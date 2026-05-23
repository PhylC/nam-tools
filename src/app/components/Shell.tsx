import Link from "next/link";
import Image from "next/image";
import { AptModeProvider, PlanModeToggle } from "./AptMode";
import { MobileNav } from "./MobileNav";
import { relatedTools, tools } from "../data/tools";
import type { Tool } from "../data/tools";

const footerResourceLinks = [
  { href: "/roi-tool", label: "ROI Tool" },
  { href: "/calculators", label: "Calculators" },
  { href: "/presentation-templates", label: "Presentations" },
  { href: "/tools/promotion-roi-calculator", label: "Promotion ROI" },
  { href: "/tools/trade-spend-calculator", label: "Trade Spend" },
  { href: "/tools/gross-margin-calculator", label: "Gross Margin" },
];

const footerSiteLinks = [
  { href: "/pricing", label: "Pricing" },
  { href: "/tools", label: "All resources" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <AptModeProvider>
      <header className="site-header">
        <div className="shell header-inner">
          <Link className="brand" href="/" aria-label="Account Planning Tools home">
            <Image
              alt="APT Account Planning Tools logo"
              className="brand-logo"
              height={48}
              priority
              src="/images/branding/logo-full.png"
              width={119}
            />
          </Link>
          <nav className="main-nav" aria-label="Main navigation">
            <Link href="/roi-tool">ROI Tool</Link>
            <Link href="/calculators">Calculators</Link>
            <Link href="/presentation-templates">Presentations</Link>
            <Link href="/pricing">Pricing</Link>
          </nav>
          <PlanModeToggle />
          <MobileNav />
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div className="shell footer-grid">
          <div>
            <Link className="brand footer-brand" href="/">
              <Image
                alt="APT Account Planning Tools logo"
                className="brand-logo footer-logo"
                height={42}
                src="/images/branding/logo-full.png"
                width={104}
              />
            </Link>
            <p>
              Practical commercial planning tools for account managers dealing
              with promo ROI, margin questions, retailer asks and meeting
              outputs.
            </p>
          </div>
          <nav aria-label="Tool links">
            <h2>Resources</h2>
            {footerResourceLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <nav aria-label="Site links">
            <h2>Site</h2>
            {footerSiteLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="shell footer-bottom">
          <span>© 2026 Account Planning Tools. All rights reserved.</span>
          <span>Calculations are estimates based on the inputs provided.</span>
        </div>
      </footer>
    </AptModeProvider>
  );
}

export function Hero({
  eyebrow,
  title,
  children,
  actions,
  visual,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  visual?: React.ReactNode;
}) {
  return (
    <section className={visual ? "hero shell hero-with-media" : "hero shell"}>
      <div className="hero-copy">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        <div className="lead">{children}</div>
        {actions ? <div className="hero-actions">{actions}</div> : null}
      </div>
      {visual ? <div className="hero-media">{visual}</div> : null}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-header">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {children ? <div className="section-lead">{children}</div> : null}
    </div>
  );
}

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <article className="card tool-card">
      <span className="pill">{tool.category}</span>
      <h3>{tool.title}</h3>
      <p>{tool.description}</p>
      <Link className="text-link" href={tool.href}>
        Open tool
      </Link>
    </article>
  );
}

export function ProPlaceholder() {
  return (
    <aside className="card pro-card">
      <span className="pill">Pro</span>
      <h2>Pro tools</h2>
      <p>
        Pro includes saved scenarios, exportable summaries, team templates and
        richer commercial commentary.
      </p>
      <Link className="button button-secondary" href="/pricing">
        View pricing
      </Link>
    </aside>
  );
}

export function PlaceholderImage({
  filename,
  title,
  description,
  aspectRatio = "16 / 9",
}: {
  filename: string;
  title: string;
  description: string;
  aspectRatio?: string;
}) {
  return (
    <figure className="product-image-card" style={{ aspectRatio }}>
      <img alt={`${title}: ${description}`} src={filename} />
      <figcaption>
        <span className="pill">Product visual</span>
        <strong>{title}</strong>
        <small>{description}</small>
      </figcaption>
    </figure>
  );
}

export function ToolPage({
  slug,
  intro,
  children,
  interpretation,
}: {
  slug: string;
  intro: string;
  children: React.ReactNode;
  interpretation: React.ReactNode;
}) {
  const tool = tools.find((item) => item.slug === slug);

  if (!tool) {
    return null;
  }

  return (
    <div className="page-stack">
      <Hero
        eyebrow={tool.category}
        title={tool.title}
        visual={
          tool.category === "Calculator" ? (
            <PlaceholderImage
              aspectRatio="16 / 9"
              description="Excel-style scenario comparison and commercial dashboard visual."
              filename="/images/commercial-deal-calculator.svg"
              title="ROI scenario view"
            />
          ) : undefined
        }
      >
        <p>{intro}</p>
      </Hero>
      <section className="shell tool-layout">
        <div className="tool-main">
          <aside className="card judgement-card">
            <h2>Commercial judgement matters</h2>
            <p>
              Retail selling prices are at the sole discretion of the retailer.
              Calculations are estimates based on the inputs provided and should
              be checked against your own internal process.
            </p>
          </aside>
          {children}
          <article className="card interpretation-card">
            <h2>Commercial interpretation</h2>
            {interpretation}
          </article>
        </div>
        <div className="tool-side">
          <ProPlaceholder />
          <article className="card related-card">
            <h2>Related tools</h2>
            <div className="related-links">
              {relatedTools(tool.related).map((related) => (
                <Link key={related.slug} href={related.href}>
                  {related.shortTitle}
                </Link>
              ))}
            </div>
          </article>
          <article className="card related-card">
            <h2>Example use cases</h2>
            <ul className="compact-list">
              {tool.useCases.map((useCase) => (
                <li key={useCase}>{useCase}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}

export function Field({
  label,
  help,
  children,
}: {
  label: React.ReactNode;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {help ? <small>{help}</small> : null}
    </label>
  );
}

const resultHelpByLabel: Record<string, string> = {
  "Net profit impact":
    "Estimated supplier profit change after supplier support, SOA and fixed costs.",
  ROI:
    "Net profit impact divided by total supplier support. A positive ROI means the deal pays back on the entered assumptions.",
  "Total supplier support":
    "Total estimated supplier investment, including per-unit SOA/support and any fixed support.",
  "Total SOA / supplier support":
    "Total estimated supplier investment, including per-unit SOA/support and any fixed support.",
  "Break-even units":
    "Estimated incremental units needed to cover supplier support and fixed costs.",
  "Incremental gross profit":
    "Estimated gross profit generated above the baseline before or after support, depending on the view shown.",
  "Incremental GP before SOA / supplier support":
    "Estimated gross profit generated above the baseline before SOA / supplier support and fixed costs.",
  "SOA / supplier support value":
    "Total per-unit supplier support across the forecast units.",
  "SOA value": "Total per-unit supplier support across the forecast units.",
  "SOA % of current invoice":
    "Supplier support expressed as a percentage of the selected invoice value.",
  "SOA % of promo retail price":
    "Supplier support expressed as a percentage of the selected retail price.",
  "SOA as % of invoice price":
    "Supplier support expressed as a percentage of the selected invoice value.",
  "SOA as % of retail price excluding tax":
    "Supplier support expressed as a percentage of the retail selling price excluding tax.",
  "SOA as % of retail price including tax":
    "Supplier support expressed as a percentage of the retail selling price including sales tax / VAT / IVA.",
  "Support % of invoice":
    "Supplier support expressed as a percentage of the selected invoice value.",
  "Retailer estimated profit":
    "Estimated retailer/customer cash profit from the deal using the entered invoice price, retail price and support.",
  "Retailer estimated profit after support":
    "Estimated retailer/customer cash profit from the deal using the entered invoice price, retail price and support.",
  "Retailer margin after support":
    "Estimated retailer/customer margin after supplier support is included. Pricing is at the sole discretion of the retailer.",
  "Retailer margin %":
    "Estimated retailer/customer margin based on the entered invoice price, retail price and support.",
  "Retailer cash profit per unit":
    "Estimated cash profit per unit for the retailer/customer.",
  "Supplier support received":
    "Estimated value of supplier support received by the retailer/customer.",
  "SOA / supplier support received":
    "Estimated value of supplier support received by the retailer/customer.",
  "Retailer margin gap vs requirement":
    "Difference between the estimated supported margin and the retailer margin target entered.",
  "Retail price excluding tax":
    "Retail selling price excluding sales tax / VAT / IVA, usually used for margin estimates.",
  "Entered retail price":
    "The shopper/end-customer retail price entered before tax-basis conversion.",
  "Promo retail price excluding tax":
    "Retail selling price converted to exclude sales tax / VAT / IVA where needed.",
  "Promotional retail price excluding tax":
    "Promotional retail selling price converted to exclude sales tax / VAT / IVA where needed.",
  "Promotional retail selling price entered":
    "The retail selling price entered before any tax-basis conversion is applied.",
  "Retail selling price before promotion entered":
    "The normal shopper/end-customer retail price entered before tax-basis conversion.",
  "Retail selling price before promotion excluding tax":
    "The normal retail selling price converted to exclude sales tax / VAT / IVA where needed.",
  "Excluding-tax selling price used":
    "Retail selling price converted to exclude sales tax / VAT / IVA where needed.",
  "Retailer gross sales excluding tax":
    "Estimated retail sales value excluding sales tax / VAT / IVA.",
  "Retailer invoice/buy value":
    "Estimated value paid by the retailer/customer to the supplier before shopper retail pricing.",
  "Retailer profit before support":
    "Estimated retailer/customer profit before supplier support is included.",
  "Retailer margin before support":
    "Estimated retailer/customer margin before supplier support is included.",
  "Retailer verdict":
    "A quick planning read based on the retailer/customer margin target entered.",
  "Total trade spend":
    "Total estimated commercial investment including variable support, rebates, marketing contribution and fixed support.",
  "Trade spend % of gross sales":
    "Trade spend as a percentage of gross sales value before deductions.",
  "Net sales after SOA / supplier support":
    "Estimated sales value after trade spend and deductions.",
  "Variable SOA / supplier support":
    "Estimated variable support, rebates and deductions linked to sales value.",
  "Fixed supplier support":
    "Fixed investment such as media, feature fee, activation support, listing support or lump-sum customer funding.",
  "Gross sales value": "Estimated sales value before trade spend and deductions.",
  "Variable discount value":
    "Estimated value of invoice discounts or variable price support.",
  "Rebate/overrider value":
    "Estimated value of back-end terms as a percentage of sales.",
  "Marketing contribution":
    "Estimated retail media, shopper or activation contribution.",
  "Other deductions": "Extra deductions included in the trade spend view.",
  "Trade spend % of invoice sales":
    "Trade spend as a percentage of estimated invoice sales where invoice sales are available.",
  "Investment value":
    "Estimated value of the requested investment based on the entered percentage or support assumptions.",
  "Expected uplift value": "Estimated additional revenue from the expected uplift.",
  "Expected gross profit": "Estimated gross profit from the expected uplift.",
  "Net impact": "Estimated commercial impact after investment and assumptions entered.",
  "Probability-adjusted net impact":
    "Expected commercial impact adjusted for the entered probability of success.",
  "Probability-adjusted revenue":
    "Expected incremental revenue adjusted for the entered probability of success.",
  "Monthly payback / contract period view":
    "Estimated net impact spread across the entered contract period.",
  Recommendation:
    "A planning guide based on the assumptions entered, not a final approval decision.",
  Verdict: "A planning guide based on the assumptions entered, not a final approval decision.",
  "Sales tax / VAT / IVA amount":
    "Estimated tax amount based on the entered tax rate.",
  "Retail price including tax":
    "Retail selling price including sales tax / VAT / IVA.",
  "Estimated retail/sale price including sales tax / VAT / IVA":
    "Retail selling price including sales tax / VAT / IVA.",
  "Estimated retail/sale price excluding sales tax / VAT / IVA":
    "Retail selling price excluding sales tax / VAT / IVA, usually used for margin estimates.",
  "Cash margin per unit": "Estimated cash profit per unit.",
  "Cash profit": "Estimated cash profit from the entered cost and selling price.",
  "Margin %": "Profit as a percentage of selling price.",
  "Markup %": "Profit as a percentage of cost.",
  "Required retailer cost price":
    "Estimated retailer/customer buy price needed to achieve the target margin.",
  "Required SOA per unit":
    "Estimated per-unit supplier support needed to reach the target retailer/customer margin.",
  "New effective promo invoice price":
    "Estimated invoice/buy price after per-unit supplier support is applied.",
  "Effective retailer cost price":
    "Estimated retailer/customer cost after SOA or promo invoice support is applied.",
  "Effective promo invoice price":
    "Estimated invoice/buy price after SOA / supplier support is deducted.",
  "Total retailer cash profit":
    "Estimated retailer/customer cash profit across the entered units.",
  "Implied retailer invoice/buy price":
    "Estimated invoice/buy price implied by the retail price and target margin.",
  "Retail price tax basis":
    "Whether the entered retail selling price includes or excludes sales tax / VAT / IVA.",
  "Sales tax / VAT / IVA rate":
    "Sales tax / VAT / IVA rate used to convert retail selling price where needed.",
  "Retention value": "Optional value of defending current business included in the investment view.",
};

function ResultLabel({ label, help }: { label: string; help?: string }) {
  const info = help ?? resultHelpByLabel[label];

  if (!info) {
    return <span className="result-label">{label}</span>;
  }

  return (
    <span className="result-label">
      <span>{label}</span>
      <span aria-label={`${label}: ${info}`} className="info-dot" tabIndex={0}>
        i
        <span className="info-tooltip" role="tooltip">
          {info}
        </span>
      </span>
    </span>
  );
}

export function ResultGrid({
  items,
}: {
  items: { label: string; value: string; tone?: "good" | "bad" | "neutral"; help?: string }[];
}) {
  return (
    <div className="result-grid">
      {items.map((item) => (
        <div className={`result-item ${item.tone ? `result-${item.tone}` : ""}`} key={item.label}>
          <ResultLabel help={item.help} label={item.label} />
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
