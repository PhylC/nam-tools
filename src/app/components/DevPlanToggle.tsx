"use client";

import { useAuth } from "../../lib/useAuth";
import { TemporaryPlanToggle } from "./AptMode";

export function DevPlanToggle({ className }: { className?: string }) {
  const { isSignedIn, isLoadingAuth } = useAuth();
  if (isLoadingAuth || !isSignedIn) return null;
  if (className) {
    return (
      <div className={className}>
        <TemporaryPlanToggle />
      </div>
    );
  }
  return <TemporaryPlanToggle />;
}
