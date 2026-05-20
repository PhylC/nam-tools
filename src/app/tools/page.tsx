import type { Metadata } from "next";
import Link from "next/link";
import { Hero, PlaceholderImage, SectionHeader, ToolCard } from "../components/Shell";
import { getTool, tools } from "../data/tools";

export const metadata: Metadata = {
  title: "Commercial Tools for NAMs and KAMs",
  description:
    "No-login planning tools and generators for account plans, JBPs, buyer meetings and customer reviews, with free calculators available separately.",
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
      <Hero eyebrow="Tools" title="Planning tools and generators for retail supplier teams.">
        <p>
          NAM Tools gives National Account Managers, Key Account Managers,
          Commercial Managers and Sales Directors a faster way to structure
          account plans, buyer meetings, JBPs and customer reviews. Calculators,
          ROI planning and presentation templates now have dedicated product
          areas so each workflow stays focused.
        </p>
      </Hero>
      <section className="shell visual-section">
        <PlaceholderImage
          aspectRatio="16 / 9"
          description="Future commercial tools and cards overview visual."
          filename="/images/tools-grid-placeholder.svg"
          title="Tools overview"
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
              Use free calculators for fast maths, the ROI Tool for promotion
              return planning, and Presentation Templates for customer-ready
              deck structures and Pro deck builder previews.
            </p>
            <div className="cta-row">
              <Link className="button" href="/calculators">
                View free calculators
              </Link>
              <Link className="button button-secondary" href="/roi-tool">
                Open ROI Tool
              </Link>
              <Link className="button button-secondary" href="/presentation-templates">
                Open templates
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
            <SectionHeader eyebrow="Toolkit" title={group.title}>
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
            <p className="eyebrow">Pro preview</p>
            <h2>Saved scenarios and deck-ready outputs are planned, not live.</h2>
          </div>
          <div className="copy-stack">
            <p>
              The free tools give quick answers today. Future Pro features are
              intended for repeatable work: import or paste Excel data,
              compare scenarios, save plans, use guided deck builders, export
              Excel summaries and create fuller customer-ready write-ups.
            </p>
            <p>
              There is no login, database, Stripe integration or real file
              upload processing in this MVP.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
