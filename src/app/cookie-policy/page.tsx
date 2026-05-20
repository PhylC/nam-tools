import type { Metadata } from "next";
import { LegalPage } from "../legal";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Cookie policy for NAM Tools, a commercial planning toolkit.",
};

export default function Page() {
  return (
    <LegalPage
      title="Cookie policy"
      intro="This cookie policy explains how NAM Tools uses cookies and similar technologies."
      body={[
        "NAM Tools uses only the cookies and similar technologies needed to provide, protect and improve the service.",
        "Basic hosting, security or performance technologies may be used by the platform that serves the site. These may involve technical logs or similar browser-level data.",
        "Core calculators do not need cookies to calculate results or generate copy-ready planning outputs.",
        "Saved scenarios, email signup, analytics and checkout services may use cookies or similar technologies where needed to provide those features.",
      ]}
    />
  );
}
