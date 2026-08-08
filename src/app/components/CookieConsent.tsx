"use client";

import { useEffect, useState } from "react";
import { useSyncExternalStore } from "react";
import {
  getStoredAnalyticsConsent,
  setStoredAnalyticsConsent,
  subscribeToAnalyticsConsent,
  type AnalyticsConsent,
} from "../../lib/analytics";

const SETTINGS_EVENT = "apt-open-cookie-settings";

export function openCookieSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SETTINGS_EVENT));
}

export function CookieSettingsButton({ className = "footer-link-button" }: { className?: string }) {
  return (
    <button className={className} onClick={openCookieSettings} type="button">
      Cookie settings
    </button>
  );
}

export function CookieConsent() {
  const consent = useSyncExternalStore(subscribeToAnalyticsConsent, getStoredAnalyticsConsent, () => null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isOpen = consent === null || isSettingsOpen;

  useEffect(() => {
    function handleOpenSettings() {
      setIsSettingsOpen(true);
    }

    window.addEventListener(SETTINGS_EVENT, handleOpenSettings);
    return () => window.removeEventListener(SETTINGS_EVENT, handleOpenSettings);
  }, []);

  function choose(nextConsent: Exclude<AnalyticsConsent, null>) {
    setStoredAnalyticsConsent(nextConsent);
    setIsSettingsOpen(false);
  }

  if (!isOpen) return null;

  return (
    <section
      aria-labelledby="cookie-consent-title"
      aria-live="polite"
      className="cookie-consent"
      role="dialog"
    >
      <div>
        <strong id="cookie-consent-title">Analytics cookies</strong>
        <p>
          APT uses essential storage for sign-in and tool preferences. With your permission, GA4 helps us
          understand page and feature usage. Calculator inputs and commercial values are not sent in analytics events.
        </p>
        {consent ? <small>Your current choice: {consent === "accepted" ? "analytics accepted" : "analytics rejected"}.</small> : null}
      </div>
      <div className="cookie-consent-actions">
        <button className="button" onClick={() => choose("accepted")} type="button">
          Accept analytics
        </button>
        <button className="button button-secondary" onClick={() => choose("rejected")} type="button">
          Reject analytics
        </button>
        <a className="text-link" href="/cookie-policy">
          Cookie information
        </a>
      </div>
    </section>
  );
}
