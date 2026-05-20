import type { Metadata } from "next";
import { ToolPage } from "../../components/Shell";
import { CommercialDealCalculator } from "../../components/ToolWidgets";

export const metadata: Metadata = {
  title: "ROI Tool",
  description:
    "Model promo ROI, gross margin, trade spend, investment asks and retailer/customer economics from one shared set of commercial assumptions.",
};

export default function Page() {
  return (
    <ToolPage
      slug="commercial-deal-calculator"
      intro="Model supplier view and retailer/customer view from one shared set of assumptions, then switch between promo ROI, gross margin, trade spend and investment ask tabs."
      interpretation={
        <p>
          Use this as the ROI tool when a promotion has more than one
          commercial angle. It keeps the inputs in one place so the supplier
          payback, retailer/customer economics and investment story stay
          consistent.
        </p>
      }
    >
      <CommercialDealCalculator defaultTab="promo" />
    </ToolPage>
  );
}
