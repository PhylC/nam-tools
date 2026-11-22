import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canonicalQuickCalculatorPath, quickCalculatorPath } from "../data/quickCalculators";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("calculators hub search targeting", () => {
  it("targets sales and retail calculator intent without creating duplicate hubs", () => {
    expect(source).toContain('title: "Retail Calculators for Price, Margin and Promotions"');
    expect(source).toContain('"sales calculators"');
    expect(source).toContain('"retail calculators"');
    expect(source).toContain('title="Retail calculators for price, margin and promotions"');
    expect(source).toContain("Which sales calculators are available?");
    expect(source).toContain("Which retail calculators are available?");
    expect(source).toContain('href="#promotion-tools"');
    expect(source).toContain('href="#pricing-tools"');
  });
});

describe("calculators saved in Workspace", () => {
  it("uses public URLs when saving and opening Markup vs Margin and VAT analyses", () => {
    expect(quickCalculatorPath("markup-vs-margin-helper")).toBe("/calculators/markup-vs-margin-calculator");
    expect(quickCalculatorPath("sales-tax-vat-iva-retail-price-converter")).toBe("/calculators/sales-tax-vat-iva-calculator");
    expect(canonicalQuickCalculatorPath("/calculators/markup-vs-margin-helper")).toBe("/calculators/markup-vs-margin-calculator");
    expect(canonicalQuickCalculatorPath("/calculators/sales-tax-vat-iva-retail-price-converter#formula")).toBe("/calculators/sales-tax-vat-iva-calculator#formula");
    expect(canonicalQuickCalculatorPath("/tools/gross-margin-calculator")).toBe("/tools/gross-margin-calculator");
  });
});
