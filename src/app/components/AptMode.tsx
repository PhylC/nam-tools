"use client";

import { createContext, useContext, useMemo, useState } from "react";

type AptMode = "free" | "pro";

type AptModeContextValue = {
  aptMode: AptMode;
  setAptMode: (mode: AptMode) => void;
};

const AptModeContext = createContext<AptModeContextValue | null>(null);

export function AptModeProvider({ children }: { children: React.ReactNode }) {
  // Temporary preview mode. Replace with authenticated user plan when login/payment is added.
  const [aptMode, setAptModeState] = useState<AptMode>(() => {
    if (typeof window === "undefined") return "free";
    const saved = window.localStorage.getItem("apt-mode");
    return saved === "free" || saved === "pro" ? saved : "free";
  });

  function setAptMode(mode: AptMode) {
    setAptModeState(mode);
    window.localStorage.setItem("apt-mode", mode);
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

export function PlanModeToggle() {
  const { aptMode, setAptMode } = useAptMode();

  return (
    <div className="plan-toggle" aria-label="Free or Pro Preview mode">
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
        Pro Preview
      </button>
    </div>
  );
}

export function ProductSectionTabs() {
  const { aptMode } = useAptMode();

  return (
    <div className="product-mode-note">
      <span className={aptMode === "pro" ? "pill pro-pill" : "pill"}>
        {aptMode === "pro" ? "Pro Preview" : "Free"}
      </span>
      <p>
        {aptMode === "pro"
          ? "You are viewing Pro workflow previews. No login, payment or gated access is active yet."
          : "You are viewing the free product experience. Calculators remain free to use."}
      </p>
    </div>
  );
}
