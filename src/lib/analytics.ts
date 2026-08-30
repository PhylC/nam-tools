"use client";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
const ANALYTICS_CONSENT_KEY = "apt-analytics-consent";

type AnalyticsEventName =
  | "calculator_opened"
  | "calculator_completed"
  | "signup_started"
  | "signup_completed"
  | "login_completed"
  | "logout_completed"
  | "upgrade_clicked"
  | "checkout_started"
  | "checkout_completed"
  | "roi_export_clicked"
  | "roi_comparison_saved"
  | "roi_scenario_saved";

type AnalyticsEventProperties = Record<string, string | number | boolean | null | undefined>;
export type AnalyticsConsent = "accepted" | "rejected" | null;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    aptAnalyticsSuppressed?: boolean;
    aptAnalyticsConsent?: AnalyticsConsent;
  }
}

export function getStoredAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
  if (stored === "accepted" || stored === "rejected") {
    window.aptAnalyticsConsent = stored;
    return stored;
  }
  window.aptAnalyticsConsent = null;
  return null;
}

export function setStoredAnalyticsConsent(consent: Exclude<AnalyticsConsent, null>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ANALYTICS_CONSENT_KEY, consent);
  window.aptAnalyticsConsent = consent;
  window.dispatchEvent(new CustomEvent("apt-analytics-consent-change", { detail: consent }));
}

export function subscribeToAnalyticsConsent(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("apt-analytics-consent-change", listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener("apt-analytics-consent-change", listener);
    window.removeEventListener("storage", listener);
  };
}

export function isAnalyticsEnabled() {
  return (
    Boolean(GA_MEASUREMENT_ID) &&
    typeof window !== "undefined" &&
    window.aptAnalyticsSuppressed === false &&
    window.aptAnalyticsConsent === "accepted"
  );
}

export function setAnalyticsSuppressed(isSuppressed: boolean) {
  if (typeof window === "undefined") return;
  window.aptAnalyticsSuppressed = isSuppressed;
}

function sendGtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag(...args);
    return;
  }
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(args);
}

export function trackPageView(url: string) {
  if (!isAnalyticsEnabled()) return;
  sendGtag("event", "page_view", {
    page_location: url,
    page_path: window.location.pathname,
    page_title: document.title,
  });
}

export function trackEvent(eventName: AnalyticsEventName, properties: AnalyticsEventProperties = {}) {
  if (!isAnalyticsEnabled()) return;
  sendGtag("event", eventName, properties);
}

export function trackCalculatorOpened(calculatorSlug: string, calculatorName: string) {
  trackEvent("calculator_opened", {
    calculator_slug: calculatorSlug,
    calculator_name: calculatorName,
  });
}

export function trackCalculatorCompleted(calculatorSlug: string, calculatorName: string) {
  trackEvent("calculator_completed", {
    calculator_slug: calculatorSlug,
    calculator_name: calculatorName,
  });
}

export function trackUpgradeClicked(location: string) {
  trackEvent("upgrade_clicked", {
    location,
  });
}
