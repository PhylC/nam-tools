import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  getRetailListingPackCheckoutConfig,
  retailListingPackAmount,
  retailListingPackSku,
  retailListingPackPath,
  retailListingPackTitle,
} from "../../lib/retailListingPackConfig";
import { JsonLd } from "../components/JsonLd";
import { Hero } from "../components/Shell";
import { breadcrumbJsonLd, MERCHANT_RETURN_POLICY_ID, REFUND_POLICY_PATH, seoMetadata, SITE_NAME, SITE_URL } from "../seo";

export const dynamic = "force-dynamic";

const preview = "/images/retail-listing-workbook.webp";
const description = "Check whether a UK retail listing will pay for itself. Use this Excel calculator to estimate contribution and break-even after promotions, rebates, delivery and fees.";

export function generateMetadata(): Metadata {
  return {
    ...seoMetadata({
      title: "Retail Listing Profitability Calculator for Excel",
      description,
      socialImage: { url: preview, alt: "Worked example from the Retail Listing Decision Pack" },
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
      {available && <JsonLd data={[
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: retailListingPackTitle, path: retailListingPackPath },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "Product",
          name: retailListingPackTitle,
          description,
          image: `${SITE_URL}${preview}`,
          sku: retailListingPackSku,
          brand: { "@type": "Brand", name: SITE_NAME },
          offers: {
            "@type": "Offer",
            url: `${SITE_URL}${retailListingPackPath}`,
            price: (retailListingPackAmount / 100).toFixed(2),
            priceCurrency: "GBP",
            availability: "https://schema.org/InStock",
            hasMerchantReturnPolicy: { "@id": MERCHANT_RETURN_POLICY_ID },
          },
        },
      ]} />}
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
            <h2>Worked example for a UK snack brand</h2>
            <p>At 12,000 units, the example earns £2,728 after deal costs. That falls £272 short of the brand’s £3,000 target. Try different volume or promotion assumptions before going back to the buyer.</p>
            <Image
              src={preview}
              alt="Excel worked example showing £2,728 contribution after fixed deal costs and a break-even volume of 5,424 units"
              width={616}
              height={610}
              sizes="(max-width: 700px) 100vw, 616px"
              style={{ display: "block", maxWidth: "100%", height: "auto", border: "1px solid #d6e2e5" }}
            />
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
          <p><Link href="/terms">Terms</Link> · <Link href={REFUND_POLICY_PATH}>Refund policy</Link> · <Link href="/contact">Order help</Link></p>
        </aside>
      </section>
    </div>
  );
}
