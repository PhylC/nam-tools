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
          setTone("error");
          setMessage("This password reset link has expired or could not be used. Request a new password reset link.");
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
      setTone("error");
      setMessage("We could not update your password. Please try again.");
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
