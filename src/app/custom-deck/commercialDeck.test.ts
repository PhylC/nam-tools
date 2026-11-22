import { describe, expect, it } from "vitest";
import { buildCommercialSlides, restoreCommercialApproval } from "./commercialDeck";
import { commercialCalculations, commercialPages, jbpBenchmark, promoBenchmark } from "./commercialBenchmarks.mjs";

const context = { deckLabel: "Example deck", audience: "Retailer/customer meeting", tone: "executive_polished", financial: true, next: true };

describe("commercial deck benchmarks", () => {
  it("reconciles the JBP envelope, calculates growth, and shares the worked example's slide structure", () => {
    const model = commercialCalculations("jbp", jbpBenchmark);
    expect(model.errors).toEqual([]);
    expect(model.sales).toMatchObject({ change: 200000, growth: 10 });
    expect(model.notes).toContain("Funding lines reconcile to £30,000.");
    const { contents } = buildCommercialSlides(context, { kind: "jbp", data: jbpBenchmark }, false);
    expect(contents.slice(1).map((slide) => slide.title)).toEqual(commercialPages("jbp", jbpBenchmark).pages.map((slide) => slide.title));
    expect(contents[1].lines[0]).toContain("Decision today");
    expect(contents.find(({ title }) => title === "Quarterly milestones and governance")?.table?.rows).toHaveLength(4);
    expect(commercialCalculations("jbp", { ...jbpBenchmark, funding: "31000" }).errors[0]).toContain("Reconcile the difference");
  });

  it("calculates the promo's three cases and rounds break-even up to whole units", () => {
    const model = commercialCalculations("promo-proposal", promoBenchmark);
    expect(model.errors).toEqual([]);
    expect(model.breakEven).toBe(6250);
    expect(model.scenarios?.map((item) => item?.profit)).toEqual([-1000, 3000, 6200]);
    expect(commercialCalculations("promo-proposal", { ...promoBenchmark, funding: "5000.01" }).breakEven).toBe(6251);
    expect(commercialCalculations("promo-proposal", { ...promoBenchmark, downsideUnits: "31000" }).errors[0]).toContain("ascending order");
    const { contents } = buildCommercialSlides(context, { kind: "promo-proposal", data: promoBenchmark }, true);
    expect(contents[1].lines[0]).toContain("Decision today");
    expect(contents.find(({ title }) => title === "Funding and break-even")?.table?.rows[0]).toEqual(["Contribution after funding", "-£1,000", "+£3,000", "+£6,200"]);
    expect(contents.find(({ title }) => title === "Post-event measurement")?.table?.headers).toContain("Success threshold");
  });

  it("supports a sparse brief and restores reviewed assumptions without invented figures", () => {
    const brief = { kind: "promo-proposal", data: { scope: "Two-week display test", decision: "Agree the test stores." } } as const;
    const approval = restoreCommercialApproval(brief);
    expect(approval).toEqual(brief);
    if (!approval) throw new Error("Could not restore brief");
    const result = buildCommercialSlides(context, approval, false);
    expect(result.errors).toEqual([]);
    expect(result.contents.some(({ table, chart }) => table || chart)).toBe(false);
    expect(result.contents[1].lines).toContain("Decision today · Agree the test stores.");
  });
});
