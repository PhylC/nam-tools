import type { Metadata } from "next";
import { ToolPage } from "../../components/Shell";
import { CommercialDealCalculator } from "../../components/ToolWidgets";

export const metadata: Metadata = {
  title: "Trade Spend Calculator",
  description: "Turn fixed funding, SOA and trade spend into a clearer view of total deal support.",
};

export default function Page() {
  return (
    <ToolPage
      slug="trade-spend-calculator"
      intro="Use this to turn fixed funding, SOA or trade spend into a clearer view of total deal support."
      interpretation={<p>Use this to expose the full cost of the plan before it is hidden across discounts, rebates, fixed fees and media contributions. High spend should buy a clear customer commitment.</p>}
    >
      <CommercialDealCalculator defaultTab="spend" />
    </ToolPage>
  );
}
