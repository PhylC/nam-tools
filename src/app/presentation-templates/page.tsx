import type { Metadata } from "next";
import Image from "next/image";
import { Hero } from "../components/Shell";
import { PresentationTemplatesProduct } from "./PresentationTemplatesClient";

export const metadata: Metadata = {
  title: "Presentations",
  description:
    "Buyer-ready and internal presentation templates with Pro guided deck builders for account managers and commercial teams.",
};

export default function PresentationTemplatesPage() {
  return (
    <div className="page-stack">
      <Hero eyebrow="Presentations" title="Buyer-ready presentations and planning templates">
        <p>
          Turn account plans, promo proposals and customer reviews into clear,
          structured outputs for buyer meetings and internal sign-off.
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
