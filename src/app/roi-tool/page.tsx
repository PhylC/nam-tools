import type { Metadata } from "next";
import { Hero } from "../components/Shell";
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
