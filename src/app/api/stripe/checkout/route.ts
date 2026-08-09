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
import { normaliseUserPlan } from "../../../../lib/userPlanShared";

export const dynamic = "force-dynamic";

type CheckoutPayload = {
  interval?: unknown;
};

function getCheckoutEnvStatus() {
  return {
    STRIPE_SECRET_KEY: Boolean(process.env.STRIPE_SECRET_KEY),
    STRIPE_PRICE_MONTHLY: Boolean(process.env.STRIPE_PRICE_MONTHLY),
    STRIPE_PRICE_ANNUAL: Boolean(process.env.STRIPE_PRICE_ANNUAL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}

function missingCheckoutConfig() {
  return Object.entries(getCheckoutEnvStatus())
    .filter(([name, isPresent]) => name.startsWith("STRIPE_") && !isPresent)
    .map(([name]) => name);
}

function serialiseError(error: unknown) {
  const candidate = error as {
    code?: unknown;
    detail?: unknown;
    details?: unknown;
    message?: unknown;
    name?: unknown;
    raw?: { code?: unknown; message?: unknown; statusCode?: unknown; type?: unknown };
    status?: unknown;
    statusCode?: unknown;
    type?: unknown;
  };

  return {
    name: typeof candidate?.name === "string" ? candidate.name : error instanceof Error ? error.name : "UnknownError",
    message: typeof candidate?.message === "string" ? candidate.message : error instanceof Error ? error.message : "Unknown error",
    code: candidate?.code ?? candidate?.raw?.code ?? null,
    details: candidate?.details ?? candidate?.detail ?? null,
    stripeType: candidate?.type ?? candidate?.raw?.type ?? null,
    statusCode: candidate?.statusCode ?? candidate?.status ?? candidate?.raw?.statusCode ?? null,
  };
}

function logCheckoutFailure(stage: string, error: unknown, context: Record<string, unknown>) {
  console.error("APT Stripe checkout failed", {
    stage,
    ...context,
    env: getCheckoutEnvStatus(),
    error: serialiseError(error),
  });
}

function logCheckoutConfigFailure(missing: string[], context: Record<string, unknown>) {
  console.error("APT Stripe checkout configuration missing", {
    stage: "validate-config",
    missing,
    ...context,
    env: getCheckoutEnvStatus(),
  });
}

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

  const logContext = {
    interval,
    userId: auth.user.id,
  };
  const missingConfig = missingCheckoutConfig();
  if (missingConfig.length > 0) {
    logCheckoutConfigFailure(missingConfig, logContext);
    return Response.json({ ok: false, message: "Checkout is temporarily unavailable." }, { status: 503 });
  }

  const stripe = getStripeClient();
  const priceId = getPriceId(interval);
  if (!stripe || !priceId) {
    logCheckoutConfigFailure(!stripe ? ["STRIPE_SECRET_KEY"] : [`STRIPE_PRICE_${interval === "monthly" ? "MONTHLY" : "ANNUAL"}`], logContext);
    return Response.json({ ok: false, message: "Checkout is temporarily unavailable." }, { status: 503 });
  }

  const actualPlan = normaliseUserPlan(auth.user.app_metadata?.plan) ?? "free";
  if (actualPlan === "pro" || actualPlan === "team") {
    return Response.json({ ok: false, message: "You already have Pro access.", redirectTo: "/account" }, { status: 409 });
  }

  let billing;
  try {
    billing = await getBillingByUserId(auth.user.id);
  } catch (error) {
    logCheckoutFailure("load-billing-record", error, logContext);
    return Response.json({ ok: false, message: "Checkout is temporarily unavailable." }, { status: 503 });
  }
  if (subscriptionStatusHasProAccess(billing?.stripe_subscription_status)) {
    return Response.json({ ok: false, message: "You already have Pro access.", redirectTo: "/account" }, { status: 409 });
  }

  try {
    await stripe.prices.retrieve(priceId);
  } catch (error) {
    logCheckoutFailure("retrieve-selected-price", error, { ...logContext, priceId });
    return Response.json({ ok: false, message: "Checkout is temporarily unavailable." }, { status: 503 });
  }

  let customerId = billing?.stripe_customer_id ?? "";
  if (!customerId) {
    let customer;
    try {
      customer = await stripe.customers.create({
        email: auth.user.email ?? undefined,
        metadata: {
          supabase_user_id: auth.user.id,
        },
      });
    } catch (error) {
      logCheckoutFailure("create-stripe-customer", error, logContext);
      return Response.json({ ok: false, message: "Checkout is temporarily unavailable." }, { status: 503 });
    }
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
    } catch (error) {
      logCheckoutFailure("upsert-billing-customer", error, { ...logContext, customerId });
      return Response.json({ ok: false, message: "Checkout is temporarily unavailable." }, { status: 503 });
    }
  }

  const origin = getAppOrigin(request);
  const metadata = {
    supabase_user_id: auth.user.id,
    apt_plan: "pro",
    billing_interval: interval,
  };

  let session;
  try {
    session = await stripe.checkout.sessions.create(
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
  } catch (error) {
    logCheckoutFailure("create-checkout-session", error, { ...logContext, customerId, priceId });
    return Response.json({ ok: false, message: "Checkout is temporarily unavailable." }, { status: 503 });
  }

  console.info("APT Stripe checkout session created", {
    userId: auth.user.id,
    customerId,
    interval,
    priceId,
    sessionId: session.id,
  });

  return Response.json({ ok: true, url: session.url });
}
