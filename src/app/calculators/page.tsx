import type { Metadata } from "next";
import Link from "next/link";
import { Hero, SectionHeader } from "../components/Shell";
import { quickCalculators } from "../data/quickCalculators";

function iconForCalculator(group: string) {
  if (group === "SOA and supplier support") return "/images/apt/apt-icon-support.svg";
  return "/images/apt/apt-icon-margin.svg";
}

export const metadata: Metadata = {
  title: "Free Commercial Calculators for Account Managers",
  description:
    "Free promo ROI, margin, SOA, invoice price and support calculators for account managers who need quick commercial checks.",
};

export default function CalculatorsPage() {
  return (
    <div className="page-stack">
      <Hero
        title="Free commercial calculators for account managers"
        actions={
          <>
            <Link className="button" href="/roi-tool">
              Open ROI tool
            </Link>
            <Link className="hero-text-link" href="#quick-calculators">
              See quick calculators
            </Link>
          </>
        }
      >
        <p>
          Choose the full ROI planner when you need a deal view, or use quick
          calculators when you only need one answer on margin, SOA, retail price
          or tax. Calculators are free to use.
        </p>
      </Hero>

      <section className="shell section">
        <SectionHeader title="Start with the full ROI planner">
          <p>
            Use this when you need a fuller view of a promotion or deal:
            product lines, support, revenue, profit and scenario summary.
          </p>
        </SectionHeader>
        <div className="grid grid-featured-single">
          <article className="card tool-card">
            <img alt="" aria-hidden="true" className="tool-card-icon" loading="lazy" src="/images/apt/apt-icon-promo-roi.svg" />
            <h3>ROI Tool</h3>
            <p>
              Model one SKU for free, or use APT Pro for multi-line promotions,
              saved scenarios and exports.
            </p>
            <Link className="text-link" href="/roi-tool">
              Open ROI tool
            </Link>
          </article>
        </div>
      </section>

      <section className="shell section" id="quick-calculators">
        <SectionHeader title="Quick calculators">
          <p>
            Use these when you need a fast answer from a few numbers.
          </p>
        </SectionHeader>
        <div className="grid">
          {quickCalculators.map((calculator) => (
            <article className="card tool-card" key={calculator.slug}>
              <img alt="" aria-hidden="true" className="tool-card-icon" loading="lazy" src={iconForCalculator(calculator.group)} />
              <h3>{calculator.title}</h3>
              <p>{calculator.description}</p>
              <Link className="text-link" href={`/calculators/${calculator.slug}`}>
                Open calculator
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="shell section">
        <article className="card judgement-card">
          <h2>Free to use.</h2>
          <p>
            Retail selling prices are at the sole discretion of the retailer.
            Calculations are estimates based on the inputs provided and should
            be checked against your own internal process.
          </p>
        </article>
      </section>
    </div>
  );
}
