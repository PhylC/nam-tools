import { Hero } from "../components/Shell";
import { privateMetadata } from "../seo";
import { CustomDeckClient } from "./CustomDeckClient";

export const metadata = privateMetadata(
  "Build a custom deck",
  "Build a custom Account Planning Tools deck from a selected PowerPoint template, supporting data and commercial brief.",
);

export default async function CustomDeckPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string | string[] }>;
}) {
  const params = await searchParams;
  const template = Array.isArray(params.template) ? params.template[0] : params.template;

  return (
    <div className="page-stack">
      <Hero title="Build a custom deck">
        <p>
          Upload your template, add supporting data and give APT the context it
          needs to create a stronger first draft.
        </p>
      </Hero>
      <CustomDeckClient selectedTemplate={template ?? ""} />
    </div>
  );
}
