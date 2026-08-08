"use client";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

type AnalyticsEventName =
  | "calculator_opened"
  | "calculator_completed"
  | "signup_started"
  | "signup_completed"
  | "login_completed"
  | "logout_completed"
  | "upgrade_clicked";

type AnalyticsEventProperties = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    aptAnalyticsSuppressed?: boolean;
  }
}

export function isAnalyticsEnabled() {
  return Boolean(GA_MEASUREMENT_ID) && typeof window !== "undefined" && window.aptAnalyticsSuppressed === false;
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
