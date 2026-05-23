import type { Metadata } from "next";
import Link from "next/link";
import { Hero, PlaceholderImage, SectionHeader, ToolCard } from "../components/Shell";
import { getTool, tools } from "../data/tools";

export const metadata: Metadata = {
  title: "Commercial Planning Resources for Account Managers and KAMs",
  description:
    "A resource hub for promo ROI planning, quick calculators and presentation outputs for retail supplier teams.",
};

const groups = [
  {
    title: "Planning tools",
    intro:
      "Turn account knowledge into structured plans for customers, internal reviews and joint growth conversations.",
    slugs: ["account-plan-generator", "joint-business-plan-builder"],
  },
  {
    title: "Meeting/review tools",
    intro:
      "Prepare buyer conversations and customer reviews with clearer sections, sharper asks and copy-ready outputs.",
    slugs: ["buyer-meeting-prep", "customer-review-template"],
  },
];

export default function ToolsPage() {
  return (
    <div className="page-stack">
      <Hero eyebrow="All resources" title="Commercial planning tools for retail supplier teams">
        <p>
          Choose the right tool for the job: build a promo ROI plan, run a quick
          commercial calculation, or create a buyer-ready presentation.
        </p>
      </Hero>
      <section className="shell visual-section">
        <PlaceholderImage
          aspectRatio="16 / 9"
          description="Commercial planning resources and workflow cards overview."
          filename="/images/tools-grid.svg"
          title="Resources overview"
        />
      </section>
      <section className="shell section">
        <article className="card split-band">
          <div>
            <p className="eyebrow">Product areas</p>
            <h2>Need a number, ROI plan or customer deck?</h2>
          </div>
          <div className="copy-stack">
            <p>
              Use Calculators for fast maths, the ROI Tool for promotion return
              planning, and Presentations for buyer-ready and internal sign-off
              outputs.
            </p>
            <div className="cta-row">
              <Link className="button" href="/calculators">
                View free calculators
              </Link>
              <Link className="button button-secondary" href="/roi-tool">
                Open ROI Tool
              </Link>
              <Link className="button button-secondary" href="/presentation-templates">
                Open presentations
              </Link>
            </div>
          </div>
        </article>
      </section>
      {groups.map((group) => {
        const groupTools = group.slugs
          .map((slug) => getTool(slug))
          .filter((tool): tool is (typeof tools)[number] => Boolean(tool));

        return (
          <section className="shell section" key={group.title}>
            <SectionHeader eyebrow="Resources" title={group.title}>
              <p>{group.intro}</p>
            </SectionHeader>
            <div className="grid">
              {groupTools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        );
      })}
      <section className="shell section">
        <article className="card judgement-card">
          <h2>Commercial judgement matters</h2>
          <p>
            These tools are planning aids for commercial teams. Use them to
            structure the conversation, then validate the numbers, assumptions,
            customer context and approval rules before making commitments.
          </p>
        </article>
      </section>
      <section className="shell section">
        <article className="card split-band">
          <div>
            <p className="eyebrow">Pro</p>
            <h2>Saved scenarios and deck-ready outputs for deeper work.</h2>
          </div>
          <div className="copy-stack">
            <p>
              The free tools give quick answers. Pro supports repeatable work:
              import or paste Excel data, compare scenarios, save plans, use
              guided deck builders, export Excel summaries and create fuller
              customer-ready write-ups.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
