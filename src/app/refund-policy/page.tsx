import type { Metadata } from "next";
import { LegalPage } from "../legal";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Refund policy for NAM Tools digital products and subscriptions.",
};

export default function Page() {
  return (
    <LegalPage
      title="Refund policy"
      intro="This policy explains how refunds are handled for NAM Tools purchases."
      body={[
        "Digital products may include Pro features, digital templates, exports, saved plans or team workspaces.",
        "Refund rights and cancellation terms may depend on the product type, access status, applicable UK consumer rules and business purchase terms.",
        "If you believe a charge or subscription has been made in error, contact hello@namtools.co.uk with the email address used for purchase and the relevant order details.",
        "Approved refunds will be returned through the original purchase method where possible.",
        "Questions about paid access can be sent to hello@namtools.co.uk.",
      ]}
    />
  );
}
