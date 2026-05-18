import type { Metadata } from "next";
import { ToolPage } from "../../components/Shell";
import { JbpBuilder } from "../../components/ToolWidgets";

export const metadata: Metadata = {
  title: "Joint Business Plan Builder",
  description: "Create a concise JBP outline with objective, initiative, investment ask and success measures.",
};

export default function Page() {
  return (
    <ToolPage
      slug="joint-business-plan-builder"
      intro="Draft the core shape of a joint business plan before turning it into a full customer-facing document."
      interpretation={<p>A credible JBP needs a shared commercial objective, a small number of growth pillars, practical activation plans and measures both sides can review honestly.</p>}
    >
      <JbpBuilder />
    </ToolPage>
  );
}
