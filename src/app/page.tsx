import Link from "next/link";
import { Hero, SectionHeader } from "./components/Shell";
import { seoMetadata } from "./seo";

export const metadata = seoMetadata({
  title: "Commercial Planning Calculators for Sales & Account Teams",
  absoluteTitle: "Account Planning Tools | Commercial Planning Calculators for Sales & Account Teams",
  description:
    "Run promo ROI, retailer margin, invoice price and SOA support checks, then create clearer account plans and buyer-ready commercial summaries.",
  path: "/",
});

const quickCheckCards = [
  {
    title: "Promo ROI",
    description: "See whether the extra volume is enough to justify price investment and support.",
    href: "/tools/promotion-roi-calculator",
    cta: "Open Promo ROI",
    preview: "Spend £10k → Return £14k → ROI 1.4x",
  },
  {
    title: "Margin check",
    description: "Sense-check supplier and retailer margin before a customer conversation.",
    href: "/tools/gross-margin-calculator",
    cta: "Open Margin Calculator",
    preview: "Invoice £5.00 → Retail £8.00 → Margin 37.5%",
  },
  {
    title: "Support / SOA",
    description: "Work out the supplier support needed for a promoted retailer price.",
    href: "/calculators/required-soa-calculator",
    cta: "Open Support Calculator",
    preview: "£199 → £169 needs £21 SOA/unit",
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

const mobilePlanSummaries = [
  {
    plan: "Free",
    label: "For quick one-off checks",
    href: "/calculators",
    cta: "Try Free",
    items: [
      "Single product-line calculations",
      "Basic result summaries",
      "Copy and CSV export for the current check",
      "Downloadable planning templates",
    ],
    emphasis: false,
  },
  {
    plan: "APT Pro",
    label: "For saved scenarios and repeat planning",
    href: "/pricing",
    cta: "See Pro",
    items: [
      "Multiple product lines and saved scenarios",
      "Advanced summaries and scenario comparison",
      "Excel and PowerPoint exports",
      "Saved defaults, templates, logo and disclaimer",
    ],
    emphasis: true,
  },
];

const heroMetrics = [
  ["Scenario", "Promo support"],
  ["Revenue uplift", "£24k"],
  ["Support spend", "£6.2k"],
  ["Gross profit", "£8.9k"],
  ["ROI", "1.4x"],
];

const credibilityPoints = [
  "Built for account managers and sales leaders",
  "Fast commercial checks without spreadsheet rebuilds",
  "Clearer summaries for buyer and account conversations",
];

const heroWorkflowSteps = [
  "Pick the commercial question",
  "Enter the numbers you have",
  "Copy a cleaner summary",
];

export default function Home() {
  return (
    <div className="page-stack home-page">
      <Hero
        eyebrow="Commercial planning calculators for account teams"
        title="Make account planning decisions with clearer numbers."
        visual={
          <aside className="home-deal-preview" aria-label="Example APT deal summary">
            <div className="home-deal-preview-header">
              <div>
                <span>Example planning check</span>
                <strong>Is this promotion worth funding?</strong>
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
              <span>Output</span>
              <strong>Buyer-ready summary with the assumptions visible.</strong>
            </div>
          </aside>
        }
        actions={
          <>
            <Link className="button" href="/roi-tool">
              Start with the ROI planner
            </Link>
            <Link className="button button-secondary" href="#tool-chooser">
              Choose a tool
            </Link>
          </>
        }
      >
        <p>
          Account Planning Tools helps sales teams model ROI, margin, support and account conversations without
          rebuilding spreadsheets every time.
        </p>
        <ol className="home-hero-workflow" aria-label="How APT works">
          {heroWorkflowSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Hero>

      <section className="shell home-credibility-strip" aria-label="APT value points">
        {credibilityPoints.map((point) => (
          <span key={point}>{point}</span>
        ))}
      </section>

      <section className="section shell home-starting-section" id="tool-chooser">
        <SectionHeader title="Choose your starting point">
          <p>
            Start with the full planner for a promotion or trade investment decision. Use a quick calculator when you
            only need one commercial answer.
          </p>
        </SectionHeader>
        <div className="home-starting-grid">
          <article className="card home-featured-tool-card">
            <div className="home-featured-tool-top">
              <span className="pill pro-pill">Best starting point</span>
            </div>
            <h2>Promotion ROI planner</h2>
            <p>
              Use this when you need the full deal view: sales uplift, support spend, revenue, gross profit, ROI and a
              short summary you can use in the conversation.
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
              <li>Model the uplift, support and margin impact</li>
              <li>Keep the assumptions visible</li>
              <li>Copy a cleaner summary for the conversation</li>
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

      <section className="section shell home-free-pro-summary" id="free-vs-pro">
        <div className="home-free-pro-heading">
          <SectionHeader title="Need to save and export scenarios?">
            <p>
              Start with the calculators. Upgrade when you need saved scenarios, comparisons and exportable planning
              outputs.
            </p>
          </SectionHeader>
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
            {mobilePlanSummaries.map((plan) => (
              <article className={`home-mobile-plan-card${plan.emphasis ? " home-mobile-plan-card-pro" : ""}`} key={plan.plan}>
                <div className="home-mobile-plan-card-header">
                  <div>
                    <span>{plan.label}</span>
                    <h3>{plan.plan}</h3>
                  </div>
                  {plan.emphasis ? <strong>Best for repeat work</strong> : null}
                </div>
                <ul>
                  {plan.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <Link className={plan.emphasis ? "button" : "button button-secondary"} href={plan.href}>
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section shell final-cta">
        <h2>Start with one commercial question.</h2>
        <p>Pick the calculation closest to the decision in front of you and get a clearer view of the deal.</p>
        <div className="final-cta-actions">
          <Link className="button" href="/roi-tool">
            Open ROI planner
          </Link>
          <Link className="button button-secondary" href="/calculators">
            See all calculators
          </Link>
        </div>
      </section>
    </div>
  );
}
