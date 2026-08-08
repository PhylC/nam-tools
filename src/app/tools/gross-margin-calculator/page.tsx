import { ToolPage } from "../../components/Shell";
import { CommercialDealCalculator } from "../../components/ToolWidgets";
import { seoMetadata } from "../../seo";

export const metadata = seoMetadata({
  title: "Gross Margin Calculator",
  description: "Check supplier gross margin, retailer margin and promo price impact before agreeing support or funding.",
  path: "/tools/gross-margin-calculator",
});

export default function Page() {
  return (
    <ToolPage
      slug="gross-margin-calculator"
      intro="Use this to check how invoice price, retail price, VAT/tax and COGS affect margin before you commit to a deal."
      interpretation={<p>Use this to compare regular and promotional margin before agreeing support. If promo profit per unit falls sharply, the plan needs enough incremental volume or strategic value to justify the dilution.</p>}
    >
      <CommercialDealCalculator defaultTab="margin" />
    </ToolPage>
  );
}
