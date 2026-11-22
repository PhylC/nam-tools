import { Hero } from "../components/Shell";
import { privateMetadata } from "../seo";
import { CustomDeckClient } from "./CustomDeckClient";

export const metadata = privateMetadata(
  "Build a custom deck",
  "Build a custom Account Planning Tools deck from a commercial brief and your choice of PowerPoint design.",
);

export default async function CustomDeckPage({
  searchParams,
}: {
  searchParams: Promise<{ deck?: string | string[]; template?: string | string[]; source?: string }>;
}) {
  const params = await searchParams;
  const deck = Array.isArray(params.deck) ? params.deck[0] : params.deck;
  const template = Array.isArray(params.template) ? params.template[0] : params.template;

  return (
    <div className="page-stack">
      <Hero title="Build a custom deck">
        <p>
          Turn your brief into an editable PowerPoint draft. Use the built-in design or upload your own template.
        </p>
      </Hero>
      <CustomDeckClient basedOnDeckId={deck ?? ""} selectedTemplate={template ?? ""} fromRoi={template === "promo-proposal" && params.source === "roi"} />
    </div>
  );
}
