import { ToolPage } from "../../components/Shell";
import { CommercialDealCalculator } from "../../components/ToolWidgets";
import { seoMetadata } from "../../seo";

export const metadata = seoMetadata({
  title: "Promotion ROI Calculator",
  description: "Check whether extra promotion volume offsets supplier support, reduced invoice price and fixed investment.",
  path: "/tools/promotion-roi-calculator",
});

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
