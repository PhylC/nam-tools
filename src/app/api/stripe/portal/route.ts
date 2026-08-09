import { getAuthenticatedUser } from "../../../../lib/serverAuth";
import { getAppOrigin, getBillingByUserId, getStripeClient } from "../../../../lib/stripeBilling";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser(request);
  if (!auth.ok) {
    return Response.json({ ok: false, message: auth.message }, { status: auth.status });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return Response.json({ ok: false, message: "Billing management is temporarily unavailable." }, { status: 503 });
  }

  let billing;
  try {
    billing = await getBillingByUserId(auth.user.id);
  } catch {
    return Response.json({ ok: false, message: "Billing management is temporarily unavailable." }, { status: 503 });
  }
  if (!billing?.stripe_customer_id) {
    return Response.json({ ok: false, message: "No billing account found." }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: billing.stripe_customer_id,
    return_url: `${getAppOrigin(request)}/account`,
  });

  console.info("APT Stripe portal session created", {
    userId: auth.user.id,
    customerId: billing.stripe_customer_id,
    portalSessionId: session.id,
  });

  return Response.json({ ok: true, url: session.url });
}
