import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Resend } from "resend";
import type Stripe from "stripe";

export const gardenersYearOrigin = "https://gardenersyear.com";
export const gardenerPlannerUrl = `${gardenersYearOrigin}/vegetable-plot-planner/`;
export const gardenerPlannerSku = "gy-vegetable-plot-planner-v1";
export const gardenerPlannerAmount = 499;

export function isGardenerPlannerOrder(session: Stripe.Checkout.Session) {
  return session.mode === "payment" && session.metadata?.apt_product === gardenerPlannerSku;
}

export async function deliverGardenerPlanner(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid" || session.status !== "complete") return;

  const apiKey = process.env.RESEND_API_KEY;
  const email = session.customer_details?.email;
  if (
    !apiKey || !email || session.currency !== "gbp" ||
    session.amount_total !== gardenerPlannerAmount ||
    session.metadata?.gy_instant_download_consent !== "yes"
  ) {
    throw new Error("Gardener's Year order details could not be verified.");
  }

  const file = await readFile(join(process.cwd(), "src", "products", "gardeners-year-vegetable-plot-planner.pdf"));
  const from = process.env.CONTACT_FROM_EMAIL || "hello@accountplanningtools.com";
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send(
    {
      from: `Gardener's Year <${from}>`,
      to: email,
      replyTo: "phyl.sion@gmail.com",
      subject: "Your Gardener's Year Vegetable Plot Planner",
      text: [
        "Thank you for your order. Your Vegetable Plot Planner is attached as a six-page A4 PDF in English. Open it in a PDF reader and print the pages you need.",
        "You paid £4.99 in total by card, including immediate delivery by email. This is a one-off purchase for personal use. You can reprint it for your own use.",
        "At checkout you requested immediate delivery and acknowledged that your 14-day cancellation right would end when the digital content is supplied. Your statutory rights if there is a problem with the file still apply.",
        "The seller is Phyl Sion, a sole trader trading as Gardener's Year, 28 Abbey Road, Croydon, CR0 1RT, United Kingdom. Account Planning Tools is another trading name of the same seller and may appear on your payment receipt or statement.",
        "For help with your order or to report a faulty file, reply to this email or contact phyl.sion@gmail.com.",
        `Order information: ${gardenerPlannerUrl}`,
        `Terms: ${gardenersYearOrigin}/terms/`,
        `Privacy: ${gardenersYearOrigin}/privacy/`,
      ].join("\n\n"),
      attachments: [{ filename: "Gardeners Year Vegetable Plot Planner.pdf", content: file }],
    },
    { idempotencyKey: `gy-vegetable-plot-planner/${session.id}` },
  );

  if (error) throw new Error(`Gardener's Year delivery email failed: ${error.name}`);
}
