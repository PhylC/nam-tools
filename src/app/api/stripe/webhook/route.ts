import type Stripe from "stripe";
import {
  getBillingByCustomerId,
  getSessionMetadataUserId,
  getStripeClient,
  syncBillingFromSubscription,
  upsertBillingRecord,
} from "../../../../lib/stripeBilling";

export const dynamic = "force-dynamic";

function getStringId(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "string") return value.id;
  return "";
}

async function syncSubscriptionById(subscriptionId: string, fallbackUserId = "") {
  const stripe = getStripeClient();
  if (!stripe || !subscriptionId) return null;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return syncBillingFromSubscription(subscription, fallbackUserId);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = getSessionMetadataUserId(session);
  const customerId = getStringId(session.customer);
  const subscriptionId = getStringId(session.subscription);

  if (userId && customerId) {
    const existing = await getBillingByCustomerId(customerId);
    await upsertBillingRecord({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId || existing?.stripe_subscription_id || null,
      stripe_subscription_status: existing?.stripe_subscription_status ?? null,
      stripe_price_id: existing?.stripe_price_id ?? null,
      stripe_current_period_end: existing?.stripe_current_period_end ?? null,
      stripe_cancel_at: existing?.stripe_cancel_at ?? null,
      stripe_canceled_at: existing?.stripe_canceled_at ?? null,
      stripe_cancel_at_period_end: existing?.stripe_cancel_at_period_end ?? false,
      stripe_cancellation_reason: existing?.stripe_cancellation_reason ?? null,
    });
  }

  if (subscriptionId) {
    await syncSubscriptionById(subscriptionId, userId);
  }
}

async function handleInvoiceEvent(invoice: Stripe.Invoice) {
  const subscriptionId = getStringId((invoice as Stripe.Invoice & { subscription?: unknown }).subscription);
  if (subscriptionId) await syncSubscriptionById(subscriptionId);
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncBillingFromSubscription(event.data.object as Stripe.Subscription);
      break;
    case "invoice.paid":
    case "invoice.payment_failed":
      await handleInvoiceEvent(event.data.object as Stripe.Invoice);
      break;
    default:
      console.info("APT Stripe webhook: unhandled event", { eventId: event.id, type: event.type });
  }
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    console.error("APT Stripe webhook: missing runtime configuration", {
      hasStripeSecret: Boolean(stripe),
      hasWebhookSecret: Boolean(webhookSecret),
    });
    return Response.json({ ok: false, message: "Webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ ok: false, message: "Missing Stripe signature." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.warn("APT Stripe webhook: signature verification failed", {
      message: error instanceof Error ? error.message : "Unknown signature error",
    });
    return Response.json({ ok: false, message: "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    await handleEvent(event);
    console.info("APT Stripe webhook processed", { eventId: event.id, type: event.type });
    return Response.json({ ok: true, received: true });
  } catch (error) {
    console.error("APT Stripe webhook processing failed", {
      eventId: event.id,
      type: event.type,
      message: error instanceof Error ? error.message : "Unknown webhook error",
    });
    return Response.json({ ok: false, message: "Webhook processing failed." }, { status: 500 });
  }
}
