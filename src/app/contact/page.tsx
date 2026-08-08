import { Hero, SectionHeader } from "../components/Shell";
import { seoMetadata } from "../seo";
import { ContactForm } from "./ContactForm";

export const metadata = seoMetadata({
  title: "Contact",
  description:
    "Contact Account Planning Tools with calculator feedback, calculation issues and practical suggestions for future commercial planning tools.",
  path: "/contact",
});

const reasons = [
  "A calculation issue or unclear result",
  "Account help or privacy/data requests",
  "A retailer ask you want a better tool for",
  "A template request for a real meeting format",
  "A practical improvement that would save time",
];

export default function ContactPage() {
  return (
    <div className="page-stack">
      <Hero eyebrow="Contact" title="Contact Account Planning Tools">
        <p>
          For product questions, feedback, account help or privacy requests, contact Account Planning Tools.
        </p>
        <p>
          Send a note through the form, or email{" "}
          <a className="text-link" href="mailto:hello@accountplanningtools.com">
            hello@accountplanningtools.com
          </a>.
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
          <div className="operator-details">
            <h3>Operator</h3>
            <p>
              Phyl Sion, trading as Account Planning Tools<br />
              28 Abbey Road<br />
              Croydon<br />
              CR0 1RT<br />
              United Kingdom
            </p>
          </div>
        </article>
        <article className="card">
          <SectionHeader eyebrow="Email" title="Send a note">
            <p>
              Send a message and it will go to the APT team.
            </p>
          </SectionHeader>
          <ContactForm />
        </article>
      </section>
    </div>
  );
}
