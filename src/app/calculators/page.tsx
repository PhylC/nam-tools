import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "../components/Shell";
import { CalculatorsHubClient } from "./CalculatorsHubClient";

export const metadata: Metadata = {
  title: "Commercial Calculator Hub | Account Planning Tools",
  description:
    "Choose the right Account Planning Tools calculator for promo ROI, retailer margin, SOA, invoice price and commercial planning questions.",
};

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
