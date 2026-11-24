import Link from "next/link";
import {
  getRetailListingPackCheckoutConfig,
  retailListingPackPath,
  retailListingPackTitle,
} from "../../lib/retailListingPackConfig";
import { FaqSection } from "../components/FaqSection";
import { Hero } from "../components/Shell";
import { JsonLd } from "../components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, seoMetadata } from "../seo";
import { CalculatorsHubClient } from "./CalculatorsHubClient";

export const metadata = seoMetadata({
  title: "Retail Calculators for Price, Margin and Promotions",
  description:
    "Calculate retail selling price, retailer margin, invoice price and promotional support (SOA). Model promotion sales and ROI with the planner.",
  path: "/calculators",
  keywords: [
    "sales calculators",
    "retail calculators",
    "commercial calculators",
    "retailer margin calculator",
    "retail selling price calculator",
    "promotion support calculator",
    "soa calculator",
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
        title="Retail calculators for price, margin and promotions"
        actions={
          <>
            <Link className="button" href="/roi-tool">
              Model promotion sales and ROI
            </Link>
            <Link className="hero-text-link" href="#pricing-tools">
              Browse pricing tools
            </Link>
            <Link className="hero-text-link" href="#promotion-tools">
              Browse promotion tools
            </Link>
          </>
        }
      >
        <p>
          Work out a retail selling price, compare baseline and promotional sales, or calculate the supplier support
          (SOA) needed for a proposed promotion.
        </p>
      </Hero>

      {getRetailListingPackCheckoutConfig() && (
        <section className="shell" aria-labelledby="excel-workbooks">
          <article className="card related-card calculator-guide-card">
            <h2 id="excel-workbooks">Excel workbooks</h2>
            <p>Review an offer for a UK retail listing. Estimate your contribution and break-even volume after rebates, promotions, delivery and listing fees.</p>
            <Link className="hero-text-link" href={retailListingPackPath}>
              {retailListingPackTitle} (£29 one-off)
            </Link>
          </article>
        </section>
      )}
      <CalculatorsHubClient />
      <FaqSection title="Commercial calculator FAQs." faqs={calculatorFaqs} />
    </div>
  );
}
