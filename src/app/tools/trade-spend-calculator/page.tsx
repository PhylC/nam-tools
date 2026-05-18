import type { Metadata } from "next";
import { ToolPage } from "../../components/Shell";
import { CommercialDealCalculator } from "../../components/ToolWidgets";

export const metadata: Metadata = {
  title: "Trade Spend Calculator",
  description: "Calculate variable discount, fixed funding and total trade spend as a percentage of gross sales.",
};

export default function Page() {
  return (
    <ToolPage
      slug="trade-spend-calculator"
      intro="Estimate the full trade spend attached to a plan, including percentage discounts and fixed funding."
      interpretation={<p>Use this to expose the full cost of the plan before it is hidden across discounts, rebates, fixed fees and media contributions. High spend should buy a clear customer commitment.</p>}
    >
      <CommercialDealCalculator defaultTab="spend" />
    </ToolPage>
  );
}
