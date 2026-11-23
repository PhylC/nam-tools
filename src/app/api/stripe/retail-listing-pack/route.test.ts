import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as startCheckout } from "./route";
import { POST as webhook } from "../webhook/route";

const stripe = vi.hoisted(() => ({
  retrievePrice: vi.fn(),
  createSession: vi.fn(),
  constructEvent: vi.fn(),
  syncSubscription: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("../../../../lib/stripeBilling", async (importOriginal) => ({
  ...await importOriginal<typeof import("../../../../lib/stripeBilling")>(),
  getStripeClient: () => ({
    prices: { retrieve: stripe.retrievePrice },
    checkout: { sessions: { create: stripe.createSession } },
    webhooks: { constructEvent: stripe.constructEvent },
  }),
  syncBillingFromSubscription: stripe.syncSubscription,
}));

vi.mock("../../../../lib/serverAuth", () => ({ getSupabaseServiceClient: vi.fn() }));

vi.mock("resend", () => ({
  Resend: class { emails = { send: stripe.sendEmail }; },
}));

const price = {
  id: "price_pack",
  active: true,
  type: "one_time",
  currency: "gbp",
  unit_amount: 2900,
  tax_behavior: "inclusive",
};

function checkout(consent = true) {
  return startCheckout(new Request("https://accountplanningtools.example/checkout", {
    method: "POST",
    body: new URLSearchParams(consent ? { businessAndDelivery: "yes" } : {}),
  }));
}

function payment(status: string, amount = 2900) {
  stripe.constructEvent.mockReturnValue({
    type: "checkout.session.completed",
    data: { object: {
      id: "cs_test_fixture",
      mode: "payment",
      status: "complete",
      metadata: { apt_product: "apt-retail-listing-pack-v1" },
      currency: "gbp",
      amount_total: amount,
      payment_status: status,
      customer_details: { email: "buyer@example.invalid" },
    } },
  });
  return webhook(new Request("https://accountplanningtools.example/webhook", {
    method: "POST",
    headers: { "stripe-signature": "fixture" },
    body: "{}",
  }));
}

beforeEach(() => {
  vi.resetAllMocks();
  for (const [key, value] of Object.entries({
    APT_RETAIL_PACK_PRICE_ID: price.id,
    APT_RETAIL_PACK_AUTOMATIC_TAX: "true",
    STRIPE_SECRET_KEY: "fixture",
    STRIPE_WEBHOOK_SECRET: "fixture",
    RESEND_API_KEY: "fixture",
    NEXT_PUBLIC_APP_URL: "https://accountplanningtools.example",
  })) vi.stubEnv(key, value);

  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  stripe.retrievePrice.mockResolvedValue(price);
  stripe.createSession.mockResolvedValue({ url: "https://checkout.stripe.com/example" });
  stripe.sendEmail.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("retail pack checkout", () => {
  it("opens a one-off card checkout for one workbook", async () => {
    const response = await checkout();
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://checkout.stripe.com/example");
    expect(stripe.createSession).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: price.id, quantity: 1 }],
      automatic_tax: { enabled: true },
      adaptive_pricing: { enabled: false },
      metadata: { apt_product: "apt-retail-listing-pack-v1", uk_business_delivery_consent: "yes" },
    }));
  });

  it("requires the buyer confirmation", async () => {
    expect((await checkout(false)).headers.get("location")).toContain("checkout=confirm");
    expect(stripe.createSession).not.toHaveBeenCalled();
  });

  it("keeps checkout closed when delivery is unconfigured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    expect((await checkout()).headers.get("location")).toContain("checkout=unavailable");
    expect(stripe.retrievePrice).not.toHaveBeenCalled();
  });

  it.each([
    { unit_amount: 3000 },
    { type: "recurring" },
    { currency: "usd" },
    { tax_behavior: "exclusive" },
    { active: false },
  ])("rejects a mismatched checkout price %#", async (override) => {
    stripe.retrievePrice.mockResolvedValue({ ...price, ...override });
    expect((await checkout()).headers.get("location")).toContain("checkout=unavailable");
    expect(stripe.createSession).not.toHaveBeenCalled();
  });
});

describe("retail pack delivery", () => {
  it("attaches the actual workbook and uses a stable retry key", async () => {
    expect((await payment("paid")).status).toBe(200);
    expect(stripe.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "buyer@example.invalid",
        attachments: [{ filename: "Retail Listing Decision Pack.xlsx", content: expect.any(Buffer) }],
      }),
      { idempotencyKey: "apt-retail-listing-pack/cs_test_fixture" },
    );
    const [{ attachments }] = stripe.sendEmail.mock.calls[0];
    expect(attachments[0].content.subarray(0, 2).toString()).toBe("PK");
    expect(stripe.syncSubscription).not.toHaveBeenCalled();
  });

  it("neither delivers unpaid orders nor treats them as subscriptions", async () => {
    expect((await payment("unpaid")).status).toBe(200);
    expect(stripe.sendEmail).not.toHaveBeenCalled();
    expect(stripe.syncSubscription).not.toHaveBeenCalled();
  });

  it("rejects unexpected amounts and lets Stripe retry delivery failures", async () => {
    expect((await payment("paid", 3000)).status).toBe(500);
    expect(stripe.sendEmail).not.toHaveBeenCalled();
    stripe.sendEmail.mockResolvedValue({ error: { name: "internal_server_error" } });
    expect((await payment("paid")).status).toBe(500);
  });
});