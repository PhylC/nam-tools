import { parseCsv } from "./parseCsv";
import { roiNumber } from "./roiCalculation";

const fields = [
  { name: "current_retailer_invoice_buy_price", alias: "current_invoice_price", kind: "amount", required: true },
  { name: "promo_retailer_invoice_buy_price", alias: "promo_invoice_price", kind: "amount" },
  { name: "support_per_unit_soa", kind: "signed" },
  { name: "current_srp", kind: "amount" },
  { name: "promo_srp", kind: "amount" },
  { name: "baseline_units", kind: "units", required: true },
  { name: "promo_units", kind: "units", required: true },
  { name: "supplier_cogs_per_unit", alias: "cogs_per_unit", kind: "amount" },
  { name: "fixed_support", kind: "amount" },
  { name: "vat_rate", kind: "amount" },
];

const numericCell = /^[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d*)?(?:e[+-]?\d+)?$|^[+-]?\.\d+(?:e[+-]?\d+)?$/i;

export function readRoiCsv(text: string): { rows: Record<string, string>[]; errors: string[] } {
  const [header, ...body] = parseCsv(text).filter(({ cells }) => cells.some((cell) => cell.trim()));
  if (!header || !body.length) return { rows: [], errors: ["Add at least one data row below the CSV headers."] };
  const headers = header.cells.map((cell) => cell.trim().toLowerCase().split(/\s+/)[0]);
  const missing = fields.filter(({ name, alias, required }) => required && !headers.includes(name) && !(alias && headers.includes(alias)));
  const errors = missing.map(({ name }) => `Missing column ${name}.`);
  const namedHeaders = headers.filter(Boolean);
  if (new Set(namedHeaders).size !== namedHeaders.length) errors.push("Each CSV column must have a unique header.");
  if (errors.length) return { rows: [], errors };

  const rows = body.map(({ number, cells }) => {
    if (cells.slice(headers.length).some((cell) => cell.trim())) {
      errors.push(`Row ${number}: there are more values than column headers. Check the CSV separators.`);
    }
    const row = Object.fromEntries(headers.map((name, index) => [name, cells[index]?.trim() ?? ""]));
    const rowErrorStart = errors.length;
    for (const { name, alias, required, kind } of fields) {
      const value = row[name] || (alias ? row[alias] : "");
      if (!value) {
        if (required) errors.push(`Row ${number}: ${name} is required.`);
        continue;
      }
      const numberValue = Number(value.replaceAll(",", ""));
      if (!numericCell.test(value) || !Number.isFinite(numberValue) || (kind !== "signed" && numberValue < 0)
        || (kind === "units" && !Number.isSafeInteger(numberValue))) {
        const expected = kind === "units" ? "a whole number of units at or above zero"
          : kind === "signed" ? "a number" : "a number at or above zero";
        errors.push(`Row ${number}: ${name} must be ${expected}.`);
        continue;
      }
      row[name] = value.replaceAll(",", "");
    }
    const promoInvoice = row.promo_retailer_invoice_buy_price;
    const soa = row.support_per_unit_soa;
    if (errors.length === rowErrorStart && promoInvoice && soa
      && Math.abs(roiNumber(row.current_retailer_invoice_buy_price) - roiNumber(promoInvoice) - roiNumber(soa)) > 1e-7) {
      errors.push(`Row ${number}: the promo invoice and SOA do not agree. Leave one blank or make them match.`);
    }
    return row;
  });

  return { rows: errors.length ? [] : rows, errors };
}
