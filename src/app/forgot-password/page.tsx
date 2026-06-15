import type { Metadata } from "next";
import { Hero } from "../components/Shell";
import { ForgotPasswordClient } from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "Reset your password | Account Planning Tools",
  description: "Send a password reset link for your APT account.",
};

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
