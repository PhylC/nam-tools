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
    description: "Use promo ROI when you need to compare support, volume and return.",
    href: "/roi-tool",
    cta: "Open Promo ROI",
    icon: "/images/apt/apt-icon-promo-roi.svg",
  },
  {
    title: "What does this do to margin?",
    description: "Check invoice price, COGS, retail price and tax assumptions.",
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
    description: "Use templates and exports to turn the numbers into a cleaner story.",
    href: "/presentation-templates",
    cta: "View Templates",
    icon: "/images/apt/apt-icon-export.svg",
  },
];

const popularTools = [
  {
    title: "Promo ROI calculator",
    description: "Check whether extra volume offsets support and price investment.",
    href: "/tools/promotion-roi-calculator",
    cta: "Open calculator",
    icon: "/images/apt/apt-icon-promo-roi.svg",
  },
  {
    title: "Gross margin calculator",
    description: "Estimate supplier and retailer margin using invoice, COGS and retail price.",
    href: "/tools/gross-margin-calculator",
    cta: "Open calculator",
    icon: "/images/apt/apt-icon-margin.svg",
  },
  {
    title: "ROI planner",
    description: "Model one line for free, or compare multi-line scenarios with Pro.",
    href: "/roi-tool",
    cta: "Open planner",
    icon: "/images/apt/apt-icon-scenario-compare.svg",
  },
  {
    title: "Presentation templates",
    description: "Download editable PowerPoint templates for account planning and reviews.",
    href: "/presentation-templates",
    cta: "View templates",
    icon: "/images/apt/apt-icon-export.svg",
  },
];

const freeFeatures = [
  "Single product",
  "Single scenario",
  "Basic result summary",
  "Copy summary",
  "CSV download",
];

const proFeatures = [
  "Save and compare scenarios",
  "Multi-product planning",
  "Account-level defaults",
  "PowerPoint and Excel exports",
  "Company logo, disclaimer and presentation template",
];

const templateLinks = [
  {
    title: "JBP",
    href: "/presentation-templates",
    description: "Annual customer planning, growth pillars and investment alignment.",
  },
  {
    title: "QBR",
    href: "/presentation-templates",
    description: "Performance, risks, actions and next-quarter priorities.",
  },
  {
    title: "Promotional Proposal",
    href: "/presentation-templates",
    description: "Promotion mechanic, support ask, ROI logic and retailer benefit.",
  },
];

export default function Home() {
  return (
    <div className="page-stack">
      <Hero
        eyebrow="Account Planning Tools"
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

      <section className="section shell" id="tool-chooser">
        <SectionHeader title="What do you need to work out?">
          <p>Start with the question you need to answer.</p>
        </SectionHeader>
        <div className="grid">
          {toolChoices.map((item) => (
            <article className="card tool-card" key={item.title}>
              <img alt="" aria-hidden="true" className="tool-card-icon" loading="lazy" src={item.icon} />
              <h3>{item.title}</h3>
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

      <section className="section shell">
        <SectionHeader title="Popular tools" />
        <div className="grid">
          {popularTools.map((tool) => (
            <article className="card tool-card" key={tool.title}>
              <img alt="" aria-hidden="true" className="tool-card-icon" loading="lazy" src={tool.icon} />
              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
              <Link className="text-link" href={tool.href}>
                {tool.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section shell split-band">
        <div>
          <p className="eyebrow">Free and Pro</p>
          <h2>Free for quick checks. Pro for repeat work.</h2>
          <p className="section-lead">
            Use Free when you need a single calculation. Use APT Pro when you
            need to save scenarios, compare options, use defaults and export
            cleaner outputs.
          </p>
          <div className="pro-workflow-home-visual">
            <ProductVisual
              alt="APT Pro workflow showing saved scenarios, comparison and export options"
              description="Saved scenarios, comparison and export workflow."
              filename="/images/apt/apt-pro-workflow-visual.webp"
              title="APT Pro workflow"
            />
          </div>
        </div>
        <div className="free-pro-columns">
          <article className="card mini-card">
            <h3>Free</h3>
            <ul className="compact-list">
              {freeFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </article>
          <article className="card mini-card">
            <h3>APT Pro</h3>
            <ul className="compact-list">
              {proFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </article>
          <Link className="button" href="/pricing">
            Compare Free and Pro
          </Link>
        </div>
      </section>

      <section className="section shell">
        <SectionHeader title="Need a cleaner deck?">
          <p>
            APT includes editable templates for business plans, QBRs and
            promotional proposals.
          </p>
        </SectionHeader>
        <div className="home-template-grid">
          {templateLinks.map((template) => (
            <Link className="card home-template-card" href={template.href} key={template.title}>
              <strong>{template.title}</strong>
              <span>{template.description}</span>
            </Link>
          ))}
        </div>
        <div className="cta-row">
          <Link className="button button-secondary" href="/presentation-templates">
            View presentation templates
          </Link>
        </div>
      </section>

      <section className="section shell final-cta">
        <h2>Start with the calculation in front of you.</h2>
        <p>Pick a tool, enter the numbers you have, and get a cleaner view of the deal.</p>
        <div className="hero-actions">
          <Link className="button" href="/calculators">
            Try free calculators
          </Link>
          <Link className="button button-secondary" href="/pricing">
            Compare Free and Pro
          </Link>
        </div>
      </section>
    </div>
  );
}
