import type { Metadata } from "next";
import { Hero, SectionHeader } from "../components/Shell";

export const metadata: Metadata = {
  title: "Contact Account Planning Tools",
  description:
    "Contact Account Planning Tools for feedback, partnerships, template requests and tool suggestions.",
};

const reasons = [
  "Feedback on a calculator or planning tool",
  "Partnership or commercial collaboration ideas",
  "Template requests for future packs",
  "Suggestions for new account manager, KAM or commercial tools",
];

export default function ContactPage() {
  return (
    <div className="page-stack">
      <Hero eyebrow="Contact" title="Share feedback, requests or tool ideas.">
        <p>
          Email{" "}
          <a className="text-link" href="mailto:hello@accountplanningtools.co.uk">
            hello@accountplanningtools.co.uk
          </a>{" "}
          for feedback, partnership ideas, template requests or suggestions for
          future tools.
        </p>
      </Hero>
      <section className="shell section split-band">
        <article className="card">
          <SectionHeader eyebrow="Contact reasons" title="Useful things to send.">
            <ul className="compact-list">
              {reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </SectionHeader>
        </article>
        <article className="card">
          <SectionHeader eyebrow="Placeholder form" title="Send a note later.">
            <p>
              This form is visual only in the MVP and does not submit yet. For
              now, please use the email link above.
            </p>
          </SectionHeader>
          <div className="form-grid">
            <label className="field">
              <span>Name</span>
              <input placeholder="Your name" />
            </label>
            <label className="field">
              <span>Email</span>
              <input placeholder="you@company.co.uk" type="email" />
            </label>
            <label className="field">
              <span>Message</span>
              <textarea placeholder="What would you like to share?" />
            </label>
          </div>
        </article>
      </section>
    </div>
  );
}
