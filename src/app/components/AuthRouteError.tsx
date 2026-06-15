"use client";

import Link from "next/link";
import { useEffect } from "react";

export function AuthRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    console.error("Auth page error", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <section className="shell section auth-section">
      <article className="card auth-card">
        <h1>Auth service unavailable</h1>
        <p>We could not load this account page right now. Please try again.</p>
        <div className="auth-actions">
          <button className="button" onClick={reset} type="button">
            Try again
          </button>
          <Link className="button button-secondary" href="/contact">
            Contact support
          </Link>
        </div>
      </article>
    </section>
  );
}
