import {
  getRetailListingPackCheckoutConfig,
  retailListingPackAmount,
  retailListingPackPath,
  retailListingPackSku,
} from "../../../../lib/retailListingPackConfig";
import { getStripeClient } from "../../../../lib/stripeBilling";
import { SITE_URL } from "../../../seo";

function returnToPack(status: string) {
  return new Response(null, {
    status: 303,
    headers: { Location: `${retailListingPackPath}?checkout=${status}`, "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const config = getRetailListingPackCheckoutConfig();
  const stripe = getStripeClient();
  if (!config || !stripe) return returnToPack("unavailable");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return returnToPack("confirm");
  }
  if (form.get("businessAndDelivery") !== "yes") return returnToPack("confirm");

  const origin = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || SITE_URL;
  try {
    const price = await stripe.prices.retrieve(config.priceId);
    if (
      !price.active ||
      price.type !== "one_time" ||
      price.currency !== "gbp" ||
      price.unit_amount !== retailListingPackAmount ||
      (config.automaticTax && price.tax_behavior !== "inclusive") ||
      price.currency_options
    ) {
      console.error("APT retail listing pack price does not match checkout configuration.");
      return returnToPack("unavailable");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: price.id, quantity: 1 }],
      billing_address_collection: "required",
      adaptive_pricing: { enabled: false },
      automatic_tax: { enabled: config.automaticTax },
      metadata: { apt_product: retailListingPackSku, uk_business_delivery_consent: "yes" },
      success_url: `${origin}${retailListingPackPath}?checkout=complete`,
      cancel_url: `${origin}${retailListingPackPath}?checkout=cancelled`,
    });

    if (session.url) {
      return new Response(null, {
        status: 303,
        headers: { Location: session.url, "Cache-Control": "no-store" },
      });
    }
  } catch (error) {
    console.error("APT retail listing pack checkout could not start.", {
      name: error instanceof Error ? error.name : "Unknown error",
    });
  }
  return returnToPack("unavailable");
}
