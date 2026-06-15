"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabaseClient";
import { AuthDebugStatus } from "../components/AuthDebugStatus";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordResetRedirectUrl() {
  const configuredRedirect = process.env.NEXT_PUBLIC_PASSWORD_RESET_REDIRECT_URL?.trim();
  if (configuredRedirect) {
    return configuredRedirect;
  }

  if (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return `${window.location.origin}/update-password`;
  }

  return "https://accountplanningtools.com/update-password";
}

function logPasswordResetError(error: unknown, redirectTo: string) {
  if (process.env.NODE_ENV === "production") return;
  console.warn("Password reset request failed", { error, redirectTo });
  if (error instanceof Error && error.stack) {
    console.warn("Password reset request stack", error.stack);
  }
}

function logPasswordResetOperation(redirectTo: string) {
  if (process.env.NODE_ENV === "production") return;
  console.info("Supabase auth operation: resetPasswordForEmail", { redirectTo });
}

function passwordResetErrorMessage(error: unknown) {
  const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
  const status = error && typeof error === "object" && "status" in error ? Number(error.status) : undefined;
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("api key") || lowerMessage.includes("invalid key") || lowerMessage.includes("project")) {
    return "Password reset could not be sent because auth is not configured.";
  }

  if (lowerMessage.includes("redirect") || lowerMessage.includes("url") || lowerMessage.includes("site url")) {
    return "Password reset is not configured correctly. Please contact support.";
  }

  if (lowerMessage.includes("fetch") || lowerMessage.includes("network") || lowerMessage.includes("failed to fetch")) {
    return "Network error. Check your connection and try again.";
  }

  if (status === 429 || lowerMessage.includes("rate")) {
    return "Too many reset requests. Please wait a few minutes and try again.";
  }

  if (lowerMessage.includes("smtp") || lowerMessage.includes("email")) {
    return "Email service is temporarily unavailable. Please try again later.";
  }

  return "Password reset service unavailable. Please try again later.";
}

function thrownPasswordResetErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("fetch") || message.includes("network") || message.includes("failed to fetch")) {
    return "Auth service unavailable. Check your connection and try again.";
  }
  return "Password reset unavailable. Please try again later.";
}

export function ForgotPasswordClient() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"error" | "success">("success");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const trimmedEmail = email.trim();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setTone("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    if (!supabase) {
      setTone("error");
      setMessage("Password reset could not be sent because auth is not configured.");
      return;
    }

    const redirectTo = getPasswordResetRedirectUrl();
    logPasswordResetOperation(redirectTo);
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo,
      });
      setIsSubmitting(false);

      if (error) {
        logPasswordResetError(error, redirectTo);
        setTone("error");
        setMessage(passwordResetErrorMessage(error));
        return;
      }
    } catch (error) {
      setIsSubmitting(false);
      logPasswordResetError(error, redirectTo);
      setTone("error");
      setMessage(thrownPasswordResetErrorMessage(error));
      return;
    }

    setEmail("");
    setTone("success");
    setMessage("If an account exists for that email, we've sent a password reset link.");
  }

  return (
    <form className="card auth-card" onSubmit={handleSubmit}>
      {!supabase ? (
        <p className="settings-message settings-message-warning">
          Password reset could not be sent because auth is not configured.
        </p>
      ) : null}
      <AuthDebugStatus />
      <label className="field">
        <span>Email</span>
        <input
          autoComplete="email"
          inputMode="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <div className="auth-actions">
        <button className="button" disabled={isSubmitting || !supabase} type="submit">
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>
      </div>
      {message ? <p className={`settings-message settings-message-${tone}`} role="status">{message}</p> : null}
    </form>
  );
}
