import type { Metadata } from "next";
import { AuthForm } from "../components/AuthForms";
import { Hero } from "../components/Shell";

export const metadata: Metadata = {
  title: "Log in | Account Planning Tools",
  description: "Log in to save calculator defaults and return to your APT workspace.",
};

export default function LoginPage() {
  return (
    <div className="page-stack">
      <Hero title="Log in">
        <p>Log in to save your calculator defaults and return to your APT workspace.</p>
      </Hero>
      <section className="shell section auth-section">
        <AuthForm mode="login" />
      </section>
    </div>
  );
}
