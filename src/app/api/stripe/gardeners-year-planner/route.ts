import {
  gardenerPlannerAmount,
  gardenerPlannerSku,
  gardenerPlannerUrl,
  gardenersYearOrigin,
} from "../../../../lib/gardenersYearPlanner";
import { getStripeClient } from "../../../../lib/stripeBilling";

function redirect(url: string) {
  return new Response(null, {
    status: 303,
    headers: { Location: url, "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const priceId = process.env.GY_VEGETABLE_PLANNER_PRICE_ID;
  const unavailable = () => redirect(`${gardenerPlannerUrl}?checkout=unavailable`);
  if (!stripe || !priceId || !process.env.RESEND_API_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return unavailable();
  }
  if (request.headers.get("origin") !== gardenersYearOrigin) {
    return redirect(gardenerPlannerUrl);
  }

  const form = await request.formData().catch(() => null);
  if (form?.get("instantDelivery") !== "yes") {
    return redirect(`${gardenerPlannerUrl}?checkout=confirm`);
  }

  try {
    const price = await stripe.prices.retrieve(priceId);
    if (
      !price.active || price.type !== "one_time" ||
      price.currency !== "gbp" || price.unit_amount !== gardenerPlannerAmount
    ) {
      console.error("Gardener's Year planner price does not match its checkout configuration.");
      return unavailable();
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: price.id, quantity: 1 }],
      branding_settings: { display_name: "Gardener's Year", button_color: "#335949" },
      shipping_address_collection: { allowed_countries: ["GB"] },
      adaptive_pricing: { enabled: false },
      metadata: { apt_product: gardenerPlannerSku, gy_instant_download_consent: "yes" },
      success_url: `${gardenerPlannerUrl}?checkout=complete`,
      cancel_url: `${gardenerPlannerUrl}?checkout=cancelled`,
    });

    if (checkout.url) return redirect(checkout.url);
  } catch (error) {
    console.error("Gardener's Year planner checkout could not start.", {
      name: error instanceof Error ? error.name : "Unknown error",
    });
  }
  return unavailable();
}
