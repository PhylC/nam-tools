import type { Metadata } from "next";
import { ToolPage } from "../../components/Shell";
import { CommercialDealCalculator } from "../../components/ToolWidgets";

export const metadata: Metadata = {
  title: "Promotion ROI Calculator",
  description: "Check whether extra promotion volume is enough to offset reduced price and support investment.",
};

export default function Page() {
  return (
    <ToolPage
      slug="promotion-roi-calculator"
      intro="Use this when a retailer asks for support, a lower promo price or more funding and you need to quickly understand whether the deal still makes sense."
      interpretation={<p>Use the verdict to decide whether to repeat, renegotiate or redesign the event. A strong promo should be profitable after realistic cannibalisation and funding; a weak promo needs a strategic reason, a better mechanic or a lower investment ask.</p>}
    >
      <CommercialDealCalculator defaultTab="promo" />
    </ToolPage>
  );
}
