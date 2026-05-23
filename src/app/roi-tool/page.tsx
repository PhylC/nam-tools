import type { Metadata } from "next";
import { Hero, PlaceholderImage } from "../components/Shell";
import { RoiToolProduct } from "./RoiToolClient";

export const metadata: Metadata = {
  title: "ROI Tool",
  description:
    "Free single-line ROI calculator and Pro multi-SKU ROI planner for account managers and commercial teams.",
};

export default function RoiToolPage() {
  return (
    <div className="page-stack">
      <Hero
        eyebrow="ROI Tool"
        title="Practical account planning tools for account managers"
        visual={
          <PlaceholderImage
            aspectRatio="16 / 9"
            description="Promotion scenario planning and ROI comparison view."
            filename="/images/commercial-deal-calculator.svg"
            title="ROI planner workspace"
          />
        }
      >
        <p>
          Use the ROI tool for quick promo checks. Pro adds multi-SKU
          planning, scenarios and export-ready outputs.
        </p>
      </Hero>
      <RoiToolProduct />
    </div>
  );
}
