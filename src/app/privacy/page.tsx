import type { Metadata } from "next";
import { LegalPage } from "../legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy placeholder for NAM Tools, including no-login tools and contact email handling.",
};

export default function Page() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="This privacy policy is placeholder copy for the current no-login NAM Tools MVP."
      body={[
        "NAM Tools is currently designed to work without an account. Calculator and generator inputs are processed in your browser and are not intentionally stored by NAM Tools.",
        "If you contact hello@namtools.co.uk, we may use the information you provide, such as your name, email address and message, to respond to your enquiry.",
        "Do not enter confidential customer, retailer, employer or commercially sensitive information unless you are comfortable using it in a browser-based planning tool.",
        "Payments are not live. If accounts, saved plans, analytics, payment processing or email capture are added later, this policy should be reviewed and updated before launch.",
        "Hosting providers and standard technical services may process basic information such as IP address, browser details and request logs to deliver and secure the site.",
        "You can contact hello@namtools.co.uk with privacy questions or requests relating to information you have sent directly to NAM Tools.",
      ]}
    />
  );
}
