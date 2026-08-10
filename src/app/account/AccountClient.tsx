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
  stripe_cancel_at: string | null;
  stripe_canceled_at: string | null;
  stripe_cancel_at_period_end: boolean;
  stripe_cancellation_reason: string | null;
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

function isPaymentIssueStatus(status: string | null | undefined) {
  return status === "past_due" || status === "unpaid" || status === "incomplete";
}

function isEndedStatus(status: string | null | undefined) {
  return status === "canceled" || status === "cancelled" || status === "incomplete_expired";
}

function isFutureDate(value: string | null | undefined) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time > Date.now();
}

function isEntitledStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

function getBillingDisplay(billing: BillingState, actualPlan: string) {
  const status = billing?.stripe_subscription_status;
  const formattedPeriodEnd = formatBillingDate(billing?.stripe_current_period_end);
  const formattedCancelAt = formatBillingDate(billing?.stripe_cancel_at);
  const isFree = actualPlan === "free";

  if (!billing || !status) {
    return {
      statusLabel: "",
      dateLabel: "",
      dateValue: "",
      message: "",
      messageTone: "info" as const,
      showBillingStatus: false,
      showManageBilling: false,
    };
  }

  if (isPaymentIssueStatus(status)) {
    return {
      statusLabel: "Payment issue",
      dateLabel: "",
      dateValue: "",
      message: "There's a problem with your payment method. Manage billing to update your payment details.",
      messageTone: "warning" as const,
      showBillingStatus: true,
      showManageBilling: true,
    };
  }

  const isScheduledCancellation = isEntitledStatus(status) && (billing.stripe_cancel_at_period_end || isFutureDate(billing.stripe_cancel_at));

  if (isScheduledCancellation) {
    const accessEndDate = formattedCancelAt || formattedPeriodEnd;
    return {
      statusLabel: "Cancelling",
      dateLabel: "Pro access ends",
      dateValue: accessEndDate,
      message: accessEndDate
        ? `Your subscription is cancelled and will not renew. You'll keep APT Pro until ${accessEndDate}.`
        : "Your subscription is cancelled and will not renew.",
      messageTone: "warning" as const,
      showBillingStatus: true,
      showManageBilling: true,
    };
  }

  if (isEntitledStatus(status) && !isFree) {
    return {
      statusLabel: "Active",
      dateLabel: "Renews",
      dateValue: formattedPeriodEnd,
      message: "",
      messageTone: "info" as const,
      showBillingStatus: true,
      showManageBilling: true,
    };
  }

  if (isEndedStatus(status) || isFree) {
    return {
      statusLabel: "Ended",
      dateLabel: "",
      dateValue: "",
      message: "",
      messageTone: "info" as const,
      showBillingStatus: isEndedStatus(status),
      showManageBilling: false,
    };
  }

  return {
    statusLabel: "Ended",
    dateLabel: "",
    dateValue: "",
    message: "",
    messageTone: "info" as const,
    showBillingStatus: true,
    showManageBilling: false,
  };
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

  const billingDisplay = getBillingDisplay(billing, actualPlan);
  const planLabel = formatUserPlan(actualPlan);
  const planBadgeClass = actualPlan === "free" ? "account-plan-badge" : "account-plan-badge account-plan-badge-pro";
  const statusBadgeClass = billingDisplay.statusLabel
    ? `account-status-badge account-status-badge-${billingDisplay.messageTone}`
    : "account-status-badge";
  const detailItems = [
    {
      label: "Email",
      value: user?.email ?? "",
      wide: true,
    },
    {
      label: "Current plan",
      value: planLabel,
    },
    billing?.billing_interval && billingDisplay.showManageBilling
      ? {
          label: "Billing cycle",
          value: formatBillingInterval(billing.billing_interval),
        }
      : null,
    billingDisplay.showBillingStatus
      ? {
          label: "Billing status",
          value: billingDisplay.statusLabel,
          badgeClassName: statusBadgeClass,
        }
      : null,
    billingDisplay.dateLabel && billingDisplay.dateValue
      ? {
          label: billingDisplay.dateLabel,
          value: billingDisplay.dateValue,
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string; wide?: boolean; badgeClassName?: string }>;

  return (
    <section className="shell section account-section">
      <article className="card account-card account-dashboard-card">
        <div className="account-card-header">
          <div>
            <p className="eyebrow">Account overview</p>
            <h2>Your APT account</h2>
            <p>Review your access, billing status and saved work.</p>
          </div>
          <span className={planBadgeClass}>{planLabel}</span>
        </div>

        <div className="account-dashboard-grid">
          <div className="account-overview-panel">
            <div className="account-detail-grid">
              {detailItems.map((item) => (
                <div className={item.wide ? "account-detail-item account-detail-item-wide" : "account-detail-item"} key={item.label}>
                  <span>{item.label}</span>
                  {item.badgeClassName ? <strong className={item.badgeClassName}>{item.value}</strong> : <strong>{item.value}</strong>}
                </div>
              ))}
            </div>

            {billingDisplay.message ? (
              <p className={`account-status-note account-status-note-${billingDisplay.messageTone}`}>
                {billingDisplay.message}
              </p>
            ) : null}
            {isLoadingBilling ? <p className="settings-message settings-message-info">Checking billing status...</p> : null}
          </div>

          <aside className="account-actions-panel" aria-label="Account actions">
            <div>
              <h3>Quick actions</h3>
              <p>Manage billing, preferences and saved planning work from one place.</p>
            </div>
            <div className="account-link-grid">
              {actualPlan === "free" ? (
                <Link className="button" href="/pricing" onClick={() => trackUpgradeClicked("account")}>
                  Upgrade to Pro
                </Link>
              ) : null}
              {billingDisplay.showManageBilling ? (
                <button className="button" disabled={isOpeningPortal} onClick={openBillingPortal} type="button">
                  {isOpeningPortal ? "Opening billing..." : "Manage billing"}
                </button>
              ) : null}
              <Link className="button button-secondary" href="/settings">Settings</Link>
              <Link className="button button-secondary" href="/workspace">My workspace</Link>
            </div>
            <button className="button button-secondary account-sign-out-button" onClick={handleSignOut} type="button">Sign out</button>
          </aside>
        </div>
        {message ? <p className="settings-message settings-message-success">{message}</p> : null}
      </article>
    </section>
  );
}
