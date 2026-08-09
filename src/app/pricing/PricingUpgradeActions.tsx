"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trackUpgradeClicked } from "../../lib/analytics";
import { getSupabaseBrowserClient } from "../../lib/supabaseClient";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";

type PricingUpgradeActionsProps = {
  location: string;
  variant?: "link" | "panel";
};

type BillingInterval = "monthly" | "annual";

const billingOptions: Array<{
  interval: BillingInterval;
  label: string;
  detail: string;
  locationSuffix: string;
}> = [
  { interval: "monthly", label: "Upgrade monthly", detail: "£9.99/month", locationSuffix: "monthly" },
  { interval: "annual", label: "Upgrade annually", detail: "£99/year. Save £20.88 a year.", locationSuffix: "annual" },
];

export function PricingUpgradeActions({ location, variant = "link" }: PricingUpgradeActionsProps) {
  const { isAuthenticated, isLoading, actualPlan } = useSupabaseAuth();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isStartingCheckout, setIsStartingCheckout] = useState<BillingInterval | null>(null);
  const isPro = actualPlan === "pro" || actualPlan === "team";

  async function startCheckout(interval: BillingInterval) {
    const supabase = getSupabaseBrowserClient();
    setMessage("");
    setIsStartingCheckout(interval);
    trackUpgradeClicked(`${location}_${interval}`);

    try {
      const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
      const token = data.session?.access_token;
      if (!token) {
        router.push("/login?returnTo=/pricing");
        return;
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ interval }),
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; url?: string; redirectTo?: string; message?: string } | null;

      if (response.status === 409 && result?.redirectTo) {
        router.push(result.redirectTo);
        return;
      }

      if (!response.ok || !result?.ok || !result.url) {
        setMessage(result?.message ?? "Checkout is temporarily unavailable.");
        return;
      }

      window.location.assign(result.url);
    } catch {
      setMessage("Checkout is temporarily unavailable.");
    } finally {
      setIsStartingCheckout(null);
    }
  }

  if (isLoading) {
    return variant === "panel" ? (
      <p className="settings-message settings-message-info">Checking your account status...</p>
    ) : (
      <span className="text-link pricing-action-muted">Checking account...</span>
    );
  }

  if (isPro) {
    return variant === "panel" ? (
      <div className="pricing-auth-actions">
        <p className="settings-message settings-message-success">Current plan: {actualPlan === "team" ? "Team" : "Pro"}</p>
        <Link className="button button-secondary" href="/account">
          Manage account
        </Link>
      </div>
    ) : (
      <Link className="text-link" href="/account">
        Manage account
      </Link>
    );
  }

  if (!isAuthenticated) {
    return variant === "panel" ? (
      <div className="pricing-auth-actions">
        <p className="settings-message settings-message-info">Create an account or log in to upgrade to APT Pro.</p>
        <Link className="button" href="/create-account?returnTo=/pricing" onClick={() => trackUpgradeClicked(`${location}_create_account`)}>
          Create account to upgrade
        </Link>
        <Link className="button button-secondary" href="/login?returnTo=/pricing">
          Log in
        </Link>
      </div>
    ) : (
      <Link className="text-link" href="/create-account?returnTo=/pricing" onClick={() => trackUpgradeClicked(`${location}_create_account`)}>
        Create account to upgrade
      </Link>
    );
  }

  return variant === "panel" ? (
    <div className="pricing-auth-actions">
      <p className="settings-message settings-message-info">Current plan: Free. Choose monthly or annual billing.</p>
      {billingOptions.map((option) => (
        <button
          className={option.interval === "annual" ? "button" : "button button-secondary"}
          disabled={Boolean(isStartingCheckout)}
          key={option.interval}
          type="button"
          onClick={() => startCheckout(option.interval)}
        >
          <span>{isStartingCheckout === option.interval ? "Opening Checkout..." : option.label}</span>
          <small>{option.detail}</small>
        </button>
      ))}
      {message ? <p className="settings-message settings-message-error">{message}</p> : null}
    </div>
  ) : (
    <div className="pricing-auth-actions pricing-auth-actions-compact">
      {billingOptions.map((option) => (
        <button
          className={option.interval === "annual" ? "button button-small" : "button button-secondary button-small"}
          disabled={Boolean(isStartingCheckout)}
          key={option.interval}
          type="button"
          onClick={() => startCheckout(option.interval)}
        >
          {isStartingCheckout === option.interval ? "Opening..." : option.label}
        </button>
      ))}
      {message ? <p className="settings-message settings-message-error">{message}</p> : null}
    </div>
  );
}
