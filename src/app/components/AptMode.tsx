"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { isDevPlanToggleEnabled } from "../../lib/userPlan";

type AptMode = "free" | "pro";

type AptModeContextValue = {
  aptMode: AptMode;
  setAptMode: (mode: AptMode) => void;
};

const AptModeContext = createContext<AptModeContextValue | null>(null);

function readStoredAptMode(): AptMode {
  const saved = window.localStorage.getItem("apt-mode");
  return saved === "free" || saved === "pro" ? saved : "free";
}

function subscribeToAptMode(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("apt-mode-change", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("apt-mode-change", onStoreChange);
  };
}

export function AptModeProvider({ children }: { children: React.ReactNode }) {
  // Temporary development-only plan override. Remove after Stripe-backed plan detection is live.
  const aptMode: AptMode = useSyncExternalStore(subscribeToAptMode, readStoredAptMode, () => "free" as AptMode);

  function setAptMode(mode: AptMode) {
    window.localStorage.setItem("apt-mode", mode);
    window.dispatchEvent(new Event("apt-mode-change"));
  }

  const value = useMemo(() => ({ aptMode, setAptMode }), [aptMode]);

  return <AptModeContext.Provider value={value}>{children}</AptModeContext.Provider>;
}

export function useAptMode() {
  const context = useContext(AptModeContext);
  if (!context) {
    throw new Error("useAptMode must be used inside AptModeProvider");
  }
  return context;
}

export function TemporaryPlanToggle() {
  const { aptMode, setAptMode } = useAptMode();
  if (!isDevPlanToggleEnabled()) return null;

  return (
    <div className="plan-toggle" aria-label="Temporary development plan mode">
      <span className="plan-toggle-label">Test mode</span>
      <button
        aria-pressed={aptMode === "free"}
        className={aptMode === "free" ? "plan-toggle-active" : ""}
        onClick={() => setAptMode("free")}
        type="button"
      >
        Free
      </button>
      <button
        aria-pressed={aptMode === "pro"}
        className={aptMode === "pro" ? "plan-toggle-active" : ""}
        onClick={() => setAptMode("pro")}
        type="button"
      >
        Pro
      </button>
    </div>
  );
}

export function ProductSectionTabs() {
  return null;
}
