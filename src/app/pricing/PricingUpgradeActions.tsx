"use client";

import Link from "next/link";
import { trackUpgradeClicked } from "../../lib/analytics";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";

type PricingUpgradeActionsProps = {
  location: string;
  variant?: "link" | "panel";
};

export function PricingUpgradeActions({ location, variant = "link" }: PricingUpgradeActionsProps) {
  const { isAuthenticated, isLoading, actualPlan } = useSupabaseAuth();
  const isPro = actualPlan === "pro" || actualPlan === "team";

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
        <p className="settings-message settings-message-info">Create an account or log in to continue when Pro checkout opens.</p>
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
      <p className="settings-message settings-message-info">
        Current plan: Free. Upgrade checkout coming soon.
      </p>
      <button className="button" disabled type="button" onClick={() => trackUpgradeClicked(`${location}_checkout_coming_soon`)}>
        Upgrade checkout coming soon
      </button>
      <Link className="button button-secondary" href="/contact" onClick={() => trackUpgradeClicked(`${location}_contact`)}>
        Request Pro access
      </Link>
    </div>
  ) : (
    <span className="text-link pricing-action-muted">Upgrade checkout coming soon</span>
  );
}
