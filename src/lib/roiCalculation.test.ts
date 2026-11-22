import { describe, expect, it } from "vitest";
import { calculateLine, rankRoiScenarios, summarizeRoiLines } from "./roiCalculation";

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

describe("scenario recommendations", () => {
  const loss = { revenue: 200, support: 325, profit: -25, revenueRoi: 200 / 325, profitRoi: -25 / 325 };
  const missing = { revenue: 800, support: 205, profit: null, revenueRoi: 800 / 205, profitRoi: null };

  it("keeps revenue and profit ROI rankings separate and withholds advice when a cost is missing", () => {
    expect(rankRoiScenarios([loss, missing])).toMatchObject({
      bestRevenueRoi: missing, bestProfitRoi: loss, hasAllCosts: false, recommended: null,
    });
  });

  it("does not recommend losses or break-even scenarios", () => {
    const breakEven = { ...missing, profit: 0, profitRoi: 0 };
    expect(rankRoiScenarios([loss, breakEven]).recommended).toBeNull();
  });

  it("recommends the highest positive profit, including when return on support is undefined", () => {
    const profitable = { revenue: 300, support: 0, profit: 150, revenueRoi: null, profitRoi: null };
    expect(rankRoiScenarios([loss, profitable]).recommended).toEqual(profitable);
  });
});

describe("multi-product profit totals", () => {
  const known = { ...line, supportMode: "promoInvoice" as const, promoInvoice: "9", promoUnits: "200", fixedSupport: "5" };
  const second = { ...line, supportMode: "promoInvoice" as const, fixedSupport: "25" };

  it("keeps revenue and support available while suppressing all profit totals when any cost is missing", () => {
    for (const cogs of ["", "invalid", "-1"]) {
      expect(summarizeRoiLines([known, { ...second, cogs }])).toMatchObject({
        complete: true, allCostsEntered: false, revenueImpact: 1000, supportCost: 530, revenueRoi: 1000 / 530,
        baselineProfit: null, promoProfit: null, profitImpact: null, profitRoi: null,
      });
    }
  });

  it("includes all product lines when costs are complete, including an explicit zero cost", () => {
    expect(summarizeRoiLines([known, second])).toMatchObject({
      allCostsEntered: true, profitImpact: 370, profitRoi: 370 / 530,
    });
    expect(summarizeRoiLines([known, { ...second, cogs: "0" }])).toMatchObject({
      allCostsEntered: true, profitImpact: 570, profitRoi: 570 / 530,
    });
  });
});
