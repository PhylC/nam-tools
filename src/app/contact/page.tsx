import type { Metadata } from "next";
import { Hero, SectionHeader } from "../components/Shell";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Account Planning Tools with calculator feedback, calculation issues and practical suggestions for future commercial planning tools.",
};

const reasons = [
  "A calculation issue or unclear result",
  "A retailer ask you want a better tool for",
  "A template request for a real meeting format",
  "A practical improvement that would save time",
];

export default function ContactPage() {
  return (
    <div className="page-stack">
      <Hero eyebrow="Contact" title="Contact">
        <p>
          Have a suggestion, spotted a calculation issue, or want a tool that
          fits the way your team works? Send a note.
        </p>
        <p>
          APT is being built around real commercial planning problems, so
          practical feedback is genuinely useful.
        </p>
        <p>
          <a className="text-link" href="mailto:hello@accountplanningtools.co.uk">
            Email us
          </a>
        </p>
      </Hero>
      <section className="shell section split-band">
        <article className="legal-copy">
          <SectionHeader eyebrow="Contact reasons" title="Useful things to send.">
            <ul className="compact-list">
              {reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </SectionHeader>
        </article>
        <article className="card">
          <SectionHeader eyebrow="Email" title="Send a note">
            <p>
              The quickest route is email for now:
              {" "}
              <a className="text-link" href="mailto:hello@accountplanningtools.co.uk">
                hello@accountplanningtools.co.uk
              </a>
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
