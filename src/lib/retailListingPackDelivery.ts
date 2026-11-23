import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Resend } from "resend";
import type Stripe from "stripe";
import { SITE_URL } from "../app/seo";
import {
  retailListingPackAmount,
  retailListingPackFilename,
  retailListingPackSku,
  retailListingPackTitle,
} from "./retailListingPackConfig";

export function isRetailListingPackOrder(session: Stripe.Checkout.Session) {
  return session.mode === "payment" && session.metadata?.apt_product === retailListingPackSku;
}

export async function deliverRetailListingPack(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid" || session.status !== "complete") return;

  const apiKey = process.env.RESEND_API_KEY;
  const email = session.customer_details?.email;
  if (!apiKey || !email || session.currency !== "gbp" || session.amount_total !== retailListingPackAmount) {
    throw new Error("Retail listing pack order details could not be verified for delivery.");
  }

  const from = process.env.CONTACT_FROM_EMAIL || "hello@accountplanningtools.com";
  const file = await readFile(join(process.cwd(), "src", "products", "retail-listing-pack.xlsx"));
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send(
    {
      from: `Account Planning Tools <${from}>`,
      to: email,
      replyTo: "hello@accountplanningtools.com",
      subject: `Your ${retailListingPackTitle}`,
      text: [
        "Thank you for your order. Your Excel workbook is attached.",
        "Order: Retail Listing Decision Pack. Total paid: £29.00.",
        "The workbook includes the deal calculator, a fictional worked example and buyer questions.",
        "You confirmed this is a UK business purchase and requested digital delivery immediately after payment.",
        "Open the workbook in Microsoft Excel and complete the amber cells on the Deal calculator tab.",
        "Your business may use and adapt the workbook for its own planning. Contact us for permission to resell or redistribute the pack.",
        `Terms: ${SITE_URL}/terms`,
        `Refund policy: ${SITE_URL}/refund-policy`,
        "Questions about your order? Reply to this email.",
      ].join("\n\n"),
      attachments: [{ filename: retailListingPackFilename, content: file }],
    },
    { idempotencyKey: `apt-retail-listing-pack/${session.id}` },
  );

  if (error) throw new Error(`Retail listing pack email failed: ${error.name}`);
}
