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
        title="Promo ROI checks without rebuilding the spreadsheet"
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
          Use this when a retailer asks for support, a lower promo price or more
          funding and you need to quickly understand whether the deal still
          makes sense. Pro adds multi-SKU planning, scenarios and export-ready
          outputs.
        </p>
      </Hero>
      <RoiToolProduct />
    </div>
  );
}
