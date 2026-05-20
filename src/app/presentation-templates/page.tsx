import type { Metadata } from "next";
import Image from "next/image";
import { Hero } from "../components/Shell";
import { PresentationTemplatesProduct } from "./PresentationTemplatesClient";

export const metadata: Metadata = {
  title: "Presentation Templates",
  description:
    "Free account planning presentation templates and Pro guided deck builder for NAMs and commercial teams.",
};

export default function PresentationTemplatesPage() {
  return (
    <div className="page-stack">
      <Hero eyebrow="Presentation Templates" title="Free deck templates and Pro custom deck building.">
        <p>
          Download or copy practical customer deck structures for JBPs, QBRs,
          promo proposals, range reviews and launches. Pro helps you build
          custom customer decks from your agenda, data and commercial story.
        </p>
      </Hero>
      <section className="shell visual-section template-hero-previews" aria-label="Template thumbnails">
        {[
          ["Joint Business Plan", "/templates/joint-business-plan/preview.svg"],
          ["Quarterly Business Review", "/templates/qbr-template/preview.svg"],
          ["Promotional Proposal", "/templates/promo-proposal/preview.svg"],
        ].map(([title, src]) => (
          <figure key={title}>
            <Image alt={`${title} thumbnail`} height={270} src={src} width={480} />
            <figcaption>{title}</figcaption>
          </figure>
        ))}
      </section>
      <PresentationTemplatesProduct />
    </div>
  );
}
