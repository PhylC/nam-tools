import type { Metadata } from "next";
import { ToolPage } from "../../components/Shell";
import { CommercialDealCalculator } from "../../components/ToolWidgets";

export const metadata: Metadata = {
  title: "Terms / Investment Ask Calculator",
  description: "Sense-check customer investment requests against uplift, revenue and gross margin.",
};

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
