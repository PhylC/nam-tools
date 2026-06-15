"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabaseClient";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordResetRedirectUrl() {
  if (typeof window === "undefined") {
    return "https://accountplanningtools.com/update-password";
  }

  const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (isLocal) {
    return `${window.location.origin}/update-password`;
  }

  return "https://accountplanningtools.com/update-password";
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
      setMessage("Password reset is temporarily unavailable. Please try again later.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: getPasswordResetRedirectUrl(),
    });
    setIsSubmitting(false);

    if (error) {
      setTone("error");
      setMessage("We could not send a password reset link right now. Please try again.");
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
          Password reset is temporarily unavailable. Please try again later.
        </p>
      ) : null}
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
