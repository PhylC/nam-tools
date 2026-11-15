"use client";

import Link from "next/link";
import { trackEvent } from "../../../lib/analytics";

const nextSteps = [
  {
    href: "/calculators/required-soa-calculator",
    label: "Test a lower shelf price",
    copy: "Calculate the supplier support needed to protect the retailer margin.",
    destination: "required-soa-calculator",
  },
  {
    href: "/roi-tool",
    label: "Build the full promotion case",
    copy: "Add volume, funding and profit assumptions in the Promotion ROI Planner.",
    destination: "roi-tool",
  },
];

export function CalculatorNextSteps() {
  return (
    <section className="card calculator-next-steps" aria-labelledby="calculator-next-steps-title">
      <div>
        <p className="eyebrow">Use the result</p>
        <h2 id="calculator-next-steps-title">What do you want to test next?</h2>
        <p>Take the calculated selling price into the next commercial decision without re-entering the same question.</p>
      </div>
      <div className="calculator-next-step-grid">
        {nextSteps.map((step, index) => (
          <Link
            className={index === 0 ? "button" : "button button-secondary"}
            href={step.href}
            key={step.href}
            onClick={() =>
              trackEvent("calculator_next_step_clicked", {
                source_calculator: "retail-selling-price-calculator",
                destination: step.destination,
              })
            }
          >
            <span>
              <strong>{step.label}</strong>
              <small>{step.copy}</small>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
