import type { Metadata } from "next";
import { Hero } from "../components/Shell";
import { RoiToolProduct } from "./RoiToolClient";

export const metadata: Metadata = {
  title: "ROI Tool",
  description:
    "Free single-line ROI calculator and Pro multi-SKU ROI planner for NAMs and account managers.",
};

export default function RoiToolPage() {
  return (
    <div className="page-stack">
      <Hero eyebrow="ROI Tool" title="Practical account planning tools for NAMs, sales teams and commercial leaders.">
        <p>
          Use the free ROI tool for fast single-line promotion checks. Pro
          helps you plan multi-SKU promotions, compare scenarios and
          export the numbers for internal sign-off.
        </p>
      </Hero>
      <RoiToolProduct />
    </div>
  );
}
