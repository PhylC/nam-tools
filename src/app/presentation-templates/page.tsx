import type { Metadata } from "next";
import { Hero, PlaceholderImage } from "../components/Shell";
import { PresentationTemplatesProduct } from "./PresentationTemplatesClient";

export const metadata: Metadata = {
  title: "Presentation Templates",
  description:
    "Free account planning presentation templates and Pro Preview guided deck builder for NAMs and commercial teams.",
};

export default function PresentationTemplatesPage() {
  return (
    <div className="page-stack">
      <Hero eyebrow="Presentation Templates" title="Free deck templates now. Pro deck builder preview when you need a stronger first draft.">
        <p>
          Download or copy practical customer deck structures for JBPs, QBRs,
          promo proposals, range reviews and launches. Pro Preview shows how
          future guided builders will turn your agenda, data and commercial ask
          into a first draft.
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
      <PresentationTemplatesProduct />
    </div>
  );
}
