import type { Metadata } from "next";
import Link from "next/link";
import {
  getRetailListingPackCheckoutConfig,
  retailListingPackPath,
  retailListingPackTitle,
} from "../../lib/retailListingPackConfig";
import { Hero } from "../components/Shell";
import { seoMetadata } from "../seo";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    ...seoMetadata({
      title: retailListingPackTitle,
      description: "An Excel workbook for UK food and drink brands to estimate what a retail listing will contribute after promotions, rebates, delivery and fees.",
      path: retailListingPackPath,
    }),
    ...(getRetailListingPackCheckoutConfig() ? {} : { robots: { index: false, follow: true } }),
  };
}

const messages: Record<string, string> = {
  complete: "If your payment succeeded, your workbook will arrive at the email address you used in Stripe. Check your junk folder if you don’t see it. For help with your order, email hello@accountplanningtools.com.",
  cancelled: "You left checkout. You can start again below.",
  confirm: "Confirm that you’re buying for a UK business and want immediate delivery to continue.",
  unavailable: "Checkout is temporarily unavailable. Please try again later.",
};

export default async function RetailListingPackPage({ searchParams }: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const message = typeof checkout === "string" && Object.hasOwn(messages, checkout) ? messages[checkout] : null;
  const available = Boolean(getRetailListingPackCheckoutConfig());

  return (
    <div className="page-stack">
      <Hero title={retailListingPackTitle}>
        <p>Work out what a retail listing could contribute after promotions, rebates, delivery and fees. An Excel workbook for independent UK food and drink brands reviewing an offer.</p>
      </Hero>

      <section className="shell tool-layout" aria-label="Pack details">
        <div className="tool-main">
          <article className="card related-card">
            <h2>What’s in the workbook</h2>
            <ul className="compact-list">
              <li><strong>Deal calculator.</strong> Enter the retailer’s terms and your costs. See contribution, margin and break-even volume.</li>
              <li><strong>Worked example.</strong> Follow a fictional snack brand’s offer from £16,800 of invoice sales to £2,728 of contribution after deal costs.</li>
              <li><strong>Buyer questions.</strong> Confirm who funds promotions, what gets deducted and when the retailer pays.</li>
            </ul>
          </article>

          <article className="card related-card">
            <h2>What the example tells you</h2>
            <p>At 12,000 units, the example earns £2,728 after deal costs. That falls £272 short of the brand’s £3,000 target. Try different volume or promotion assumptions before going back to the buyer.</p>
          </article>
        </div>

        <aside className="card related-card" aria-label="Purchase the workbook">
          <h2>£29 one-off</h2>
          <p>One editable Microsoft Excel workbook (.xlsx). Delivered by email. No APT account required.</p>
          {message && <p role="status">{message}</p>}
          {available && checkout !== "complete" ? (
            <form method="post" action="/api/stripe/retail-listing-pack">
              <p><label><input name="businessAndDelivery" type="checkbox" value="yes" required /> I’m buying for a UK business and request immediate digital delivery after payment.</label></p>
              <p><button className="button" type="submit">Buy the workbook for £29</button></p>
            </form>
          ) : !available ? <p>Checkout is currently closed.</p> : null}
          <p><Link href="/terms">Terms</Link> · <Link href="/refund-policy">Refund policy</Link> · <Link href="/contact">Order help</Link></p>
        </aside>
      </section>
    </div>
  );
}
