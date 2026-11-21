import { ToolPage } from "../../components/Shell";
import { JbpBuilder } from "../../components/ToolWidgets";
import { seoMetadata } from "../../seo";

export const metadata = seoMetadata({
  title: "Joint Business Plan Builder",
  description: "Create a joint business plan workflow with objectives, growth initiatives, investment asks, success measures, deck output and a tracker.",
  path: "/tools/joint-business-plan-builder",
});

export default function Page() {
  return (
    <ToolPage
      slug="joint-business-plan-builder"
      intro="Build the core JBP story, then turn it into a deck and spreadsheet-style tracker for customer planning."
      interpretation={<p>A credible JBP usually needs both a presentation and a working tracker: shared objectives, growth pillars, investment, owners, milestones and measures both sides can review honestly.</p>}
    >
      <JbpBuilder />
      <article className="card related-card calculator-guide-card">
        <h2>Worked joint business plan example</h2>
        <p><strong>Shared objective.</strong> Grow sales of one range by 10% against the prior 12-month baseline while maintaining the agreed retailer margin.</p>
        <ul className="compact-list">
          <li><strong>Q1.</strong> Supplier account manager and retailer category buyer agree the baseline, margin target and pilot stores.</li>
          <li><strong>Q2.</strong> The retailer merchandising lead agrees shelf placement. The supplier demand planner checks supply for the pilot.</li>
          <li><strong>Q3.</strong> Both leads review sales per store per week, availability and margin before deciding whether to extend the pilot.</li>
          <li><strong>Q4.</strong> The buyer and account manager compare full-year sales and margin with the agreed baseline and record the next action.</li>
        </ul>
      </article>
    </ToolPage>
  );
}
