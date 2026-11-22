import Link from "next/link";
import { retailMediaRoasPath } from "../../lib/retailMediaRoas";
import { FaqSection } from "../components/FaqSection";
import { Hero } from "../components/Shell";
import { JsonLd } from "../components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, seoMetadata } from "../seo";
import { RoiToolProduct } from "./RoiToolClient";

export const metadata = seoMetadata({
  title: "Promotion ROI Planner for Trade Spend and Retail Support",
  description:
    "Model promotion ROI, trade spend, support investment, incremental revenue and profit for one SKU or a multi-line retail scenario.",
  path: "/roi-tool",
});

const roiToolFaqs = [
  {
    question: "What does the ROI planner calculate?",
    answer:
      "It models promotion volume, supplier support, invoice revenue, gross profit impact and ROI so you can compare the deal before committing.",
  },
  {
    question: "Can I model more than one SKU?",
    answer:
      "Yes. APT Pro supports multi-line ROI scenarios so you can compare a fuller customer proposal rather than one product at a time.",
  },
  {
    question: "Can I export the ROI result?",
    answer:
      "Free users can copy basic outputs. Pro users can save scenarios and export cleaner outputs for internal reviews or customer meetings.",
  },
];

export default function RoiToolPage() {
  return (
    <div className="page-stack roi-tool-page">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "ROI Tool", path: "/roi-tool" },
          ]),
          faqJsonLd(roiToolFaqs),
        ]}
      />
      <Hero
        eyebrow="Promotion ROI tool"
        title="Promotion ROI planner"
        actions={
          <>
            <a className="button" href="#roi-planner-start">
              Start calculation
            </a>
            <a className="hero-text-link" href="#promotion-roi-faqs">
              Check what it calculates
            </a>
          </>
        }
      >
        <p>
          Model trade spend and support for one SKU or a full multi-line promotion,
          compare scenarios and export the numbers for retailer, distributor or
          customer planning.
        </p>
      </Hero>
      <RoiToolProduct />
      <section className="shell" aria-labelledby="trade-promotion-example">
        <article className="card related-card calculator-guide-card">
          <h2 id="trade-promotion-example">Trade promotion ROI example</h2>
          <p>All amounts exclude VAT. The example assumes a cost of goods of £2 per unit in both scenarios.</p>
          <ul className="compact-list">
            <li><strong>Baseline.</strong> 1,000 units at a £4 invoice price bring in £4,000 and generate £2,000 of profit.</li>
            <li><strong>Promotion.</strong> 1,400 units at £3.50 bring in £4,900. Profit after a £200 fixed fee is £1,900.</li>
          </ul>
          <p>Revenue rises by £900 while profit falls by £100. At the same sales forecast, bringing the fee down to £100 restores baseline profit.</p>
          <p>For a retailer’s paid media proposal, use the <Link href={retailMediaRoasPath}>retail media ROAS and profit calculator</Link>.</p>
        </article>
      </section>
      <div id="promotion-roi-faqs">
        <FaqSection title="Promotion ROI FAQs." faqs={roiToolFaqs} />
      </div>
    </div>
  );
}
