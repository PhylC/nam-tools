import Link from "next/link";
import { JsonLd } from "../../components/JsonLd";
import { Hero, SectionHeader } from "../../components/Shell";
import { quickCalculatorGroups, quickCalculators } from "../../data/quickCalculators";
import { breadcrumbJsonLd, seoMetadata } from "../../seo";

export const metadata = seoMetadata({
  title: "Commercial Calculators for Account Managers",
  description:
    "Quick SOA, retailer margin, invoice price, promo invoice, sales tax, VAT, IVA, markup and margin calculators for account managers.",
  path: "/calculators/quick-calculators",
});

const choices = [
  "Calculate retail selling price from invoice price and target margin",
  "What SOA do I need to hit a margin?",
  "What margin is the retailer actually making?",
  "Calculate invoice price from retail price and target margin",
  "What is my promo invoice after SOA?",
  "Convert tax-inclusive and tax-exclusive retail prices",
];

export default function QuickCalculatorsIndexPage() {
  return (
    <div className="page-stack">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Calculators", path: "/calculators" },
          { name: "Quick calculators", path: "/calculators/quick-calculators" },
        ])}
      />
      <Hero eyebrow="Calculators" title="Choose the commercial calculation you need.">
        <p>
          Fast retail selling price, target margin, invoice, SOA, support percentage and sales
          tax / VAT / IVA calculators for common account manager and KAM checks.
        </p>
      </Hero>

      <section className="shell section">
        <article className="card choice-panel">
          <p className="eyebrow">Choose what you want to calculate</p>
          <div className="choice-grid">
            {choices.map((choice) => {
              const calculator = quickCalculators.find((item) => item.choice === choice);

              return calculator ? (
                <Link key={choice} href={`/calculators/${calculator.slug}`}>
                  {choice}
                </Link>
              ) : null;
            })}
          </div>
        </article>
      </section>

      {quickCalculatorGroups.map((group) => {
        const groupCalculators = quickCalculators.filter((calculator) => calculator.group === group);

        return (
          <section className="shell section" key={group}>
            <SectionHeader eyebrow="Calculators" title={group}>
              <p>
                Open the calculator that matches the commercial question in
                front of you. Each page includes the calculator, formula and
                related checks.
              </p>
            </SectionHeader>
            <div className="grid">
              {groupCalculators.map((calculator) => (
                <article className="card tool-card" key={calculator.slug}>
                  <h3>{calculator.title}</h3>
                  <p>{calculator.description}</p>
                  <Link className="text-link" href={`/calculators/${calculator.slug}`}>
                    Open calculator
                  </Link>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
