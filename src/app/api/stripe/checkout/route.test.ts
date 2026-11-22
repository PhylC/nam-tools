import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const stripe = vi.hoisted(() => ({
  retrieve: vi.fn(),
  createCustomer: vi.fn(),
  createCheckout: vi.fn(),
}));

vi.mock("../../../../lib/serverAuth", () => ({
  getAuthenticatedUser: async () => ({ ok: true, user: { id: "free-user", app_metadata: {} } }),
}));
vi.mock("../../../../lib/stripeBilling", () => ({
  parseBillingInterval: (interval: unknown) => interval === "monthly" || interval === "annual" ? interval : null,
  getStripeClient: () => ({
    prices: { retrieve: stripe.retrieve },
    customers: { create: stripe.createCustomer },
    checkout: { sessions: { create: stripe.createCheckout } },
  }),
  getPriceId: (interval: string) => `price_${interval}`,
  getAppOrigin: () => "https://accountplanningtools.example",
  getBillingByUserId: async () => ({ stripe_customer_id: "cus_test" }),
  subscriptionStatusHasProAccess: () => false,
  upsertBillingRecord: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of ["STRIPE_SECRET_KEY", "STRIPE_PRICE_MONTHLY", "STRIPE_PRICE_ANNUAL"]) {
    vi.stubEnv(key, "fixture");
  }
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  stripe.createCheckout.mockResolvedValue({ id: "cs_test_fixture", url: "https://checkout.stripe.com/example" });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function checkout(interval: string) {
  return POST(new Request("https://accountplanningtools.example/api/stripe/checkout", {
    method: "POST",
    body: JSON.stringify({ interval }),
  }));
}

describe("checkout billing period", () => {
  it.each([
    ["monthly", "month"],
    ["annual", "year"],
  ])("creates a %s checkout only with the matching Stripe price", async (selection, interval) => {
    stripe.retrieve.mockResolvedValue({ active: true, type: "recurring", recurring: { interval, interval_count: 1 } });

    expect((await checkout(selection)).status).toBe(200);
    expect(stripe.retrieve).toHaveBeenCalledWith(`price_${selection}`);
    expect(stripe.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ line_items: [{ price: `price_${selection}`, quantity: 1 }] }),
      expect.objectContaining({ idempotencyKey: expect.stringContaining(`price_${selection}`) }),
    );
  });

  it.each([
    { active: true, type: "recurring", recurring: { interval: "year", interval_count: 1 } },
    { active: true, type: "recurring", recurring: { interval: "month", interval_count: 3 } },
    { active: true, type: "one_time", recurring: null },
    { active: false, type: "recurring", recurring: { interval: "month", interval_count: 1 } },
  ])("rejects a monthly selection with an incompatible Stripe price %#", async (price) => {
    stripe.retrieve.mockResolvedValue(price);

    expect((await checkout("monthly")).status).toBe(503);
    expect(stripe.createCheckout).not.toHaveBeenCalled();
    expect(stripe.createCustomer).not.toHaveBeenCalled();
  });
});
