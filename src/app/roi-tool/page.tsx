import { Hero } from "../components/Shell";
import { seoMetadata } from "../seo";
import { RoiToolProduct } from "./RoiToolClient";

export const metadata = seoMetadata({
  title: "Promotion ROI Planner",
  description:
    "Model promotion ROI, support investment, incremental revenue and profit for one SKU or a multi-line retail scenario.",
  path: "/roi-tool",
});

export default function RoiToolPage() {
  return (
    <div className="page-stack roi-tool-page">
      <Hero
        eyebrow="ROI Tool"
        title="ROI planner"
      >
        <p>
          Model one SKU or a full multi-line promotion, compare scenarios and
          export the numbers.
        </p>
      </Hero>
      <RoiToolProduct />
    </div>
  );
}
