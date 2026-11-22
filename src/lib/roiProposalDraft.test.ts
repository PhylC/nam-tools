import { describe, expect, it } from "vitest";
import { commercialCalculations } from "../app/custom-deck/commercialBenchmarks.mjs";
import { buildRoiProposalDraft, parseRoiProposalDraft, readRoiProposalDraft, roiProposalStorageKey } from "./roiProposalDraft";

const example = { baselineUnits: 1000, expectedUnits: 1400, fixedFunding: 200, baselinePriceImpact: 500, unitContribution: 1.5 };

describe("ROI to Promotional Proposal", () => {
  it("reconciles profit and break-even with the single-product worked example", () => {
    const draft = buildRoiProposalDraft([example], "GBP");
    expect(draft).toEqual({ currency: "GBP", ...example });
    const result = commercialCalculations("promo-proposal", {
      baselineUnits: "1000", expectedUnits: "1400", funding: "200", baselinePriceImpact: "500", contribution: "1.50",
    });
    expect(result.errors).toEqual([]);
    expect(result.scenarios?.[1]?.profit).toBe(-100);
    expect(result.breakEven).toBe(467);
  });

  it("keeps the planner currency on transferred figures", () => {
    const result = commercialCalculations("promo-proposal", {
      baselineUnits: "1000", expectedUnits: "1400", funding: "200", baselinePriceImpact: "500", contribution: "1.50", currency: "EUR",
    });
    expect(result.notes).toContain("Break-even is 467 incremental units. Expected contribution after funding is -€100.");
  });

  it("carries the volumes and funding for a mixed SKU scenario without inventing a blended rate", () => {
    const draft = buildRoiProposalDraft([example, { ...example, unitContribution: 2 }], "GBP");
    expect(draft).toMatchObject({ baselineUnits: 2000, expectedUnits: 2800, fixedFunding: 400, baselinePriceImpact: 1000, unitContribution: null });
    expect(commercialCalculations("promo-proposal", { baselineUnits: "2000", expectedUnits: "2800", funding: "400" }).errors).toEqual([]);
  });

  it("rejects unsupported currencies and invalid stored figures without consuming the draft", () => {
    expect(parseRoiProposalDraft({ ...example, currency: "JPY" })).toBeNull();
    expect(buildRoiProposalDraft([{ ...example, expectedUnits: 14.5 }], "GBP")).toBeNull();
    const data = JSON.stringify({ currency: "GBP", ...example });
    const storage = { getItem: (key: string) => key === roiProposalStorageKey ? data : null } as Storage;
    expect(readRoiProposalDraft(storage)).toEqual(readRoiProposalDraft(storage));
    expect(readRoiProposalDraft(storage)).toMatchObject({ fixedFunding: 200 });
  });
});
