"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import { loadSavedAnalysis } from "../../lib/saveStore";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";
import { canRestoreCalculator, savedCalculatorState } from "../data/savedCalculator";

type RestoreResult = {
  id: string;
  title?: string;
  values?: Record<string, string>;
  legacy?: boolean;
};

function subscribeToNavigation(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function readAnalysisId() {
  return new URLSearchParams(window.location.search).get("analysis") ?? "";
}

const emptyId = () => "";

export function RestoreCalculator({ calculatorId, children }: {
  calculatorId?: string;
  children: (values?: Record<string, string>) => ReactNode;
}) {
  const id = useSyncExternalStore(subscribeToNavigation, readAnalysisId, emptyId);
  const { user, isAuthenticated, isLoading } = useSupabaseAuth();
  const [loaded, setLoaded] = useState<RestoreResult & { owner: string }>();
  const owner = user?.id ?? "";
  useEffect(() => {
    if (!id || isLoading || !isAuthenticated) return;
    let active = true;
    void loadSavedAnalysis(id).then(({ data }) => {
      if (!active) return;
      const savedId = String(data?.calculatorId ?? "");
      if (!data || !canRestoreCalculator(savedId) || (calculatorId && savedId !== calculatorId)) {
        setLoaded({ id, owner });
        return;
      }
      setLoaded({ id, owner, title: String(data.title ?? "Saved analysis"), ...savedCalculatorState(data) });
    }).catch(() => {
      if (active) setLoaded({ id, owner });
    });
    return () => { active = false; };
  }, [id, owner, isAuthenticated, isLoading, calculatorId]);

  if (!id) return children();
  if (isLoading || (isAuthenticated && (loaded?.id !== id || loaded.owner !== owner))) {
    return <p className="pro-inline-message" role="status">Loading saved analysis…</p>;
  }
  if (!isAuthenticated) {
    const returnTo = window.location.pathname + window.location.search;
    return <p className="pro-inline-message"><Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>Sign in to open the saved analysis</Link></p>;
  }
  return (
    <>
      <p className="pro-inline-message" role="status">
        {loaded?.values ? `Opened “${loaded.title}”.${loaded.legacy ? " Review the restored fields before using the result." : ""}`
          : "Could not load the saved analysis. Check Workspace and try again."}
      </p>
      {loaded?.values ? children(loaded.values) : <Link href="/workspace#analyses">Return to Workspace</Link>}
    </>
  );
}
