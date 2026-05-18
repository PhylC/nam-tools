import type { Metadata } from "next";
import { ToolPage } from "../../components/Shell";
import { CustomerReviewTemplate } from "../../components/ToolWidgets";

export const metadata: Metadata = {
  title: "Customer Review Template",
  description: "Generate a customer review summary covering performance, wins, misses and next actions.",
};

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
