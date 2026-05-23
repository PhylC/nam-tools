import type { Metadata } from "next";
import Link from "next/link";
import { Hero, PlaceholderImage, SectionHeader } from "../components/Shell";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free and Pro Account Planning Tools plans for guided deck builders, linked spreadsheet assumptions, saved drafts and exports.",
};

const plans = [
  {
    name: "Free",
    price: "£0",
    detail: "Simple free tools for day-to-day commercial planning.",
    status: "Live now",
    features: [
      "Run quick commercial checks",
      "Static PowerPoint templates",
      "Static Google Sheets/Excel-style templates",
      "Core calculators",
      "Free single-line ROI Tool",
      "Copy basic summaries",
      "Fast browser-based workflows",
      "No setup required",
    ],
    href: "/calculators",
    cta: "Use free calculators",
  },
  {
    name: "Pro",
    price: "£19/month",
    detail: "For individual account managers who want reusable outputs.",
    status: "Pro",
    features: [
      "Upload or paste Excel data",
      "Guided deck builders",
      "Multi-SKU ROI scenario planner",
      "First-draft PowerPoint/Google Slides outputs",
      "Linked Excel/Google Sheets assumptions",
      "Build and compare multiple scenarios",
      "Saved drafts",
      "Customer-ready charts and summaries",
    ],
    href: "/presentation-templates",
    cta: "Open Pro workflows",
  },
  {
    name: "Team",
    price: "Custom",
    detail: "For commercial teams standardising planning quality.",
    status: "Coming soon",
    features: [
      "Shared customer plans",
      "Team scenario libraries",
      "Manager review workflow",
      "Standardised templates",
      "Shared export packs",
    ],
    href: "/contact",
    cta: "Contact sales",
  },
];

const freeVsPro = [
  {
    title: "Free",
    badge: "Live now",
    items: [
      "Use core calculators and templates",
      "Static PowerPoint templates",
      "Static Google Sheets/Excel-style templates",
      "Core calculators",
      "Free ROI Tool",
      "Copy basic summaries",
      "Fast browser-based workflows",
    ],
  },
  {
    title: "Pro",
    badge: "Pro",
    items: [
      "Upload or paste Excel data",
      "Guided deck builders",
      "Multi-SKU ROI scenarios",
      "First-draft PowerPoint/Google Slides outputs",
      "Linked Excel/Google Sheets assumptions",
      "Compare scenarios",
      "Saved drafts",
      "Customer-ready charts and summaries",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="page-stack">
      <Hero eyebrow="Pricing" title="Choose the workflow depth you need.">
        <p>
          Start with simple free tools. Upgrade to Pro for multi-SKU planning,
          scenario comparison, saving and exports.
        </p>
      </Hero>
      <section className="shell visual-section">
        <PlaceholderImage
          aspectRatio="16 / 9"
          description="Pro workflow, export and saved scenario workspace."
          filename="/images/pricing-pro-workflow.svg"
          title="Pro workflow and export"
        />
      </section>
      <section className="shell section">
        <SectionHeader eyebrow="Plans" title="Built around practical commercial workflows.">
          <p>
            The free plan covers quick commercial checks and reusable templates.
            Pro focuses on guided deck builders, first-draft PowerPoint/Google
            Slides outputs, linked spreadsheet assumptions, scenario comparison
            and customer-ready charts.
          </p>
        </SectionHeader>
        <div className="grid">
          {plans.map((plan) => (
            <article className="card pricing-card" key={plan.name}>
              <span className="pill">{plan.status}</span>
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
        <SectionHeader eyebrow="Free vs Pro" title="Free tools should build trust. Pro should deepen the workflow.">
          <p>
            The free version stays useful: quick inputs, instant answers and
            copyable summaries. Pro is reserved for saving, comparing and
            producing customer-ready packs.
          </p>
        </SectionHeader>
        <div className="grid grid-two">
          {freeVsPro.map((plan) => (
            <article className="card pricing-card" key={plan.title}>
              <span className={`pill ${plan.title === "Pro" ? "pro-pill" : ""}`}>{plan.badge}</span>
              <h2>{plan.title}</h2>
              <ul className="compact-list">
                {plan.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <section className="shell section">
        <article className="card split-band">
          <div>
            <p className="eyebrow">Why Pro will exist</p>
            <h2>Quick checks are free. Repeatable planning needs more structure.</h2>
          </div>
          <div className="copy-stack">
            <p>
              The free tools are for fast commercial checks: a quick ROI read,
              a margin sense-check, or a first draft of a buyer meeting plan.
            </p>
            <p>
              Pro will exist for repeatable planning: guided deck builders,
              first-draft PowerPoint/Google Slides outputs, linked
              Excel/Google Sheets assumptions, scenario comparison, saved drafts
              and customer-ready charts.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
