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

const preview = "/images/retail-listing-workbook-negotiation.webp";
const previewAlt = "Excel workbook showing invoice price, promotion funding, volume and listing fee targets, with editable downside inputs";
const description = "Check whether a UK retail listing will pay for itself. Calculate what to negotiate and test the impact of lower sales or heavier promotions in Excel.";

export function generateMetadata(): Metadata {
  return {
    ...seoMetadata({
      title: "Retail Listing Profitability Calculator for Excel",
      description,
      socialImage: { url: preview, alt: previewAlt },
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
        <p>Work out what a retail listing could earn, which terms to negotiate and how the deal holds up if sales fall short. An Excel workbook for independent UK food and drink brands reviewing one product with one retailer.</p>
      </Hero>

      <section className="shell tool-layout" aria-label="Pack details">
        <div className="tool-main">
          <article className="card related-card">
            <h2>What’s in the workbook</h2>
            <ul className="compact-list">
              <li><strong>Deal calculator.</strong> Enter the retailer’s terms and your costs. See contribution, margin and break-even volume.</li>
              <li><strong>Negotiation targets.</strong> Find the minimum invoice price and sales volume you need, plus the most you can afford to spend on promotional funding and listing fees.</li>
              <li><strong>Downside case.</strong> Test what happens to contribution if you sell fewer units or fund promotions on a larger share of sales.</li>
              <li><strong>Buyer questions.</strong> Confirm who funds promotions, what gets deducted and when the retailer pays.</li>
            </ul>
          </article>

          <article className="card related-card">
            <h2>Worked example for a UK snack brand</h2>
            <p>At 12,000 units, the offer falls £272 short of the brand’s £3,000 target. The workbook shows what would close the gap, such as raising the invoice price to £1.43 per unit or capping listing and launch fees at £1,228, with other terms held constant.</p>
            <p>At 9,000 units with 40% on promotion, estimated contribution drops from £2,728 to £1,146.</p>
            <Image
              src={preview}
              alt={previewAlt}
              width={1230}
              height={781}
              sizes="(max-width: 700px) 100vw, 760px"
              style={{ display: "block", maxWidth: "100%", height: "auto", border: "1px solid #d6e2e5" }}
            />
            <p><Link href={preview}>Open the full-size workbook preview</Link></p>
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
