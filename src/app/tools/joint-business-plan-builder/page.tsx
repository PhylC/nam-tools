import { ToolPage } from "../../components/Shell";
import { JbpBuilder } from "../../components/ToolWidgets";
import { seoMetadata } from "../../seo";

export const metadata = seoMetadata({
  title: "Joint Business Plan Builder",
  description: "Create a concise joint business plan outline with objectives, growth initiatives, investment asks and success measures.",
  path: "/tools/joint-business-plan-builder",
});

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
