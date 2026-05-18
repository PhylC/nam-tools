import Link from "next/link";
import { Hero, PlaceholderImage, SectionHeader, ToolCard } from "./components/Shell";
import { getTool, tools } from "./data/tools";

const featuredTools = [
  "account-plan-generator",
  "joint-business-plan-builder",
  "buyer-meeting-prep",
];

const startHere = [
  {
    title: "Check a promotion",
    text: "Use quick SOA, invoice, sales tax / VAT / IVA and retailer margin calculators for fast commercial checks.",
    href: "/calculators/quick-calculators",
    cta: "Open quick calculators",
  },
  {
    title: "Build a customer plan",
    text: "Turn performance notes, opportunities and risks into a structured account plan.",
    href: "/tools/account-plan-generator",
    cta: "Build account plan",
  },
  {
    title: "Prep for a buyer meeting",
    text: "Create a sharper meeting opener, commercial story, objections and follow-up note.",
    href: "/tools/buyer-meeting-prep",
    cta: "Prep meeting",
  },
];

const proFeatures = [
  "Scenario comparison for deeper planning",
  "Saved plans and saved work",
  "Excel import/export for repeatable reviews",
  "Free PowerPoint and spreadsheet templates",
  "Guided deck builders from template workflows",
  "PDF/deck-ready exports",
  "Advanced templates",
  "Team review packs",
];

export default function Home() {
  const featured = featuredTools
    .map((slug) => getTool(slug))
    .filter((tool): tool is (typeof tools)[number] => Boolean(tool));

  return (
    <div className="page-stack">
      <Hero
        eyebrow="NAM Tools"
        title="Commercial tools for better account plans, promo reviews and buyer meetings."
        actions={
          <>
            <Link className="button" href="/calculators">
              Start with calculators
            </Link>
            <Link className="button button-secondary" href="/tools">
              View tools
            </Link>
          </>
        }
      >
        <p>
          NAM Tools helps National Account Managers, Key Account Managers,
          Commercial Managers and Sales Directors structure commercial thinking
          faster, from deal ROI, trade spend and retailer/customer economics to
          customer plans, JBPs, buyer meeting prep and free PowerPoint and
          spreadsheet templates.
        </p>
      </Hero>

      <section className="shell visual-section hero-visual">
        <PlaceholderImage
          aspectRatio="3 / 2"
          description="Future dashboard/calculator screenshot style visual."
          filename="/images/hero-commercial-dashboard-placeholder.svg"
          title="Commercial dashboard"
        />
      </section>

      <section className="shell trust-strip" aria-label="NAM Tools highlights">
        <span>Built for retail suppliers</span>
        <span>No-login tools</span>
        <span>Commercial planning first</span>
      </section>

      <section className="section shell">
        <SectionHeader eyebrow="Start here" title="Pick the job in front of you.">
          <p>
            Start with one of the common account management moments, then move
            into the full toolkit when you need a deeper planning view.
          </p>
        </SectionHeader>
        <div className="grid">
          {startHere.map((item) => (
            <article className="card start-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <Link className="text-link" href={item.href}>
                {item.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-band">
        <div className="shell split-band">
          <div>
            <p className="eyebrow">Why this exists</p>
            <h2>Too many account plans start from blank documents.</h2>
          </div>
          <div className="copy-stack">
            <p>
              Commercial teams often know the customer context, but lose time
              rebuilding the same calculators, meeting notes and plan structures
              from scratch.
            </p>
            <p>
              NAM Tools gives the thinking a starting shape: the numbers to
              test, the questions to challenge and the sections a credible
              customer plan needs.
            </p>
          </div>
        </div>
      </section>

      <section className="section shell">
        <SectionHeader eyebrow="Calculators" title="Free commercial checks before the customer conversation.">
          <p>
            Start with the calculator hub when you need to sense-check promo
            ROI, retailer margin, SOA, trade spend, invoice price or an
            investment ask quickly.
          </p>
        </SectionHeader>
        <div className="grid">
          <article className="card tool-card">
            <span className="pill">Free</span>
            <h3>Commercial Deal Calculator</h3>
            <p>
              Model supplier profit, retailer/customer view, trade spend and
              investment ask from one set of assumptions.
            </p>
            <Link className="text-link" href="/tools/commercial-deal-calculator">
              Open deal calculator
            </Link>
          </article>
          <article className="card tool-card">
            <span className="pill">Free</span>
            <h3>Quick Commercial Calculators</h3>
            <p>
              Use fast SOA, retail price, invoice price, margin, tax and markup
              calculators when you only have a few numbers.
            </p>
            <Link className="text-link" href="/calculators/quick-calculators">
              Open quick calculators
            </Link>
          </article>
        </div>
        <div className="cta-row">
          <Link className="button" href="/calculators">
            View all calculators
          </Link>
        </div>
      </section>

      <section className="section shell">
        <SectionHeader eyebrow="Core tools" title="Useful immediately, without a login.">
          <p>
            Planning tools focus on practical commercial documents: account
            plans, JBPs, buyer meeting prep and customer review outputs.
          </p>
        </SectionHeader>
        <div className="grid">
          {featured.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
        <div className="cta-row">
          <Link className="button" href="/tools">
            View all tools
          </Link>
          <Link className="button button-secondary" href="/tools/joint-business-plan-builder">
            Build a JBP
          </Link>
        </div>
      </section>

      <section className="section shell split-band">
        <div>
          <p className="eyebrow">Free now, Pro later</p>
          <h2>Keep the current tools open while Pro features take shape.</h2>
        </div>
        <div className="card muted-card">
          <p>
            NAM Tools is no-login and free to use today. Future paid plans are
            planned to support saved work, linked spreadsheet assumptions,
            guided deck builders, scenario comparison and customer-ready deck
            outputs. Payments and Pro are coming soon, not live yet.
          </p>
          <ul className="compact-list">
            {proFeatures.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <Link className="text-link" href="/pricing">
            See pricing placeholders
          </Link>
          <PlaceholderImage
            aspectRatio="16 / 10"
            description="Future Pro workflow preview showing saved scenarios and exports."
            filename="/images/pricing-pro-placeholder.svg"
            title="Pro workflow preview"
          />
        </div>
      </section>

      <section className="section shell final-cta">
        <h2>Start with the commercial question you need to answer today.</h2>
        <p>
          Check a promotion, build an account plan, prep for a buyer meeting or
          draft a customer review without opening a blank document first.
        </p>
        <div className="hero-actions">
          <Link className="button" href="/tools">
            Start with tools
          </Link>
          <Link className="button button-secondary" href="/templates">
            Copy free templates
          </Link>
        </div>
      </section>
    </div>
  );
}
