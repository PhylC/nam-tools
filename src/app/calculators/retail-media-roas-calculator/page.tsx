import Link from "next/link";
import { retailMediaRoasName, retailMediaRoasPath } from "../../../lib/retailMediaRoas";
import { FaqSection } from "../../components/FaqSection";
import { JsonLd } from "../../components/JsonLd";
import { ResourceMethodology } from "../../components/ResourceMethodology";
import { Hero } from "../../components/Shell";
import { breadcrumbJsonLd, seoMetadata } from "../../seo";
import { RetailMediaCalculator } from "./RetailMediaCalculator";

export const metadata = seoMetadata({
  title: "Retail Media ROAS Calculator & Break-Even Profit",
  description: "Calculate retail media ROAS, supplier profit, campaign ROI and break-even sales. Compare incrementality scenarios using your margin, media spend and fees.",
  path: retailMediaRoasPath,
});

const faqs = [
  {
    question: "How do you calculate retail media ROAS?",
    answer: "Divide retailer-attributed sales by media spend. Use the same attribution window and sales basis as the retailer’s report when comparing campaigns.",
  },
  {
    question: "How is ROAS different from retail media ROI?",
    answer: "ROAS shows attributed retail sales per unit of media spend. Supplier ROI measures the profit or loss from incremental supplier sales after variable costs, ad spend and other campaign costs, as a percentage of the full campaign cost.",
  },
  {
    question: "What if I only have retailer-attributed sales?",
    answer: "Use the retailer’s figures for reported ROAS. To compare profit scenarios, convert the attributed units into supplier net revenue using your net invoice values, then test what happens if 25%, 50% or 75% of that revenue was incremental. These percentages are planning assumptions.",
  },
  {
    question: "How much extra supplier revenue do I need to break even?",
    answer: "Divide total campaign cost by your positive supplier contribution margin as a decimal. A £6,000 campaign at a 40% margin needs £15,000 in incremental supplier net sales.",
  },
];

export default function RetailMediaRoasPage() {
  return (
    <div className="page-stack">
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Calculators", path: "/calculators" },
        { name: retailMediaRoasName, path: retailMediaRoasPath },
      ])} />
      <Hero title={retailMediaRoasName} actions={
        <>
          <a className="button" href="#calculator">Start calculation</a>
          <a className="hero-text-link" href="#retail-media-example">See the worked example</a>
        </>
      }>
        <p>Check whether a retailer media proposal pays for itself. Calculate reported return on ad spend, estimated supplier profit and the sales lift you need to break even.</p>
      </Hero>
      <RetailMediaCalculator />
      <section className="shell" aria-labelledby="retail-media-example">
        <article className="card related-card calculator-guide-card">
          <h2 id="retail-media-example">Worked example of retail media ROAS and profit</h2>
          <p>A retailer attributes £20,000 of retail sales to £5,000 of advertising. The supplier estimates £8,000 of incremental net sales at a 40% contribution margin and pays £1,000 of additional fees.</p>
          <ul className="compact-list">
            <li><strong>Reported ROAS.</strong> £20,000 ÷ £5,000 = 4×.</li>
            <li><strong>Campaign profit.</strong> £8,000 × 40% − £6,000 = a £2,800 loss.</li>
            <li><strong>Campaign ROI.</strong> −£2,800 ÷ £6,000 = −46.67%.</li>
            <li><strong>Break-even incremental supplier sales.</strong> £6,000 ÷ 40% = £15,000.</li>
          </ul>
          <p>For the supplier view, use net invoice revenue and a contribution margin that reflects the variable costs of those sales. If you have a measured sales lift, use it. When you only have attributed sales, treat the incrementality percentages as assumptions and check the retailer’s measurement window and method before comparing proposals.</p>
          <p><a href="https://iabeurope.eu/wp-content/uploads/IAB-Europes-Commerce-Media-Measurement-Standards-V2.1-May-2026.pdf">Read IAB Europe’s commerce media measurement standards</a></p>
          <p><Link href="/roi-tool">Model a price promotion and supplier support</Link> or <Link href="/tools/trade-spend-calculator">check the rest of your trade spend</Link>.</p>
        </article>
      </section>
      <section className="shell">
        <ResourceMethodology reviewedOn="2026-11-22">Use attributed retail sales for reported ROAS. Use incremental supplier net revenue and contribution margin to estimate supplier profit, then subtract media spend and fees. Use a consistent attribution window when comparing campaigns.</ResourceMethodology>
      </section>
      <FaqSection title="Retail media ROAS and ROI questions" faqs={faqs} />
    </div>
  );
}
