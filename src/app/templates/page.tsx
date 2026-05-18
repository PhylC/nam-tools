import type { Metadata } from "next";
import Link from "next/link";
import { Hero, PlaceholderImage } from "../components/Shell";
import { TemplateLibrary } from "./TemplateLibrary";

export const metadata: Metadata = {
  title: "Free PowerPoint and Spreadsheet Templates",
  description:
    "Copy free static PowerPoint-style and Google Sheets-style NAM templates. Guided Pro deck builders with linked calculations are coming soon.",
};

export default function TemplatesPage() {
  return (
    <div className="page-stack">
      <Hero eyebrow="Templates" title="Free PowerPoint and spreadsheet templates now. Guided builders later.">
        <p>
          Copy blank PowerPoint-style deck outlines and Google Sheets-style
          planning structures today. Pro will later ask smart commercial
          questions and generate first-draft decks with linked calculation
          support.
        </p>
      </Hero>

      <section className="shell visual-section">
        <PlaceholderImage
          aspectRatio="16 / 9"
          description="Future PowerPoint and Google Sheets-style guided template workflow visual."
          filename="/images/templates-deck-builder-placeholder.svg"
          title="Deck builder preview"
        />
      </section>

      <TemplateLibrary />

      <section className="shell section">
        <article className="card split-band">
          <div>
            <p className="eyebrow">Early access</p>
            <h2>Template feedback and Pro builder requests.</h2>
            <p>
              This form is visual only for now. No details are submitted yet,
              but it shows where early access capture will sit when backend
              handling is added.
            </p>
          </div>
          <div className="copy-stack">
            <label className="field">
              <span>Name</span>
              <input placeholder="Your name" />
            </label>
            <label className="field">
              <span>Email</span>
              <input placeholder="you@company.co.uk" type="email" />
            </label>
            <Link className="button" href="/tools">
              Use the live tools now
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
