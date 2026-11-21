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

      <article className="card related-card calculator-guide-card">
        <h2>A completed customer review example</h2>
        <p><strong>Performance.</strong> In this fictional review, sales rose from £120,000 to £132,000 versus the previous quarter (up 10%), while gross margin fell from 28% to 25%. Gross profit fell from £33,600 to £33,000.</p>
        <p><strong>Decision for the buyer.</strong> Agree a two-store test of the promotion at a lower funding level. Review incremental sales and gross profit before agreeing a wider rollout.</p>
        <p><strong>Follow-up.</strong> The account manager sends the revised offer by Friday. The buyer confirms the two test stores by Tuesday. Finance checks gross profit after the four-week test.</p>
      </article>
    </ToolPage>
  );
}
