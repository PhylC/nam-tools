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
    </ToolPage>
  );
}
