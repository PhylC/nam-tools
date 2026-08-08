import { Hero } from "../components/Shell";
import { privateMetadata } from "../seo";
import { ForgotPasswordClient } from "./ForgotPasswordClient";

export const metadata = privateMetadata(
  "Reset your password",
  "Send a password reset link for your APT account.",
);

export default function ForgotPasswordPage() {
  return (
    <div className="page-stack">
      <Hero title="Reset your password">
        <p>Enter the email address for your account and we&apos;ll send you a password reset link.</p>
      </Hero>
      <section className="shell section auth-section">
        <ForgotPasswordClient />
      </section>
    </div>
  );
}
