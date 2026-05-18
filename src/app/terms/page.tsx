import type { Metadata } from "next";
import { LegalPage } from "../legal";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "UK-oriented placeholder terms for NAM Tools, a general commercial planning toolkit for account managers.",
};

export default function Page() {
  return (
    <LegalPage
      title="Terms of use"
      intro="These terms are UK-oriented placeholder terms for the NAM Tools MVP."
      body={[
        "NAM Tools provides general commercial planning tools and template-style outputs for account managers, commercial teams and related users. The tools are intended to help structure thinking around account plans, promotion reviews, buyer meetings, trade spend and investment asks.",
        "The outputs are estimates and planning prompts only. You are responsible for checking all inputs, formulas, assumptions and outputs before using them with customers, employers, retailers, colleagues or any third party.",
        "NAM Tools does not provide legal, financial, tax, accounting, investment or other professional advice. Use of this site does not create an advisory, client, agency or consultancy relationship.",
        "We do not guarantee any commercial outcome, buyer decision, customer agreement, margin result, sales uplift or return on investment from using the tools.",
        "You must not rely on NAM Tools as the sole basis for business decisions. Always apply your own commercial judgement and follow your employer's approval processes.",
        "The service is currently provided without login and without live payments. We may change, remove or improve pages, tools, formulas and content as the product develops.",
      ]}
    />
  );
}
