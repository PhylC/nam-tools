import { describe, expect, it } from "vitest";
import { calculateLine } from "./roiCalculation";

const line = {
  currentInvoice: "10",
  promoInvoice: "8",
  soa: "1",
  baselineUnits: "100",
  promoUnits: "150",
  cogs: "4",
  fixedSupport: "",
};

describe("promotion input selection", () => {
  it("uses the selected input for both revenue and support when both values are populated", () => {
    expect(calculateLine({ ...line, supportMode: "soa" })).toMatchObject({
      promoInvoice: 9, promoRevenue: 1350, supportCost: 150, profitImpact: 150, revenueRoi: 350 / 150,
    });
    expect(calculateLine({ ...line, supportMode: "promoInvoice" })).toMatchObject({
      promoInvoice: 8, promoRevenue: 1200, supportCost: 300, profitImpact: 0, revenueRoi: 200 / 300,
    });
  });

  it("ignores a hidden input even when the selected input is blank", () => {
    expect(calculateLine({ ...line, supportMode: "soa", soa: "" })).toMatchObject({
      promoInvoice: 10, promoRevenue: 1500, supportCost: 0, revenueRoi: null,
    });
    expect(calculateLine({ ...line, supportMode: "promoInvoice", promoInvoice: "" })).toMatchObject({
      promoInvoice: 10, promoRevenue: 1500, supportCost: 0, revenueRoi: null,
    });
  });
});
