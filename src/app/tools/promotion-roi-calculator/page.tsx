import type { Metadata } from "next";
import { ToolPage } from "../../components/Shell";
import { CommercialDealCalculator } from "../../components/ToolWidgets";

export const metadata: Metadata = {
  title: "Promotion ROI Calculator",
  description: "Calculate incremental gross profit, net impact and ROI for retail promotions.",
};

export default function Page() {
  return (
    <ToolPage
      slug="promotion-roi-calculator"
      intro="Check whether a promotion created enough incremental gross profit to justify SOA, fixed funding and retailer/customer support."
      interpretation={<p>Use the verdict to decide whether to repeat, renegotiate or redesign the event. A strong promo should be profitable after realistic cannibalisation and funding; a weak promo needs a strategic reason, a better mechanic or a lower investment ask.</p>}
    >
      <CommercialDealCalculator defaultTab="promo" />
    </ToolPage>
  );
}
