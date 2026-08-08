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
    </ToolPage>
  );
}
