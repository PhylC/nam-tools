"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { trackEvent, trackUpgradeClicked } from "../../lib/analytics";
import { getSupabaseBrowserClient } from "../../lib/supabaseClient";
import { useAuth } from "../../lib/useAuth";
import { formatUserPlan } from "../../lib/userPlan";

type BillingState = {
  stripe_subscription_status: string | null;
  stripe_current_period_end: string | null;
  stripe_cancel_at_period_end: boolean;
  billing_interval: "monthly" | "annual" | null;
} | null;

function formatBillingDate(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatBillingInterval(value: "monthly" | "annual" | null) {
  if (value === "monthly") return "Monthly";
  if (value === "annual") return "Annual";
  return "";
}

export function AccountClient() {
  const { user, isSignedIn, isLoadingAuth, signOut, actualPlan } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("checkout") === "success"
      ? "Payment received. We're confirming your Pro subscription."
      : "";
  });
  const [billing, setBilling] = useState<BillingState>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  async function getAccessToken() {
    const supabase = getSupabaseBrowserClient();
    const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    return data.session?.access_token ?? "";
  }

  const refreshBilling = useCallback(async () => {
    if (!isSignedIn) return;
    setIsLoadingBilling(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const response = await fetch("/api/account/billing", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; billing?: BillingState } | null;
      if (response.ok && result?.ok) {
        setBilling(result.billing ?? null);
      }
    } finally {
      setIsLoadingBilling(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      getSupabaseBrowserClient()?.auth.refreshSession();
    }
    const timer = window.setTimeout(() => {
      refreshBilling();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isSignedIn, refreshBilling]);

  async function handleSignOut() {
    const result = await signOut();
    if (result.ok) {
      trackEvent("logout_completed");
      router.push("/calculators?auth=signed-out");
      return;
    }
    setMessage(result.message);
  }

  async function openBillingPortal() {
    setIsOpeningPortal(true);
    setMessage("");
    try {
      const token = await getAccessToken();
      if (!token) {
        router.push("/login?returnTo=/account");
        return;
      }
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; url?: string; message?: string } | null;
      if (!response.ok || !result?.ok || !result.url) {
        setMessage(result?.message ?? "Billing management is temporarily unavailable.");
        return;
      }
      window.location.assign(result.url);
    } catch {
      setMessage("Billing management is temporarily unavailable.");
    } finally {
      setIsOpeningPortal(false);
    }
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
              <dd>{formatUserPlan(actualPlan)}</dd>
            </div>
            {billing?.billing_interval ? (
              <div>
                <dt>Billing</dt>
                <dd>{formatBillingInterval(billing.billing_interval)}</dd>
              </div>
            ) : null}
            {billing?.stripe_subscription_status ? (
              <div>
                <dt>Billing status</dt>
                <dd>{billing.stripe_subscription_status.replaceAll("_", " ")}</dd>
              </div>
            ) : null}
            {billing?.stripe_current_period_end ? (
              <div>
                <dt>{billing.stripe_cancel_at_period_end ? "Pro access ends" : "Renews"}</dt>
                <dd>{formatBillingDate(billing.stripe_current_period_end)}</dd>
              </div>
            ) : null}
          </dl>
          {billing?.stripe_cancel_at_period_end && actualPlan !== "free" ? (
            <p className="settings-message settings-message-warning">
              Your Pro subscription will end on {formatBillingDate(billing.stripe_current_period_end)}.
            </p>
          ) : null}
          {billing?.stripe_subscription_status === "past_due" ? (
            <p className="settings-message settings-message-warning">
              There is a billing issue with your subscription. Manage billing to update payment details.
            </p>
          ) : null}
          {isLoadingBilling ? <p className="settings-message settings-message-info">Checking billing status...</p> : null}
        </div>
        <div className="account-link-grid">
          {actualPlan === "free" ? (
            <Link className="button" href="/pricing" onClick={() => trackUpgradeClicked("account")}>
              Upgrade
            </Link>
          ) : null}
          {billing?.stripe_subscription_status ? (
            <button className="button" disabled={isOpeningPortal} onClick={openBillingPortal} type="button">
              {isOpeningPortal ? "Opening billing..." : "Manage billing"}
            </button>
          ) : null}
          <Link className="button" href="/settings">Settings</Link>
          <Link className="button button-secondary" href="/workspace">My workspace</Link>
          <button className="button button-secondary" onClick={handleSignOut} type="button">Sign out</button>
        </div>
        {message ? <p className="settings-message settings-message-success">{message}</p> : null}
      </article>
    </section>
  );
}
