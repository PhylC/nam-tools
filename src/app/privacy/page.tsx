import Link from "next/link";
import { Hero } from "../components/Shell";
import { seoMetadata } from "../seo";

export const metadata = seoMetadata({
  title: "Privacy Policy",
  description:
    "Privacy policy for Account Planning Tools, including accounts, saved workspace data, contact messages, analytics and cookies.",
  path: "/privacy",
});

const purposes = [
  {
    data: "Account data",
    purpose: "Create and manage sign-in, sessions, account status and plan access.",
    basis: "Contract, or steps requested before entering a contract.",
  },
  {
    data: "Saved workspace data",
    purpose: "Save and retrieve ROI plans, deck briefs and related workspace items where account storage is available.",
    basis: "Contract, or legitimate interests in providing requested product features.",
  },
  {
    data: "Local browser preferences",
    purpose: "Remember calculator defaults, settings, saved local work and cookie choices on the device.",
    basis: "Legitimate interests, and consent for analytics preferences where required.",
  },
  {
    data: "Contact messages",
    purpose: "Respond to enquiries, feedback, account help and privacy/data requests.",
    basis: "Legitimate interests, or steps requested by you.",
  },
  {
    data: "Security and technical logs",
    purpose: "Deliver, monitor, protect and debug the service.",
    basis: "Legitimate interests in operating a reliable and secure service.",
  },
  {
    data: "Optional analytics",
    purpose: "Understand public page views and feature usage so APT can improve.",
    basis: "Consent where required for non-essential analytics cookies or similar technologies.",
  },
];

export default function Page() {
  return (
    <div className="page-stack">
      <Hero eyebrow="Compliance" title="Privacy policy">
        <p>
          This policy explains how Account Planning Tools handles personal data, account information,
          saved workspace content, contact messages and optional analytics.
        </p>
      </Hero>
      <section className="shell section legal-copy card">
        <h2>Who operates APT</h2>
        <p>
          The data controller for Account Planning Tools is Phyl Sion, trading as Account Planning Tools.
        </p>
        <p>
          Contact:{" "}
          <a className="text-link" href="mailto:hello@accountplanningtools.com">hello@accountplanningtools.com</a>.
          Postal address: 28 Abbey Road, Croydon, CR0 1RT, United Kingdom.
        </p>

        <h2>Data we collect</h2>
        <ul>
          <li>Account data, such as email address, authentication/session information and account plan/status.</li>
          <li>Saved workspace data, such as ROI plans, scenarios, deck briefs, saved analyses and generated outlines when you use saved workspace features.</li>
          <li>Local browser data, such as calculator defaults, export preferences, test-mode preferences for authorised testers, saved local work and cookie choices stored on your device.</li>
          <li>Contact data, such as your name, email address, message and page URL when you use the contact form or email APT.</li>
          <li>Technical data, such as browser/device information, IP address and request logs processed by hosting, security, authentication or analytics providers.</li>
          <li>Optional analytics data, such as public page views, calculator/tool opened and completed events, login/logout completion and upgrade-click events.</li>
        </ul>
        <p>
          Analytics events are designed not to include commercial calculator inputs, SKU values, prices,
          margin figures, COGS, support values, scenario names, email addresses or user IDs.
        </p>

        <h2>Purposes and lawful bases</h2>
        <div className="legal-table-wrap">
          <table className="legal-table">
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Purpose</th>
                <th scope="col">Likely lawful basis</th>
              </tr>
            </thead>
            <tbody>
              {purposes.map((row) => (
                <tr key={row.data}>
                  <td>{row.data}</td>
                  <td>{row.purpose}</td>
                  <td>{row.basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Service providers</h2>
        <p>APT currently uses or is prepared to use these service providers where configured:</p>
        <ul>
          <li>Supabase for authentication, session handling and account-backed saved data such as ROI plans and deck briefs.</li>
          <li>Resend for contact form email delivery when email delivery is configured.</li>
          <li>Google Analytics 4 / Google for optional analytics, only after analytics consent where required.</li>
          <li>Render for site hosting, delivery, security, performance and request logging.</li>
        </ul>

        <h2>International transfers</h2>
        <p>
          Service providers may process data outside the UK. Where this happens, transfers are handled
          under the provider&apos;s applicable legal transfer mechanisms and safeguards, subject to their
          terms and configuration.
        </p>

        <h2>Retention</h2>
        <p>
          Account data is retained while the account is active. After account deletion, account data is
          deleted or anonymised within up to 90 days, subject to legal, security or abuse-prevention
          requirements.
        </p>
        <p>
          Saved workspace items, including saved plans, scenarios, deck briefs and related workspace data,
          are retained while the relevant account exists. They are deleted with the account, with up to 90
          days allowed for backup or system deletion.
        </p>
        <p>
          Contact enquiries are retained for up to 24 months after the last substantive interaction. They
          may be retained longer where reasonably necessary for an ongoing dispute, legal issue or legitimate
          business requirement.
        </p>
        <p>
          Technical and security logs are normally retained for up to 90 days. They may be retained longer
          where required to investigate security incidents, abuse or technical problems.
        </p>
        <p>
          Google Analytics data is intended to be retained for 14 months, subject to the actual GA4 property
          configuration. The GA4 property must be manually configured to match this period. Analytics consent
          preferences are retained for as long as reasonably necessary to honour and demonstrate the user&apos;s
          consent choice.
        </p>
        <p>
          Local browser data remains on your device until you clear it or use product controls that remove it.
        </p>

        <h2>Your rights</h2>
        <p>
          Under UK data protection law, you may have rights to access, correct, delete, restrict or object
          to use of your personal data. You may also have a right to data portability where applicable, and
          a right to withdraw consent where processing relies on consent.
        </p>
        <p>
          You can make a request using{" "}
          <a className="text-link" href="mailto:hello@accountplanningtools.com">hello@accountplanningtools.com</a>.
          You also have the right to complain to the UK Information Commissioner&apos;s Office.
        </p>

        <h2>Cookies and analytics choices</h2>
        <p>
          Essential authentication/session functionality can continue without analytics consent. Optional GA4
          analytics is only enabled according to the site&apos;s analytics consent control. You can change your
          analytics choice using Cookie settings in the footer.
        </p>
        <p>
          More detail is available in the <Link className="text-link" href="/cookie-policy">Cookie Policy</Link>.
        </p>

        <h2>Commercial data warning</h2>
        <p>
          Some APT tools let you enter customer, retailer, employer or commercially sensitive planning
          information. Only enter information you are authorised and comfortable using in a browser-based
          planning tool, especially when saving workspace items to your account.
        </p>
      </section>
    </div>
  );
}
