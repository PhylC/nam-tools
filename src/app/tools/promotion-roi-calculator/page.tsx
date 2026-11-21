import Link from "next/link";
import { ToolPage } from "../../components/Shell";
import { CommercialDealCalculator } from "../../components/ToolWidgets";
import { seoMetadata } from "../../seo";

export const metadata = seoMetadata({
  title: "Promotion ROI Calculator",
  description: "Check whether extra promotion volume offsets supplier support, reduced invoice price and fixed investment.",
  path: "/tools/promotion-roi-calculator",
});

export default function Page() {
  return (
    <ToolPage
      slug="promotion-roi-calculator"
      intro="Check the impact of one promotional deal. Enter the normal and promotional invoice prices, volume and any supplier support to see what changes for the supplier and retailer."
      interpretation={<>
        <p>Start with the quick invoice view if you only have prices and volumes. Add your cost of goods and fixed fees to check incremental profit. Add the shelf price and VAT basis when you also need to check retailer margin.</p>
        <p>For several SKUs or side-by-side scenarios, use the <Link href="/roi-tool">Promotion ROI Planner</Link>.</p>
      </>}
    >
      <CommercialDealCalculator defaultTab="promo" />
    </ToolPage>
  );
}
