import { quickCalculatorPath } from "./quickCalculators";

const quickFields: Record<string, Record<string, string>> = {
  "retail-selling-price-calculator": {
    "Retailer invoice/buy price": "rspInvoice", "Target retailer margin %": "rspMargin",
  },
  "actual-retailer-margin-calculator": {
    "Normal retailer invoice/buy price": "actualInvoice", "Support input mode": "actualMode",
    "SOA / supplier support per unit": "actualSupport", "Promo retailer invoice/buy price": "actualPromoInvoice",
    "Retailer selling price": "actualRetail", "Fixed support": "actualFixed", Units: "actualUnits",
  },
  "invoice-price-calculator": {
    "Retail selling price": "invoiceRetail", "Target retailer margin %": "invoiceMargin",
  },
  "required-soa-calculator": {
    "Standard retailer selling price": "soaStandardRetail", "Standard retailer margin %": "soaStandardMargin",
    "Proposed retailer selling price": "soaProposedRetail", "Required retailer margin %": "soaRequiredMargin", "Expected units": "soaUnits",
  },
  "soa-support-percent-calculator": {
    "SOA / supplier support per unit": "supportValue", "Retailer invoice/buy price": "supportInvoice",
    "Retail selling price": "supportRetail",
  },
  "promo-invoice-calculator": {
    "Current retailer invoice/buy price": "promoInvoiceCurrent", "SOA / supplier support per unit": "promoInvoiceSupport",
    Units: "promoInvoiceUnits",
  },
  "sales-tax-vat-iva-retail-price-converter": { "Retail selling price": "converterPrice" },
  "markup-vs-margin-helper": { "Cost / invoice price": "markupCost", "Retail selling price": "markupRetail" },
};

const dealFields = {
  "Baseline units": "baselineUnits", "Promo units": "promoUnits", "Current retailer invoice/buy price": "retailerBuyPrice",
  "Promo retailer invoice/buy price": "promoInvoicePrice", "Support per unit / SOA": "soa", "Current SRP": "srp",
  "Promo SRP": "promoSrp", "Supplier COGS": "cogs", "Fixed supplier support": "fixedCost",
};

const taxLabels = ["VAT", "IVA", "Sales tax", "GST", "TVA", "MwSt"];

function stringValues(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return Object.fromEntries(Object.entries(input)
    .filter(([, value]) => typeof value === "string" || typeof value === "number")
    .map(([key, value]) => [key, String(value)]));
}

function basis(value: string | undefined) {
  if (/^inc(?:ludes)?\b/i.test(value ?? "")) return "includes";
  if (/^ex(?:cludes)?\b/i.test(value ?? "")) return "excludes";
  return undefined;
}

export function canRestoreCalculator(id: string) {
  return Boolean(quickCalculatorPath(id) || /^commercial-deal-(promo|margin|spend|investment)$/.test(id));
}

export function quickCalculatorSnapshot(id: string | undefined, state: Record<string, string>) {
  const keys = ["currency", "market", "taxLabel", "customTaxLabel", "retailTaxBasis", "taxRate",
    ...Object.values(quickFields[id ?? ""] ?? {})];
  return Object.fromEntries(keys.filter((key) => Object.hasOwn(state, key)).map((key) => [key, state[key]]));
}

export function savedCalculatorState(analysis: Record<string, unknown>) {
  const defaults = analysis.defaults;
  const snapshot = defaults && typeof defaults === "object" && "calculatorState" in defaults
    ? stringValues(defaults.calculatorState) : {};
  if (Object.keys(snapshot).length) return { values: snapshot, legacy: false };

  const id = String(analysis.calculatorId ?? "");
  const isDeal = id.startsWith("commercial-deal-");
  const inputs = stringValues(analysis.inputs);
  const values: Record<string, string> = {};
  const fields = isDeal ? dealFields : quickFields[id] ?? {};
  for (const [label, key] of Object.entries(fields)) {
    if (Object.hasOwn(inputs, label)) values[key] = inputs[label];
  }
  if (inputs.Currency) values.currency = inputs.Currency;

  const taxPrefix = isDeal ? "Current retail " : "";
  const taxRateKey = Object.keys(inputs).find((key) => key.startsWith(taxPrefix) && key.endsWith(" rate"));
  if (taxRateKey) {
    const label = taxRateKey.slice(taxPrefix.length, -5);
    values.taxLabel = taxLabels.includes(label) ? label : "Custom";
    values.customTaxLabel = values.taxLabel === "Custom" && label !== "tax" ? label : "";
    values[isDeal ? "vatRate" : "taxRate"] = inputs[taxRateKey];
  }

  if (isDeal) {
    const currentBasis = basis(inputs["Current retail tax basis"]);
    const promoBasis = basis(inputs["Promo retail tax basis"]);
    const promoRateKey = Object.keys(inputs).find((key) => key.startsWith("Promo retail ") && key.endsWith(" rate"));
    if (currentBasis) values.retailerVatBasis = currentBasis;
    if (promoBasis) values.promoRetailVatBasis = promoBasis;
    if (promoRateKey) values.promoRetailVatRate = inputs[promoRateKey];
    if (values.soa && !values.promoInvoicePrice) values.supportMethod = "soa";
  } else {
    const retailBasis = basis(inputs["Retail tax basis"]);
    if (retailBasis) values.retailTaxBasis = retailBasis;
  }
  return { values, legacy: true };
}
