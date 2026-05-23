import Link from "next/link";
import type { Metadata } from "next";
import { Hero, PlaceholderImage, SectionHeader, ToolCard } from "./components/Shell";
import { getTool, tools } from "./data/tools";

export const metadata: Metadata = {
  description:
    "Commercial planning tools for account managers. Run promo ROI, margin and support checks with clearer outputs for retailer meetings and account planning.",
};

const featuredTools = [
  "account-plan-generator",
  "joint-business-plan-builder",
  "buyer-meeting-prep",
];

const startHere = [
  {
    title: "Use free calculators",
    text: "Calculators stay free. Use them for fast checks, pricing maths and simple commercial decisions.",
    href: "/calculators",
    cta: "Open calculators",
  },
  {
    title: "Plan promotion ROI",
    text: "Use the free ROI tool for one-line checks, or use Pro for multi-SKU scenario planning.",
    href: "/roi-tool",
    cta: "Open ROI tool",
  },
  {
    title: "Build a customer deck",
    text: "Download free deck templates or use Pro to build customer-ready first drafts.",
    href: "/presentation-templates",
    cta: "Open presentations",
  },
];

const proFeatures = [
  "Save and reopen commercial scenarios",
  "Compare different versions of a deal",
  "Excel import/export for repeatable reviews",
  "Free PowerPoint and spreadsheet templates",
  "Build custom deck briefs from templates",
  "PDF/deck-ready exports",
  "Account-level calculator defaults",
  "Company logo, disclaimer and presentation template",
];

export default function Home() {
  const featured = featuredTools
    .map((slug) => getTool(slug))
    .filter((tool): tool is (typeof tools)[number] => Boolean(tool));

  return (
    <div className="page-stack">
      <Hero
        eyebrow="Account Planning Tools"
        title="Commercial planning tools for account managers"
        actions={
          <>
            <Link className="button" href="/calculators">
              Try the calculators
            </Link>
            <Link className="button button-secondary" href="/pricing">
              Compare Free and Pro
            </Link>
          </>
        }
      >
        <p>
          Run quick promo, margin and support checks — then turn the numbers
          into cleaner summaries for retailer meetings, internal reviews and
          account planning.
        </p>
        <p>APT helps you move faster when the question is simple but the spreadsheet never is.</p>
      </Hero>

      <section className="shell visual-section hero-visual">
        <PlaceholderImage
          aspectRatio="3 / 2"
          description="Dashboard and calculator workspace visual."
          filename="/images/hero-commercial-dashboard.svg"
          title="Commercial dashboard"
        />
      </section>

      <section className="shell trust-strip" aria-label="Account Planning Tools highlights">
        <span>Built for retail suppliers</span>
        <span>Fast browser tools</span>
        <span>Commercial planning first</span>
      </section>

      <section className="section shell">
        <SectionHeader eyebrow="Product sections" title="Numbers, calculators and outputs.">
          <p>
            Build promo ROI plans, run quick commercial calculations and turn the
            answer into something useful for a retailer conversation or internal
            sign-off.
          </p>
        </SectionHeader>
        <div className="grid">
          <article className="card tool-card">
            <span className="pill">Free forever</span>
            <h3>Calculators</h3>
            <p>Fast commercial maths for SOA, invoice price, retailer margin, tax and trade spend.</p>
            <Link className="text-link" href="/calculators">Open calculators</Link>
          </article>
          <article className="card tool-card">
            <span className="pill pro-pill">Free + Pro</span>
            <h3>ROI Tool</h3>
            <p>Single-line ROI checks, multi-SKU scenario planning and CSV export.</p>
            <Link className="text-link" href="/roi-tool">Open ROI Tool</Link>
          </article>
          <article className="card tool-card">
            <span className="pill pro-pill">Free + Pro</span>
            <h3>Presentations</h3>
            <p>Create buyer-ready and internal sign-off outputs from your planning work.</p>
            <Link className="text-link" href="/presentation-templates">Open presentations</Link>
          </article>
        </div>
      </section>

      <section className="section shell">
        <SectionHeader eyebrow="Start here" title="Pick the job in front of you.">
          <p>
            Start with one of the common account management moments: a buyer ask,
            a margin question, a support calculation or a deck that needs to be
            clearer by tomorrow.
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
              Commercial teams usually know the customer context. The lost time
              comes from rebuilding the same calculators, assumptions and deck
              structures from scratch.
            </p>
            <p>
              Account Planning Tools gives the work a starting shape: the
              numbers to test, the questions to challenge and the sections a
              credible customer plan needs.
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
            <h3>ROI Tool</h3>
            <p>
              Model one SKU or a full multi-line promotion, compare scenarios
              and export the numbers.
            </p>
            <Link className="text-link" href="/roi-tool">
              Open ROI tool
            </Link>
          </article>
          <article className="card tool-card">
            <span className="pill">Free</span>
            <h3>Calculators</h3>
            <p>
              Use fast SOA, retail price, invoice price, margin, tax and markup
              calculators when you only have a few numbers.
            </p>
            <Link className="text-link" href="/calculators/quick-calculators">
              Browse calculators
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
        <SectionHeader eyebrow="Presentations" title="Buyer-ready outputs without starting from blank pages.">
          <p>
            Buyer meeting prep, customer review and JBP structures live together
            so the numbers can become a clearer meeting story.
          </p>
        </SectionHeader>
        <div className="grid">
          {featured.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
        <div className="cta-row">
          <Link className="button" href="/presentation-templates">
            Open presentations
          </Link>
          <Link className="button button-secondary" href="/tools">
            View all resources
          </Link>
        </div>
      </section>

      <section className="section shell split-band">
        <div>
          <p className="eyebrow">Free and Pro</p>
          <h2>Start quickly, then go deeper when the work needs it.</h2>
        </div>
        <div className="card muted-card">
          <p>
            Free tools are useful for quick one-off checks. APT Pro is for the
            regular work: saving scenarios, comparing versions, keeping your
            default setup and turning results into cleaner outputs.
          </p>
          <ul className="compact-list">
            {proFeatures.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <Link className="text-link" href="/pricing">
            See pricing
          </Link>
          <PlaceholderImage
            aspectRatio="16 / 10"
            description="Pro planning view showing saved scenarios and exports."
            filename="/images/pricing-pro-workflow.svg"
            title="Pro planning"
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
          <Link className="button" href="/roi-tool">
            Start with ROI Tool
          </Link>
          <Link className="button button-secondary" href="/presentation-templates">
            Open presentations
          </Link>
        </div>
      </section>
    </div>
  );
}
