import type { Metadata } from "next";
import { AuthForm } from "../components/AuthForms";
import { Hero } from "../components/Shell";

export const metadata: Metadata = {
  title: "Log in | Account Planning Tools",
  description: "Log in to save calculator defaults and return to your APT workspace.",
};

type LoginPageProps = {
  searchParams: Promise<{ confirmed?: string; confirmation?: string; error?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorParam = Array.isArray(params.error) ? params.error[0] : params.error;
  const showConfirmed = params.confirmed === "true";
  const showConfirmationError = params.confirmation === "expired" || Boolean(errorParam);

  return (
    <div className="page-stack">
      <Hero title="Log in">
        <p>Log in to save your calculator defaults and return to your APT workspace.</p>
      </Hero>
      <section className="shell section auth-section">
        {showConfirmed ? (
          <div className="settings-message settings-message-success auth-notice" role="status">
            <strong>Email confirmed. You can now log in.</strong>
            <span>Use the email and password you used when creating your account.</span>
          </div>
        ) : null}
        {showConfirmationError ? (
          <div className="settings-message settings-message-error auth-notice" role="alert">
            Confirmation link expired or could not be used. Try logging in, or create your account again.
          </div>
        ) : null}
        <AuthForm mode="login" />
      </section>
    </div>
  );
}
