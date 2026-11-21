import { ToolPage } from "../../components/Shell";
import { AccountPlanGenerator } from "../../components/ToolWidgets";
import { seoMetadata } from "../../seo";

export const metadata = seoMetadata({
  title: "Account Plan Generator",
  description: "Turn account notes into a practical plan with priorities, opportunities, risks and 30/60/90 day actions.",
  path: "/tools/account-plan-generator",
});

export default function Page() {
  return (
    <ToolPage
      slug="account-plan-generator"
      intro="Convert performance notes, growth opportunities and risks into a concise account plan outline."
      interpretation={<p>Use the output to align internal teams around the account narrative, the real opportunity, the biggest risk and the actions that need ownership in the next 90 days.</p>}
    >
      <AccountPlanGenerator />
      <article className="card related-card calculator-guide-card">
        <h2>From account notes to a 90-day plan</h2>
        <p><strong>Starting notes.</strong> Sales are below plan. Eight priority stores still lack the agreed range, and the next buyer review is in six weeks.</p>
        <ol className="compact-list">
          <li><strong>By day 30.</strong> Account manager confirms which stores are missing the range and takes a priority list to the buyer review.</li>
          <li><strong>By day 60.</strong> Field sales lead verifies listings and availability in the agreed stores.</li>
          <li><strong>By day 90.</strong> Commercial analyst compares sales per store per week and availability with the pre-rollout baseline. The account manager agrees the next decision with the buyer.</li>
        </ol>
      </article>
    </ToolPage>
  );
}
