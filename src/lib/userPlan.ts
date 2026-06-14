"use client";

export type UserPlan = "free" | "pro" | "team";
export type TemporaryPlanMode = "free" | "pro";

export type AptUserProfile = {
  id: string;
  email: string;
  plan: UserPlan;
  calculatorDefaults?: {
    market: string;
    currency: string;
    taxLabel: string;
    customTaxLabel: string;
    taxRate: number;
    retailTaxBasis: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export function isDevPlanToggleEnabled() {
  return process.env.NEXT_PUBLIC_SHOW_PLAN_TOGGLE === "true";
}

export function getUserPlan(
  temporaryPlanOverride: TemporaryPlanMode,
  accountPlan?: UserPlan | null,
  isSignedIn = false,
): UserPlan {
  // TODO: Replace logged-in test plan toggle with Stripe/Supabase plan lookup.
  if (accountPlan) return accountPlan;
  if (isSignedIn && isDevPlanToggleEnabled() && temporaryPlanOverride === "pro") return "pro";
  return "free";
}
