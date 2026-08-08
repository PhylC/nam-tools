"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../lib/useAuth";
import { formatUserPlan, type UserPlan } from "../../lib/userPlan";

function initialsFromEmail(email: string) {
  return email.slice(0, 1).toUpperCase();
}

function PlanBadge({ plan }: { plan: UserPlan }) {
  return <span className={`plan-status-badge plan-status-${plan}`}>{formatUserPlan(plan)}</span>;
}

export function HeaderAuthNav() {
  const { user, isSignedIn, isLoadingAuth, signOut, actualPlan } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const email = user?.email ?? "";

  async function handleSignOut() {
    const result = await signOut();
    if (result.ok) {
      router.push("/calculators?auth=signed-out");
      return;
    }
    setMessage(result.message);
  }

  if (isLoadingAuth) {
    return <div className="auth-nav auth-nav-muted">Checking account...</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="auth-nav">
        <Link className="text-link" href="/login">Log in</Link>
        <Link className="button button-small" href="/create-account">Create account</Link>
      </div>
    );
  }

  return (
    <div className="account-nav">
      <details className="account-menu">
        <summary>
          <span className="account-avatar" aria-hidden="true">{initialsFromEmail(email)}</span>
          <span className="account-email">{email}</span>
        </summary>
        <div className="account-menu-panel">
          <span className="account-plan">Current plan: {formatUserPlan(actualPlan)}</span>
          <Link href="/account">Account</Link>
          <Link href="/settings">Settings</Link>
          <Link href="/workspace">My workspace</Link>
          <button className="text-button" onClick={handleSignOut} type="button">Sign out</button>
          {message ? <small>{message}</small> : null}
        </div>
      </details>
      <PlanBadge plan={actualPlan} />
      {actualPlan === "free" ? (
        <Link className="plan-upgrade-link" href="/pricing">
          Upgrade
        </Link>
      ) : null}
    </div>
  );
}

export function MobileAuthLinks({ onNavigate }: { onNavigate: () => void }) {
  const { user, isSignedIn, isLoadingAuth, signOut, actualPlan } = useAuth();
  const router = useRouter();
  const email = user?.email ?? "";

  async function handleSignOut() {
    const result = await signOut();
    onNavigate();
    if (result.ok) router.push("/calculators?auth=signed-out");
  }

  if (isLoadingAuth) {
    return <span className="mobile-nav-note">Checking account...</span>;
  }

  if (!isSignedIn) {
    return (
      <>
        <Link className="mobile-nav-link" href="/login" onClick={onNavigate}>Log in</Link>
        <Link className="mobile-nav-link mobile-nav-link-strong" href="/create-account" onClick={onNavigate}>Create free account</Link>
      </>
    );
  }

  return (
    <>
      <span className="mobile-nav-note mobile-account-note">
        <span>{email}</span>
        <PlanBadge plan={actualPlan} />
      </span>
      {actualPlan === "free" ? (
        <Link className="mobile-nav-link mobile-nav-link-strong" href="/pricing" onClick={onNavigate}>Upgrade</Link>
      ) : null}
      <Link className="mobile-nav-link" href="/account" onClick={onNavigate}>Account</Link>
      <button className="mobile-nav-link mobile-nav-button" onClick={handleSignOut} type="button">Sign out</button>
    </>
  );
}
