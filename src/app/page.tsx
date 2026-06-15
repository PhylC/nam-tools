import Link from "next/link";
import type { Metadata } from "next";
import { Hero, SectionHeader } from "./components/Shell";

export const metadata: Metadata = {
  title: "Account Planning Tools | Promo ROI, Margin and Support Calculators",
  description:
    "Commercial planning tools for account managers. Run promo ROI, margin and support checks, then create cleaner summaries for meetings and account planning.",
};

const quickCheckCards = [
  {
    title: "Promo ROI",
    description: "Check whether extra volume offsets price investment and support.",
    href: "/tools/promotion-roi-calculator",
    cta: "Open Promo ROI",
    preview: "Spend £10k → Return £14k → ROI 1.4x",
  },
  {
    title: "Margin check",
    description: "Estimate supplier and retailer margin from invoice, COGS and retail price.",
    href: "/tools/gross-margin-calculator",
    cta: "Open Margin Calculator",
    preview: "Invoice £5.00 → Retail £8.00 → Margin 37.5%",
  },
  {
    title: "Support / SOA",
    description: "Turn fixed support, SOA or trade spend into a clearer deal view.",
    href: "/calculators/soa-support-percent-calculator",
    cta: "Open Support Calculator",
    preview: "Invoice £5.00 - SOA £0.50 = Net £4.50",
  },
];

const planningCards = [
  {
    title: "Buyer Meeting Planner",
    description:
      "Structure the objective, ask, risk, negotiation points and next steps for a retailer conversation.",
    href: "/tools/buyer-meeting-prep",
    cta: "Plan a meeting",
    preview: "Objective → Ask → Risks → Next steps",
  },
  {
    title: "Account Plan",
    description: "Turn customer priorities, opportunities and risks into a clearer account plan.",
    href: "/tools/account-plan-generator",
    cta: "Build account plan",
    preview: "Priorities → Opportunities → Actions",
  },
  {
    title: "JBP Builder",
    description: "Create a practical joint business planning structure for customer conversations.",
    href: "/tools/joint-business-plan-builder",
    cta: "Build JBP",
    preview: "Goals → Initiatives → Measures",
  },
];

const comparisonRows = [
  ["Calculators", "Included", "Included"],
  ["Product lines", "1", "Multiple"],
  ["Scenarios", "1", "Save + compare"],
  ["Result summary", "Basic", "Advanced"],
  ["Copy summary", "Included", "Included"],
  ["CSV export", "Current calculation", "Included"],
  ["Excel export", "—", "Workbook"],
  ["PowerPoint export", "—", "Deck export"],
  ["Branding/disclaimer", "—", "Logo + disclaimer"],
  ["Templates", "Download", "Save templates"],
  ["Saved defaults", "Account defaults", "Account + export defaults"],
];

const bestChoiceCards = [
  {
    plan: "Free",
    label: "For quick one-off checks",
    cta: "Try free calculators",
    href: "/calculators",
    emphasis: false,
  },
  {
    plan: "APT Pro",
    label: "For saved scenarios, exports and repeat planning",
    cta: "See APT Pro",
    href: "/pricing",
    emphasis: true,
  },
];

const heroMetrics = [
  ["Product line", "Core range"],
  ["Revenue uplift", "£24,000"],
  ["Support", "£6,200"],
  ["Gross profit", "£8,900"],
  ["ROI", "1.4x"],
];

const credibilityPoints = [
  "Built around real NAM workflows",
  "Free calculators available",
  "Pro adds saved scenarios and exports",
];

export default function Home() {
  return (
    <div className="page-stack home-page">
      <Hero
        eyebrow="Commercial planning tools for account managers"
        title="Plan better deals. Explain the numbers faster."
        visual={
          <aside className="home-deal-preview" aria-label="Example APT deal summary">
            <div className="home-deal-preview-header">
              <div>
                <span>Mini deal summary</span>
                <strong>Promo scenario</strong>
              </div>
              <span className="home-preview-badge">Free preview</span>
            </div>
            <dl className="home-deal-metrics">
              {heroMetrics.map(([label, value]) => (
                <div className={label === "ROI" ? "home-deal-metric home-deal-metric-strong" : "home-deal-metric"} key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <div className="home-preview-summary">
              <span>Scenario saved</span>
              <strong>Clean summary ready for buyer conversation.</strong>
            </div>
          </aside>
        }
        actions={
          <>
            <Link className="button" href="/roi-tool">
              Start with ROI planner
            </Link>
            <Link className="button button-secondary" href="/calculators">
              Browse tools
            </Link>
          </>
        }
      >
        <p>
          APT helps sales teams model ROI, margin, support and buyer conversations without rebuilding spreadsheets
          every time.
        </p>
      </Hero>

      <section className="shell home-credibility-strip" aria-label="APT value points">
        {credibilityPoints.map((point) => (
          <span key={point}>{point}</span>
        ))}
      </section>

      <section className="section shell home-starting-section" id="tool-chooser">
        <SectionHeader title="Choose your starting point">
          <p>
            Start with the full planner when you need the complete deal view, or use a quick calculator when you only
            need one answer.
          </p>
        </SectionHeader>
        <div className="home-starting-grid">
          <article className="card home-featured-tool-card">
            <div className="home-featured-tool-top">
              <span className="pill pro-pill">Best starting point</span>
            </div>
            <h2>Full ROI planner</h2>
            <p>
              Use this when you need the complete deal view: product lines, support, revenue, profit, ROI and scenario
              summary.
            </p>
            <div className="home-card-preview home-featured-preview" aria-label="Example ROI planner calculation">
              <span>Volume uplift</span>
              <strong>+12,000 units</strong>
              <span>Support spend</span>
              <strong>£6,200</strong>
              <span>ROI</span>
              <strong>1.4x</strong>
            </div>
            <ul className="compact-list">
              <li>Model one product line for free</li>
              <li>Add multi-line scenarios with APT Pro</li>
              <li>Save and export your work with Pro</li>
            </ul>
            <Link className="button" href="/roi-tool">
              Open ROI planner
            </Link>
          </article>

          <div className="home-quick-checks">
            {quickCheckCards.map((item) => (
              <article className="card home-quick-check-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="home-card-preview">{item.preview}</div>
                <Link className="text-link" href={item.href}>
                  {item.cta}
                </Link>
              </article>
            ))}
            <div className="home-starting-link-row">
              <Link className="text-link" href="/calculators">
                See all calculators
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section shell home-planning-section">
        <SectionHeader title="More than calculators">
          <p>
            APT also helps you prepare the commercial story behind the numbers — buyer meetings, account plans and
            joint business planning.
          </p>
        </SectionHeader>
        <div className="home-planning-grid">
          {planningCards.map((item) => (
            <article className="card home-planning-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className="home-card-preview">{item.preview}</div>
              <Link className="text-link" href={item.href}>
                {item.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section shell home-free-pro-summary">
        <div className="home-free-pro-heading">
          <SectionHeader title="Free for quick checks. Pro for repeat work.">
            <p>
              Use Free when you need a fast answer. Use APT Pro when you need to save, compare and export commercial
              scenarios.
            </p>
          </SectionHeader>
        </div>

        <div className="home-best-choice-strip" aria-label="Best choice by planning need">
          {bestChoiceCards.map((card) => (
            <article className={`home-choice-card${card.emphasis ? " home-choice-card-pro" : ""}`} key={card.plan}>
              <div>
                <h3>{card.plan}</h3>
                <p>{card.label}</p>
              </div>
              <Link className={card.emphasis ? "button" : "button button-secondary"} href={card.href}>
                {card.cta}
              </Link>
            </article>
          ))}
        </div>

        <div className="home-comparison-card">
          <div className="home-comparison-table-wrap" aria-label="Free and APT Pro comparison">
            <table className="home-comparison-table">
              <caption>Free and APT Pro feature comparison</caption>
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  <th scope="col">Free</th>
                  <th className="home-pro-column" scope="col">
                    <span>APT Pro</span>
                    <span className="home-pro-badge">Best for repeat planning</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(([feature, free, pro]) => (
                  <tr key={feature}>
                    <th scope="row">{feature}</th>
                    <td>{free}</td>
                    <td className="home-pro-column">{pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="home-mobile-comparison" aria-label="Free and APT Pro comparison">
            {comparisonRows.map(([feature, free, pro]) => (
              <article className="home-mobile-comparison-row" key={feature}>
                <h3>{feature}</h3>
                <div className="home-mobile-comparison-values">
                  <div>
                    <span>Free</span>
                    <strong>{free}</strong>
                  </div>
                  <div className="home-mobile-pro-value">
                    <span>APT Pro</span>
                    <strong>{pro}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section shell final-cta">
        <h2>Start with the calculation in front of you.</h2>
        <p>Pick a tool, enter the numbers you have, and get a clearer view of the deal.</p>
        <div className="final-cta-actions">
          <Link className="button" href="/calculators">
            Try free calculators
          </Link>
          <Link className="button button-secondary" href="/pricing">
            See APT Pro
          </Link>
        </div>
      </section>
    </div>
  );
}
