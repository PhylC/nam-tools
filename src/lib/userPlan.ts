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

export function getUserPlan(temporaryPlanMode: TemporaryPlanMode): UserPlan {
  // TODO: Replace temporary plan toggle with Stripe-backed plan detection.
  return temporaryPlanMode === "pro" ? "pro" : "free";
}
