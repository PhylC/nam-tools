"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabaseClient";
import { isDevPlanToggleEnabled } from "../../lib/userPlan";

type AptMode = "free" | "pro";

type AptModeContextValue = {
  aptMode: AptMode;
  canUseTestMode: boolean;
  isLoadingTestMode: boolean;
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
  const storedAptMode: AptMode = useSyncExternalStore(subscribeToAptMode, readStoredAptMode, () => "free" as AptMode);
  const [canUseTestMode, setCanUseTestMode] = useState(false);
  const [isLoadingTestMode, setIsLoadingTestMode] = useState(() => Boolean(getSupabaseBrowserClient()) && isDevPlanToggleEnabled());
  const aptMode: AptMode = canUseTestMode ? storedAptMode : "free";

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase || !isDevPlanToggleEnabled()) {
      window.localStorage.removeItem("apt-mode");
      window.dispatchEvent(new Event("apt-mode-change"));
      return;
    }

    const browserSupabase = supabase;
    let isMounted = true;

    async function refreshTestModeAccess() {
      setIsLoadingTestMode(true);
      try {
        const { data } = await browserSupabase.auth.getSession();
        const token = data.session?.access_token;

        if (!token) {
          if (!isMounted) return;
          setCanUseTestMode(false);
          window.localStorage.removeItem("apt-mode");
          window.dispatchEvent(new Event("apt-mode-change"));
          return;
        }

        const response = await fetch("/api/auth/test-mode", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = (await response.json().catch(() => null)) as { canUseTestMode?: boolean } | null;
        const nextCanUseTestMode = Boolean(result?.canUseTestMode);

        if (!isMounted) return;
        setCanUseTestMode(nextCanUseTestMode);
        if (!nextCanUseTestMode) {
          window.localStorage.removeItem("apt-mode");
          window.dispatchEvent(new Event("apt-mode-change"));
        }
      } catch {
        if (!isMounted) return;
        setCanUseTestMode(false);
        window.localStorage.removeItem("apt-mode");
        window.dispatchEvent(new Event("apt-mode-change"));
      } finally {
        if (isMounted) setIsLoadingTestMode(false);
      }
    }

    refreshTestModeAccess();
    const { data: listener } = browserSupabase.auth.onAuthStateChange(() => {
      refreshTestModeAccess();
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const setAptMode = useCallback((mode: AptMode) => {
    if (!canUseTestMode) {
      window.localStorage.removeItem("apt-mode");
      window.dispatchEvent(new Event("apt-mode-change"));
      return;
    }
    window.localStorage.setItem("apt-mode", mode);
    window.dispatchEvent(new Event("apt-mode-change"));
  }, [canUseTestMode]);

  const value = useMemo(
    () => ({ aptMode, canUseTestMode, isLoadingTestMode, setAptMode }),
    [aptMode, canUseTestMode, isLoadingTestMode, setAptMode],
  );

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
  const { aptMode, canUseTestMode, isLoadingTestMode, setAptMode } = useAptMode();
  if (!isDevPlanToggleEnabled() || isLoadingTestMode || !canUseTestMode) return null;

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
