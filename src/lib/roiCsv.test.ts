import { describe, expect, it } from "vitest";
import { readRoiCsv } from "./roiCsv";

const headers = "current_invoice_price REQUIRED,baseline_units REQUIRED,promo_units REQUIRED,promo_invoice_price,support_per_unit_soa,notes";

describe("ROI CSV import", () => {
  it("accepts legacy aliases, quoted thousands and multiline notes", () => {
    const csv = `${headers}\r\n10,"1,000",1500,8,2,"line one\r\nline two"`;
    expect(readRoiCsv(csv)).toMatchObject({
      errors: [],
      rows: [{
        current_retailer_invoice_buy_price: "10",
        promo_retailer_invoice_buy_price: "8",
        baseline_units: "1000",
        notes: "line one\r\nline two",
      }],
    });
  });

  it("rejects the entire file when a later row has invalid required and optional numbers", () => {
    const result = readRoiCsv(`${headers}\n10,100,150,8,,\nabc,xyz,150.5,8,"1,0",`);
    expect(result.rows).toEqual([]);
    expect(result.errors).toEqual([
      "Row 3: current_retailer_invoice_buy_price must be a number at or above zero.",
      "Row 3: support_per_unit_soa must be a number.",
      "Row 3: baseline_units must be a whole number of units at or above zero.",
      "Row 3: promo_units must be a whole number of units at or above zero.",
    ]);
  });

  it("rejects conflicting promo prices and SOA and files with no data rows", () => {
    expect(readRoiCsv(`${headers}\n10,100,150,8,1,`).errors[0]).toContain("Row 2: the promo invoice and SOA do not agree");
    expect(readRoiCsv(headers).errors[0]).toContain("Add at least one data row");
  });
});
