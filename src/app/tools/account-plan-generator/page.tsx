import type { Metadata } from "next";
import { ToolPage } from "../../components/Shell";
import { AccountPlanGenerator } from "../../components/ToolWidgets";

export const metadata: Metadata = {
  title: "Account Plan Generator",
  description: "Generate a practical account summary with opportunities, risks and 30/60/90 day actions.",
};

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
