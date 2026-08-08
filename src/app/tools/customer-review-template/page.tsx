import { ToolPage } from "../../components/Shell";
import { CustomerReviewTemplate } from "../../components/ToolWidgets";
import { seoMetadata } from "../../seo";

export const metadata = seoMetadata({
  title: "Customer Review Template",
  description: "Generate a customer review summary covering performance, wins, misses, commercial asks and next actions.",
  path: "/tools/customer-review-template",
});

export default function Page() {
  return (
    <ToolPage
      slug="customer-review-template"
      intro="Create a structured customer review that covers performance, wins, issues and proposed next actions."
      interpretation={<p>Use the generated review as a clear first draft. Add the actual scorecard, evidence and owners so the discussion moves from commentary to decisions.</p>}
    >
      <CustomerReviewTemplate />
    </ToolPage>
  );
}
