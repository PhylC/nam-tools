import { getAuthenticatedUser } from "../../../../lib/serverAuth";
import { getBillingByUserId } from "../../../../lib/stripeBilling";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser(request);
  if (!auth.ok) {
    return Response.json({ ok: false, message: auth.message }, { status: auth.status });
  }

  let billing;
  try {
    billing = await getBillingByUserId(auth.user.id);
  } catch {
    return Response.json({ ok: false, message: "Billing status is temporarily unavailable." }, { status: 503 });
  }
  const billingInterval =
    billing?.stripe_price_id && billing.stripe_price_id === process.env.STRIPE_PRICE_MONTHLY
      ? "monthly"
      : billing?.stripe_price_id && billing.stripe_price_id === process.env.STRIPE_PRICE_ANNUAL
        ? "annual"
        : null;

  return Response.json({
    ok: true,
    billing: billing ? { ...billing, billing_interval: billingInterval } : null,
  });
}
