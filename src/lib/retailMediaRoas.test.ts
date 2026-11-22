import { describe, expect, it } from "vitest";
import { calculateRetailMediaReturn } from "./retailMediaRoas";

const example = {
  attributedRetailSales: 20_000, adSpend: 5_000, fees: 1_000, contributionMarginPercent: 40,
};

describe("retail media ROAS and profit", () => {
  it("keeps reported retail ROAS separate from incremental supplier profit", () => {
    const result = calculateRetailMediaReturn(example, { incrementalSupplierSales: 8_000 });
    expect(result.roas).toBe(4);
    expect(result.campaignCost).toBe(6_000);
    expect(result.outcome?.profit).toBe(-2_800);
    expect(result.outcome?.roiPercent).toBeCloseTo(-46.67, 2);
    expect(result.breakEvenSupplierSales).toBe(15_000);
  });

  it("uses supplier revenue, fees and the same margin across scenarios", () => {
    const result = calculateRetailMediaReturn(example, { attributedSupplierSales: 24_000 });
    expect(result.outcome).toBeNull();
    expect(result.scenarios.map((row) => [row.share, row.supplierSales, row.profit]))
      .toEqual([[25, 6_000, -3_600], [50, 12_000, -1_200], [75, 18_000, 1_200]]);
  });

  it("reports unavailable ratios with zero spend or margin and supports declining sales", () => {
    const zero = calculateRetailMediaReturn(
      { ...example, contributionMarginPercent: 0, adSpend: 0, fees: 0 },
      { incrementalSupplierSales: 0 },
    );
    expect(zero.roas).toBeNull();
    expect(zero.breakEvenSupplierSales).toBeNull();
    expect(zero.outcome?.roiPercent).toBeNull();
    expect(calculateRetailMediaReturn(example, { incrementalSupplierSales: -500 }).outcome?.profit).toBe(-6_200);
    expect(calculateRetailMediaReturn(example, { incrementalSupplierSales: 15_000 }).outcome?.profit).toBe(0);
  });
});
