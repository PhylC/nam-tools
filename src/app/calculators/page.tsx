import type { Metadata } from "next";
import Link from "next/link";
import { Hero, ProductVisual, SectionHeader } from "../components/Shell";
import { quickCalculators } from "../data/quickCalculators";

export const metadata: Metadata = {
  title: "Free Commercial Calculators for Account Managers",
  description:
    "Free promo ROI, margin, SOA, invoice price and support calculators for account managers who need quick commercial checks.",
};

export default function CalculatorsPage() {
  return (
    <div className="page-stack">
      <Hero
        eyebrow="Free calculators"
        title="Free commercial calculators for account managers"
        actions={
          <>
            <Link className="button" href="/roi-tool">
              Open ROI tool
            </Link>
            <Link className="button button-secondary" href="/calculators/quick-calculators">
              Browse calculators
            </Link>
          </>
        }
        visual={
          <ProductVisual
            aspectRatio="16 / 9"
            description="Calculator workspace showing ROI inputs and summary outputs."
            filename="/images/commercial-deal-calculator.svg"
            title="Free calculator workspace"
          />
        }
      >
        <p>
          Use these when a retailer asks for support, a lower promo price or a
          quick margin read and you need to understand whether the numbers still
          make sense. Calculators are free to use.
        </p>
      </Hero>

      <section className="shell section">
        <SectionHeader eyebrow="Main calculator" title="One calculator for the full ROI picture.">
          <p>
            Use the ROI tool when a buyer asks for more funding, a lower promo
            price or a different mechanic and you need a quick read before the
            conversation moves on.
          </p>
        </SectionHeader>
        <div className="grid">
          <article className="card tool-card">
            <span className="pill">Free</span>
            <h3>ROI Tool</h3>
            <p>
              Model one SKU in Free, or use APT Pro for multi-line promotions,
              scenario comparison and export-ready summaries.
            </p>
            <Link className="text-link" href="/roi-tool">
              Open ROI tool
            </Link>
          </article>
          <article className="card tool-card">
            <span className="pill">Free</span>
            <h3>Calculators</h3>
            <p>
              Quick checks for SOA, retailer margin, invoice price, tax and
              markup when you only have a few numbers.
            </p>
            <Link className="text-link" href="/calculators/quick-calculators">
              Browse calculators
            </Link>
          </article>
        </div>
      </section>

      <section className="shell section">
        <SectionHeader eyebrow="Popular calculators" title="Fast answers from two to four numbers.">
          <p>
            Jump straight to the calculation you need, with short formula notes
            and related checks nearby.
          </p>
        </SectionHeader>
        <div className="grid">
          {quickCalculators.map((calculator) => (
            <article className="card tool-card" key={calculator.slug}>
              <span className="pill">Free</span>
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
