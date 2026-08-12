import Link from "next/link";
import { Hero } from "../components/Shell";
import { seoMetadata } from "../seo";
import { CalculatorsHubClient } from "./CalculatorsHubClient";

export const metadata = seoMetadata({
  title: "Commercial Calculator Hub",
  description:
    "Choose calculators for promo ROI, retailer margin, SOA support, invoice price and commercial planning questions.",
  path: "/calculators",
});

export default function CalculatorsPage() {
  return (
    <div className="page-stack calculators-hub-page">
      <Hero
        title="What are you trying to work out?"
        actions={
          <>
            <Link className="button" href="/roi-tool">
              Open ROI planner
            </Link>
            <Link className="hero-text-link" href="#pricing-tools">
              Browse quick calculators
            </Link>
          </>
        }
      >
        <p>
          Start with the full ROI planner for a complete promotion view, or jump into a quick calculator when you only
          need one answer.
        </p>
      </Hero>

      <CalculatorsHubClient />
    </div>
  );
}
