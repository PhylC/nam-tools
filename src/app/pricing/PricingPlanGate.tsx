"use client";

import type { ReactNode } from "react";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";

type PricingPlanGateProps = {
  free: ReactNode;
  pro: ReactNode;
  loading?: ReactNode;
};

export function PricingPlanGate({ free, pro, loading }: PricingPlanGateProps) {
  const { actualPlan, isLoading } = useSupabaseAuth();
  const isPro = actualPlan === "pro" || actualPlan === "team";

  if (isLoading) return loading ?? free;
  return isPro ? pro : free;
}
