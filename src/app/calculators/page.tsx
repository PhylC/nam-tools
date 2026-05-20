import type { Metadata } from "next";
import Link from "next/link";
import { Hero, PlaceholderImage, SectionHeader } from "../components/Shell";
import { quickCalculators } from "../data/quickCalculators";

export const metadata: Metadata = {
  title: "Free Commercial Calculators for NAMs",
  description:
    "Free promo ROI, retailer margin, SOA, invoice price, trade spend and commercial investment calculators for National Account Managers and account managers.",
};

export default function CalculatorsPage() {
  return (
    <div className="page-stack">
      <Hero
        eyebrow="Free calculators"
        title="Free commercial calculators for NAMs and account managers"
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
          <PlaceholderImage
            aspectRatio="16 / 9"
            description="Scenario comparison and calculator dashboard visual."
            filename="/images/commercial-deal-calculator.svg"
            title="Free calculator workspace"
          />
        }
      >
        <p>
          Quickly check promo ROI, retailer margin, SOA, trade spend, invoice
          price and commercial investment before you build the full customer
          plan. Calculators are free to use.
        </p>
      </Hero>

      <section className="shell section">
        <SectionHeader eyebrow="Main calculator" title="One calculator for the full ROI picture.">
          <p>
            Use one set of inputs to compare the supplier view, retailer/customer
            view, trade spend and investment ask.
          </p>
        </SectionHeader>
        <div className="grid">
          <article className="card tool-card">
            <span className="pill">Free</span>
            <h3>ROI Tool</h3>
            <p>
              Model one SKU or a full multi-line promotion, compare scenarios
              and export the numbers.
            </p>
            <Link className="text-link" href="/roi-tool">
              Open ROI tool
            </Link>
          </article>
          <article className="card tool-card">
            <span className="pill">Free</span>
            <h3>Calculators</h3>
            <p>
              A grouped index of fast SOA, retailer margin, invoice price, tax
              and markup calculators.
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
            Jump straight to high-intent calculators, each with its own formula
            notes and related checks.
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
            Calculator outputs are planning estimates. Validate all figures,
            assumptions, tax treatment and customer context before making
            commitments.
          </p>
        </article>
      </section>
    </div>
  );
}
