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
            <Link className="button" href="/tools/commercial-deal-calculator">
              Open deal calculator
            </Link>
            <Link className="button button-secondary" href="/calculators/quick-calculators">
              Open quick calculators
            </Link>
          </>
        }
      >
        <p>
          Quickly check promo ROI, retailer margin, SOA, trade spend, invoice
          price and commercial investment before you build the full customer
          plan.
        </p>
      </Hero>

      <section className="shell visual-section">
        <PlaceholderImage
          aspectRatio="16 / 9"
          description="Future Excel-style scenario comparison and calculator dashboard visual."
          filename="/images/commercial-deal-calculator-placeholder.svg"
          title="Free calculator workspace"
        />
      </section>

      <section className="shell section">
        <SectionHeader eyebrow="Main calculator" title="One calculator for the full deal shape.">
          <p>
            Use one set of inputs to compare the supplier view, retailer/customer
            view, trade spend and investment ask.
          </p>
        </SectionHeader>
        <div className="grid">
          <article className="card tool-card">
            <span className="pill">Free</span>
            <h3>Commercial Deal Calculator</h3>
            <p>
              One set of inputs, supplier view, retailer view, trade spend and
              investment ask.
            </p>
            <Link className="text-link" href="/tools/commercial-deal-calculator">
              Open main calculator
            </Link>
          </article>
          <article className="card tool-card">
            <span className="pill">Free</span>
            <h3>Quick Commercial Calculators</h3>
            <p>
              A grouped index of fast SOA, retailer margin, invoice price, tax
              and markup calculators.
            </p>
            <Link className="text-link" href="/calculators/quick-calculators">
              Choose a quick calculator
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
          <h2>Free to use, no login required.</h2>
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
