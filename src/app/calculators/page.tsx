import Link from "next/link";
import { FaqSection } from "../components/FaqSection";
import { Hero } from "../components/Shell";
import { JsonLd } from "../components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, seoMetadata } from "../seo";
import { CalculatorsHubClient } from "./CalculatorsHubClient";

export const metadata = seoMetadata({
  title: "Sales & Retail Calculators",
  description:
    "Use free sales and retail calculators for promotion ROI, retailer margin, trade support, invoice price, sales tax, VAT, IVA and commercial planning.",
  path: "/calculators",
  keywords: [
    "sales calculators",
    "retail calculators",
    "commercial calculators",
    "retailer margin calculator",
    "sales tax calculator",
    "promotion ROI calculator",
  ],
});

const calculatorFaqs = [
  {
    question: "Which commercial calculator should I start with?",
    answer:
      "Use the ROI planner for a full promotion view. Use the quick calculators when you only need one answer, such as retail margin, invoice price, required support or tax conversion.",
  },
  {
    question: "Which sales calculators are available?",
    answer:
      "Sales and account teams can use the promotion ROI planner, required support or SOA calculator, promo invoice calculator and pricing tools to prepare customer proposals and commercial reviews.",
  },
  {
    question: "Which retail calculators are available?",
    answer:
      "Retail planning tools include retail selling price, invoice price, actual retailer margin and sales tax, VAT or IVA calculators. Use them to check the commercial mechanics behind a retailer proposal.",
  },
  {
    question: "Can I calculate retailer margin from invoice price?",
    answer:
      "Yes. The retailer margin calculators help you check margin from invoice price, support, retail selling price and sales tax, VAT or IVA assumptions.",
  },
  {
    question: "Can I use the calculators in different countries?",
    answer:
      "Yes. The calculators support configurable currency and tax assumptions, so you can model GBP, USD, EUR, sales tax, VAT or IVA planning scenarios.",
  },
  {
    question: "Can I work out the support or SOA needed for a promotion?",
    answer:
      "Yes. The support calculators estimate the supplier support needed to move from a standard price to a promoted price while protecting margin.",
  },
];

export default function CalculatorsPage() {
  return (
    <div className="page-stack calculators-hub-page">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Calculators", path: "/calculators" },
          ]),
          faqJsonLd(calculatorFaqs),
        ]}
      />
      <Hero
        title="Sales and retail calculators for commercial planning"
        actions={
          <>
            <Link className="button" href="/roi-tool">
              Open ROI planner
            </Link>
            <Link className="hero-text-link" href="#pricing-tools">
              Browse quick calculators
            </Link>
          </>
        }
      >
        <p>
          Use these free calculators to check promotion ROI, retailer margin, invoice price, trade support, sales tax,
          VAT or IVA. Start with the full ROI planner for a complete customer proposal, or choose a quick calculator
          when you only need one commercial answer.
        </p>
      </Hero>

      <section className="shell section" aria-labelledby="sales-retail-calculators-heading">
        <div className="section-header">
          <h2 id="sales-retail-calculators-heading">Choose a sales or retail calculator</h2>
          <p>
            These tools are designed for account managers, sales teams and retail supplier teams preparing prices,
            promotions and buyer conversations.
          </p>
        </div>
        <div className="calculator-tool-grid">
          <article className="card calculator-hub-card">
            <div className="calculator-preview">Promotion ROI · support · promo invoice</div>
            <h3>Sales calculators</h3>
            <p>
              Model the commercial return from a promotion, calculate supplier support and turn the result into a
              clearer customer proposal.
            </p>
            <Link className="text-link" href="#promotion-tools">
              Browse sales calculators
            </Link>
          </article>
          <article className="card calculator-hub-card">
            <div className="calculator-preview">Retail price · margin · invoice · tax</div>
            <h3>Retail calculators</h3>
            <p>
              Calculate retail selling price, back-solve invoice price, check actual retailer margin and apply sales
              tax, VAT or IVA assumptions.
            </p>
            <Link className="text-link" href="#pricing-tools">
              Browse retail calculators
            </Link>
          </article>
        </div>
      </section>

      <CalculatorsHubClient />
      <FaqSection title="Commercial calculator FAQs." faqs={calculatorFaqs} />
    </div>
  );
}
