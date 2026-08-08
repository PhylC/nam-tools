import { Hero } from "../components/Shell";
import { privateMetadata } from "../seo";
import { UpdatePasswordClient } from "./UpdatePasswordClient";

export const metadata = privateMetadata(
  "Choose a new password",
  "Set a new password for your APT account.",
);

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
