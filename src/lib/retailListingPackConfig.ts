export const retailListingPackPath = "/retail-listing-decision-pack";
export const retailListingPackTitle = "Retail Listing Decision Pack";
export const retailListingPackFilename = "Retail Listing Decision Pack.xlsx";
export const retailListingPackAmount = 2900;
export const retailListingPackSku = "apt-retail-listing-pack-v1";

export function getRetailListingPackCheckoutConfig() {
  const priceId = process.env.APT_RETAIL_PACK_PRICE_ID?.trim();
  const tax = process.env.APT_RETAIL_PACK_AUTOMATIC_TAX?.trim();

  if (
    !priceId ||
    (tax !== "true" && tax !== "false") ||
    !process.env.STRIPE_SECRET_KEY ||
    !process.env.STRIPE_WEBHOOK_SECRET ||
    !process.env.RESEND_API_KEY
  ) return null;

  return { priceId, automaticTax: tax === "true" };
}
