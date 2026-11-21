import Link from "next/link";
import { ToolPage } from "../../components/Shell";
import { BuyerMeetingPrepTool } from "../../components/ToolWidgets";
import { seoMetadata } from "../../seo";

export const metadata = seoMetadata({
  title: "Buyer Meeting Planner",
  description: "Create a structured buyer meeting plan with the commercial ask, talking points, likely objections and follow-up actions.",
  path: "/tools/buyer-meeting-prep",
});

export default function Page() {
  return (
    <ToolPage
      slug="buyer-meeting-prep"
      intro="Use this when you know the ask, the risk and the customer context, but need a clearer plan for the buyer conversation."
      interpretation={<p>Use the copy-ready output as a meeting plan, not a script. The strongest buyer conversations connect the customer challenge, a specific ask, supporting numbers and a clear next decision.</p>}
    >
      <BuyerMeetingPrepTool />
      <article className="card related-card calculator-guide-card">
        <h2>Worked retailer buyer meeting brief</h2>
        <dl>
          <dt><strong>Objective</strong></dt>
          <dd>Agree a two-week pilot for one SKU before committing to a wider rollout.</dd>
          <dt><strong>Ask</strong></dt>
          <dd>Review a forecast of 1,400 units against the 1,000-unit baseline and agree how the pilot will be measured.</dd>
          <dt><strong>Commercial rationale</strong></dt>
          <dd>The forecast shows a £900 revenue uplift and a £100 profit shortfall at the proposed fee. The pilot breaks even against baseline profit if the fixed fee falls by £100, with the same volume forecast.</dd>
          <dt><strong>Follow-up</strong></dt>
          <dd>Ask the buyer to confirm the fee and merchandising plan. Agree a post-promotion review of sales, profit and stock availability.</dd>
        </dl>
        <p><Link href="/roi-tool#trade-promotion-example">See the promotion numbers behind this example</Link>.</p>
      </article>
    </ToolPage>
  );
}
