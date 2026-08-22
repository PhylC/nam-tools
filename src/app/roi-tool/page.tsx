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
      >
        <p>
          Model trade spend and support for one SKU or a full multi-line promotion,
          compare scenarios and export the numbers for retailer, distributor or
          customer planning.
        </p>
      </Hero>
      <RoiToolProduct />
      <FaqSection title="Promotion ROI FAQs." faqs={roiToolFaqs} />
    </div>
  );
}
