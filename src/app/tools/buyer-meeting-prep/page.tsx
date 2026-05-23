import type { Metadata } from "next";
import { ToolPage } from "../../components/Shell";
import { BuyerMeetingPrepTool } from "../../components/ToolWidgets";

export const metadata: Metadata = {
  title: "Buyer Meeting Prep Tool",
  description: "Generate a structured buyer meeting plan with talking points, objections and responses.",
};

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
