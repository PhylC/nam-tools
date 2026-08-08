import { LegalPage } from "../legal";
import { seoMetadata } from "../seo";

export const metadata = seoMetadata({
  title: "Privacy Policy",
  description:
    "Privacy policy for Account Planning Tools, including browser-based tools and contact email handling.",
  path: "/privacy",
});

export default function Page() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="This privacy policy explains how Account Planning Tools handles information."
      body={[
        "Account Planning Tools is currently designed to work without an account. Calculator and generator inputs are processed in your browser and are not intentionally stored by Account Planning Tools.",
        "If you contact hello@accountplanningtools.com, we may use the information you provide, such as your name, email address and message, to respond to your enquiry.",
        "Do not enter confidential customer, retailer, employer or commercially sensitive information unless you are comfortable using it in a browser-based planning tool.",
        "If you use saved plans, saved deck briefs, analytics features, checkout or email capture, those services may process the information needed to provide the feature.",
        "Hosting providers and standard technical services may process basic information such as IP address, browser details and request logs to deliver and secure the site.",
        "You can contact hello@accountplanningtools.com with privacy questions or requests relating to information you have sent directly to Account Planning Tools.",
      ]}
    />
  );
}
