import Link from "next/link";
import { JsonLd } from "../components/JsonLd";
import { Hero } from "../components/Shell";
import { breadcrumbJsonLd, seoMetadata } from "../seo";
import { PresentationTemplatesProduct } from "./PresentationTemplatesClient";

export const metadata = seoMetadata({
  title: "Presentation Templates for Account Planning",
  description:
    "Buyer-ready and internal presentation templates for turning account plans, promo proposals and customer reviews into clearer meeting outputs.",
  path: "/presentation-templates",
});

export default function PresentationTemplatesPage() {
  return (
    <div className="page-stack presentation-templates-page">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Presentation Templates", path: "/presentation-templates" },
          ]),
        ]}
      />
      <Hero
        eyebrow="Presentation workspace"
        title="Create and manage decks"
        actions={
          <>
            <Link className="button" href="/custom-deck">
              Create custom deck
            </Link>
            <Link className="button button-secondary" href="/workspace#decks">
              Open saved decks
            </Link>
          </>
        }
      >
        <p>
          Start a deck, choose the right presentation type, download a template,
          or reopen saved deck work from one place.
        </p>
      </Hero>
      <PresentationTemplatesProduct />
    </div>
  );
}
