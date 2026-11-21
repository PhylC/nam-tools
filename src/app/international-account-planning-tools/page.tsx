import Link from "next/link";
import { FaqSection } from "../components/FaqSection";
import { JsonLd } from "../components/JsonLd";
import { Hero, SectionHeader } from "../components/Shell";
import { INTERNATIONAL_KEYWORD_TARGETS, breadcrumbJsonLd, faqJsonLd, seoMetadata } from "../seo";

export const metadata = seoMetadata({
  title: "International Account Planning Tools for FMCG and CPG Teams",
  description:
    "Commercial planning tools for international FMCG and CPG teams working across promo ROI, trade spend, retailer margin, sales tax, VAT and IVA assumptions.",
  path: "/international-account-planning-tools",
  keywords: INTERNATIONAL_KEYWORD_TARGETS,
});

const marketUseCases = [
  {
    title: "UK and Ireland account planning",
    copy:
      "Model promotions, retailer margin, VAT assumptions, invoice price and support investment before customer meetings.",
  },
  {
    title: "US and North American CPG planning",
    copy:
      "Sense-check promotional ROI, trade spend and customer investment using sales tax and local currency assumptions.",
  },
  {
    title: "European commercial planning",
    copy:
      "Use EUR pricing, IVA or VAT-style tax assumptions and clean scenario summaries for distributor and retailer reviews.",
  },
];

const planningToolLinks = [
  {
    title: "Promotion ROI",
    copy: "Compare support, uplift, invoice revenue and payback before a retailer or distributor promo is agreed.",
    href: "/roi-tool",
    cta: "Open ROI planner",
  },
  {
    title: "Retail margin and pricing",
    copy: "Check invoice price, retail selling price, margin and tax assumptions when markets use different price structures.",
    href: "/calculators",
    cta: "See calculators",
  },
  {
    title: "Support and trade spend",
    copy: "Work out the support, allowance or funding needed to hit a promoted price while keeping the commercial ask clear.",
    href: "/tools/trade-spend-calculator",
    cta: "Check trade spend",
  },
];

const pageFaqs = [
  {
    question: "Can APT be used by teams outside the UK?",
    answer:
      "Yes. APT supports GBP, USD and EUR pricing, and lets teams use sales tax, VAT or IVA assumptions depending on the market they are planning for.",
  },
  {
    question: "Is this for FMCG and CPG teams?",
    answer:
      "APT is built around the commercial questions FMCG, CPG, retail supplier and account teams face: promotion ROI, trade spend, margin, support and customer planning.",
  },
  {
    question: "Does APT replace local finance approval?",
    answer:
      "No. APT is a planning and scenario tool. Teams should still confirm local tax, pricing, compliance and sign-off requirements with their own business.",
  },
];

export default function InternationalAccountPlanningToolsPage() {
  return (
    <div className="page-stack">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "International account planning tools", path: "/international-account-planning-tools" },
          ]),
          faqJsonLd(pageFaqs),
        ]}
      />
      <Hero eyebrow="International account planning" title="Commercial planning tools for FMCG and CPG teams working across markets.">
        <p>
          APT helps international account teams turn promotion, trade spend, margin and tax assumptions into clearer
          planning outputs without rebuilding a spreadsheet for every retailer, distributor or customer conversation.
        </p>
      </Hero>

      <section className="shell section">
        <SectionHeader eyebrow="Use cases" title="Plan the same commercial questions in different markets.">
          <p>
            Currency symbols, tax names and customer structures change by country. The core decisions stay familiar:
            will the promotion pay back, what support is needed, and how does the deal affect margin?
          </p>
        </SectionHeader>
        <div className="grid">
          {marketUseCases.map((item) => (
            <article className="card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shell section split-band international-tool-section">
        <article className="legal-copy">
          <SectionHeader eyebrow="Buyer value" title="Turn market differences into clearer customer decisions.">
            <p>
              International account teams need fast answers that still respect local trading terms. APT keeps the
              commercial question visible first, then lets each market adjust currency, tax and support assumptions.
            </p>
          </SectionHeader>
        </article>
        <article className="legal-copy">
          <div className="international-tool-grid">
            {planningToolLinks.map((item) => (
              <div className="card international-tool-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
                <Link className="text-link" href={item.href}>
                  {item.cta}
                </Link>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="shell section">
        <article className="card split-band">
          <div>
            <p className="eyebrow">Workflow</p>
            <h2>Start with the commercial question, then localise the assumptions.</h2>
          </div>
          <div className="copy-stack">
            <p>
              Use the ROI planner for promotion decisions, quick calculators for margin and tax checks, and planning
              tools when the output needs to become a buyer meeting note, account plan or JBP discussion.
            </p>
            <div className="cta-row">
              <Link className="button" href="/roi-tool">
                Open ROI planner
              </Link>
              <Link className="button button-secondary" href="/calculators">
                See calculators
              </Link>
              <Link className="text-link" href="/pricing">
                Compare Free vs Pro
              </Link>
            </div>
          </div>
        </article>
      </section>

      <section className="shell section">
        <article className="card related-card">
          <h2>Compare retailer margin across two markets</h2>
          <p>Use the retailer’s invoice price and shopper price excluding local tax in each market. In this fictional example, a £2.00 invoice price and £3.00 shelf price excluding tax give a 33.3% margin. A €2.20 invoice price and €3.30 shelf price excluding tax also give a 33.3% margin.</p>
          <p>Use the <Link href="/calculators/sales-tax-vat-iva-calculator">sales tax, VAT and IVA calculator</Link> first if a shelf price includes tax. Compare percentages directly. To compare cash profit across markets, convert both amounts to the same currency using the same reporting basis.</p>
        </article>
      </section>

      <FaqSection title="International planning FAQs." faqs={pageFaqs} />
    </div>
  );
}
