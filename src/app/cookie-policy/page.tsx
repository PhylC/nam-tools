import type { Metadata } from "next";
import { LegalPage } from "../legal";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Cookie policy placeholder for NAM Tools, a no-login commercial planning toolkit.",
};

export default function Page() {
  return (
    <LegalPage
      title="Cookie policy"
      intro="This cookie policy explains the intended position for the current MVP."
      body={[
        "NAM Tools does not currently require login and does not currently use payment cookies or advertising cookies.",
        "Basic hosting, security or performance technologies may be used by the platform that serves the site. These may involve technical logs or similar browser-level data.",
        "The current tools do not need cookies to calculate results or generate copy-ready planning outputs.",
        "If analytics, accounts, saved scenarios, email signup or payment services are added later, this policy should be updated before those features are launched.",
        "Payments are not live yet, so there are no checkout or subscription cookies in the MVP.",
      ]}
    />
  );
}
