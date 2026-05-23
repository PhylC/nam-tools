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
      intro="Use this when a retailer asks for support, a lower promo price or more funding and you need to quickly understand whether the deal still makes sense."
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
