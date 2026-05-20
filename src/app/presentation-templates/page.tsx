import type { Metadata } from "next";
import Image from "next/image";
import { Hero } from "../components/Shell";
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
      <section className="shell visual-section template-hero-previews" aria-label="Template previews">
        {[
          ["Joint Business Plan", "/templates/joint-business-plan/preview.svg"],
          ["Quarterly Business Review", "/templates/qbr-template/preview.svg"],
          ["Promotional Proposal", "/templates/promo-proposal/preview.svg"],
        ].map(([title, src]) => (
          <figure key={title}>
            <Image alt={`${title} preview`} height={270} src={src} width={480} />
            <figcaption>{title}</figcaption>
          </figure>
        ))}
      </section>
      <PresentationTemplatesProduct />
    </div>
  );
}
