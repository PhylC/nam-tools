import { ToolPage } from "../../components/Shell";
import { CommercialDealCalculator } from "../../components/ToolWidgets";
import { seoMetadata } from "../../seo";

export const metadata = seoMetadata({
  title: "Trade Spend Calculator",
  description: "Turn SOA, discounts, rebates, fixed funding and marketing support into a clearer total trade spend view.",
  path: "/tools/trade-spend-calculator",
});

export default function Page() {
  return (
    <ToolPage
      slug="trade-spend-calculator"
      intro="Use this to turn fixed funding, SOA or trade spend into a clearer view of total deal support."
      interpretation={<p>Use this to expose the full cost of the plan before it is hidden across discounts, rebates, fixed fees and media contributions. High spend should buy a clear customer commitment.</p>}
    >
      <CommercialDealCalculator defaultTab="spend" />
      <article className="card related-card calculator-guide-card">
        <h2>How to calculate trade spend on one deal</h2>
        <p>Suppose you sell 1,000 units at a standard invoice price of £5 excluding VAT, offer £0.30 support per unit and pay a £200 fixed fee.</p>
        <ol className="compact-list">
          <li><strong>Per-unit support.</strong> £0.30 × 1,000 = £300.</li>
          <li><strong>Total deal support.</strong> £300 of per-unit support plus the £200 fee comes to £500.</li>
          <li><strong>Share of sales before support.</strong> £500 ÷ £5,000 = 10% of invoice sales before the per-unit allowance.</li>
        </ol>
        <p>The calculator’s trade-spend view starts from the £4,700 promo invoice sales after SOA. With no other deductions, the additional £200 is 4.3% of those sales. The £300 allowance is already reflected in the lower invoice price.</p>
      </article>
    </ToolPage>
  );
}
