import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "../../components/JsonLd";
import { FaqSection } from "../../components/FaqSection";
import { Hero } from "../../components/Shell";
import { QuickCommercialCalculators } from "../../components/ToolWidgets";
import { breadcrumbJsonLd, faqJsonLd, seoMetadata } from "../../seo";
import {
  getQuickCalculatorById,
  getQuickCalculatorBySlug,
  quickCalculators,
  requiredSoaWorkedExampleId,
} from "../../data/quickCalculators";
import { CalculatorNextSteps } from "./CalculatorNextSteps";

const retailSellingPriceFaqs = [
  {
    question: "How do I calculate retail selling price from invoice price?",
    answer:
      "Divide the retailer invoice or buy price by one minus the target retailer margin. For a £1.75 invoice price and 30% target margin, the excluding-tax retail selling price is £2.50.",
  },
  {
    question: "Should retailer margin be calculated before or after VAT?",
    answer:
      "Retailer margin is normally checked against the selling price excluding VAT, sales tax or IVA. The calculator shows both the excluding-tax commercial value and the shopper-facing including-tax price.",
  },
  {
    question: "What is the difference between margin and markup?",
    answer:
      "Margin measures profit as a percentage of the selling price, while markup measures profit as a percentage of cost. This calculator uses target retailer margin, not markup.",
  },
  {
    question: "What if the calculated shelf price is too high?",
    answer:
      "Use the required SOA calculator to estimate the supplier support needed for a lower shelf price, then test volume and profitability in the Promotion ROI Planner.",
  },
];

const metadataBySlug: Record<string, { title: string; description: string }> = {
  "required-soa-calculator": {
    title: "Required SOA / Support Calculator",
    description:
      "Work out the supplier support needed to move from a standard retail price to a proposed retail price while delivering the retailer's required margin.",
  },
  "retail-selling-price-calculator": {
    title: "Retail Selling Price Calculator from Invoice Price and Margin",
    description:
      "Calculate retail selling price from invoice or buy price and target retailer margin. See the excluding-tax and VAT, sales tax or IVA inclusive result instantly.",
  },
  "actual-retailer-margin-calculator": {
    title: "Actual Retailer Margin Calculator",
    description:
      "Check how invoice price, promo support, retail price and VAT or tax affect retailer margin.",
  },
  "invoice-price-calculator": {
    title: "Invoice Price from Retail Price + Margin Calculator",
    description:
      "Back-solve the invoice price implied by a retail price and target margin.",
  },
  "promo-invoice-calculator": {
    title: "Promo Invoice Calculator",
    description:
      "Turn SOA or support per unit into a promotional invoice price and total support view.",
  },
  "sales-tax-vat-iva-calculator": {
    title: "Sales Tax, VAT and IVA Retail Price Calculator",
    description:
      "Convert retail prices when margin needs to be checked excluding VAT, sales tax or IVA.",
  },
  "markup-vs-margin-calculator": {
    title: "Markup vs Margin Calculator",
    description:
      "Check whether a deal conversation is using margin or markup before the numbers get confused.",
  },
};

export function generateStaticParams() {
  return quickCalculators.map((calculator) => ({ slug: calculator.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const calculator = getQuickCalculatorBySlug(slug);

  if (!calculator) {
    return {};
  }

  const pageMetadata = metadataBySlug[slug] ?? {
    title: calculator.title,
    description: calculator.description,
  };

  return seoMetadata({
    ...pageMetadata,
    path: `/calculators/${calculator.slug}`,
  });
}

export default async function CalculatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const calculator = getQuickCalculatorBySlug(slug);

  if (!calculator) {
    notFound();
  }

  const related = calculator.related
    .map((id) => getQuickCalculatorById(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const isRetailSellingPrice = calculator.slug === "retail-selling-price-calculator";
  const isRequiredSoa = calculator.slug === "required-soa-calculator";
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Calculators", path: "/calculators" },
    { name: calculator.title, path: `/calculators/${calculator.slug}` },
  ]);

  return (
    <div className={`page-stack${isRetailSellingPrice ? " retail-selling-price-page" : ""}`}>
      <JsonLd
        data={isRetailSellingPrice ? [breadcrumbs, faqJsonLd(retailSellingPriceFaqs)] : breadcrumbs}
      />
      <Hero
        title={calculator.h1}
        actions={
          isRetailSellingPrice ? (
            <>
              <Link className="button" href="#calculator">
                Calculate selling price
              </Link>
              <Link className="hero-text-link" href="#retail-price-formula">
                See the formula and VAT example
              </Link>
            </>
          ) : undefined
        }
      >
        <p>{calculator.description}</p>
      </Hero>

      {isRetailSellingPrice ? (
        <section className="shell calculator-proof-strip" aria-label="Calculator benefits">
          <div>
            <strong>3 inputs</strong>
            <span>Invoice price, target margin and tax rate</span>
          </div>
          <div>
            <strong>Instant result</strong>
            <span>Ex-tax and shopper-facing selling prices</span>
          </div>
          <div>
            <strong>No login</strong>
            <span>Free commercial sense-check</span>
          </div>
        </section>
      ) : null}

      <section className="shell tool-layout">
        <div className="tool-main">
          <div id="calculator">
            <QuickCommercialCalculators only={calculator.id} />
          </div>
          {isRequiredSoa ? (
            <article className="card related-card calculator-guide-card" id="soa-promo-price-example">
              <h2>Should you reduce SOA or raise the promo price?</h2>
              <p>
                Suppose the standard selling price is £100 excluding VAT and the retailer normally earns a 30%
                margin. That makes the normal invoice price £70 per unit. All prices below exclude VAT.
              </p>
              <ul className="compact-list">
                <li>
                  <strong>Keep the £85 promo price and 30% margin.</strong> The retailer can pay £59.50 per unit
                  (£85 × 70%). The supplier needs to fund £10.50 per unit (£70 − £59.50).
                </li>
                <li>
                  <strong>Cut support to £7 and keep the £85 price.</strong> The retailer&apos;s net cost rises to £63.
                  The retailer keeps £22 per unit, a margin of 25.9% (£22 ÷ £85).
                </li>
                <li>
                  <strong>Cap support at £7 and keep the 30% margin.</strong> The promo price needs to rise to £90
                  (£63 ÷ 70%).
                </li>
              </ul>
              <p>
                If the £85 price is important for shoppers, check whether the retailer can accept 25.9% margin or the
                supplier can fund £10.50 per unit. Use the <Link href="/roi-tool">Promotion ROI Planner</Link> to
                compare expected volume and supplier profit for £85 with £10.50 support and £90 with £7 support.
              </p>
              <a href={`#${requiredSoaWorkedExampleId}`}>Try the numbers in the SOA calculator</a>
            </article>
          ) : null}
          {isRetailSellingPrice ? (
            <>
              <article className="card related-card calculator-guide-card" id="retail-price-formula">
                <h2>How to calculate retail selling price</h2>
                <p>Use the retailer’s invoice price per unit and express the target retailer margin as a decimal.</p>
                <ol className="compact-list">
                  <li>
                    <strong>Price excluding VAT = invoice price ÷ (1 − target retailer margin).</strong>{" "}
                    For a £1.75 invoice price and 30% margin, £1.75 ÷ (1 − 0.30) gives £2.50 excluding VAT.
                  </li>
                  <li>
                    <strong>Price including VAT = price excluding VAT × (1 + VAT rate).</strong>{" "}
                    At 20% VAT, £2.50 × 1.20 gives a £3.00 shopper price.
                  </li>
                </ol>
                <p>Check retailer margin against the £2.50 excluding VAT. Use the tax rate that applies to your product.</p>
                <p>
                  Use the result as a planning estimate before a range review, price ladder or promotion discussion.
                  If the buyer wants a lower shelf price, use the{" "}
                  <Link href="/calculators/required-soa-calculator">required SOA calculator</Link> to work out the
                  support needed, then sense-check the full deal in the <Link href="/roi-tool">Promotion ROI Planner</Link>.
                </p>
              </article>
              <CalculatorNextSteps />
            </>
          ) : null}
        </div>
        <div className="tool-side">
          <article className="card related-card">
            <h2>When to use this</h2>
            <ul className="compact-list">
              {calculator.whenToUse.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="card related-card">
            <h2>Formula used</h2>
            <ul className="compact-list">
              {calculator.formula.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="card related-card">
            <h2>Related calculators</h2>
            <div className="related-links">
              <Link href="/calculators/quick-calculators">Browse calculators</Link>
              {related.map((item) => (
                <Link key={item.slug} href={`/calculators/${item.slug}`}>
                  {item.title}
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>
      {isRetailSellingPrice ? (
        <FaqSection
          eyebrow="Retail pricing questions"
          title="Retail selling price calculator FAQs."
          faqs={retailSellingPriceFaqs}
        />
      ) : null}
    </div>
  );
}
