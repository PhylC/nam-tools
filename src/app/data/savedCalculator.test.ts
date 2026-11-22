import { describe, expect, it } from "vitest";
import { quickCalculatorSnapshot, savedCalculatorState } from "./savedCalculator";

describe("restoring calculator analyses", () => {
  it("reconstructs legacy markup inputs and the original VAT basis", () => {
    expect(savedCalculatorState({
      calculatorId: "markup-vs-margin-helper",
      inputs: { Currency: "GBP", "Cost / invoice price": 10, "Retail selling price": "14.99", "Retail tax basis": "Excludes VAT", "VAT rate": 20 },
    })).toEqual({
      legacy: true,
      values: { currency: "GBP", markupCost: "10", markupRetail: "14.99", retailTaxBasis: "excludes", taxLabel: "VAT", taxRate: "20", customTaxLabel: "" },
    });
  });

  it("restores saved deal tax settings and named snapshot fields without picking up unrelated quick calculator inputs", () => {
    const snapshot = quickCalculatorSnapshot("sales-tax-vat-iva-retail-price-converter", {
      converterPrice: "110", markupRetail: "10", currency: "USD", taxRate: "10", retailTaxBasis: "includes", taxLabel: "Custom", customTaxLabel: "Local tax",
    });
    expect(snapshot).not.toHaveProperty("markupRetail");
    expect(savedCalculatorState({ defaults: { calculatorState: snapshot }, inputs: { "VAT rate": "20" } }))
      .toEqual({ legacy: false, values: snapshot });
    expect(savedCalculatorState({
      calculatorId: "commercial-deal-margin",
      inputs: { "Current retail tax basis": "Excludes VAT", "Current retail VAT rate": "20", "Promo retail tax basis": "Includes VAT", "Promo retail VAT rate": "15" },
    }).values).toMatchObject({ retailerVatBasis: "excludes", vatRate: "20", promoRetailVatBasis: "includes", promoRetailVatRate: "15" });
  });
});
