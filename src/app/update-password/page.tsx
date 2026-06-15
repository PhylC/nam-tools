import type { Metadata } from "next";
import { Hero } from "../components/Shell";
import { UpdatePasswordClient } from "./UpdatePasswordClient";

export const metadata: Metadata = {
  title: "Choose a new password | Account Planning Tools",
  description: "Set a new password for your APT account.",
};

export default function UpdatePasswordPage() {
  return (
    <div className="page-stack">
      <Hero title="Choose a new password">
        <p>Enter and confirm your new password to finish resetting your account access.</p>
      </Hero>
      <section className="shell section auth-section">
        <UpdatePasswordClient />
      </section>
    </div>
  );
}
