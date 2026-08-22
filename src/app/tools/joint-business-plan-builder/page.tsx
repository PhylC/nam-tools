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
    </ToolPage>
  );
}
