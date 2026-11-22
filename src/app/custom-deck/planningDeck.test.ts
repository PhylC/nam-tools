import { describe, expect, it } from "vitest";
import { planningConfig } from "./planningBenchmarks.mjs";
import { buildCommercialSlides, getCommercialKind, restoreCommercialApproval } from "./commercialDeck";
import type { CommercialData, CommercialKind } from "./commercialDeck";

const context = { deckLabel: "QA deck", audience: "Leadership review", tone: "concise_commercial", financial: true, next: true };

function example(kind: Exclude<CommercialKind, "jbp" | "promo-proposal">, data: CommercialData = {}) {
  const restored = restoreCommercialApproval({ kind, data: { ...planningConfig[kind].benchmark, ...data } });
  if (!restored) throw new Error(`Missing example for ${kind}`);
  return buildCommercialSlides(context, restored, false);
}

describe("guided planning deck benchmarks", () => {
  it.each(Object.keys(planningConfig))("restores and builds the %s worked example", (value) => {
    const kind = getCommercialKind(value);
    if (!kind || kind === "jbp" || kind === "promo-proposal") throw new Error("Unexpected deck type");
    const deck = example(kind);
    expect(deck.errors).toEqual([]);
    expect(deck.contents[0].purpose).toBe("title");
    expect(deck.contents[1].lines[0]).toContain("Decision requested");
    expect(deck.contents.some((slide) => slide.table)).toBe(true);
  });

  it("shows lost volume separately from net range growth", () => {
    const deck = example("range-review");
    expect(deck.notes).toContain("480 net incremental units after displacement.");
    expect(example("range-review", { displacedUnits: "" }).errors[0]).toMatch(/both units/);
  });

  it("checks scenario order and calculates launch volume", () => {
    const deck = example("product-launch");
    expect(deck.notes).toContain("5,760 units in the expected launch case.");
    expect(example("product-launch", { downsideRate: "7" }).errors[0]).toMatch(/ascending order/);
    expect(example("product-launch", { stores: "0" }).errors[0]).toMatch(/ranged stores/i);
  });

  it("keeps total category value separate from the retailer value", () => {
    const deck = example("category-opportunity");
    expect(deck.notes).toContain("£15,600 expected retailer sales value.");
    expect(deck.contents.find(({ title }) => title === "Total category opportunity")?.lines[0]).toContain("£1,800,000");
    expect(deck.contents.find(({ title }) => title === "Retailer opportunity scenarios")?.table?.rows[2][2]).toBe("£15,600");
  });

  it("ranks account opportunities by value, then confidence", () => {
    const deck = example("account-plan", { opportunities: [["Low confidence", "120", "Low", "Test"], ["High confidence", "120", "High", "Fund"], ["Greater value", "150", "Medium", "Confirm"]] });
    expect(deck.contents.find(({ title }) => title === "Ranked opportunities")?.table?.rows.map((row) => row[0]))
      .toEqual(["Greater value", "High confidence", "Low confidence"]);
  });

  it("reconciles both growth drivers and funding in annual planning", () => {
    const deck = example("annual-planning");
    expect(deck.notes).toContain("Growth drivers behind the new target reconcile to £200,000.");
    expect(deck.notes).toContain("Funding decisions and release gates reconcile to £30,000.");
    expect(example("annual-planning", { nextTarget: "2150000", envelope: "40000" }).errors).toEqual([
      expect.stringContaining("change in target"), expect.stringContaining("investment envelope"),
    ]);
  });

  it("excludes internal guardrails when restoring and exporting the buyer-facing proposal", () => {
    const confidential = [["Internal only", "Reject below 40 stores", "Supplier discount limit", "Finance approval"]];
    const buyer = example("buyer-meeting-external", { negotiation: confidential, objections: confidential });
    expect(JSON.stringify(buyer.contents)).not.toMatch(/reject below|approval limit|discount limit|guardrails/i);
    expect(JSON.stringify(buyer.contents)).toContain("Joint next steps");
    expect(JSON.stringify(example("buyer-meeting", { negotiation: confidential }).contents)).toContain("Reject below 40 stores");
  });
});
