"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useAuth } from "../../lib/useAuth";

type AuthPageGuardProps = {
  children: React.ReactNode;
  mode: "login" | "create";
};

const DEFAULT_SIGNED_IN_PATH = "/workspace";

function isSafeReturnPath(path: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return false;
  try {
    const parsed = new URL(path, "https://accountplanningtools.local");
    return parsed.origin === "https://accountplanningtools.local" && !["/login", "/create-account"].includes(parsed.pathname);
  } catch {
    return false;
  }
}

export function AuthPageGuard({ children, mode }: AuthPageGuardProps) {
  const { isSignedIn, isLoadingAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const destination = useMemo(() => (isSafeReturnPath(returnTo) ? (returnTo ?? DEFAULT_SIGNED_IN_PATH) : DEFAULT_SIGNED_IN_PATH), [returnTo]);

  useEffect(() => {
    if (!isLoadingAuth && isSignedIn) {
      router.replace(destination);
    }
  }, [destination, isLoadingAuth, isSignedIn, router]);

  if (isLoadingAuth) {
    return <p className="settings-message settings-message-info auth-notice">Checking your account...</p>;
  }

  if (isSignedIn) {
    return (
      <div className="card auth-card auth-already-signed-in">
        <h2>You&apos;re already signed in.</h2>
        <p>{mode === "create" ? "You do not need to create another account." : "You do not need to log in again."}</p>
        <div className="cta-row">
          <Link className="button" href={destination}>
            Continue
          </Link>
          <Link className="button button-secondary" href="/account">
            Account
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
