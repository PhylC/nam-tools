import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "../../components/JsonLd";
import { Hero } from "../../components/Shell";
import { featuredTemplates, getTemplateGuide } from "../../data/presentationTemplates";
import { breadcrumbJsonLd, seoMetadata } from "../../seo";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return featuredTemplates.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const guide = getTemplateGuide((await params).slug);
  if (!guide) notFound();
  return seoMetadata({
    title: `Free ${guide.label} PowerPoint Template`,
    description: guide.purpose,
    path: `/presentation-templates/${guide.slug}`,
  });
}

export default async function TemplateGuide({ params }: Props) {
  const guide = getTemplateGuide((await params).slug);
  if (!guide) notFound();
  const path = `/presentation-templates/${guide.slug}`;

  return (
    <div className="page-stack presentation-templates-page">
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Presentation Templates", path: "/presentation-templates" },
        { name: guide.label, path },
      ])} />
      <Hero
        title={`${guide.label} PowerPoint template`}
        actions={(
          <>
            <a className="button" download href={`/templates/${guide.template.pptx}`}>Download starter</a>
            <a className="button button-secondary" download href={`/templates/${guide.example}`}>Download worked example</a>
          </>
        )}
      >
        <p>{guide.purpose} Both files contain {guide.template.slides} editable slides and are free to download.</p>
      </Hero>
      <section className="shell section deck-template-guide">
        <figure>
          <Image alt={guide.previewAlt} height={540} sizes="(max-width: 720px) 94vw, 620px" src={guide.preview} width={960} />
          <figcaption>Slide from the worked example. Names and commercial figures are fictional.</figcaption>
        </figure>
        <div>
          <h2>How to use this template</h2>
          <ol>
            {guide.sections.map(([title, detail]) => (
              <li key={title}><strong>{title}</strong><p>{detail}</p></li>
            ))}
          </ol>
          <p>Adapt the templates for your own internal planning or customer presentations. <Link href="/terms">Template usage terms</Link></p>
          <Link href="/presentation-templates">Browse all PowerPoint templates</Link>
        </div>
      </section>
    </div>
  );
}
