import { FaqSection } from "../components/FaqSection";
import { JsonLd } from "../components/JsonLd";
import { Hero } from "../components/Shell";
import { breadcrumbJsonLd, faqJsonLd, seoMetadata } from "../seo";
import { PresentationTemplatesProduct } from "./PresentationTemplatesClient";

export const metadata = seoMetadata({
  title: "Presentation Templates for Account Planning",
  description:
    "Buyer-ready and internal presentation templates for turning account plans, promo proposals and customer reviews into clearer meeting outputs.",
  path: "/presentation-templates",
});

const presentationTemplateFaqs = [
  {
    question: "What presentation templates are included?",
    answer:
      "APT includes templates for joint business plans, quarterly business reviews, promotional proposals, range reviews, launches and buyer meeting preparation.",
  },
  {
    question: "Are the templates editable?",
    answer:
      "Yes. The templates are intended to be edited for your customer, category, numbers and internal meeting format.",
  },
  {
    question: "Can teams use branded templates?",
    answer:
      "Yes. Pro and team workflows can use saved template references, branding details and export preferences for more consistent outputs.",
  },
];

export default function PresentationTemplatesPage() {
  return (
    <div className="page-stack presentation-templates-page snapshot-hero-page">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Presentation Templates", path: "/presentation-templates" },
          ]),
          faqJsonLd(presentationTemplateFaqs),
        ]}
      />
      <Hero title="Buyer-ready presentations and planning templates">
        <p>
          Use this when you have the numbers but still need to turn them into a
          clean, meeting-ready story for a buyer conversation or internal
          sign-off.
        </p>
      </Hero>
      <PresentationTemplatesProduct />
      <FaqSection title="Presentation template FAQs." faqs={presentationTemplateFaqs} />
    </div>
  );
}
