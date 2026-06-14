import type { Metadata } from "next";
import { Hero } from "../components/Shell";
import { PresentationTemplatesProduct } from "./PresentationTemplatesClient";

export const metadata: Metadata = {
  title: "Presentations",
  description:
    "Buyer-ready and internal presentation templates for turning account plans, promo proposals and customer reviews into clearer meeting outputs.",
};

export default function PresentationTemplatesPage() {
  return (
    <div className="page-stack">
      <Hero title="Buyer-ready presentations and planning templates">
        <p>
          Use this when you have the numbers but still need to turn them into a
          clean, meeting-ready story for a buyer conversation or internal
          sign-off.
        </p>
      </Hero>
      <PresentationTemplatesProduct />
    </div>
  );
}
