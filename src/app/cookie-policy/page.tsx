import { LegalPage } from "../legal";
import { seoMetadata } from "../seo";

export const metadata = seoMetadata({
  title: "Cookie Policy",
  description:
    "Cookie policy for Account Planning Tools, a commercial planning toolkit.",
  path: "/cookie-policy",
});

export default function Page() {
  return (
    <LegalPage
      title="Cookie policy"
      intro="This cookie policy explains how Account Planning Tools uses cookies and similar technologies."
      body={[
        "APT uses essential cookies, local storage or similar technologies to provide sign-in, session handling, security, cookie choices, calculator defaults and saved local work. These are separate from optional analytics.",
        "Supabase authentication/session functionality may use essential storage so accounts and protected pages continue to work whether analytics is accepted or rejected.",
        "Core calculators can calculate results in the browser without analytics cookies. Some settings, recently used calculator values and local saved work may be stored on your device so the tools remain useful between visits.",
        "Optional GA4 analytics is used only if analytics is enabled in the deployment environment and you accept analytics through the site's consent control. Analytics events are designed not to include calculator inputs, commercial values, scenario names, email addresses or user IDs.",
        "Resend may process contact form details when you send a message. Render may process technical logs needed to deliver and protect the service.",
        "You can change your analytics choice at any time using Cookie settings in the footer. Rejecting analytics does not affect essential sign-in/session functionality.",
      ]}
    />
  );
}
