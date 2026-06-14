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
    supportTerminology: string;
    customSupportTerminology: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export function isTemporaryPlanToggleEnabled() {
  return process.env.NEXT_PUBLIC_SHOW_PLAN_TOGGLE === "true";
}

export function getUserPlan(temporaryPlanMode: TemporaryPlanMode, accountPlan?: UserPlan | null): UserPlan {
  // TODO: Replace temporary plan toggle with Stripe-backed plan detection.
  if (accountPlan) return accountPlan;
  if (isTemporaryPlanToggleEnabled() && temporaryPlanMode === "pro") return "pro";
  return "free";
}
