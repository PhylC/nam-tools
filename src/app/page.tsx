import Link from "next/link";
import type { Metadata } from "next";
import { Hero, ProductVisual, SectionHeader } from "./components/Shell";

export const metadata: Metadata = {
  title: "Account Planning Tools | Promo ROI, Margin and Support Calculators",
  description:
    "Commercial planning tools for account managers. Run promo ROI, margin and support checks, then create cleaner summaries for meetings and account planning.",
};

const toolChoices = [
  {
    title: "Will this promotion pay back?",
    description: "Check whether extra volume offsets price investment and support.",
    href: "/roi-tool",
    cta: "Open Promo ROI",
    icon: "/images/apt/apt-icon-promo-roi.svg",
  },
  {
    title: "What does this do to margin?",
    description: "Estimate supplier and retailer margin using invoice, COGS and retail price.",
    href: "/tools/gross-margin-calculator",
    cta: "Open Margin Calculator",
    icon: "/images/apt/apt-icon-margin.svg",
  },
  {
    title: "How much support is in the deal?",
    description: "Turn SOA, fixed funding or trade spend into a clearer support view.",
    href: "/calculators/soa-support-percent-calculator",
    cta: "Open Support Calculator",
    icon: "/images/apt/apt-icon-support.svg",
  },
  {
    title: "I need a meeting-ready summary",
    description: "Use templates and custom deck tools to turn the numbers into a clearer story.",
    href: "/presentation-templates",
    cta: "View Templates",
    icon: "/images/apt/apt-icon-export.svg",
  },
];

const popularWorkflows = [
  {
    title: "Promo ROI",
    description: "Model support, promo invoice price, volume and return.",
    href: "/tools/promotion-roi-calculator",
    cta: "Open Promo ROI",
    icon: "/images/apt/apt-icon-promo-roi.svg",
  },
  {
    title: "Gross margin",
    description: "Check how invoice price, COGS and retail price affect margin.",
    href: "/tools/gross-margin-calculator",
    cta: "Open Gross Margin",
    icon: "/images/apt/apt-icon-margin.svg",
  },
  {
    title: "ROI planner",
    description: "Start with one product line for free, then use Pro for multi-line scenarios.",
    href: "/roi-tool",
    cta: "Open ROI Planner",
    icon: "/images/apt/apt-icon-scenario-compare.svg",
  },
];

const freeFeatures = [
  "Single product",
  "Single scenario",
  "Basic result summary",
  "CSV download",
  "Calculator defaults with a free account",
];

const proFeatures = [
  "Save analyses and scenarios",
  "Compare deal versions",
  "Workspace for saved work",
  "PowerPoint and Excel exports",
  "Company templates and export settings",
];

const proWorkflowFeatures = [
  "Save analyses and scenarios",
  "Compare different deal versions",
  "Use account-level defaults",
  "Export cleaner outputs",
  "Build custom decks from templates and briefs",
];

export default function Home() {
  return (
    <div className="page-stack home-page">
      <Hero
        title="Commercial planning tools for account managers"
        visual={
          <ProductVisual
            alt="APT calculator dashboard showing inputs, results and export options"
            aspectRatio="3 / 2"
            description="APT calculator dashboard showing inputs, result summary and export options."
            filename="/images/apt/apt-homepage-hero-dashboard.webp"
            loading="eager"
            title="Commercial dashboard"
          />
        }
        actions={
          <>
            <Link className="button" href="#tool-chooser">
              Find the right tool
            </Link>
            <Link className="button button-secondary" href="/calculators">
              Try free calculators
            </Link>
            <Link className="text-link" href="/pricing">
              See APT Pro
            </Link>
          </>
        }
      >
        <p>
          Run quick promo, margin and support checks — then turn the numbers
          into cleaner summaries for retailer meetings, internal reviews and
          account planning.
        </p>
        <p>APT helps when the question is simple but the spreadsheet never is.</p>
      </Hero>

      <section className="section shell home-tool-chooser" id="tool-chooser">
        <SectionHeader title="What do you need to work out?">
          <p>Start with the commercial question in front of you.</p>
        </SectionHeader>
        <div className="home-tool-grid">
          {toolChoices.map((item) => (
            <article className="card tool-card home-tool-card" key={item.title}>
              <div className="home-card-topline">
                <img alt="" aria-hidden="true" className="tool-card-icon" loading="lazy" src={item.icon} />
                <h3>{item.title}</h3>
              </div>
              <p>{item.description}</p>
              <Link className="text-link" href={item.href}>
                {item.cta}
              </Link>
            </article>
          ))}
        </div>
        <div className="cta-row">
          <Link className="button button-secondary" href="/calculators">
            See all calculators
          </Link>
        </div>
      </section>

      <section className="section shell home-workflows">
        <div className="home-section-heading-row">
          <SectionHeader title="Popular workflows" />
          <p>Jump into the checks account managers come back to most often.</p>
        </div>
        <div className="home-workflow-grid">
          {popularWorkflows.map((workflow, index) => (
            <article className="card home-workflow-card" key={workflow.title}>
              <span className="home-workflow-number">{String(index + 1).padStart(2, "0")}</span>
              <img alt="" aria-hidden="true" className="tool-card-icon" loading="lazy" src={workflow.icon} />
              <h3>{workflow.title}</h3>
              <p>{workflow.description}</p>
              <Link className="text-link" href={workflow.href}>
                {workflow.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section home-pro-band">
        <div className="shell split-band home-pro-layout">
          <div>
            <h2>APT Pro is for repeat commercial planning</h2>
            <p className="section-lead">
              Save analyses, compare scenarios, keep your defaults and return to your work without rebuilding the
              numbers every time.
            </p>
            <ul className="compact-list home-feature-list">
              {proWorkflowFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <div className="hero-actions">
              <Link className="button" href="/pricing">
                Compare Free and Pro
              </Link>
              <Link className="button button-secondary" href="/workspace">
                Open My workspace
              </Link>
            </div>
          </div>
          <ProductVisual
            alt="APT Pro workflow showing saved scenarios, comparison and export options"
            description="Saved scenarios, comparison and export workflow."
            filename="/images/apt/apt-pro-workflow-visual.webp"
            title="APT Pro workflow"
          />
        </div>
      </section>

      <section className="section shell home-output-section">
        <div className="home-output-copy">
          <SectionHeader title="Turn the numbers into a cleaner story">
            <p>
              Download editable PowerPoint templates or use the custom deck flow to shape a meeting-ready first draft
              from your brief and supporting data.
            </p>
          </SectionHeader>
          <div className="hero-actions">
            <Link className="button" href="/presentation-templates">
              View presentation templates
            </Link>
            <Link className="button button-secondary" href="/custom-deck">
              Build custom deck
            </Link>
          </div>
        </div>
        <div className="home-output-visual">
          <ProductVisual
            alt="APT custom deck builder showing deck type, uploads and brief fields"
            description="Deck type, template choice, supporting data and brief fields."
            filename="/images/apt/apt-custom-deck-builder-preview.webp"
            title="Custom deck workflow"
          />
        </div>
      </section>

      <section className="section shell home-free-pro-summary">
        <div className="home-section-heading-row">
          <SectionHeader title="Free for quick checks. Pro for repeat work.">
            <p>
              Use Free when you need a single calculation. Use APT Pro when the work needs saving, comparing and
              sharing.
            </p>
          </SectionHeader>
          <Link className="button button-secondary" href="/pricing">
            Compare Free and Pro
          </Link>
        </div>
        <div className="free-pro-columns">
          <article className="card mini-card home-plan-card">
            <h3>Free</h3>
            <ul className="compact-list">
              {freeFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </article>
          <article className="card mini-card home-plan-card home-plan-card-pro">
            <h3>APT Pro</h3>
            <ul className="compact-list">
              {proFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="section shell final-cta">
        <h2>Start with the calculation in front of you.</h2>
        <p>Pick a tool, enter the numbers you have, and get a clearer view of the deal.</p>
        <div className="hero-actions">
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
