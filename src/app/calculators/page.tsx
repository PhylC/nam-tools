import Link from "next/link";
import { FaqSection } from "../components/FaqSection";
import { Hero } from "../components/Shell";
import { JsonLd } from "../components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, seoMetadata } from "../seo";
import { CalculatorsHubClient } from "./CalculatorsHubClient";

export const metadata = seoMetadata({
  title: "Commercial Calculator Hub",
  description:
    "Choose calculators for promo ROI, retailer margin, SOA support, invoice price and commercial planning questions.",
  path: "/calculators",
});

const calculatorFaqs = [
  {
    question: "Which commercial calculator should I start with?",
    answer:
      "Use the ROI planner for a full promotion view. Use the quick calculators when you only need one answer, such as retail margin, invoice price or required support.",
  },
  {
    question: "Can I calculate retailer margin from invoice price?",
    answer:
      "Yes. The retailer margin calculators help you check margin from invoice price, support, retail selling price and tax assumptions.",
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
        title="What are you trying to work out?"
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
          Start with the full ROI planner for a complete promotion view, or jump into a quick calculator when you only
          need one answer.
        </p>
      </Hero>

      <CalculatorsHubClient />
      <FaqSection title="Commercial calculator FAQs." faqs={calculatorFaqs} />
    </div>
  );
}
