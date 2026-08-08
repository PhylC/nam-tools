"use client";

import { useRouter } from "next/navigation";
import { trackUpgradeClicked } from "../../lib/analytics";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";

type ProPlan = "pro" | "team";

export type ProActionContext = {
  from: string;
  feature: string;
  location?: string;
};

function safeParam(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "pro-feature";
}

export function buildUpgradeHref(context: ProActionContext) {
  const params = new URLSearchParams({
    from: safeParam(context.from),
    feature: safeParam(context.feature),
  });
  return `/pricing?${params.toString()}`;
}

export function isProPlan(plan: string | null | undefined): plan is ProPlan {
  return plan === "pro" || plan === "team";
}

export function useProAction(defaultContext: ProActionContext) {
  const router = useRouter();
  const { isLoading, plan } = useSupabaseAuth();
  const isPro = isProPlan(plan);

  function upgradeHref(context: Partial<ProActionContext> = {}) {
    return buildUpgradeHref({ ...defaultContext, ...context });
  }

  function requirePro(action: () => void, context: Partial<ProActionContext> = {}) {
    if (isLoading) return false;
    if (isPro) {
      action();
      return true;
    }

    const nextContext = { ...defaultContext, ...context };
    trackUpgradeClicked(nextContext.location ?? `pro_action_${safeParam(nextContext.from)}_${safeParam(nextContext.feature)}`);
    router.push(buildUpgradeHref(nextContext));
    return false;
  }

  return { isLoading, isPro, requirePro, upgradeHref };
}
