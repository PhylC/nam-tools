"use client";

import { useAuth } from "../../lib/useAuth";
import { TemporaryPlanToggle, useAptMode } from "./AptMode";

export function DevPlanToggle({ className }: { className?: string }) {
  const { canUseTestMode, isLoadingTestMode } = useAptMode();
  const { isSignedIn, isLoadingAuth } = useAuth();
  if (isLoadingAuth || isLoadingTestMode || !isSignedIn || !canUseTestMode) return null;
  if (className) {
    return (
      <div className={className}>
        <TemporaryPlanToggle />
      </div>
    );
  }
  return <TemporaryPlanToggle />;
}
