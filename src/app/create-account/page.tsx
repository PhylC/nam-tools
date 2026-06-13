import type { Metadata } from "next";
import { AuthForm } from "../components/AuthForms";
import { Hero } from "../components/Shell";

export const metadata: Metadata = {
  title: "Create a free account | Account Planning Tools",
  description: "Create a free APT account to save currency, market and tax defaults.",
};

export default function CreateAccountPage() {
  return (
    <div className="page-stack">
      <Hero title="Create a free account">
        <p>Use calculators without an account, or create a free account to save your currency, market and tax defaults.</p>
      </Hero>
      <section className="shell section auth-section">
        <AuthForm mode="create" />
      </section>
    </div>
  );
}
