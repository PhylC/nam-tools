import { AuthForm } from "../components/AuthForms";
import { AuthPageGuard } from "../components/AuthPageGuard";
import { Hero } from "../components/Shell";
import { privateMetadata } from "../seo";
import { Suspense } from "react";

export const metadata = privateMetadata(
  "Create a free account",
  "Create a free APT account to save currency, market and tax defaults.",
);

export default function CreateAccountPage() {
  return (
    <div className="page-stack">
      <Hero title="Create a free account">
        <p>Use calculators without an account, or create a free account to save your currency, market and tax defaults.</p>
      </Hero>
      <section className="shell section auth-section">
        <Suspense fallback={null}>
          <AuthPageGuard mode="create">
            <AuthForm mode="create" />
          </AuthPageGuard>
        </Suspense>
      </section>
    </div>
  );
}
