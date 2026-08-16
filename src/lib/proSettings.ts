"use client";

import { EXPORT_PLANNING_CAVEAT } from "./commercialCaveats";
import { getSupabaseBrowserClient } from "./supabaseClient";

export const PRESENTATION_TEMPLATE_LIMIT_BYTES = 20 * 1024 * 1024;
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
  defaultExportFormat: "pptx" | "google_slides_compatible" | "keynote_compatible";
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
  defaultExportFormat: "pptx",
  disclaimer: EXPORT_PLANNING_CAVEAT,
};

type AccountSettings = {
  calculatorDefaults: CalculatorDefaults;
  exportDefaults: ExportDefaults;
  presentationTemplates: SavedPresentationTemplate[];
};

type AccountSettingsRow = {
  calculator_defaults: Partial<CalculatorDefaults> | null;
  export_defaults: Partial<ExportDefaults> | null;
  presentation_templates: SavedPresentationTemplate[] | null;
};

export type AccountSettingsResult = {
  data: AccountSettings;
  message?: string;
};

function normalizeCalculatorDefaults(saved: Partial<CalculatorDefaults> | null | undefined): CalculatorDefaults {
  const next = { ...defaultCalculatorDefaults, ...(saved ?? {}) };
  return {
    currency: next.currency || defaultCalculatorDefaults.currency,
    market: next.market || defaultCalculatorDefaults.market,
    retailTaxBasis: next.retailTaxBasis || defaultCalculatorDefaults.retailTaxBasis,
    taxRate: Number.isFinite(next.taxRate) ? next.taxRate : defaultCalculatorDefaults.taxRate,
    taxLabel: next.taxLabel || defaultCalculatorDefaults.taxLabel,
    customTaxLabel: next.customTaxLabel || defaultCalculatorDefaults.customTaxLabel,
    cogsBehaviour: next.cogsBehaviour || defaultCalculatorDefaults.cogsBehaviour,
  };
}

function normalizeExportDefaults(saved: Partial<ExportDefaults> | null | undefined): ExportDefaults {
  const next = { ...defaultExportDefaults, ...(saved ?? {}) };
  const formatAliases: Record<string, ExportDefaults["defaultExportFormat"]> = {
    powerpoint: "pptx",
    pptx: "pptx",
    google_slides_compatible: "google_slides_compatible",
    keynote_compatible: "keynote_compatible",
  };
  return {
    ...next,
    companyLogoStoragePath: next.companyLogoStoragePath ?? null,
    defaultExportFormat: formatAliases[next.defaultExportFormat] ?? defaultExportDefaults.defaultExportFormat,
  };
}

export function readCalculatorDefaults() {
  return defaultCalculatorDefaults;
}

export async function saveCalculatorDefaults(defaults: CalculatorDefaults) {
  return saveAccountSettings({ calculatorDefaults: normalizeCalculatorDefaults(defaults) });
}

export function readExportDefaults() {
  return defaultExportDefaults;
}

export async function saveExportDefaults(defaults: ExportDefaults) {
  return saveAccountSettings({ exportDefaults: normalizeExportDefaults(defaults) });
}

export function readPresentationTemplateMeta(): PresentationTemplateMeta {
  return null;
}

export async function savePresentationTemplateMeta(meta: PresentationTemplateMeta) {
  const templates = meta
    ? [
        {
          id: meta.id || `template-${meta.uploadedAt}`,
          displayName: meta.displayName || "Main company template",
          filename: meta.filename,
          uploadedAt: meta.uploadedAt,
          size: meta.size,
          storagePathOrUrl: meta.storagePathOrUrl || meta.storagePath || null,
          isDefault: true,
        },
      ]
    : [];
  return savePresentationTemplates(templates);
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
  return [];
}

export async function savePresentationTemplates(templates: SavedPresentationTemplate[]) {
  return saveAccountSettings({ presentationTemplates: normaliseTemplateLibrary(templates) });
}

export function getDefaultPresentationTemplate() {
  return readPresentationTemplates().find((template) => template.isDefault) ?? null;
}

async function getAuthenticatedUser() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { supabase: null, user: null };
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { supabase, user: null };
  return { supabase, user: data.user };
}

function defaultAccountSettings(): AccountSettings {
  return {
    calculatorDefaults: defaultCalculatorDefaults,
    exportDefaults: defaultExportDefaults,
    presentationTemplates: [],
  };
}

function normalizeAccountSettings(row?: AccountSettingsRow | null): AccountSettings {
  return {
    calculatorDefaults: normalizeCalculatorDefaults(row?.calculator_defaults),
    exportDefaults: normalizeExportDefaults(row?.export_defaults),
    presentationTemplates: normaliseTemplateLibrary(row?.presentation_templates ?? []),
  };
}

export async function loadAccountSettings(): Promise<AccountSettingsResult> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) {
    return { data: defaultAccountSettings(), message: "Sign in to load account settings." };
  }

  const { data, error } = await supabase
    .from("account_settings")
    .select("calculator_defaults,export_defaults,presentation_templates")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return { data: defaultAccountSettings(), message: "Could not load account settings." };
  return { data: normalizeAccountSettings(data as AccountSettingsRow | null) };
}

export async function saveAccountSettings(partial: Partial<AccountSettings>): Promise<AccountSettingsResult> {
  const { supabase, user } = await getAuthenticatedUser();
  const current = await loadAccountSettings();
  const merged = {
    calculatorDefaults: normalizeCalculatorDefaults(partial.calculatorDefaults ?? current.data.calculatorDefaults),
    exportDefaults: normalizeExportDefaults(partial.exportDefaults ?? current.data.exportDefaults),
    presentationTemplates: normaliseTemplateLibrary(partial.presentationTemplates ?? current.data.presentationTemplates),
  };

  if (!supabase || !user) {
    return { data: merged, message: "Sign in to save settings to your account. Nothing was saved on this device." };
  }

  const { error } = await supabase.from("account_settings").upsert({
    user_id: user.id,
    calculator_defaults: merged.calculatorDefaults,
    export_defaults: merged.exportDefaults,
    presentation_templates: merged.presentationTemplates,
    updated_at: new Date().toISOString(),
  });

  if (error) return { data: merged, message: "Could not save settings to your account. Nothing was saved on this device." };
  return { data: merged };
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
