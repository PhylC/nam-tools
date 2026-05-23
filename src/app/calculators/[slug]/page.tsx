import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Hero, SectionHeader } from "../../components/Shell";
import { QuickCommercialCalculators } from "../../components/ToolWidgets";
import {
  getQuickCalculatorById,
  getQuickCalculatorBySlug,
  quickCalculators,
} from "../../data/quickCalculators";

const metadataBySlug: Record<string, Metadata> = {
  "required-soa-calculator": {
    title: "Required SOA Calculator",
    description:
      "Use this when a retailer asks for support and you need to estimate the SOA needed to reach a target margin.",
  },
  "retail-selling-price-calculator": {
    title: "Retail Selling Price Calculator",
    description:
      "Check how invoice price, retail price and VAT or tax affect margin before you commit to a deal.",
  },
  "actual-retailer-margin-calculator": {
    title: "Actual Retailer Margin Calculator",
    description:
      "Check how invoice price, promo support, retail price and VAT or tax affect retailer margin.",
  },
  "invoice-price-calculator": {
    title: "Invoice Price Calculator from Retail Price and Margin",
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

  return metadataBySlug[slug] ?? {
    title: calculator.title,
    description: calculator.description,
  };
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

  return (
    <div className="page-stack">
      <Hero eyebrow="Free calculator" title={calculator.h1}>
        <p>{calculator.description}</p>
      </Hero>

      <section className="shell tool-layout">
        <div className="tool-main">
          <QuickCommercialCalculators only={calculator.id} />
          <article className="card judgement-card">
            <h2>Pricing caveat</h2>
            <p>
              Retail selling prices are at the sole discretion of the retailer.
              Calculations are estimates based on the inputs provided and should
              be checked against your own internal process.
            </p>
          </article>
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
    </div>
  );
}
