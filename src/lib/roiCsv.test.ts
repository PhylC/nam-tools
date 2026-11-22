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

  it("re-imports export rows and preserves scenario names, input mode and assumptions", () => {
    const report = [
      "group_name,scenario_name,row_type,current_invoice_price,baseline_units,promo_units,promo_invoice_price,support_per_unit_soa,cogs_per_unit,currency,vat_rate",
      "Test,SOA case,line,10,100,150,,1,4,EUR,21",
      "Test,SOA case,scenario_summary,,100,150,,,,,",
      "Test,Invoice case,line,10,100,140,8,,4,EUR,21",
      "disclaimer,Planning estimate only.",
    ].join("\r\n");
    expect(readRoiCsv(report)).toMatchObject({
      errors: [],
      rows: [
        { scenario_name: "SOA case", promo_invoice_price: "", support_per_unit_soa: "1", currency: "EUR", vat_rate: "21" },
        { scenario_name: "Invoice case", promo_retailer_invoice_buy_price: "8", support_per_unit_soa: "" },
      ],
    });
    expect(readRoiCsv(report.replace("SOA case,line,10", "SOA case,line,bad")).rows).toEqual([]);
  });
});
