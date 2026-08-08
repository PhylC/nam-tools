import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Hero } from "../../components/Shell";
import { QuickCommercialCalculators } from "../../components/ToolWidgets";
import { seoMetadata } from "../../seo";
import {
  getQuickCalculatorById,
  getQuickCalculatorBySlug,
  quickCalculators,
} from "../../data/quickCalculators";

const metadataBySlug: Record<string, { title: string; description: string }> = {
  "required-soa-calculator": {
    title: "Required SOA / Support Calculator",
    description:
      "Work out the supplier support needed to move from a standard retail price to a proposed retail price while delivering the retailer's required margin.",
  },
  "retail-selling-price-calculator": {
    title: "Retail Selling Price from Invoice + Margin Calculator",
    description:
      "Check how invoice price, retail price and VAT or tax affect margin before you commit to a deal.",
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

  return (
    <div className="page-stack">
      <Hero title={calculator.h1}>
        <p>{calculator.description}</p>
      </Hero>

      <section className="shell tool-layout">
        <div className="tool-main">
          <QuickCommercialCalculators only={calculator.id} />
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
