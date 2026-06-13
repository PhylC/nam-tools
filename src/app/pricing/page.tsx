import type { Metadata } from "next";
import Link from "next/link";
import { Hero, SectionHeader } from "../components/Shell";

export const metadata: Metadata = {
  title: "Pricing | Free vs APT Pro",
    description:
    "Compare Free and APT Pro. Use free calculators for quick checks, or upgrade to save, compare and export commercial scenarios.",
};

const plans = [
  {
    name: "Free",
    price: "£0",
    detail: "Best for quick checks.",
    features: [
      "Single-product, single-scenario checks",
      "Core calculators",
      "Free single-line ROI Tool",
      "Copy a basic summary",
      "Download a simple CSV",
      "Remember last-used values on this device",
      "No setup required",
    ],
    href: "/calculators",
    cta: "Use free calculators",
  },
  {
    name: "APT Pro",
    price: "£19/month",
    detail: "Best for regular commercial planning.",
    features: [
      "Save scenarios and reopen them later",
      "Compare different versions of a deal",
      "Multi-SKU ROI scenario planner",
      "Upload or paste spreadsheet data",
      "Account-level calculator defaults",
      "Save your company logo, disclaimer and presentation template",
      "Cleaner exports for meetings and reviews",
    ],
    href: "/settings",
    cta: "Open Pro settings",
  },
  {
    name: "Team",
    price: "Custom",
    detail: "For teams that need shared planning standards, templates or scenario workflows.",
    features: [
      "Shared customer plans",
      "Team scenario libraries",
      "Manager review process",
      "Standardised templates",
      "Shared export packs",
    ],
    href: "/contact",
    cta: "Contact sales",
  },
];

const comparisonRows = [
  ["Quick calculators", "Included", "Included"],
  ["Products per calculation", "1 product", "Multiple products"],
  ["Scenarios", "1 scenario", "Save, duplicate and compare scenarios"],
  ["Result summary", "Basic summary", "Advanced commercial summary"],
  ["Copy summary", "Included", "Included"],
  ["CSV download", "Current calculation only", "Included, plus richer exports"],
  ["Excel export", "Not included", "Export workbook"],
  ["PowerPoint export", "Not included", "Export presentation-ready summaries"],
  ["Company branding", "Not included", "Logo, company details and disclaimer"],
  ["Presentation template upload", "Not included", "Use your own .pptx template"],
  ["Calculator defaults", "Remembered on this device", "Saved to your account"],
  ["Best for", "Quick one-off checks", "Repeated commercial planning and retailer meetings"],
];

export default function PricingPage() {
  return (
    <div className="page-stack">
      <Hero eyebrow="Pricing" title="Start free. Move to Pro when the work repeats.">
        <p>
          Start free for quick one-off checks. Upgrade to APT Pro when you need
          to save, compare and export commercial scenarios regularly.
        </p>
      </Hero>
      <section className="shell section">
        <SectionHeader eyebrow="Plans" title="Useful for quick checks. Stronger for repeat work.">
          <p>
            Use the core calculators for single-product, single-scenario
            checks. APT Pro adds saved scenarios, account-level defaults and
            cleaner exports for meetings, reviews and planning.
          </p>
        </SectionHeader>
        <div className="grid">
          {plans.map((plan) => (
            <article className="card pricing-card" key={plan.name}>
              <h2>{plan.name}</h2>
              <div className="price">{plan.price}</div>
              <p>{plan.detail}</p>
              <ul className="compact-list">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link className="text-link" href={plan.href}>
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="shell section">
        <SectionHeader eyebrow="Free vs APT Pro" title="Compare Free and APT Pro">
          <p>
            Free is built for quick one-off checks. APT Pro is for saving,
            comparing and exporting commercial scenarios.
          </p>
        </SectionHeader>
        <div className="comparison-table-wrap">
          <table className="pricing-comparison-table">
            <caption>Free and APT Pro feature comparison</caption>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col">Free</th>
                <th className="pro-column" scope="col">
                  <span>APT Pro</span>
                  <span className="pill pro-pill recommended-pill">Recommended</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([feature, free, pro]) => (
                <tr key={feature}>
                  <th scope="row">{feature}</th>
                  <td data-label="Free">{free}</td>
                  <td className="pro-column" data-label="APT Pro">{pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <article className="card comparison-cta">
          <div>
            <h3>Use Free for quick checks.</h3>
            <p>Upgrade to APT Pro when you need to save, compare and export your work.</p>
          </div>
          <div className="cta-row">
            <Link className="button" href="/settings">
              Start with APT Pro
            </Link>
            <Link className="button button-secondary" href="/calculators">
              Try free calculators
            </Link>
          </div>
        </article>
      </section>
      <section className="shell section">
        <article className="card split-band">
          <div>
            <p className="eyebrow">Why Pro</p>
            <h2>APT Pro is for when the work does not stop at one calculation.</h2>
          </div>
          <div className="copy-stack">
            <p>
              The free tools are for fast commercial checks: a quick ROI read,
              a margin sense-check, or a first draft of a buyer meeting plan.
            </p>
            <p>
              Pro is for the real workflow: saving scenarios, comparing
              versions, keeping your default setup, and turning results into
              cleaner outputs for meetings and reviews.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
