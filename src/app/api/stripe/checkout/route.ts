import { getAuthenticatedUser } from "../../../../lib/serverAuth";
import {
  getAppOrigin,
  getBillingByUserId,
  getPriceId,
  getStripeClient,
  parseBillingInterval,
  subscriptionStatusHasProAccess,
  upsertBillingRecord,
} from "../../../../lib/stripeBilling";
import { normaliseUserPlan } from "../../../../lib/userPlan";

export const dynamic = "force-dynamic";

type CheckoutPayload = {
  interval?: unknown;
};

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser(request);
  if (!auth.ok) {
    return Response.json({ ok: false, message: auth.message }, { status: auth.status });
  }

  let payload: CheckoutPayload;
  try {
    payload = (await request.json()) as CheckoutPayload;
  } catch {
    return Response.json({ ok: false, message: "Send a valid checkout request." }, { status: 400 });
  }

  const interval = parseBillingInterval(payload.interval);
  if (!interval) {
    return Response.json({ ok: false, message: "Choose monthly or annual billing." }, { status: 400 });
  }

  const stripe = getStripeClient();
  const priceId = getPriceId(interval);
  if (!stripe || !priceId) {
    return Response.json({ ok: false, message: "Checkout is temporarily unavailable." }, { status: 503 });
  }

  const actualPlan = normaliseUserPlan(auth.user.app_metadata?.plan) ?? "free";
  if (actualPlan === "pro" || actualPlan === "team") {
    return Response.json({ ok: false, message: "You already have Pro access.", redirectTo: "/account" }, { status: 409 });
  }

  let billing;
  try {
    billing = await getBillingByUserId(auth.user.id);
  } catch {
    return Response.json({ ok: false, message: "Checkout is temporarily unavailable." }, { status: 503 });
  }
  if (subscriptionStatusHasProAccess(billing?.stripe_subscription_status)) {
    return Response.json({ ok: false, message: "You already have Pro access.", redirectTo: "/account" }, { status: 409 });
  }

  let customerId = billing?.stripe_customer_id ?? "";
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: auth.user.email ?? undefined,
      metadata: {
        supabase_user_id: auth.user.id,
      },
    });
    customerId = customer.id;
    try {
      await upsertBillingRecord({
        user_id: auth.user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: billing?.stripe_subscription_id ?? null,
        stripe_subscription_status: billing?.stripe_subscription_status ?? null,
        stripe_price_id: billing?.stripe_price_id ?? null,
        stripe_current_period_end: billing?.stripe_current_period_end ?? null,
        stripe_cancel_at_period_end: billing?.stripe_cancel_at_period_end ?? false,
      });
    } catch {
      return Response.json({ ok: false, message: "Checkout is temporarily unavailable." }, { status: 503 });
    }
  }

  const origin = getAppOrigin(request);
  const metadata = {
    supabase_user_id: auth.user.id,
    apt_plan: "pro",
    billing_interval: interval,
  };

  const session = await stripe.checkout.sessions.create(
    {
      mode: "subscription",
      customer: customerId,
      client_reference_id: auth.user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      subscription_data: {
        metadata,
      },
      success_url: `${origin}/account?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
    },
    {
      idempotencyKey: `apt-checkout-${auth.user.id}-${interval}-${Math.floor(Date.now() / 60_000)}`,
    },
  );

  console.info("APT Stripe checkout session created", {
    userId: auth.user.id,
    customerId,
    interval,
    priceId,
    sessionId: session.id,
  });

  return Response.json({ ok: true, url: session.url });
}
