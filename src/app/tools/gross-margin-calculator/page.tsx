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

      <article className="card related-card calculator-guide-card">
        <h2>Worked gross margin example for a promotion</h2>
        <p>Use prices excluding VAT. At baseline, the shopper price is £3.00, the invoice price is £2.00 and supplier cost is £1.20. On promotion, the shopper price is £2.50 and a £0.20 allowance reduces the invoice price to £1.80.</p>
        <ul className="compact-list">
          <li><strong>Supplier gross profit.</strong> £0.80 per unit at baseline (40% of the invoice price) and £0.60 on promotion (33.3%). At 1,000 baseline units and 1,400 promo units, supplier gross profit rises from £800 to £840 before fixed costs.</li>
          <li><strong>Retailer gross margin.</strong> £1.00 ÷ £3.00 = 33.3% at baseline and £0.70 ÷ £2.50 = 28% on promotion, assuming no other fees or funding.</li>
        </ul>
        <p>Check both views before agreeing the deal. In this example the supplier makes £40 more in total before fixed costs, while the retailer earns less margin per unit.</p>
      </article>
    </ToolPage>
  );
}
