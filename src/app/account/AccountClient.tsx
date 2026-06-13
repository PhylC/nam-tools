"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../../lib/useAuth";

export function AccountClient() {
  const { user, isSignedIn, isLoadingAuth, signOut, plan } = useAuth();
  const [message, setMessage] = useState("");

  async function handleSignOut() {
    const result = await signOut();
    setMessage(result.message);
  }

  if (isLoadingAuth) {
    return (
      <section className="shell section">
        <article className="card account-card">
          <h2>Loading account...</h2>
        </article>
      </section>
    );
  }

  if (!isSignedIn) {
    return (
      <section className="shell section">
        <article className="card account-card">
          <h2>Log in or create a free account to manage your APT settings.</h2>
          <div className="cta-row">
            <Link className="button" href="/login">Log in</Link>
            <Link className="button button-secondary" href="/create-account">Create free account</Link>
          </div>
          {message ? <p className="settings-message settings-message-success">{message}</p> : null}
        </article>
      </section>
    );
  }

  return (
    <section className="shell section">
      <article className="card account-card">
        <div>
          <h2>Account details</h2>
          <dl className="account-detail-list">
            <div>
              <dt>Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>Current plan</dt>
              <dd>{plan === "pro" ? "APT Pro" : plan === "team" ? "Team" : "Free"}</dd>
            </div>
          </dl>
        </div>
        <div className="account-link-grid">
          <Link className="button" href="/settings">Settings</Link>
          <Link className="button button-secondary" href="/workspace">My workspace</Link>
          <button className="button button-secondary" onClick={handleSignOut} type="button">Sign out</button>
        </div>
        {message ? <p className="settings-message settings-message-success">{message}</p> : null}
      </article>
    </section>
  );
}
