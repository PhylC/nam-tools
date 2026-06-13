"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../../lib/useAuth";

function initialsFromEmail(email: string) {
  return email.slice(0, 1).toUpperCase();
}

export function HeaderAuthNav() {
  const { user, isSignedIn, isLoadingAuth, signOut, plan } = useAuth();
  const [message, setMessage] = useState("");
  const email = user?.email ?? "";

  async function handleSignOut() {
    const result = await signOut();
    setMessage(result.message);
  }

  if (isLoadingAuth) {
    return <div className="auth-nav auth-nav-muted">Checking account...</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="auth-nav">
        <Link className="text-link" href="/login">Log in</Link>
        <Link className="button button-small" href="/create-account">Create free account</Link>
      </div>
    );
  }

  return (
    <details className="account-menu">
      <summary>
        <span className="account-avatar" aria-hidden="true">{initialsFromEmail(email)}</span>
        <span className="account-email">{email}</span>
      </summary>
      <div className="account-menu-panel">
        <span className="account-plan">Current plan: {plan === "pro" ? "APT Pro" : plan === "team" ? "Team" : "Free"}</span>
        <Link href="/account">Account</Link>
        <Link href="/settings">Settings</Link>
        <Link href="/workspace">My workspace</Link>
        <button className="text-button" onClick={handleSignOut} type="button">Sign out</button>
        {message ? <small>{message}</small> : null}
      </div>
    </details>
  );
}

export function MobileAuthLinks({ onNavigate }: { onNavigate: () => void }) {
  const { user, isSignedIn, isLoadingAuth, signOut, plan } = useAuth();
  const email = user?.email ?? "";

  async function handleSignOut() {
    await signOut();
    onNavigate();
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
      <span className="mobile-nav-note">{email} · {plan === "pro" ? "APT Pro" : plan === "team" ? "Team" : "Free"}</span>
      <Link className="mobile-nav-link" href="/account" onClick={onNavigate}>Account</Link>
      <button className="mobile-nav-link mobile-nav-button" onClick={handleSignOut} type="button">Sign out</button>
    </>
  );
}
