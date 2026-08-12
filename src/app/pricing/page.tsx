import Link from "next/link";
import { FaqSection } from "../components/FaqSection";
import { JsonLd } from "../components/JsonLd";
import { Hero, ProductVisual, SectionHeader } from "../components/Shell";
import { TrackedUpgradeLink } from "../components/TrackedLinks";
import { getAptProPriceLabels } from "../../lib/pricingConfig";
import { LocalizedFreePrice, LocalizedProPrice } from "./LocalizedProPrice";
import { PricingUpgradeActions } from "./PricingUpgradeActions";
import { breadcrumbJsonLd, faqJsonLd, seoMetadata } from "../seo";

export const metadata = seoMetadata({
  title: "Pricing - Free vs APT Pro",
  description:
    "Compare Free and APT Pro. Use free calculators for quick checks, or upgrade to save, compare and export commercial scenarios.",
  path: "/pricing",
});

const plans = [
  {
    name: "Free",
    price: getAptProPriceLabels("GBP").free,
    detail: "For one-off commercial checks.",
    features: [
      "Core calculators",
      "Single-line ROI checks",
      "Basic summaries and CSVs",
      "Saved calculator defaults with an account",
    ],
    href: "/calculators",
    cta: "Use free calculators",
  },
  {
    name: "APT Pro",
    price: getAptProPriceLabels("GBP").monthly,
    detail: getAptProPriceLabels("GBP").annualDetail,
    features: [
      "Save analyses, scenarios and deck briefs",
      "Compare deal versions and reopen saved work",
      "Plan multi-SKU ROI scenarios",
      "Upload or paste spreadsheet data",
      "Save templates, branding and export preferences",
      "Export cleaner meeting-ready outputs",
    ],
    href: "/pricing",
    cta: "Upgrade to Pro",
    recommended: true,
  },
  {
    name: "Team",
    price: "Custom",
    detail: "For customised tools, branded templates and team workflows.",
    features: [
      "Team pricing for multi-user access",
      "Customised planning tools and calculators",
      "Shared customer plans and libraries",
      "Branded templates and export standards",
      "Workflow support for team planning routines",
    ],
    href: "/contact",
    cta: "Discuss team pricing",
  },
];

const comparisonRows = [
  ["Best fit", "Quick one-off checks", "Repeat planning and retailer meetings"],
  ["ROI planning", "Single line", "Multi-SKU scenarios"],
  ["Saved work", "Defaults only", "Analyses, scenarios, decks and exports"],
  ["Scenario handling", "One version", "Save, duplicate and compare versions"],
  ["Exports", "Basic summary and CSV", "Cleaner meeting-ready outputs"],
  ["Branding and templates", "Not included", "Logo, disclaimer and saved templates"],
];

const mobileComparisonRows = [
  ["Best fit", "Quick checks", "Repeat planning"],
  ["ROI", "Single line", "Multi-SKU"],
  ["Saved work", "Defaults", "Work + exports"],
  ["Scenarios", "One version", "Save + compare"],
  ["Exports", "Basic", "Meeting-ready"],
  ["Branding", "—", "Logo + templates"],
];

const decisionCards = [
  {
    title: "Need one quick answer?",
    body: "Use Free for margin checks, a single ROI line or a quick commercial sense-check.",
    href: "/calculators",
    cta: "Use free calculators",
  },
  {
    title: "Preparing repeat customer work?",
    body: "Use Pro when you need to save versions, compare scenarios and return to work later.",
    href: "#apt-pro-plan",
    cta: "Choose Pro",
  },
  {
    title: "Standardising a team?",
    body: "Talk to us about team pricing, customised tools, templates, review steps or shared planning standards.",
    href: "/contact",
    cta: "Discuss team pricing",
  },
];

const pricingFaqs = [
  {
    question: "Can I cancel anytime?",
    answer: "Yes. You can manage or cancel your subscription from your Account page through Stripe billing.",
  },
  {
    question: "Is checkout secure?",
    answer: "Yes. Card and payment details are handled by Stripe; APT does not store card details.",
  },
  {
    question: "What happens to saved work if I cancel?",
    answer: "Your account remains available. Pro-only saved scenarios and exports stop when Pro access ends.",
  },
  {
    question: "Can teams ask for custom pricing?",
    answer:
      "Yes. Use the contact page for team pricing, branded templates, shared workflows or customised calculators.",
  },
  {
    question: "Can the tools be customised?",
    answer:
      "Yes. Team and custom enquiries can cover calculator changes, branded outputs, template standards and workflow support.",
  },
];

const upgradeMessages: Record<string, string> = {
  "add-line": "Upgrade to Pro to add multiple ROI lines.",
  "add-product": "Upgrade to Pro to add multiple products.",
  "add-scenario": "Upgrade to Pro to add and compare scenarios.",
  "compare-scenarios": "Upgrade to Pro to compare saved scenarios.",
  "company-template": "Upgrade to Pro to use company templates.",
  "custom-deck": "Upgrade to Pro to build custom decks from your data.",
  "download-template": "Upgrade to Pro to download ROI spreadsheet templates.",
  "export-excel": "Upgrade to Pro to export Excel workbooks.",
  "export-powerpoint": "Upgrade to Pro to export PowerPoint outputs.",
  "export-results": "Upgrade to Pro to export ROI results.",
  "pro-actions": "Upgrade to Pro to save, compare and export commercial scenarios.",
  "save-analysis": "Upgrade to Pro to save calculator analyses.",
  "save-plan": "Upgrade to Pro to save ROI plans.",
  "save-scenario": "Upgrade to Pro to save and compare scenarios.",
  "upload-spreadsheet": "Upgrade to Pro to upload spreadsheets.",
};

function getUpgradeMessage(feature?: string | string[]) {
  const key = Array.isArray(feature) ? feature[0] : feature;
  if (!key) return "";
  return upgradeMessages[key] ?? "Upgrade to Pro to use this feature.";
}

function getCheckoutMessage(checkout?: string | string[]) {
  const value = Array.isArray(checkout) ? checkout[0] : checkout;
  if (value === "cancelled") return "Checkout cancelled. You haven't been charged.";
  return "";
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: Promise<{ checkout?: string | string[]; from?: string | string[]; feature?: string | string[] }>;
}) {
  const params = searchParams ? await searchParams : {};
  const upgradeMessage = getUpgradeMessage(params.feature);
  const checkoutMessage = getCheckoutMessage(params.checkout);

  return (
    <div className="page-stack pricing-page">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/pricing" },
          ]),
          faqJsonLd(pricingFaqs),
        ]}
      />
      <Hero eyebrow="Pricing" title="Start free. Move to Pro when the work repeats.">
        <p>
          Use Free for quick checks. Choose APT Pro when you need to save,
          compare and export customer-ready planning work.
        </p>
        {checkoutMessage ? <p className="pricing-context-note">{checkoutMessage}</p> : null}
        {upgradeMessage ? <p className="pricing-context-note">{upgradeMessage}</p> : null}
      </Hero>
      <section className="shell section">
        <SectionHeader eyebrow="Choose" title="Pick the path that matches the job.">
          <p>
            Most people start free. Pro becomes useful when the same customer,
            deal or planning question comes back again.
          </p>
        </SectionHeader>
        <div className="pricing-decision-grid">
          {decisionCards.map((card) => (
            <article className="pricing-decision-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
              <Link className="text-link" href={card.href}>{card.cta}</Link>
            </article>
          ))}
        </div>
      </section>
      <section className="shell section">
        <SectionHeader eyebrow="Plans" title="Simple plans for different levels of work." />
        <div className="grid pricing-plan-grid">
          {plans.map((plan) => (
            <article className={plan.recommended ? "card pricing-card pricing-card-featured" : "card pricing-card"} id={plan.name === "APT Pro" ? "apt-pro-plan" : undefined} key={plan.name}>
              <div className="pricing-card-heading">
                <h2>{plan.name}</h2>
                {plan.recommended ? <span className="pill pro-pill recommended-pill">Recommended</span> : null}
              </div>
              {plan.name === "Free" ? (
                <LocalizedFreePrice />
              ) : plan.name === "APT Pro" ? (
                <LocalizedProPrice />
              ) : (
                <>
                  <div className="price">{plan.price}</div>
                  <p>{plan.detail}</p>
                </>
              )}
              <ul className="compact-list">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {plan.name === "APT Pro" ? (
                <PricingUpgradeActions location="pricing_plan_apt_pro" />
              ) : plan.name === "Free" ? (
                <Link className="text-link" href={plan.href}>
                  {plan.cta}
                </Link>
              ) : (
                <TrackedUpgradeLink className="text-link" href={plan.href} location={`pricing_plan_${plan.name.toLowerCase().replaceAll(" ", "_")}`}>
                  {plan.cta}
                </TrackedUpgradeLink>
              )}
            </article>
          ))}
        </div>
      </section>
      <section className="shell section">
        <SectionHeader eyebrow="Compare" title="The practical difference.">
          <p>
            Free helps you get to an answer. Pro helps you manage the work when
            there are versions, meetings and outputs to keep track of.
          </p>
        </SectionHeader>
        <div className="comparison-table-wrap desktop-comparison-table">
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
        <div className="mobile-comparison-table" aria-label="Free and APT Pro feature comparison">
          <div className="mobile-comparison-header" role="row">
            <div role="columnheader">Feature</div>
            <div role="columnheader">Free</div>
            <div role="columnheader">APT Pro</div>
          </div>
          {mobileComparisonRows.map(([feature, free, pro]) => (
            <div className="mobile-comparison-row" role="row" key={feature}>
              <div className="mobile-comparison-feature" role="cell">{feature}</div>
              <div role="cell">{free}</div>
              <div className="mobile-comparison-pro" role="cell">{pro}</div>
            </div>
          ))}
        </div>
        <article className="card comparison-cta mobile-comparison-cta">
          <div>
            <h3>Ready to save the work?</h3>
            <p>Choose Pro when the calculation becomes a planning workflow.</p>
          </div>
          <div className="cta-row">
            <Link className="button button-secondary" href="/calculators">
              Use free calculators
            </Link>
            <Link className="button" href="#apt-pro-plan">
              See APT Pro
            </Link>
          </div>
        </article>
        <article className="card comparison-cta comparison-cta-desktop">
          <div>
            <h3>Ready to save the work?</h3>
            <p>Choose Pro when the calculation becomes a planning workflow.</p>
          </div>
          <PricingUpgradeActions location="pricing_comparison" variant="panel" />
        </article>
      </section>
      <section className="shell section">
        <article className="card split-band">
          <div>
            <p className="eyebrow">Onboarding</p>
            <h2>After you join, start with one real customer question.</h2>
          </div>
          <div className="copy-stack">
            <p>
              Create an account, set your defaults, then run the calculator or
              ROI scenario you need for the next conversation.
            </p>
            <p>
              If that work needs to be saved, compared or exported, Pro turns it
              into a repeatable planning flow inside My workspace.
            </p>
          </div>
          <div className="pricing-workflow-visual">
            <ProductVisual
              alt="APT workspace showing saved analyses, scenarios, decks and exports"
              aspectRatio="547 / 270"
              description="Saved analyses, scenarios, decks and exports in one workspace."
              filename="/images/apt/apt-workspace-dashboard-preview.webp"
              height={270}
              title="My workspace"
              width={547}
            />
          </div>
        </article>
      </section>
      <FaqSection title="Before you upgrade." faqs={pricingFaqs} />
    </div>
  );
}
