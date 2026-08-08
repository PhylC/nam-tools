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
    </ToolPage>
  );
}
