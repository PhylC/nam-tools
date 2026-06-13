"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { useAuth } from "../../lib/useAuth";

type AuthFormMode = "login" | "create";

function getReturnTo(fallback: string) {
  if (typeof window === "undefined") return fallback;
  const returnTo = new URLSearchParams(window.location.search).get("returnTo");
  return returnTo?.startsWith("/") ? returnTo : fallback;
}

export function AuthForm({ mode }: { mode: AuthFormMode }) {
  const router = useRouter();
  const { signIn, signUp, isConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"error" | "success" | "info">("info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCreate = mode === "create";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!email.trim() || !password) {
      setTone("error");
      setMessage("Enter your email and password.");
      return;
    }

    if (password.length < 6) {
      setTone("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (isCreate && password !== confirmPassword) {
      setTone("error");
      setMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const result = isCreate ? await signUp(email.trim(), password) : await signIn(email.trim(), password);
    setIsSubmitting(false);
    setTone(result.ok ? "success" : "error");
    setMessage(result.message);

    if (result.ok && !isCreate) {
      router.push(getReturnTo("/account"));
    }
  }

  return (
    <form className="card auth-card" onSubmit={handleSubmit}>
      {!isConfigured ? (
        <p className="settings-message settings-message-warning">
          Auth is not configured yet. Add Supabase environment variables.
        </p>
      ) : null}
      <label className="field">
        <span>Email</span>
        <input autoComplete="email" inputMode="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label className="field">
        <span>Password</span>
        <input autoComplete={isCreate ? "new-password" : "current-password"} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      {isCreate ? (
        <label className="field">
          <span>Confirm password</span>
          <input autoComplete="new-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        </label>
      ) : null}
      <div className="auth-actions">
        <button className="button" disabled={isSubmitting || !isConfigured} type="submit">
          {isSubmitting ? "Working..." : isCreate ? "Create free account" : "Log in"}
        </button>
        {isCreate ? (
          <Link className="text-link" href="/login">Already have an account? Log in</Link>
        ) : (
          <Link className="button button-secondary" href="/create-account">Create free account</Link>
        )}
      </div>
      {message ? <p className={`settings-message settings-message-${tone}`} role="status">{message}</p> : null}
    </form>
  );
}
