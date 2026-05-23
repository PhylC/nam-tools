import type { Metadata } from "next";
import Link from "next/link";
import { Hero, PlaceholderImage, SectionHeader } from "../components/Shell";

export const metadata: Metadata = {
  title: "About Account Planning Tools",
  description:
    "Account Planning Tools helps account managers and commercial teams turn messy commercial thinking into clearer account plans, promo reviews and buyer meeting prep.",
};

export default function AboutPage() {
  return (
    <div className="page-stack">
      <Hero eyebrow="About" title="Built to make commercial planning less blank-page heavy.">
        <p>
          Account Planning Tools is a small, practical toolkit for people who need to turn
          messy commercial thinking into clearer plans, reviews and buyer
          conversations.
        </p>
      </Hero>
      <section className="shell visual-section">
        <PlaceholderImage
          aspectRatio="16 / 9"
          description="Commercial planning and account review workspace visual."
          filename="/images/about-commercial-planning-workspace.svg"
          title="Commercial planning workspace"
        />
      </section>
      <section className="shell section split-band">
        <article className="card">
          <SectionHeader title="Why it exists">
            <p>
              A lot of account management work starts with scattered notes,
              half-remembered formulas and a blank document. Account Planning Tools gives
              that work a starting structure so National Account Managers, Key
              Account Managers, Commercial Managers and Sales Directors can move
              faster.
            </p>
          </SectionHeader>
        </article>
        <article className="card">
          <SectionHeader title="What it is">
            <p>
              The site combines simple calculators with planning prompts for
              promotion reviews, trade spend, gross margin, investment asks,
              account plans, JBPs, buyer meetings and customer reviews.
            </p>
          </SectionHeader>
        </article>
      </section>
      <section className="shell section">
        <article className="card legal-copy">
          <h2>The standard</h2>
          <p>
            Account Planning Tools should feel useful quickly, but it should not pretend to
            replace commercial judgement. Outputs are estimates and first
            drafts. Users should validate all figures, assumptions and wording
            before using anything with customers, employers or retailers.
          </p>
          <Link className="button" href="/roi-tool">
            Start with ROI Tool
          </Link>
        </article>
      </section>
      <section className="shell section">
        <article className="card">
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
