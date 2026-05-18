import type { Metadata } from "next";
import { ToolPage } from "../../components/Shell";
import { CommercialDealCalculator } from "../../components/ToolWidgets";

export const metadata: Metadata = {
  title: "Gross Margin Calculator",
  description: "Calculate gross margin per unit, margin percentage and total gross profit.",
};

export default function Page() {
  return (
    <ToolPage
      slug="gross-margin-calculator"
      intro="Compare base margin, promo margin after SOA and the indicative retailer/customer margin view from shared deal assumptions."
      interpretation={<p>Use this to compare regular and promotional margin before agreeing support. If promo profit per unit falls sharply, the plan needs enough incremental volume or strategic value to justify the dilution.</p>}
    >
      <CommercialDealCalculator defaultTab="margin" />
    </ToolPage>
  );
}
