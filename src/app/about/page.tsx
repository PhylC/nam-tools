import type { Metadata } from "next";
import Link from "next/link";
import { Hero, SectionHeader } from "../components/Shell";

export const metadata: Metadata = {
  title: "About Account Planning Tools | APT",
  description:
    "Learn why Account Planning Tools was built for account managers, sales leads and commercial teams who need clearer promo, margin and support calculations.",
};

export default function AboutPage() {
  return (
    <div className="page-stack">
      <Hero eyebrow="About" title="About Account Planning Tools">
        <p>
          Account Planning Tools exists because commercial planning is still too messy.
        </p>
      </Hero>
      <section className="shell section">
        <article className="legal-copy">
          <p>
            Most account managers, sales leads and commercial teams are not
            short of spreadsheets. They are short of time, clarity and clean
            outputs they can actually use in a retailer meeting.
          </p>
          <p>
            APT is being built to make the repeated parts of account planning
            easier: promo ROI, margin checks, support calculations, scenario
            comparisons and presentation-ready summaries.
          </p>
          <p>
            It is not trying to replace commercial judgement. It is there to
            help you get to the answer faster, spot the obvious watchouts and
            turn the numbers into something useful.
          </p>
        </article>
      </section>
      <section className="shell section split-band">
        <article className="legal-copy">
          <SectionHeader title="Why I built APT">
            <p>
              I have spent years in commercial sales roles where the same
              questions come up again and again: Will this promo actually pay
              back? What happens if the retailer asks for more support? What
              does this do to margin? Can we show this clearly in a deck? Why is
              this spreadsheet different to the one from last time?
            </p>
            <p>
              APT is my attempt to turn those repeated tasks into simple tools
              that are easier to use, easier to explain and easier to share.
            </p>
          </SectionHeader>
        </article>
        <article className="legal-copy">
          <SectionHeader title="What APT is — and is not">
            <p>
              APT is a practical planning tool for commercial teams. It can help
              structure the numbers, compare scenarios and create clearer
              outputs.
            </p>
            <p>
              It is not financial advice, it does not make pricing decisions for
              retailers, and it does not replace proper internal sign-off.
              Retail selling prices remain at the sole discretion of the
              retailer.
            </p>
          </SectionHeader>
        </article>
      </section>
      <section className="shell section">
        <article className="legal-copy">
          <h2>Who it is for</h2>
          <p>
            APT is built for national account managers, key account managers,
            sales leads, category teams and commercial teams who need to turn
            deal inputs into clearer commercial decisions.
          </p>
          <p>
            It is especially useful when you need a quick view of promo ROI,
            support levels, margin impact or a clean summary for a customer
            meeting.
          </p>
          <div className="cta-row">
            <Link className="button" href="/calculators">
              Try the free calculators
            </Link>
            <Link className="button button-secondary" href="/pricing">
              See APT Pro
            </Link>
          </div>
        </article>
      </section>
      <section className="shell section">
        <article className="legal-copy">
          <SectionHeader eyebrow="Product focus" title="What keeps improving.">
            <p>
              Account Planning Tools keeps improving around the practical jobs commercial
              teams repeat every week.
            </p>
          </SectionHeader>
          <ul className="checklist">
            <li>Cleaner calculators</li>
            <li>Sharper templates</li>
            <li>Better saved work</li>
            <li>Clearer exports</li>
            <li>Stronger deck briefs</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
