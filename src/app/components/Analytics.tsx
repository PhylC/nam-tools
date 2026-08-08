"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  GA_MEASUREMENT_ID,
  getStoredAnalyticsConsent,
  setAnalyticsSuppressed,
  subscribeToAnalyticsConsent,
  trackPageView,
} from "../../lib/analytics";
import { useAptMode } from "./AptMode";

const privatePagePrefixes = [
  "/account",
  "/workspace",
  "/settings",
  "/login",
  "/create-account",
  "/forgot-password",
  "/update-password",
  "/custom-deck",
];

function isPublicPageViewPath(pathname: string) {
  return !privatePagePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function Analytics() {
  const pathname = usePathname();
  const { canUseTestMode, isLoadingTestMode } = useAptMode();
  const [isReady, setIsReady] = useState(false);
  const consent = useSyncExternalStore(subscribeToAnalyticsConsent, getStoredAnalyticsConsent, () => null);

  useEffect(() => {
    setAnalyticsSuppressed(isLoadingTestMode || canUseTestMode);
  }, [isLoadingTestMode, canUseTestMode]);

  useEffect(() => {
    if (
      !GA_MEASUREMENT_ID ||
      consent !== "accepted" ||
      !isReady ||
      isLoadingTestMode ||
      canUseTestMode ||
      !isPublicPageViewPath(pathname)
    ) {
      return;
    }
    trackPageView(window.location.href);
  }, [pathname, consent, isReady, isLoadingTestMode, canUseTestMode]);

  if (!GA_MEASUREMENT_ID || consent !== "accepted" || isLoadingTestMode || canUseTestMode) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="apt-ga4" strategy="afterInteractive" onReady={() => setIsReady(true)}>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
