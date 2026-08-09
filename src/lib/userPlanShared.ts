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
  canUseTemporaryPlanOverride = false,
): UserPlan {
  if (accountPlan) return accountPlan;
  if (isSignedIn && canUseTemporaryPlanOverride && temporaryPlanOverride === "pro") return "pro";
  return "free";
}

export function getActualUserPlan(accountPlan?: UserPlan | null): UserPlan {
  return accountPlan ?? "free";
}

export function normaliseUserPlan(value: unknown): UserPlan | null {
  return value === "free" || value === "pro" || value === "team" ? value : null;
}

export function isProPlan(plan: UserPlan | null | undefined) {
  return plan === "pro" || plan === "team";
}

export function isFreePlan(plan: UserPlan | null | undefined) {
  return !isProPlan(plan);
}

export function formatUserPlan(plan: UserPlan) {
  if (plan === "pro") return "Pro";
  if (plan === "team") return "Team";
  return "Free";
}
