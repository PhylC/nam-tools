import Link from "next/link";
import {
  getRetailListingPackCheckoutConfig,
  retailListingPackPath,
  retailListingPackTitle,
} from "../../../lib/retailListingPackConfig";
import { ToolPage } from "../../components/Shell";
import { CommercialDealCalculator } from "../../components/ToolWidgets";
import { seoMetadata } from "../../seo";

export const metadata = seoMetadata({
  title: "Terms / Investment Ask Calculator",
  description: "Sense-check customer investment requests against expected uplift, supplier revenue, gross margin and payback.",
  path: "/tools/terms-investment-calculator",
});

export default function Page() {
  return (
    <ToolPage
      slug="terms-investment-calculator"
      intro="Use this when a customer asks for extra investment and you need to check the uplift, payback and margin logic before agreeing."
      interpretation={<p>Use the recommendation to decide whether to support, negotiate or reject the ask. A sensible investment should pay back within the contract period and be tied to measurable customer delivery.</p>}
    >
      <CommercialDealCalculator defaultTab="investment" />

      {getRetailListingPackCheckoutConfig() && (
        <article className="card related-card calculator-guide-card">
          <h2>Review a new retail listing</h2>
          <p>Include listing fees, delivery, rebates and promotions when you estimate what the deal will contribute.</p>
          <Link href={retailListingPackPath}>{retailListingPackTitle} (£29 Excel workbook)</Link>
        </article>
      )}

      <article className="card related-card calculator-guide-card">
        <h2>How much extra revenue covers a fixed investment ask?</h2>
        <p>A buyer asks for £1,200 over six months. If supplier invoice sales are £20,000 over that period, enter the ask as 6% of sales. At a 30% gross margin and with no other costs or retention benefit, the ask needs £4,000 of incremental invoice sales to break even: £1,200 ÷ 0.30, or 20% uplift.</p>
        <p>If expected uplift is 25%, the additional invoice sales are £5,000. At 80% likelihood, the calculator weights that to £4,000, which breaks even at the same 30% margin. Check whether the customer can deliver the volume within six months before you commit.</p>
      </article>
    </ToolPage>
  );
}
