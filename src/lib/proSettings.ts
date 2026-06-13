"use client";

export const CALCULATOR_DEFAULTS_KEY = "aptCalculatorDefaults";
export const EXPORT_DEFAULTS_KEY = "aptExportDefaults";
export const PRESENTATION_TEMPLATE_META_KEY = "aptPresentationTemplateMeta";
export const PRESENTATION_TEMPLATE_LIMIT_BYTES = 10 * 1024 * 1024;

export type RetailTaxBasisDefault = "includes_tax" | "excludes_tax";

export type CalculatorDefaults = {
  currency: string;
  market: string;
  retailTaxBasis: RetailTaxBasisDefault;
  taxRate: number;
  taxLabel: "VAT" | "Sales tax" | "IVA" | "GST" | "TVA" | "MwSt" | "Custom";
  customTaxLabel: string;
  cogsBehaviour: "ask_when_needed" | "usually_include_cogs" | "hide_unless_enabled";
  supportTerminology: "SOA" | "Trade spend" | "Promo support" | "Funding" | "Custom";
  customSupportTerminology: string;
};

export type ExportDefaults = {
  companyName: string;
  userName: string;
  jobTitle: string;
  companyLogoFilename: string;
  companyLogoStoragePath?: string | null;
  defaultExportFormat: "powerpoint" | "excel" | "pdf";
  disclaimer: string;
};

export type PresentationTemplateMeta = {
  filename: string;
  uploadedAt: string;
  size: number;
  storagePath?: string | null;
} | null;

export const defaultCalculatorDefaults: CalculatorDefaults = {
  currency: "GBP",
  market: "UK",
  retailTaxBasis: "excludes_tax",
  taxRate: 20,
  taxLabel: "VAT",
  customTaxLabel: "",
  cogsBehaviour: "ask_when_needed",
  supportTerminology: "SOA",
  customSupportTerminology: "",
};

export const defaultExportDefaults: ExportDefaults = {
  companyName: "",
  userName: "",
  jobTitle: "",
  companyLogoFilename: "",
  companyLogoStoragePath: null,
  defaultExportFormat: "powerpoint",
  disclaimer:
    "Retail selling prices are at the sole discretion of the retailer. Calculations are estimates based on the inputs provided and should be checked against your own internal process.",
};

function readLocalObject<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const saved = window.localStorage.getItem(key);
  if (!saved) return fallback;
  try {
    return { ...fallback, ...(JSON.parse(saved) as Partial<T>) };
  } catch {
    return fallback;
  }
}

function writeLocalObject<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readCalculatorDefaults() {
  // TODO: Load authenticated Pro account defaults from Supabase profile storage before local fallback.
  return readLocalObject(CALCULATOR_DEFAULTS_KEY, defaultCalculatorDefaults);
}

export function saveCalculatorDefaults(defaults: CalculatorDefaults) {
  // TODO: Save authenticated Pro account defaults to Supabase profile storage.
  writeLocalObject(CALCULATOR_DEFAULTS_KEY, defaults);
}

export function readExportDefaults() {
  // TODO: Load authenticated Pro export defaults from Supabase profile storage before local fallback.
  return readLocalObject(EXPORT_DEFAULTS_KEY, defaultExportDefaults);
}

export function saveExportDefaults(defaults: ExportDefaults) {
  // TODO: Save authenticated Pro export defaults to Supabase profile storage.
  writeLocalObject(EXPORT_DEFAULTS_KEY, defaults);
}

export function readPresentationTemplateMeta(): PresentationTemplateMeta {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(PRESENTATION_TEMPLATE_META_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as PresentationTemplateMeta;
  } catch {
    return null;
  }
}

export function savePresentationTemplateMeta(meta: PresentationTemplateMeta) {
  // TODO: Save authenticated Pro template metadata and storage reference to Supabase profile storage.
  if (typeof window === "undefined") return;
  if (!meta) {
    window.localStorage.removeItem(PRESENTATION_TEMPLATE_META_KEY);
    return;
  }
  window.localStorage.setItem(PRESENTATION_TEMPLATE_META_KEY, JSON.stringify(meta));
}

export function getSavedPresentationTemplate() {
  // Future Pro presentation exports can call this before falling back to the default APT export template.
  return readPresentationTemplateMeta();
}

export function retailTaxBasisToVatBasis(value: RetailTaxBasisDefault) {
  return value === "excludes_tax" ? "excludes" : "includes";
}

export function vatBasisToRetailTaxBasis(value: "includes" | "excludes"): RetailTaxBasisDefault {
  return value === "excludes" ? "excludes_tax" : "includes_tax";
}

export function getActiveTaxLabel(defaults: Pick<CalculatorDefaults, "taxLabel" | "customTaxLabel">) {
  if (defaults.taxLabel === "Custom" && defaults.customTaxLabel?.trim()) {
    return defaults.customTaxLabel.trim();
  }
  return defaults.taxLabel || "VAT";
}

export function getActiveSupportTerminology(
  defaults: Pick<CalculatorDefaults, "supportTerminology" | "customSupportTerminology">,
) {
  if (defaults.supportTerminology === "Custom" && defaults.customSupportTerminology?.trim()) {
    return defaults.customSupportTerminology.trim();
  }
  return defaults.supportTerminology || "SOA";
}
