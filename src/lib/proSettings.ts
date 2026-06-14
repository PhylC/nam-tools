"use client";

export const CALCULATOR_DEFAULTS_KEY = "aptCalculatorDefaults";
export const EXPORT_DEFAULTS_KEY = "aptExportDefaults";
export const PRESENTATION_TEMPLATE_META_KEY = "aptPresentationTemplateMeta";
export const PRESENTATION_TEMPLATES_KEY = "aptPresentationTemplates";
export const PRESENTATION_TEMPLATE_LIMIT_BYTES = 10 * 1024 * 1024;
export const PRESENTATION_TEMPLATE_LIBRARY_LIMIT = 3;

export type RetailTaxBasisDefault = "includes_tax" | "excludes_tax";

export type CalculatorDefaults = {
  currency: string;
  market: string;
  retailTaxBasis: RetailTaxBasisDefault;
  taxRate: number;
  taxLabel: "VAT" | "Sales tax" | "IVA" | "GST" | "TVA" | "MwSt" | "Custom";
  customTaxLabel: string;
  cogsBehaviour: "ask_when_needed" | "usually_include_cogs" | "hide_unless_enabled";
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
  id?: string;
  displayName?: string;
  filename: string;
  uploadedAt: string;
  size: number;
  storagePath?: string | null;
  storagePathOrUrl?: string | null;
  isDefault?: boolean;
} | null;

export type SavedPresentationTemplate = {
  id: string;
  displayName: string;
  filename: string;
  uploadedAt: string;
  size?: number;
  storagePathOrUrl?: string | null;
  isDefault: boolean;
};

export const defaultCalculatorDefaults: CalculatorDefaults = {
  currency: "GBP",
  market: "UK",
  retailTaxBasis: "excludes_tax",
  taxRate: 20,
  taxLabel: "VAT",
  customTaxLabel: "",
  cogsBehaviour: "ask_when_needed",
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
  const saved = readLocalObject(CALCULATOR_DEFAULTS_KEY, defaultCalculatorDefaults);
  return {
    currency: saved.currency || defaultCalculatorDefaults.currency,
    market: saved.market || defaultCalculatorDefaults.market,
    retailTaxBasis: saved.retailTaxBasis || defaultCalculatorDefaults.retailTaxBasis,
    taxRate: Number.isFinite(saved.taxRate) ? saved.taxRate : defaultCalculatorDefaults.taxRate,
    taxLabel: saved.taxLabel || defaultCalculatorDefaults.taxLabel,
    customTaxLabel: saved.customTaxLabel || defaultCalculatorDefaults.customTaxLabel,
    cogsBehaviour: saved.cogsBehaviour || defaultCalculatorDefaults.cogsBehaviour,
  };
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
  return getDefaultPresentationTemplate();
}

function normaliseTemplateLibrary(items: SavedPresentationTemplate[]) {
  const clean = items
    .filter((item) => item && item.id && item.filename)
    .slice(0, PRESENTATION_TEMPLATE_LIBRARY_LIMIT)
    .map((item, index) => ({
      ...item,
      displayName: item.displayName?.trim() || item.filename,
      isDefault: Boolean(item.isDefault) && index < PRESENTATION_TEMPLATE_LIBRARY_LIMIT,
    }));

  if (clean.length === 0) return clean;
  const defaultIndex = clean.findIndex((item) => item.isDefault);
  return clean.map((item, index) => ({
    ...item,
    isDefault: defaultIndex >= 0 ? index === defaultIndex : index === 0,
  }));
}

export function readPresentationTemplates(): SavedPresentationTemplate[] {
  // TODO: Load authenticated Pro presentation template library metadata from Supabase profile storage.
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(PRESENTATION_TEMPLATES_KEY);
  if (saved) {
    try {
      return normaliseTemplateLibrary(JSON.parse(saved) as SavedPresentationTemplate[]);
    } catch {
      return [];
    }
  }

  const legacy = readPresentationTemplateMeta();
  if (!legacy) return [];
  return normaliseTemplateLibrary([
    {
      id: legacy.id || `legacy-${legacy.uploadedAt}`,
      displayName: legacy.displayName || "Main company template",
      filename: legacy.filename,
      uploadedAt: legacy.uploadedAt,
      size: legacy.size,
      storagePathOrUrl: legacy.storagePathOrUrl || legacy.storagePath || null,
      isDefault: true,
    },
  ]);
}

export function savePresentationTemplates(templates: SavedPresentationTemplate[]) {
  // TODO: Save authenticated Pro presentation template library metadata to Supabase profile storage.
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRESENTATION_TEMPLATES_KEY, JSON.stringify(normaliseTemplateLibrary(templates)));
}

export function getDefaultPresentationTemplate() {
  return readPresentationTemplates().find((template) => template.isDefault) ?? null;
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
