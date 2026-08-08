import { LegalPage } from "../legal";
import { seoMetadata } from "../seo";

export const metadata = seoMetadata({
  title: "Terms of Use",
  description:
    "UK-oriented terms for Account Planning Tools, a general commercial planning toolkit for account managers.",
  path: "/terms",
});

export default function Page() {
  return (
    <LegalPage
      title="Terms of use"
      intro="These terms explain how to use Account Planning Tools."
      body={[
        "Account Planning Tools is operated by Phyl Sion, trading as Account Planning Tools.",
        "Account Planning Tools provides general commercial planning tools and template-style outputs for account managers, commercial teams and related users. The tools are intended to help structure thinking around account plans, promotion reviews, buyer meetings, trade spend and investment asks.",
        "The outputs are estimates and planning prompts only. You are responsible for checking all inputs, formulas, assumptions and outputs before using them with customers, employers, retailers, colleagues or any third party.",
        "Account Planning Tools does not provide legal, financial, tax, accounting, investment or other professional advice. Use of this site does not create an advisory, client, agency or consultancy relationship.",
        "We do not guarantee any commercial outcome, buyer decision, customer agreement, margin result, sales uplift or return on investment from using the tools.",
        "You must not rely on Account Planning Tools as the sole basis for business decisions. Always apply your own commercial judgement and follow your employer's approval processes.",
        "If you create an account, you are responsible for keeping your sign-in details secure and for any activity carried out through your account. Tell APT if you believe your account has been misused.",
        "You must not misuse the service, attempt to interfere with its operation, bypass access controls, scrape the product, upload malicious content, or use the tools for unlawful or unauthorised purposes.",
        "APT content, tool structure, page copy and materials are owned by or licensed to Account Planning Tools. You may use generated outputs for your own legitimate internal business planning, subject to checking and adapting them responsibly.",
        "We may change, suspend, remove or improve pages, tools, formulas, features and content as the product develops. We do not guarantee uninterrupted availability.",
        "Paid Pro subscription, billing, cancellation and refund terms are not fully set out here because live payment functionality is still being prepared. Those terms should be added before paid checkout launches.",
      ]}
    />
  );
}
