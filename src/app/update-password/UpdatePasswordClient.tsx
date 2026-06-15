"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabaseClient";

function readUrlError(searchParams: URLSearchParams) {
  const queryError = searchParams.get("error") || searchParams.get("error_description");
  if (queryError) return true;

  if (typeof window === "undefined") return false;
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return Boolean(hashParams.get("error") || hashParams.get("error_description"));
}

function logPasswordUpdateError(context: string, error: unknown) {
  if (process.env.NODE_ENV === "production") return;
  console.warn(`Password reset flow failed: ${context}`, error);
}

function passwordUpdateErrorMessage(error: unknown) {
  const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("weak") || lowerMessage.includes("password")) {
    return "Choose a stronger password with at least 8 characters.";
  }

  if (lowerMessage.includes("expired") || lowerMessage.includes("invalid") || lowerMessage.includes("token")) {
    return "This password reset link has expired or could not be used. Request a new password reset link.";
  }

  if (lowerMessage.includes("fetch") || lowerMessage.includes("network") || lowerMessage.includes("failed to fetch")) {
    return "Network error. Check your connection and try again.";
  }

  return "Password reset service unavailable. Please try again later.";
}

export function UpdatePasswordClient() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"error" | "success" | "info">("info");
  const [isCheckingLink, setIsCheckingLink] = useState(true);
  const [hasResetSession, setHasResetSession] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function prepareResetSession() {
      if (!supabase) {
        if (!isMounted) return;
        setTone("error");
        setMessage("Password reset is temporarily unavailable. Please try again later.");
        setIsCheckingLink(false);
        return;
      }

      if (readUrlError(new URLSearchParams(window.location.search))) {
        if (!isMounted) return;
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        logPasswordUpdateError("reset link contained an error", {
          queryError: Boolean(new URLSearchParams(window.location.search).get("error")),
          queryErrorDescription: Boolean(new URLSearchParams(window.location.search).get("error_description")),
          hashError: Boolean(hashParams.get("error")),
          hashErrorDescription: Boolean(hashParams.get("error_description")),
        });
        setTone("error");
        setMessage("This password reset link has expired or could not be used. Request a new password reset link.");
        setIsCheckingLink(false);
        return;
      }

      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (!isMounted) return;
          logPasswordUpdateError("code exchange", error);
          setTone("error");
          setMessage(passwordUpdateErrorMessage(error));
          setIsCheckingLink(false);
          return;
        }
        window.history.replaceState(null, "", "/update-password");
      }

      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (!data.session) {
        setTone("error");
        setMessage("Use the password reset link from your email to choose a new password.");
        setIsCheckingLink(false);
        return;
      }

      if (window.location.hash) {
        window.history.replaceState(null, "", "/update-password");
      }

      setHasResetSession(true);
      setMessage("");
      setIsCheckingLink(false);
    }

    prepareResetSession();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!newPassword || !confirmPassword) {
      setTone("error");
      setMessage("Enter and confirm your new password.");
      return;
    }

    if (newPassword.length < 8) {
      setTone("error");
      setMessage("Your password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setTone("error");
      setMessage("Passwords do not match.");
      return;
    }

    if (!supabase || !hasResetSession) {
      setTone("error");
      setMessage("This password reset link has expired or could not be used. Request a new password reset link.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      await supabase.auth.signOut();
    }
    setIsSubmitting(false);

    if (error) {
      logPasswordUpdateError("password update", error);
      setTone("error");
      setMessage(passwordUpdateErrorMessage(error));
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setIsUpdated(true);
    setTone("success");
    setMessage("Your password has been updated. You can now log in.");
  }

  return (
    <form className="card auth-card" onSubmit={handleSubmit}>
      {isCheckingLink ? <p className="settings-message settings-message-info">Checking your password reset link...</p> : null}
      <label className="field">
        <span>New password</span>
        <input
          autoComplete="new-password"
          disabled={!hasResetSession || isUpdated}
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </label>
      <label className="field">
        <span>Confirm new password</span>
        <input
          autoComplete="new-password"
          disabled={!hasResetSession || isUpdated}
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </label>
      <div className="auth-actions">
        <button className="button" disabled={isSubmitting || !hasResetSession || isUpdated} type="submit">
          {isSubmitting ? "Updating..." : "Update password"}
        </button>
        {isUpdated ? (
          <Link className="button button-secondary" href="/login">
            Go to login
          </Link>
        ) : null}
      </div>
      {message ? <p className={`settings-message settings-message-${tone}`} role={tone === "error" ? "alert" : "status"}>{message}</p> : null}
      {!hasResetSession && !isCheckingLink ? (
        <Link className="text-link" href="/forgot-password">
          Request a new password reset link
        </Link>
      ) : null}
    </form>
  );
}
