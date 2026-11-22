const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2, minimumFractionDigits: 0 });
export const unitCurrency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 });
export const signed = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1, signDisplay: "exceptZero" });
export const units = new Intl.NumberFormat("en-GB");

const trim = (value) => typeof value === "string" ? value.trim() : "";
export const signedMoney = (value) => value > 0 ? "+" + currency.format(value) : currency.format(value);
export const money = (value) => value === null ? "—" : currency.format(value);
export const at = (data, key) => trim(data[key]);
export const normalizedRows = (data, key, count) => (Array.isArray(data[key]) ? data[key] : [])
  .map((row) => Array.from({ length: count }, (_, index) => trim(row[index])))
  .filter((row) => row.some(Boolean));

export function readNumber(value, whole = false) {
  const input = trim(value).replace(/^£\s*/, "");
  if (!input) return null;
  const pattern = whole ? /^(?:\d{1,3}(?:,\d{3})+|\d+)$/ : /^-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?$/;
  if (!pattern.test(input)) return NaN;
  const result = Number(input.replaceAll(",", ""));
  return Number.isSafeInteger(Math.round(result * (whole ? 1 : 100))) ? result : NaN;
}
