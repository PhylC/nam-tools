"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { useAuth } from "../../lib/useAuth";
import { AuthDebugStatus } from "./AuthDebugStatus";

type AuthFormMode = "login" | "create";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setTone("error");
      setMessage("Enter your email and password.");
      return;
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setTone("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setTone("error");
      setMessage("Your password must be at least 8 characters.");
      return;
    }

    if (isCreate && password !== confirmPassword) {
      setTone("error");
      setMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = isCreate ? await signUp(trimmedEmail, password) : await signIn(trimmedEmail, password);
      setTone(result.ok ? "success" : "error");
      setMessage(result.message);

      if (result.ok && result.redirectTo) {
        router.push(result.redirectTo);
        return;
      }

      if (result.ok && !isCreate) {
        router.push(getReturnTo("/account"));
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`${isCreate ? "Create account" : "Login"} form submit failed`, error);
        if (error instanceof Error && error.stack) console.warn(`${isCreate ? "Create account" : "Login"} form submit stack`, error.stack);
      }
      setTone("error");
      setMessage(isCreate ? "Account creation is temporarily unavailable." : "Auth service unavailable. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="card auth-card" onSubmit={handleSubmit}>
      {!isConfigured && !isCreate ? (
        <p className="settings-message settings-message-warning">
          Sign-in is not configured. Please contact support.
        </p>
      ) : null}
      <AuthDebugStatus />
      <label className="field">
        <span>Email</span>
        <input autoComplete="email" inputMode="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label className="field">
        <span>Password</span>
        <input autoComplete={isCreate ? "new-password" : "current-password"} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      {!isCreate ? (
        <Link className="text-link auth-forgot-link" href="/forgot-password">
          Forgot password?
        </Link>
      ) : null}
      {isCreate ? (
        <label className="field">
          <span>Confirm password</span>
          <input autoComplete="new-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        </label>
      ) : null}
      <div className="auth-actions">
        <button className="button" disabled={isSubmitting || (!isCreate && !isConfigured)} type="submit">
          {isSubmitting ? "Working..." : isCreate ? "Create free account" : "Log in"}
        </button>
        {isCreate ? (
          <Link className="text-link" href="/login">Already have an account? Log in</Link>
        ) : (
          <Link className="button button-secondary" href="/create-account">Create free account</Link>
        )}
      </div>
      {message ? <p className={`settings-message settings-message-${tone}`} role="status">{message}</p> : null}
      {isCreate && tone === "success" ? (
        <div className="auth-actions auth-actions-followup">
          <Link className="button button-secondary" href="/login">
            Go to login
          </Link>
          <Link className="text-link" href="/calculators">
            Back to calculators
          </Link>
        </div>
      ) : null}
    </form>
  );
}
