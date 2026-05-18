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
      intro="Sense-check whether a customer investment ask can be justified by the expected uplift and gross margin."
      interpretation={<p>Use the recommendation to decide whether to support, negotiate or reject the ask. A sensible investment should pay back within the contract period and be tied to measurable customer delivery.</p>}
    >
      <CommercialDealCalculator defaultTab="investment" />
    </ToolPage>
  );
}
