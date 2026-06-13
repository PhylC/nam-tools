import type { Metadata } from "next";
import { Hero, ProductVisual } from "../components/Shell";
import { RoiToolProduct } from "./RoiToolClient";

export const metadata: Metadata = {
  title: "ROI Tool",
  description:
    "Use the ROI tool for quick promo checks, multi-SKU planning, scenario comparison and clearer commercial recommendations.",
};

export default function RoiToolPage() {
  return (
    <div className="page-stack">
      <Hero
        eyebrow="ROI Tool"
        title="ROI planner"
        visual={
          <ProductVisual
            aspectRatio="16 / 9"
            description="Promotion scenario planning and ROI comparison view."
            filename="/images/commercial-deal-calculator.svg"
            title="ROI planner workspace"
          />
        }
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
