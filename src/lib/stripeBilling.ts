import Stripe from "stripe";
import { normaliseUserPlan, type UserPlan } from "./userPlanShared";
import { getSupabaseServiceClient } from "./serverAuth";

export type BillingInterval = "monthly" | "annual";

export type UserBillingRecord = {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
  stripe_price_id: string | null;
  stripe_current_period_end: string | null;
  stripe_cancel_at: string | null;
  stripe_canceled_at: string | null;
  stripe_cancel_at_period_end: boolean;
  stripe_cancellation_reason: string | null;
};

const entitledSubscriptionStatuses = new Set(["active", "trialing"]);

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}

export function getPriceId(interval: BillingInterval) {
  return interval === "monthly" ? process.env.STRIPE_PRICE_MONTHLY : process.env.STRIPE_PRICE_ANNUAL;
}

export function parseBillingInterval(value: unknown): BillingInterval | null {
  if (value === "monthly" || value === "annual") return value;
  return null;
}

export function getAppOrigin(request: Request) {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configuredOrigin) return configuredOrigin;

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  if (forwardedProto && host) return `${forwardedProto.split(",")[0]}://${host.split(",")[0]}`;
  return new URL(request.url).origin;
}

export function subscriptionStatusHasProAccess(status: string | null | undefined) {
  return Boolean(status && entitledSubscriptionStatuses.has(status));
}

export function planFromSubscriptionStatus(status: string | null | undefined): UserPlan {
  return subscriptionStatusHasProAccess(status) ? "pro" : "free";
}

function timestampToIso(value: number | null | undefined) {
  return value ? new Date(value * 1000).toISOString() : null;
}

function firstSubscriptionPriceId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price.id ?? null;
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const legacyPeriodEnd = (subscription as Stripe.Subscription & { current_period_end?: number | null }).current_period_end;
  return legacyPeriodEnd ?? subscription.items.data[0]?.current_period_end ?? null;
}

export function billingFieldsFromSubscription(subscription: Stripe.Subscription, userId: string): UserBillingRecord {
  const customer = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const cancellationReason =
    typeof subscription.cancellation_details?.reason === "string" ? subscription.cancellation_details.reason : null;
  return {
    user_id: userId,
    stripe_customer_id: customer,
    stripe_subscription_id: subscription.id,
    stripe_subscription_status: subscription.status,
    stripe_price_id: firstSubscriptionPriceId(subscription),
    stripe_current_period_end: timestampToIso(getSubscriptionPeriodEnd(subscription)),
    stripe_cancel_at: timestampToIso(subscription.cancel_at),
    stripe_canceled_at: timestampToIso(subscription.canceled_at),
    stripe_cancel_at_period_end: subscription.cancel_at_period_end,
    stripe_cancellation_reason: cancellationReason,
  };
}

export function getSubscriptionMetadataUserId(subscription: Stripe.Subscription) {
  return subscription.metadata?.supabase_user_id || subscription.metadata?.user_id || "";
}

export function getSessionMetadataUserId(session: Stripe.Checkout.Session) {
  return session.metadata?.supabase_user_id || session.client_reference_id || "";
}

export async function getBillingByUserId(userId: string) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Missing Supabase service-role configuration.");

  const { data, error } = await supabase
    .from("user_billing")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as UserBillingRecord | null;
}

export async function getBillingByCustomerId(customerId: string) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Missing Supabase service-role configuration.");

  const { data, error } = await supabase
    .from("user_billing")
    .select("*")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as UserBillingRecord | null;
}

export async function getBillingBySubscriptionId(subscriptionId: string) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Missing Supabase service-role configuration.");

  const { data, error } = await supabase
    .from("user_billing")
    .select("*")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as UserBillingRecord | null;
}

export async function upsertBillingRecord(record: UserBillingRecord) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Missing Supabase service-role configuration.");

  const { data, error } = await supabase
    .from("user_billing")
    .upsert(record, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) throw error;
  return data as UserBillingRecord;
}

export async function updateAuthPlan(userId: string, plan: UserPlan) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Missing Supabase service-role configuration.");

  const { data: userResult, error: userError } = await supabase.auth.admin.getUserById(userId);
  if (userError) throw userError;

  const existingPlan = normaliseUserPlan(userResult.user?.app_metadata?.plan);
  if (existingPlan === plan) return;

  const nextMetadata = {
    ...(userResult.user?.app_metadata ?? {}),
    plan,
  };

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: nextMetadata,
  });

  if (error) throw error;
}

export async function syncBillingFromSubscription(subscription: Stripe.Subscription, fallbackUserId = "") {
  let userId = getSubscriptionMetadataUserId(subscription) || fallbackUserId;
  const subscriptionId = subscription.id;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  if (!userId) {
    const existingBySubscription = await getBillingBySubscriptionId(subscriptionId);
    userId = existingBySubscription?.user_id ?? "";
  }

  if (!userId && customerId) {
    const existingByCustomer = await getBillingByCustomerId(customerId);
    userId = existingByCustomer?.user_id ?? "";
  }

  if (!userId) {
    console.warn("APT Stripe webhook: could not resolve user for subscription", {
      subscriptionId,
      customerId,
      status: subscription.status,
    });
    return null;
  }

  const record = await upsertBillingRecord(billingFieldsFromSubscription(subscription, userId));
  const nextPlan = planFromSubscriptionStatus(subscription.status);
  await updateAuthPlan(userId, nextPlan);

  console.info("APT Stripe subscription synced", {
    userId,
    subscriptionId,
    customerId,
    status: subscription.status,
    plan: nextPlan,
  });

  return record;
}
