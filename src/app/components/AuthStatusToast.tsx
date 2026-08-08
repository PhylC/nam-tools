"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

type ToastState = {
  title: string;
  text?: string;
};

function getToastState(status: string | null): ToastState | null {
  if (status === "logged-in") {
    return {
      title: "Welcome back — you're now logged in.",
      text: "Your settings and workspace are available.",
    };
  }

  if (status === "signed-out") {
    return {
      title: "You've been signed out.",
    };
  }

  return null;
}

export function AuthStatusToast() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const authStatus = searchParams.get("auth");
  const toast = useMemo(() => getToastState(authStatus), [authStatus]);

  const dismissToast = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth");
    const nextQuery = params.toString();
    const hash = window.location.hash;
    router.replace(`${pathname}${nextQuery ? `?${nextQuery}` : ""}${hash}`, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(dismissToast, 4500);
    return () => window.clearTimeout(timeout);
  }, [dismissToast, toast]);

  if (!toast) return null;

  return (
    <div className="auth-status-toast" role="status" aria-live="polite" aria-atomic="true">
      <div>
        <strong>{toast.title}</strong>
        {toast.text ? <span>{toast.text}</span> : null}
      </div>
      <button aria-label="Dismiss message" onClick={dismissToast} type="button">
        ×
      </button>
    </div>
  );
}
