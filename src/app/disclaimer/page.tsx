import type { Metadata } from "next";
import { LegalPage } from "../legal";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "Disclaimer for Account Planning Tools calculators, templates and commercial planning outputs.",
};

export default function Page() {
  return (
    <LegalPage
      title="Disclaimer"
      intro="Account Planning Tools is designed to support commercial thinking, not replace professional judgement."
      body={[
        "Account Planning Tools is for general commercial planning only. Calculator results, generated text and template-style outputs are estimates based on the figures and assumptions you enter.",
        "You must validate all figures, formulas, assumptions, costs, margins, trade spend, forecasts and customer context before using outputs with customers, employers, retailers or colleagues.",
        "Account Planning Tools does not provide financial, legal, tax, accounting, investment, procurement, negotiation or other professional advice.",
        "No guarantee is given that using Account Planning Tools will improve commercial performance, secure a buyer agreement, deliver sales uplift, increase margin or produce any specific business outcome.",
        "You remain responsible for your own decisions, recommendations, approvals and customer commitments.",
        "Do not use the tools as the sole basis for a business case, customer proposal or investment decision.",
      ]}
    />
  );
}
