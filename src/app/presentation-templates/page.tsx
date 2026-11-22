import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "../components/JsonLd";
import { Hero } from "../components/Shell";
import { featuredTemplates, getTemplateGuide } from "../data/presentationTemplates";
import { breadcrumbJsonLd, seoMetadata } from "../seo";
import { PresentationTemplatesProduct } from "./PresentationTemplatesClient";

export const metadata = seoMetadata({
  title: "Free PowerPoint Templates for Account Planning",
  description: "Download nine free, editable PowerPoint templates for joint business plans, quarterly business reviews, promotional proposals and other commercial meetings.",
  path: "/presentation-templates",
});

export default function PresentationTemplatesPage() {
  const featured = featuredTemplates.flatMap(({ slug }) => {
    const guide = getTemplateGuide(slug);
    return guide ? [guide] : [];
  });

  return (
    <div className="page-stack presentation-templates-page">
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Presentation Templates", path: "/presentation-templates" },
      ])} />
      <Hero
        title="Free PowerPoint templates for account planning"
        actions={<a className="button" href="#free-templates">Browse all 9 downloads</a>}
      >
        <p>Download editable decks for business reviews, buyer meetings and commercial plans. No account required.</p>
      </Hero>
      <section aria-label="Featured PowerPoint templates" className="shell deck-featured">
        {featured.map((guide) => (
          <article className="card deck-featured-card" key={guide.slug}>
            <div>
              <h2>{guide.label}</h2>
              <a className="button button-small" download href={`/templates/${guide.template.pptx}`} aria-label={`Download the ${guide.label} starter`}>
                Download starter
              </a>
              <Link className="deck-example-link" href={`/presentation-templates/${guide.slug}`}>Preview and worked example</Link>
            </div>
            <Image alt={guide.previewAlt} width={960} height={540} sizes="(max-width: 720px) 94vw, 360px" src={guide.preview} />
          </article>
        ))}
      </section>
      <PresentationTemplatesProduct />
    </div>
  );
}
