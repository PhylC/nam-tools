import { AuthForm } from "../components/AuthForms";
import { AuthPageGuard } from "../components/AuthPageGuard";
import { Hero } from "../components/Shell";
import { privateMetadata } from "../seo";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = privateMetadata(
  "Create a free account",
  "Create a free APT account to save currency, market and tax defaults.",
);

export default function CreateAccountPage() {
  return (
    <div className="page-stack">
      <Hero title="Create a free account">
        <p>Create a free account to save your defaults, then start with the calculation you need next.</p>
      </Hero>
      <section className="shell section auth-section auth-onboarding-section">
        <Suspense fallback={null}>
          <AuthPageGuard mode="create">
            <AuthForm mode="create" />
          </AuthPageGuard>
        </Suspense>
        <aside className="card auth-onboarding-card" aria-label="What to do after creating an account">
          <p className="eyebrow">Start here</p>
          <h2>Your first useful setup.</h2>
          <ol>
            <li>Save your currency, market and tax defaults.</li>
            <li>Run a real calculator for your next customer question.</li>
            <li>Upgrade only when you need saved scenarios or exports.</li>
          </ol>
          <div className="auth-onboarding-actions">
            <Link className="button button-secondary" href="/settings">Set defaults</Link>
            <Link className="text-link" href="/calculators">Browse calculators</Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
