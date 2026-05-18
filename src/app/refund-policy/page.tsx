import type { Metadata } from "next";
import { LegalPage } from "../legal";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Refund policy placeholder for future paid NAM Tools digital products and subscriptions.",
};

export default function Page() {
  return (
    <LegalPage
      title="Refund policy"
      intro="Payments are not live yet. This policy explains the placeholder position before paid digital products launch."
      body={[
        "NAM Tools does not currently accept payments, subscriptions or paid digital product purchases. There is therefore nothing to refund at this stage.",
        "Future paid products may include Pro features, digital templates, exports, saved plans or team workspaces. The refund policy will be reviewed and updated before any paid launch.",
        "For future digital products, refund rights and cancellation terms may depend on the product type, access status, applicable UK consumer rules and business purchase terms.",
        "No Stripe checkout or live payment processing is integrated in the current MVP.",
        "Questions about future paid access can be sent to hello@namtools.co.uk.",
      ]}
    />
  );
}
