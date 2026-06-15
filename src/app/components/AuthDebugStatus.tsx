"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient, getSupabaseDebugInfo, getSupabaseEnvStatus } from "../../lib/supabaseClient";

export function AuthDebugStatus() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const envStatus = getSupabaseEnvStatus();
  const debugInfo = getSupabaseDebugInfo();
  const [sessionStatus, setSessionStatus] = useState("checking");

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!supabase) {
      setSessionStatus("unavailable");
      return;
    }

    let isMounted = true;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.warn("Supabase auth status check failed", error);
          if (error instanceof Error && error.stack) console.warn("Supabase auth status stack", error.stack);
          setSessionStatus("error");
          return;
        }
        setSessionStatus(data.session ? "yes" : "no");
      })
      .catch((error) => {
        if (!isMounted) return;
        console.warn("Supabase auth status check threw", error);
        if (error instanceof Error && error.stack) console.warn("Supabase auth status stack", error.stack);
        setSessionStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <details className="auth-debug-panel">
      <summary>Auth debug</summary>
      <dl>
        <div>
          <dt>Supabase URL</dt>
          <dd>{envStatus.hasUrl ? "set" : "missing"}</dd>
        </div>
        <div>
          <dt>Supabase host</dt>
          <dd>{debugInfo.host}</dd>
        </div>
        <div>
          <dt>Supabase project ref</dt>
          <dd>{debugInfo.projectRef}</dd>
        </div>
        <div>
          <dt>Supabase anon key</dt>
          <dd>{envStatus.hasAnonKey ? "set" : "missing"}</dd>
        </div>
        <div>
          <dt>Password reset redirect override</dt>
          <dd>{envStatus.hasPasswordResetRedirect ? "set" : "not set"}</dd>
        </div>
        <div>
          <dt>Current session</dt>
          <dd>{sessionStatus}</dd>
        </div>
      </dl>
    </details>
  );
}
