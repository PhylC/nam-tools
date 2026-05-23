"use client";

import { useEffect, useMemo, useState } from "react";
import { Field, ResultGrid } from "./Shell";
import { useAptMode } from "./AptMode";
import type { QuickCalculatorId } from "../data/quickCalculators";
import {
  readCalculatorDefaults,
  saveCalculatorDefaults,
  retailTaxBasisToVatBasis,
  vatBasisToRetailTaxBasis,
} from "../../lib/proSettings";

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const money2 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const number = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat("en-GB", {
  style: "percent",
  maximumFractionDigits: 1,
});

const currencyChoices = [
  { label: "GBP (£)", value: "GBP", symbol: "£" },
  { label: "EUR (€)", value: "EUR", symbol: "€" },
  { label: "USD ($)", value: "USD", symbol: "$" },
  { label: "CAD (C$)", value: "CAD", symbol: "C$" },
  { label: "AUD (A$)", value: "AUD", symbol: "A$" },
  { label: "NZD (NZ$)", value: "NZD", symbol: "NZ$" },
  { label: "CHF (CHF)", value: "CHF", symbol: "CHF " },
  { label: "SEK (kr)", value: "SEK", symbol: "kr " },
  { label: "NOK (kr)", value: "NOK", symbol: "kr " },
  { label: "DKK (kr)", value: "DKK", symbol: "kr " },
  { label: "PLN (zł)", value: "PLN", symbol: "zł" },
  { label: "JPY (¥)", value: "JPY", symbol: "¥" },
  { label: "ZAR (R)", value: "ZAR", symbol: "R" },
  { label: "Other (¤)", value: "Other", symbol: "¤" },
];

const LAST_USED_CALCULATOR_VALUES_KEY = "aptLastUsedCalculatorValues";
const DISCLAIMER_LINE =
  "Retail selling prices are at the sole discretion of the retailer. Calculations are estimates based on the inputs provided.";

type CsvRow = { label: string; value: string | number };

function readLastUsedCalculatorValues(id: string) {
  if (typeof window === "undefined") return {};
  try {
    const saved = JSON.parse(window.localStorage.getItem(LAST_USED_CALCULATOR_VALUES_KEY) ?? "{}") as Record<string, Record<string, string>>;
    return saved[id] ?? {};
  } catch {
    return {};
  }
}

function writeLastUsedCalculatorValues(id: string, values: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    const saved = JSON.parse(window.localStorage.getItem(LAST_USED_CALCULATOR_VALUES_KEY) ?? "{}") as Record<string, Record<string, string>>;
    window.localStorage.setItem(LAST_USED_CALCULATOR_VALUES_KEY, JSON.stringify({ ...saved, [id]: values }));
  } catch {
    window.localStorage.setItem(LAST_USED_CALCULATOR_VALUES_KEY, JSON.stringify({ [id]: values }));
  }
}

function csvEscape(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function downloadCsv(filename: string, rows: CsvRow[]) {
  const csv = rows.map((row) => `${csvEscape(row.label)},${csvEscape(row.value)}`).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function slugifyFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function formatCurrencyValue(value: number, currencyCode: string, digits: number) {
  const selected = currencyChoices.find((item) => item.value === currencyCode) ?? currencyChoices[0];
  const formatted = new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

  return `${selected.symbol}${formatted}`;
}

function num(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rate(value: string) {
  return num(value) / 100;
}

function safePercent(value: number) {
  return Number.isFinite(value) ? percent.format(value) : "n/a";
}

function hasValues(values: string[]) {
  return values.every((value) => value.trim() !== "");
}

function InfoLabel({
  label,
  info,
  required,
}: {
  label: string;
  info?: string;
  required?: boolean;
}) {
  const status = required ? "Required" : "Optional";

  if (!info) {
    return (
      <span className="field-label">
        <span>{label}</span>
        <span className={required ? "field-status field-required" : "field-status"}>
          {status}
        </span>
      </span>
    );
  }

  return (
    <span className="field-label">
      <span>{label}</span>
      <span className={required ? "field-status field-required" : "field-status"}>
        {status}
      </span>
      <span aria-label={`${label}: ${info}`} className="info-dot" tabIndex={0}>
        i
        <span className="info-tooltip" role="tooltip">
          {info}
        </span>
      </span>
    </span>
  );
}

function NumericInput({
  label,
  help,
  value,
  onChange,
  placeholder,
  required = true,
  step = "0.01",
}: {
  label: string;
  help: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <Field label={<InfoLabel label={label} info={help} required={required} />} help={help}>
      <input
        type="number"
        min="0"
        placeholder={placeholder}
        required={required}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function TextInput({
  label,
  help,
  value,
  onChange,
  multiline,
  required = true,
}: {
  label: string;
  help: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <Field label={<InfoLabel label={label} info={help} required={required} />} help={help}>
      {multiline ? (
        <textarea required={required} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input required={required} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </Field>
  );
}

function SelectInput({
  label,
  help,
  value,
  onChange,
  options,
  required = true,
}: {
  label: string;
  help: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  required?: boolean;
}) {
  return (
    <Field label={<InfoLabel label={label} info={help} required={required} />} help={help}>
      <select required={required} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function CopyButton({ text, label = "Copy output" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const [fallbackText, setFallbackText] = useState("");

  async function copy() {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
        return;
      } catch {
        setFallbackText(text);
        return;
      }
    }
    setFallbackText(text);
  }

  return (
    <>
      <button className="button button-secondary copy-button" type="button" onClick={copy}>
        {copied ? "Summary copied." : label}
      </button>
      {fallbackText ? (
        <label className="field copy-fallback">
          <span>Copy this summary</span>
          <textarea value={fallbackText} readOnly onFocus={(event) => event.currentTarget.select()} />
        </label>
      ) : null}
    </>
  );
}

function DownloadCsvButton({
  filename,
  rows,
}: {
  filename: string;
  rows: CsvRow[];
}) {
  return (
    <button className="button button-secondary copy-button" type="button" onClick={() => downloadCsv(filename, rows)}>
      Download CSV
    </button>
  );
}

function LockedProActions() {
  const { aptMode } = useAptMode();
  const [message, setMessage] = useState("");
  const actions = [
    "Save scenario",
    "Compare scenarios",
    "Add another product",
    "Add another scenario",
    "Export to PowerPoint",
    "Export Excel workbook",
    "Use company template",
  ];

  function handleClick() {
    setMessage("APT Pro lets you save, compare and export commercial scenarios without rebuilding the numbers each time.");
  }

  return (
    <section className="locked-pro-actions" aria-label="APT Pro actions">
      <div>
        <span className="pill pro-pill">Pro</span>
        <p>Free calculators are designed for quick one-off checks. APT Pro is for saving, comparing and exporting commercial scenarios.</p>
      </div>
      <div className="locked-action-row">
        {actions.map((action) => (
          <button className="button button-secondary button-small" disabled={aptMode === "pro"} key={action} onClick={handleClick} type="button">
            {action}{aptMode === "pro" ? " · Coming soon" : ""}
          </button>
        ))}
      </div>
      {message && aptMode === "free" ? (
        <div className="locked-card">
          <strong>{message}</strong>
          <a className="text-link" href="/pricing">View APT Pro</a>
        </div>
      ) : null}
    </section>
  );
}

function BadgeRow() {
  return (
    <div className="badge-row" aria-label="Tool access level">
      <span className="pill">Free</span>
      <span className="pill pro-pill">Pro</span>
    </div>
  );
}

function PlanningDisclaimer() {
  return (
    <p className="planning-disclaimer">
      Use this as a commercial planning guide only. Validate numbers before making customer commitments.
    </p>
  );
}

function RetailerPricingCaveat() {
  return (
    <p className="planning-disclaimer">
      Pricing is at the sole discretion of the retailer. Outputs are estimates
      for planning only. Tax treatment varies by market. Retailer/customer
      margin estimates are indicative only and depend on actual buy price,
      retail price, sales tax/VAT/IVA treatment, mechanics and retailer
      accounting.
    </p>
  );
}

function AdvancedAssumptions({ children }: { children: React.ReactNode }) {
  return (
    <details className="advanced-box">
      <summary>Advanced assumptions</summary>
      <div className="form-grid advanced-grid">{children}</div>
    </details>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="insight-panel">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function FreeResult({
  summary,
  children,
}: {
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <div className="result-box">
      <div className="output-header">
        <div>
          <span className="pill">Free result</span>
          <h2>Quick commercial read</h2>
        </div>
        <CopyButton text={summary} />
      </div>
      <PlanningDisclaimer />
      {children}
    </div>
  );
}

function ProPreview({ features }: { features: string[] }) {
  return (
    <aside className="pro-panel">
      <span className="pill pro-pill">Pro</span>
      <h2>Go deeper with Pro</h2>
      <div className="locked-grid" aria-label="Pro features">
        <div className="locked-card">
          <strong>Retailer-friendly view</strong>
          <span>Turn the deal into a clean customer-facing story.</span>
        </div>
        <div className="locked-card">
          <strong>Scenario comparison</strong>
          <span>Compare multiple scenarios side by side.</span>
        </div>
        <div className="locked-card">
          <strong>Save and export</strong>
          <span>Save plans and download PDF/deck-ready outputs.</span>
        </div>
        <div className="locked-card">
          <strong>Team pack</strong>
          <span>Build fuller customer-ready write-ups and team reviews.</span>
        </div>
      </div>
      <ul className="compact-list">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <div className="locked-card">
        <strong>Retailer-friendly Pro story</strong>
        <span>
          Pro will turn the same calculation into a clean customer-facing story,
          showing the commercial upside for the retailer without exposing
          unnecessary internal supplier commentary.
        </span>
      </div>
    </aside>
  );
}

type DealTab = "promo" | "margin" | "spend" | "investment";
type DealMode = "invoice" | "profit" | "retailer";
type SupportMethod = "soa" | "promoInvoice";
type VatBasis = "includes" | "excludes";

const taxBasisOptions = [
  { label: "Includes sales tax / VAT / IVA", value: "includes" },
  { label: "Excludes sales tax / VAT / IVA", value: "excludes" },
];

type CalculatorFieldRequirements = {
  usesCurrency: boolean;
  usesRetailPrice: boolean;
  usesRetailTaxBasis: boolean;
  usesVatRate: boolean;
  usesCogs: boolean;
};

const defaultFieldRequirements: CalculatorFieldRequirements = {
  usesCurrency: true,
  usesRetailPrice: true,
  usesRetailTaxBasis: true,
  usesVatRate: true,
  usesCogs: false,
};

const CALCULATOR_FIELD_REQUIREMENTS: Record<QuickCalculatorId, CalculatorFieldRequirements> = {
  "required-soa-calculator": {
    usesCurrency: true,
    usesRetailPrice: true,
    usesRetailTaxBasis: true,
    usesVatRate: true,
    usesCogs: false,
  },
  "retail-selling-price-calculator": {
    usesCurrency: true,
    usesRetailPrice: false,
    usesRetailTaxBasis: false,
    usesVatRate: true,
    usesCogs: false,
  },
  "actual-retailer-margin-calculator": {
    usesCurrency: true,
    usesRetailPrice: true,
    usesRetailTaxBasis: true,
    usesVatRate: true,
    usesCogs: false,
  },
  "invoice-price-calculator": {
    usesCurrency: true,
    usesRetailPrice: true,
    usesRetailTaxBasis: true,
    usesVatRate: true,
    usesCogs: false,
  },
  "soa-support-percent-calculator": {
    usesCurrency: true,
    usesRetailPrice: true,
    usesRetailTaxBasis: true,
    usesVatRate: true,
    usesCogs: false,
  },
  "promo-invoice-calculator": {
    usesCurrency: true,
    usesRetailPrice: false,
    usesRetailTaxBasis: false,
    usesVatRate: false,
    usesCogs: false,
  },
  "sales-tax-vat-iva-retail-price-converter": {
    usesCurrency: true,
    usesRetailPrice: true,
    usesRetailTaxBasis: true,
    usesVatRate: true,
    usesCogs: false,
  },
  "markup-vs-margin-helper": {
    usesCurrency: true,
    usesRetailPrice: true,
    usesRetailTaxBasis: true,
    usesVatRate: true,
    usesCogs: false,
  },
};

function getCalculatorRequirements(id?: QuickCalculatorId): CalculatorFieldRequirements {
  if (!id) return defaultFieldRequirements;
  return CALCULATOR_FIELD_REQUIREMENTS[id] ?? defaultFieldRequirements;
}

function taxBasisLabel(value: VatBasis) {
  return value === "includes" ? "Includes sales tax / VAT / IVA" : "Excludes sales tax / VAT / IVA";
}

function ContextualCalculatorSettings({
  requirements,
  currencyCode,
  setCurrencyCode,
  vatBasis,
  setVatBasis,
  vatRate,
  setVatRate,
  compact,
}: {
  requirements: CalculatorFieldRequirements;
  currencyCode: string;
  setCurrencyCode: (value: string) => void;
  vatBasis: VatBasis;
  setVatBasis: (value: VatBasis) => void;
  vatRate: string;
  setVatRate: (value: string) => void;
  compact?: boolean;
}) {
  const { aptMode } = useAptMode();
  const [savedMessage, setSavedMessage] = useState("");
  const needsSettings = requirements.usesCurrency || requirements.usesRetailTaxBasis || requirements.usesVatRate;
  const usesTax = requirements.usesRetailTaxBasis || requirements.usesVatRate;
  const showRetailTaxNote = requirements.usesRetailPrice && requirements.usesRetailTaxBasis;

  if (!needsSettings) return null;

  function saveDefaults() {
    const current = readCalculatorDefaults();
    saveCalculatorDefaults({
      ...current,
      currency: currencyCode,
      retailTaxBasis: vatBasisToRetailTaxBasis(vatBasis),
      taxRate: Number(vatRate) || 0,
    });
    setSavedMessage("Default calculator settings saved.");
    window.setTimeout(() => setSavedMessage(""), 2200);
  }

  function rememberDefaults(next: Partial<ReturnType<typeof readCalculatorDefaults>>) {
    const current = readCalculatorDefaults();
    saveCalculatorDefaults({ ...current, ...next });
  }

  return (
    <section className={compact ? "card quick-settings-card quick-settings-card-compact" : "input-section settings-section"} aria-label={usesTax ? "Currency and tax settings" : "Currency"}>
      <div className="input-section-header">
        <span className="pill">Settings</span>
        <h3>{usesTax ? "Currency and tax settings" : "Currency"}</h3>
        <p>
          {usesTax
            ? "Used where retail prices are included in the calculation. Margin estimates use excluding-tax retail price."
            : "Used for formatting results only. This does not convert exchange rates."}
        </p>
      </div>
      <div className="form-grid">
        {requirements.usesCurrency ? (
          <SelectInput
            label="Currency"
            help="Currency is for formatting only. This tool does not convert exchange rates."
            value={currencyCode}
            onChange={(value) => {
              setCurrencyCode(value);
              rememberDefaults({ currency: value });
            }}
            options={currencyChoices.map(({ label, value }) => ({ label, value }))}
          />
        ) : null}
        {requirements.usesRetailTaxBasis ? (
          <SelectInput
            label="Retail price tax basis"
            help="Choose whether retail selling prices entered in this calculator include or exclude sales tax / VAT / IVA."
            value={vatBasis}
            onChange={(value) => {
              const next = value as VatBasis;
              setVatBasis(next);
              rememberDefaults({ retailTaxBasis: vatBasisToRetailTaxBasis(next) });
            }}
            options={taxBasisOptions}
          />
        ) : null}
        {requirements.usesVatRate ? (
          <NumericInput
            label="Sales tax / VAT / IVA rate %"
            help={
              requirements.usesRetailPrice
                ? "Used to convert retail selling prices to excluding-tax values for margin estimates."
                : "Used to show the including-tax retail price."
            }
            placeholder="e.g. 20"
            value={vatRate}
            onChange={(value) => {
              setVatRate(value);
              rememberDefaults({ taxRate: Number(value) || 0 });
            }}
          />
        ) : null}
      </div>
      {showRetailTaxNote ? (
        <p className="form-note">
          Retailer prices are often discussed including sales tax / VAT / IVA,
          but margin is usually assessed excluding tax. This tool converts the
          entered price where needed.
        </p>
      ) : null}
      <div className="settings-save-row">
        {aptMode === "pro" ? (
          <button className="button button-secondary button-small" type="button" onClick={saveDefaults}>
            Save as my default
          </button>
        ) : null}
        <small>Free: remembered on this device. Pro: saved to your account and used across calculators and exports.</small>
      </div>
      {savedMessage ? <p className="settings-message settings-message-success">{savedMessage}</p> : null}
    </section>
  );
}

const dealTabs: { id: DealTab; label: string }[] = [
  { id: "promo", label: "Quick invoice view" },
  { id: "investment", label: "Supplier profit view" },
  { id: "margin", label: "Retailer view" },
  { id: "spend", label: "Trade spend / investment" },
];

function dealTabTitle(tab: DealTab) {
  return dealTabs.find((item) => item.id === tab)?.label ?? "Deal summary";
}

function CalculationDetail({
  summary,
  children,
}: {
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <details className="advanced-box calculation-detail">
      <summary>Show calculation detail</summary>
      <div className="detail-content">
        {children}
        <CopyButton text={summary} label="Copy detailed calculation" />
      </div>
    </details>
  );
}

function DealProPreview() {
  return (
    <aside className="pro-panel">
      <span className="pill pro-pill">Pro</span>
      <h2>Go deeper with Pro deal planning</h2>
      <div className="locked-grid locked-grid-three" aria-label="Pro features">
        <div className="locked-card">
          <strong>Excel import/export</strong>
          <span>Paste SKU or customer rows and export the finished deal view.</span>
        </div>
        <div className="locked-card">
          <strong>Scenario comparison</strong>
          <span>Compare mechanics, support levels and volume assumptions side by side.</span>
        </div>
        <div className="locked-card">
          <strong>Retailer-ready deck output</strong>
          <span>Create a cleaner customer-facing story with charts and notes.</span>
        </div>
      </div>
    </aside>
  );
}

export function CommercialDealCalculator({ defaultTab = "promo" }: { defaultTab?: DealTab }) {
  const { aptMode } = useAptMode();
  const storageId = `commercial-deal-calculator-${defaultTab}`;
  const lastUsed = readLastUsedCalculatorValues(storageId);
  const savedDefaults = readCalculatorDefaults();
  const [exampleMessage, setExampleMessage] = useState("");
  const [activeTab, setActiveTab] = useState<DealTab>(defaultTab);
  const [dealMode, setDealMode] = useState<DealMode>("invoice");
  const [supportMethod, setSupportMethod] = useState<SupportMethod>("promoInvoice");
  const [currencyCode, setCurrencyCode] = useState(lastUsed.currency ?? savedDefaults.currency);
  const [baselineUnits, setBaselineUnits] = useState(lastUsed.baselineUnits ?? "");
  const [promoUnits, setPromoUnits] = useState(lastUsed.promoUnits ?? "");
  const [srp, setSrp] = useState(lastUsed.srp ?? "");
  const [promoSrp, setPromoSrp] = useState(lastUsed.promoSrp ?? "");
  const [cogs, setCogs] = useState(lastUsed.cogs ?? "");
  const [soa, setSoa] = useState(lastUsed.soa ?? "");
  const [promoInvoicePrice, setPromoInvoicePrice] = useState(lastUsed.promoInvoicePrice ?? "");
  const [fixedCost, setFixedCost] = useState(lastUsed.fixedCost ?? "");
  const [retailerBuyPrice, setRetailerBuyPrice] = useState(lastUsed.retailerBuyPrice ?? "");
  const [retailerVatBasis, setRetailerVatBasis] = useState<VatBasis>((lastUsed.retailerVatBasis as VatBasis) ?? retailTaxBasisToVatBasis(savedDefaults.retailTaxBasis));
  const [vatRate, setVatRate] = useState(lastUsed.vatRate ?? String(savedDefaults.taxRate || ""));
  const [averageDiscount, setAverageDiscount] = useState(lastUsed.averageDiscount ?? "");
  const [rebate, setRebate] = useState(lastUsed.rebate ?? "");
  const [marketingContribution, setMarketingContribution] = useState(lastUsed.marketingContribution ?? "");
  const [expectedUplift, setExpectedUplift] = useState(lastUsed.expectedUplift ?? "");
  const [grossMargin, setGrossMargin] = useState(lastUsed.grossMargin ?? "");
  const [requestedInvestment, setRequestedInvestment] = useState(lastUsed.requestedInvestment ?? "");
  const [probability, setProbability] = useState(lastUsed.probability ?? "");
  const [cannibalisation, setCannibalisation] = useState(lastUsed.cannibalisation ?? "");
  const [postPromoDip, setPostPromoDip] = useState(lastUsed.postPromoDip ?? "");
  const [retailerMarginRequirement, setRetailerMarginRequirement] = useState(lastUsed.retailerMarginRequirement ?? "");
  const [contractMonths, setContractMonths] = useState(lastUsed.contractMonths ?? "");
  const [otherDeductions, setOtherDeductions] = useState(lastUsed.otherDeductions ?? "");
  const [retentionValue, setRetentionValue] = useState(lastUsed.retentionValue ?? "");

  const currency = useMemo(
    () => ({ format: (value: number) => formatCurrencyValue(value, currencyCode, 0) }),
    [currencyCode],
  );
  const money2 = useMemo(
    () => ({ format: (value: number) => formatCurrencyValue(value, currencyCode, 2) }),
    [currencyCode],
  );

  useEffect(() => {
    if (aptMode !== "free") return;
    writeLastUsedCalculatorValues(storageId, {
      currency: currencyCode,
      baselineUnits,
      promoUnits,
      srp,
      promoSrp,
      cogs,
      soa,
      promoInvoicePrice,
      fixedCost,
      retailerBuyPrice,
      retailerVatBasis,
      vatRate,
      averageDiscount,
      rebate,
      marketingContribution,
      expectedUplift,
      grossMargin,
      requestedInvestment,
      probability,
      cannibalisation,
      postPromoDip,
      retailerMarginRequirement,
      contractMonths,
      otherDeductions,
      retentionValue,
    });
  }, [
    storageId,
    aptMode,
    currencyCode,
    baselineUnits,
    promoUnits,
    srp,
    promoSrp,
    cogs,
    soa,
    promoInvoicePrice,
    fixedCost,
    retailerBuyPrice,
    retailerVatBasis,
    vatRate,
    averageDiscount,
    rebate,
    marketingContribution,
    expectedUplift,
    grossMargin,
    requestedInvestment,
    probability,
    cannibalisation,
    postPromoDip,
    retailerMarginRequirement,
    contractMonths,
    otherDeductions,
    retentionValue,
  ]);

  function loadDealExample() {
    setCurrencyCode("GBP");
    setBaselineUnits("2500");
    setPromoUnits("5000");
    setRetailerBuyPrice("10.00");
    setPromoInvoicePrice("8.50");
    setSoa("0.50");
    setCogs("5.25");
    setFixedCost("2000");
    setSrp("14.99");
    setPromoSrp("11.99");
    setRetailerVatBasis("includes");
    setVatRate("20");
    setRetailerMarginRequirement("30");
    setCannibalisation("5");
    setPostPromoDip("2");
    setExampleMessage("Example loaded. Adjust the numbers to match your deal.");
    window.setTimeout(() => setExampleMessage(""), 2600);
  }

  function chooseDealMode(nextMode: DealMode) {
    setDealMode(nextMode);
    if (nextMode === "retailer") {
      setSupportMethod("soa");
      setActiveTab("margin");
      return;
    }
    setSupportMethod("promoInvoice");
    setActiveTab(nextMode === "profit" ? "investment" : "promo");
  }

  const result = useMemo(() => {
    const baseline = num(baselineUnits);
    const units = num(promoUnits);
    const srpEntered = num(srp);
    const promoSrpEntered = num(promoSrp);
    const vatRateValue = rate(vatRate);
    const srpValue =
      retailerVatBasis === "includes"
        ? srpEntered / (1 + vatRateValue)
        : srpEntered;
    const promoSrpValue =
      retailerVatBasis === "includes"
        ? promoSrpEntered / (1 + vatRateValue)
        : promoSrpEntered;
    const cogsValue = num(cogs);
    const fixed = num(fixedCost);
    const retailerBuy = num(retailerBuyPrice);
    const enteredSoa = num(soa);
    const enteredPromoInvoice = num(promoInvoicePrice);
    const soaPerUnit =
      supportMethod === "soa" ? enteredSoa : retailerBuy - enteredPromoInvoice;
    const effectivePromoInvoice =
      supportMethod === "soa" ? retailerBuy - enteredSoa : enteredPromoInvoice;
    const retailerSellOutEntered = promoSrpEntered;
    const retailerSellOutExVat = promoSrpValue;
    const incrementalUnits = units - baseline;
    const cannibalisedUnits = Math.max(0, incrementalUnits) * rate(cannibalisation);
    const postPromoDipUnits = units * rate(postPromoDip);
    const netIncrementalUnits = incrementalUnits - cannibalisedUnits - postPromoDipUnits;
    const baselineInvoiceRevenue = baseline * retailerBuy;
    const promoInvoiceRevenue = units * effectivePromoInvoice;
    const invoiceRevenueImpact = promoInvoiceRevenue - baselineInvoiceRevenue;
    const baseGpPerUnit = retailerBuy - cogsValue;
    const baseGm = retailerBuy > 0 ? baseGpPerUnit / retailerBuy : 0;
    const baseTotalGp = baseGpPerUnit * baseline;
    const baselineGrossProfit = baseGpPerUnit * baseline;
    const promoGpBeforeSoaPerUnit = effectivePromoInvoice - cogsValue;
    const promoGmBeforeSoa = effectivePromoInvoice > 0 ? promoGpBeforeSoaPerUnit / effectivePromoInvoice : 0;
    const soaValue = units * soaPerUnit;
    const soaRate = srpValue > 0 ? soaPerUnit / srpValue : 0;
    const totalInvestment = soaValue + fixed;
    const promoGpBeforeInvestment = units * promoGpBeforeSoaPerUnit;
    const incrementalGpBeforeInvestment = promoGpBeforeInvestment - baselineGrossProfit;
    const netProfitImpact = incrementalGpBeforeInvestment - fixed;
    const roi = totalInvestment > 0 ? netProfitImpact / totalInvestment : 0;
    const breakEvenIncrementalUnits = totalInvestment / Math.max(baseGpPerUnit, 0.01);
    const promoGpAfterSoaPerUnit = effectivePromoInvoice - cogsValue;
    const promoGmAfterSoa = effectivePromoInvoice > 0 ? promoGpAfterSoaPerUnit / effectivePromoInvoice : 0;
    const promoGpAfterSoaFixed = promoGpAfterSoaPerUnit * units - fixed;
    const gpChangeVsBase = promoGpAfterSoaFixed - baseTotalGp;
    const retailerGrossSales = units * retailerSellOutExVat;
    const retailerCostOfGoods = units * effectivePromoInvoice;
    const supplierFundingReceived = totalInvestment;
    const retailerGpBeforeFunding = retailerGrossSales - retailerCostOfGoods;
    const retailerEstimatedProfitAfterFunding = retailerGpBeforeFunding + fixed;
    const retailerCashProfitPerUnitBeforeFunding = srpValue - retailerBuy;
    const retailerCashProfitPerUnitAfterFunding =
      retailerSellOutExVat - effectivePromoInvoice + (units > 0 ? fixed / units : 0);
    const retailerMarginBeforeFunding =
      srpValue > 0 ? retailerCashProfitPerUnitBeforeFunding / srpValue : 0;
    const retailerMarginAfterFunding =
      retailerSellOutExVat > 0 ? retailerCashProfitPerUnitAfterFunding / retailerSellOutExVat : 0;
    const retailerSupportedMargin = promoSrpValue > 0 ? soaPerUnit / promoSrpValue : 0;
    const retailerMarginGapVsRequirement = rate(retailerMarginRequirement) - retailerMarginAfterFunding;
    const grossSales = promoInvoiceRevenue;
    const invoiceSales = promoInvoiceRevenue;
    const variableDiscountValue = grossSales * rate(averageDiscount);
    const rebateValue = grossSales * rate(rebate);
    const otherDeductionValue = grossSales * rate(otherDeductions);
    const totalTradeSpend =
      variableDiscountValue + rebateValue + fixed + num(marketingContribution) + otherDeductionValue;
    const netSalesAfterTradeSpend = grossSales - totalTradeSpend;
    const tradeSpendGrossRate = grossSales > 0 ? totalTradeSpend / grossSales : 0;
    const tradeSpendInvoiceRate = invoiceSales > 0 ? totalTradeSpend / invoiceSales : 0;
    const investmentValue = grossSales * rate(requestedInvestment);
    const expectedIncrementalRevenue = grossSales * rate(expectedUplift);
    const expectedGrossProfit = expectedIncrementalRevenue * rate(grossMargin);
    const probabilityAdjustedRevenue = expectedIncrementalRevenue * rate(probability);
    const probabilityAdjustedNetImpact =
      probabilityAdjustedRevenue * rate(grossMargin) + num(retentionValue) - investmentValue;
    const monthlyPayback = num(contractMonths) > 0 ? probabilityAdjustedNetImpact / num(contractMonths) : 0;
    const investmentRecommendation =
      probabilityAdjustedNetImpact > investmentValue * 0.15
        ? "Support"
        : probabilityAdjustedNetImpact >= 0
          ? "Negotiate"
          : "Reject / reshape";
    const promoVerdict =
      netProfitImpact < 0 && retailerEstimatedProfitAfterFunding > 0
        ? "Retailer-friendly but supplier-heavy"
        : roi > 0.25 && netProfitImpact > totalInvestment * 0.25
          ? "Strong commercial shape"
          : netProfitImpact >= 0
            ? "Works, but watch assumptions"
            : "Loss-making unless strategic";
    const marginVerdict =
      promoGmAfterSoa < 0 || promoGpAfterSoaFixed < 0
        ? "Risky"
        : promoGmAfterSoa < baseGm - 0.1 || gpChangeVsBase < 0
          ? "Thin"
          : "Healthy";
    const spendIntensity =
      tradeSpendGrossRate > 0.25 ? "heavy" : tradeSpendGrossRate > 0.12 ? "normal" : "light";
    const invoiceVerdict =
      invoiceRevenueImpact >= totalInvestment
        ? "Revenue impact covers support"
        : invoiceRevenueImpact >= 0
          ? "Positive revenue, check payback"
          : "Revenue falls, needs a strategic reason";

    return {
      netIncrementalUnits,
      baselineInvoiceRevenue,
      promoInvoiceRevenue,
      invoiceRevenueImpact,
      effectivePromoInvoice,
      soaValue,
      soaPerUnit,
      soaRate,
      fixed,
      totalInvestment,
      baselineGrossProfit,
      incrementalGpBeforeInvestment,
      netProfitImpact,
      roi,
      breakEvenIncrementalUnits,
      retailerGrossSales,
      retailBaseEntered: srpEntered,
      retailBaseExTax: srpValue,
      retailerSellOutEntered,
      retailerSellOutExVat,
      vatRateValue,
      retailerCostOfGoods,
      retailerGpBeforeFunding,
      supplierFundingReceived,
      retailerEstimatedProfitAfterFunding,
      retailerMarginBeforeFunding,
      retailerMarginAfterFunding,
      retailerCashProfitPerUnitAfterFunding,
      baseGm,
      baseGpPerUnit,
      baseTotalGp,
      promoGmBeforeSoa,
      promoGmAfterSoa,
      promoGpAfterSoaFixed,
      gpChangeVsBase,
      retailerSupportedMargin,
      retailerMarginGapVsRequirement,
      grossSales,
      invoiceSales,
      variableDiscountValue,
      rebateValue,
      marketingContributionValue: num(marketingContribution),
      otherDeductionValue,
      totalTradeSpend,
      netSalesAfterTradeSpend,
      tradeSpendGrossRate,
      tradeSpendInvoiceRate,
      investmentValue,
      expectedIncrementalRevenue,
      expectedGrossProfit,
      probabilityAdjustedRevenue,
      probabilityAdjustedNetImpact,
      monthlyPayback,
      investmentRecommendation,
      promoVerdict,
      invoiceVerdict,
      marginVerdict,
      spendIntensity,
    };
  }, [
    baselineUnits,
    promoUnits,
    srp,
    promoSrp,
    cogs,
    soa,
    promoInvoicePrice,
    fixedCost,
    retailerBuyPrice,
    retailerVatBasis,
    vatRate,
    supportMethod,
    averageDiscount,
    rebate,
    marketingContribution,
    expectedUplift,
    grossMargin,
    requestedInvestment,
    probability,
    cannibalisation,
    postPromoDip,
    retailerMarginRequirement,
    contractMonths,
    otherDeductions,
    retentionValue,
  ]);

  const retailerVatBasisLabel = taxBasisLabel(retailerVatBasis);
  const retailerVatSummary = `Retail selling price before promotion entered: ${money2.format(result.retailBaseEntered)} (${retailerVatBasisLabel}); excluding-tax value used: ${money2.format(result.retailBaseExTax)}. Promotional retail selling price entered: ${money2.format(result.retailerSellOutEntered)} (${retailerVatBasisLabel}); sales tax / VAT / IVA rate: ${safePercent(result.vatRateValue)}; excluding-tax value used for retailer margin: ${money2.format(result.retailerSellOutExVat)}. Currency is for formatting only. This tool does not convert exchange rates.`;
  const supportInputReady = supportMethod === "soa" ? hasValues([soa]) : hasValues([promoInvoicePrice]);
  const hasInvoiceInputs = hasValues([baselineUnits, promoUnits, retailerBuyPrice]) && supportInputReady;
  const hasProfitInputs = hasInvoiceInputs && hasValues([cogs]);
  const hasRetailerInputs =
    hasInvoiceInputs && hasValues([srp, promoSrp, retailerMarginRequirement, vatRate]);
  const activeTabReady =
    activeTab === "promo"
      ? hasInvoiceInputs
      : activeTab === "investment"
        ? hasProfitInputs
        : activeTab === "margin"
          ? hasRetailerInputs
          : hasInvoiceInputs;
  const activePrompt =
    activeTab === "investment"
      ? "Add supplier COGS to calculate profit impact and ROI."
      : activeTab === "margin"
        ? "Add retail selling prices to estimate the retailer/customer view."
        : "Enter the required fields to see your result.";

  const retailerVerdict =
    result.retailerMarginAfterFunding >= rate(retailerMarginRequirement)
      ? "Retailer view looks supported"
      : "Retailer margin may need checking";

  const simpleSummaries: Record<DealTab, string> = {
    promo: `Quick invoice deal summary
Verdict: ${result.invoiceVerdict}
Baseline invoice revenue: ${currency.format(result.baselineInvoiceRevenue)}
Promo invoice revenue: ${currency.format(result.promoInvoiceRevenue)}
Revenue impact: ${currency.format(result.invoiceRevenueImpact)}
SOA / supplier support per unit: ${money2.format(result.soaPerUnit)}
Promotional invoice price: ${money2.format(result.effectivePromoInvoice)}
Total supplier support: ${currency.format(result.totalInvestment)}
Pricing is at the sole discretion of the retailer. Outputs are estimates for planning only.`,
    margin: `Retailer view summary
Verdict: ${retailerVerdict}
Retailer estimated profit: ${currency.format(result.retailerEstimatedProfitAfterFunding)}
Retailer margin after support: ${safePercent(result.retailerMarginAfterFunding)}
SOA / supplier support received: ${currency.format(result.supplierFundingReceived)}
Retailer cash profit per unit: ${money2.format(result.retailerCashProfitPerUnitAfterFunding)}
${retailerVatSummary}
Pricing is at the sole discretion of the retailer. Outputs are estimates for planning only.`,
    spend: `Trade spend summary
Spend level: ${result.spendIntensity}
Total trade spend: ${currency.format(result.totalTradeSpend)}
Net sales after trade spend: ${currency.format(result.netSalesAfterTradeSpend)}
Trade spend % of gross sales: ${safePercent(result.tradeSpendGrossRate)}
SOA / supplier support per unit: ${money2.format(result.soaPerUnit)}
Promotional invoice price: ${money2.format(result.effectivePromoInvoice)}
Pricing is at the sole discretion of the retailer. Outputs are estimates for planning only.`,
    investment: `Supplier profit summary
Verdict: ${result.promoVerdict}
Gross profit before: ${currency.format(result.baselineGrossProfit)}
Gross profit during promotion: ${currency.format(result.promoGpAfterSoaFixed)}
Net profit impact: ${currency.format(result.netProfitImpact)}
ROI: ${safePercent(result.roi)}
SOA / supplier support per unit: ${money2.format(result.soaPerUnit)}
Promotional invoice price: ${money2.format(result.effectivePromoInvoice)}
Pricing is at the sole discretion of the retailer. Outputs are estimates for planning only.`,
  };

  const detailedSummaries: Record<DealTab, string> = {
    promo: `${simpleSummaries.promo}
Net incremental units: ${number.format(result.netIncrementalUnits)}
SOA / supplier support value: ${currency.format(result.soaValue)}
Fixed supplier support: ${currency.format(result.fixed)}
Effective promo invoice price: ${money2.format(result.effectivePromoInvoice)}`,
    margin: `${simpleSummaries.margin}
Retailer gross sales excluding tax: ${currency.format(result.retailerGrossSales)}
Retailer invoice/buy value: ${currency.format(result.retailerCostOfGoods)}
Retailer profit before support: ${currency.format(result.retailerGpBeforeFunding)}
Retailer margin before support: ${safePercent(result.retailerMarginBeforeFunding)}
Retailer margin gap vs target: ${safePercent(result.retailerMarginGapVsRequirement)}`,
    spend: `${simpleSummaries.spend}
Gross sales value: ${currency.format(result.grossSales)}
Variable discount value: ${currency.format(result.variableDiscountValue)}
Rebate/overrider value: ${currency.format(result.rebateValue)}
Marketing contribution: ${currency.format(result.marketingContributionValue)}
Other deductions: ${currency.format(result.otherDeductionValue)}
Trade spend % of invoice sales: ${safePercent(result.tradeSpendInvoiceRate)}`,
    investment: `${simpleSummaries.investment}
Baseline invoice revenue: ${currency.format(result.baselineInvoiceRevenue)}
Promo invoice revenue: ${currency.format(result.promoInvoiceRevenue)}
Break-even incremental units: ${number.format(result.breakEvenIncrementalUnits)}
Fixed supplier support: ${currency.format(result.fixed)}`,
  };

  const tabSummaries: Record<DealTab, string> = {
    promo:
      result.invoiceRevenueImpact >= 0
        ? `The promoted period is estimated to generate ${currency.format(result.invoiceRevenueImpact)} more invoice revenue than the baseline period. Check whether that is enough for the support being invested.`
        : `The promoted period is estimated to generate ${currency.format(Math.abs(result.invoiceRevenueImpact))} less invoice revenue than baseline. It needs a strategic reason or stronger volume.`,
    margin: `The retailer/customer is estimated to make ${currency.format(result.retailerEstimatedProfitAfterFunding)} after supplier support. Pricing remains entirely at retailer discretion.`,
    spend: `Total trade spend is ${currency.format(result.totalTradeSpend)}, equal to ${safePercent(result.tradeSpendGrossRate)} of gross sales. High spend should buy a clear customer commitment.`,
    investment:
      result.netProfitImpact >= 0
        ? `This deal is estimated to create ${currency.format(result.netProfitImpact)} after fixed support. Check whether the assumptions are realistic before committing.`
        : `This deal is estimated to lose ${currency.format(Math.abs(result.netProfitImpact))} after fixed support. It needs a strategic reason or a better mechanic.`,
  };
  const tabExplanations: Record<DealTab, string> = {
    promo: "This shows whether the additional volume and revenue are enough to offset the reduced price and support investment.",
    margin: "This shows the estimated margin based on the inputs provided. If retail prices include tax, the excluding-tax price is used for margin estimates.",
    spend: "This helps estimate how much funding is being added to the deal and whether that support is fixed, per unit or both.",
    investment: "This adds COGS and fixed support to show whether the promotion creates enough supplier return after investment.",
  };
  const dealInputsForCsv: CsvRow[] = [
    { label: "Currency", value: currencyCode },
    { label: "Baseline units", value: baselineUnits },
    { label: "Promo units", value: promoUnits },
    { label: "Current invoice price", value: retailerBuyPrice },
    { label: "Promo invoice price", value: promoInvoicePrice },
    { label: "Support per unit / SOA", value: soa },
    { label: "Current SRP", value: srp },
    { label: "Promo SRP", value: promoSrp },
    { label: "COGS", value: cogs },
    { label: "Fixed support", value: fixedCost || "0" },
    { label: "Retail price tax basis", value: retailerVatBasisLabel },
    { label: "Sales tax / VAT / IVA rate", value: vatRate },
  ];
  const dealOutputsForCsv: Record<DealTab, CsvRow[]> = {
    promo: [
      { label: "Baseline invoice revenue", value: currency.format(result.baselineInvoiceRevenue) },
      { label: "Promo invoice revenue", value: currency.format(result.promoInvoiceRevenue) },
      { label: "Revenue impact", value: currency.format(result.invoiceRevenueImpact) },
      { label: "Total support", value: currency.format(result.totalInvestment) },
      { label: "Effective promo invoice price", value: money2.format(result.effectivePromoInvoice) },
    ],
    margin: [
      { label: "Retailer estimated profit", value: currency.format(result.retailerEstimatedProfitAfterFunding) },
      { label: "Retailer margin after support", value: safePercent(result.retailerMarginAfterFunding) },
      { label: "Retailer cash profit per unit", value: money2.format(result.retailerCashProfitPerUnitAfterFunding) },
    ],
    spend: [
      { label: "Total trade spend", value: currency.format(result.totalTradeSpend) },
      { label: "Trade spend % of gross sales", value: safePercent(result.tradeSpendGrossRate) },
      { label: "Net sales after support", value: currency.format(result.netSalesAfterTradeSpend) },
    ],
    investment: [
      { label: "Gross profit before", value: currency.format(result.baselineGrossProfit) },
      { label: "Gross profit during promotion", value: currency.format(result.promoGpAfterSoaFixed) },
      { label: "Net profit impact", value: currency.format(result.netProfitImpact) },
      { label: "ROI", value: safePercent(result.roi) },
    ],
  };
  const dealCsvRows = [
    { label: "Calculator name", value: dealTabTitle(activeTab) },
    { label: "Timestamp", value: new Date().toISOString() },
    ...dealInputsForCsv,
    ...dealOutputsForCsv[activeTab],
    { label: "Summary", value: simpleSummaries[activeTab] },
    { label: "Disclaimer", value: DISCLAIMER_LINE },
  ];

  return (
    <article className="card tool-form commercial-deal-calculator">
      <BadgeRow />
      <section className="deal-input-panel" aria-label="Shared commercial deal inputs">
        <div>
          <span className="pill">60-second inputs</span>
          <h2>Start with the few numbers most account managers already have.</h2>
          <p className="form-intro">
            Required fields are enough for a quick result. Optional fields
            improve the estimate.
          </p>
        </div>
        <div className="summary-actions">
          <button className="button button-secondary button-small" onClick={loadDealExample} type="button">
            Load example
          </button>
        </div>
        {exampleMessage ? <p className="settings-message settings-message-success">{exampleMessage}</p> : null}
        <RetailerPricingCaveat />
        <ContextualCalculatorSettings
          requirements={{
            usesCurrency: true,
            usesRetailPrice: dealMode === "retailer",
            usesRetailTaxBasis: dealMode === "retailer",
            usesVatRate: dealMode === "retailer",
            usesCogs: dealMode === "profit",
          }}
          currencyCode={currencyCode}
          setCurrencyCode={setCurrencyCode}
          vatBasis={retailerVatBasis}
          setVatBasis={setRetailerVatBasis}
          vatRate={vatRate}
          setVatRate={setVatRate}
        />
        <section className="input-section" aria-label="Promotion and price inputs">
          <div className="input-section-header">
            <h3>What are you trying to calculate?</h3>
            <p>Choose the closest deal type. The calculator will only ask for the fields that fit that check.</p>
          </div>
          <div className="mode-grid" role="radiogroup" aria-label="ROI tool mode">
            {[
              {
                id: "invoice" as DealMode,
                title: "Quick invoice deal check",
                description:
                  "I know invoice price before, promo invoice price and volumes. Show revenue impact and support.",
              },
              {
                id: "profit" as DealMode,
                title: "Profit / COGS deal check",
                description:
                  "I also know COGS and want to estimate profit impact and ROI.",
              },
              {
                id: "retailer" as DealMode,
                title: "Retailer margin and SOA check",
                description:
                  "I want to estimate retailer margin, SOA needed or promo invoice impact.",
              },
            ].map((mode) => (
              <button
                aria-checked={dealMode === mode.id}
                className={dealMode === mode.id ? "mode-card mode-card-active" : "mode-card"}
                key={mode.id}
                onClick={() => chooseDealMode(mode.id)}
                role="radio"
                type="button"
              >
                <strong>{mode.title}</strong>
                <span>{mode.description}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="input-section" aria-label="Supplier support input method">
          <div className="input-section-header">
            <h3>How do you want to enter supplier support?</h3>
          </div>
          <div className="segmented-control" role="radiogroup" aria-label="Supplier support input method">
            <button
              aria-checked={supportMethod === "soa"}
              className={supportMethod === "soa" ? "tab-button tab-button-active" : "tab-button"}
              onClick={() => setSupportMethod("soa")}
              role="radio"
              type="button"
            >
              SOA / supplier support per unit
            </button>
            <button
              aria-checked={supportMethod === "promoInvoice"}
              className={supportMethod === "promoInvoice" ? "tab-button tab-button-active" : "tab-button"}
              onClick={() => setSupportMethod("promoInvoice")}
              role="radio"
              type="button"
            >
              Promo invoice price
            </button>
          </div>
        </section>
        <section className="input-section" aria-label="Promotion and price inputs">
          <div className="input-section-header">
            <h3>Promotion and price inputs</h3>
          </div>
          <div className="form-grid">
            <NumericInput label="Baseline units before promotion" help="Estimated units sold in the normal comparison period before the promotion." placeholder="e.g. 10,000" value={baselineUnits} onChange={setBaselineUnits} step="1" />
            <NumericInput label="Forecast units during promotion" help="Expected units sold during the promotion or deal period." placeholder="e.g. 18,000" value={promoUnits} onChange={setPromoUnits} step="1" />
            <NumericInput label="Retailer invoice/buy price before promotion" help="The price the retailer/customer pays the supplier per unit before the promotion." placeholder="e.g. 1.75" value={retailerBuyPrice} onChange={setRetailerBuyPrice} />
            {supportMethod === "soa" ? (
              <NumericInput label="SOA / supplier support per unit" help="Supplier-funded support per unit, such as saving on allowance, off-invoice support, scan support or per-unit promotional funding." placeholder="e.g. 0.35" value={soa} onChange={setSoa} />
            ) : (
              <NumericInput label="Promotional retailer invoice/buy price" help="Effective invoice/buy price during the promotion after supplier support." placeholder="e.g. 1.40" value={promoInvoicePrice} onChange={setPromoInvoicePrice} />
            )}
            {dealMode === "profit" ? (
              <NumericInput label="Supplier COGS per unit" help="Your internal cost of goods sold per unit. This is not the retailer invoice price." placeholder="e.g. 1.10" value={cogs} onChange={setCogs} />
            ) : null}
            {dealMode !== "profit" ? null : (
              <NumericInput label="Fixed supplier support" help="Fixed investment such as media, feature fee, activation support, listing support or lump-sum customer funding." placeholder="e.g. 2,500" required={false} value={fixedCost} onChange={setFixedCost} />
            )}
            {dealMode !== "profit" ? (
              <NumericInput label="Fixed supplier support" help="Fixed investment such as media, feature fee, activation support, listing support or lump-sum customer funding." placeholder="e.g. 2,500" required={false} value={fixedCost} onChange={setFixedCost} />
            ) : null}
            {dealMode === "retailer" || dealMode === "invoice" ? (
              <NumericInput label="Retail selling price before promotion" help="The normal shopper/end-customer price. Uses the tax setting above." placeholder="e.g. 2.50" required={dealMode === "retailer"} value={srp} onChange={setSrp} />
            ) : null}
            {dealMode === "retailer" || dealMode === "invoice" ? (
              <NumericInput label="Promotional retail selling price" help="The promotional shopper/end-customer price. Uses the tax setting above. Pricing is at the sole discretion of the retailer." placeholder="e.g. 2.00" required={dealMode === "retailer"} value={promoSrp} onChange={setPromoSrp} />
            ) : null}
            {dealMode === "retailer" ? (
              <NumericInput label="Retailer margin target %" help="Target retailer/customer margin for a quick sense-check." placeholder="e.g. 25" value={retailerMarginRequirement} onChange={setRetailerMarginRequirement} />
            ) : null}
          </div>
        </section>
        <AdvancedAssumptions>
          <NumericInput label="Estimated cannibalisation %" help="Sales that may switch from your other products." placeholder="e.g. 10" required={false} value={cannibalisation} onChange={setCannibalisation} />
          <NumericInput label="Estimated post-promo dip %" help="Sales that may be pulled forward from after the event." placeholder="e.g. 2" required={false} value={postPromoDip} onChange={setPostPromoDip} />
          <NumericInput label="Average invoice discount %" help="Average discount or price support applied to invoice sales." placeholder="e.g. 12" required={false} value={averageDiscount} onChange={setAverageDiscount} />
          <NumericInput label="Rebate / overrider %" help="Back-end terms as a percentage of sales." placeholder="e.g. 3" required={false} value={rebate} onChange={setRebate} />
          <NumericInput label="Marketing contribution" help="Retail media, shopper or activation contribution." placeholder="e.g. 2,500" required={false} value={marketingContribution} onChange={setMarketingContribution} />
          <NumericInput label="Expected sales uplift %" help="Expected uplift from the ask or plan." placeholder="e.g. 8" required={false} value={expectedUplift} onChange={setExpectedUplift} />
          <NumericInput label="Supplier gross margin %" help="Supplier margin to apply to expected uplift." placeholder="e.g. 32" required={false} value={grossMargin} onChange={setGrossMargin} />
          <NumericInput label="Requested investment %" help="Customer ask as a percentage of deal value." placeholder="e.g. 3" required={false} value={requestedInvestment} onChange={setRequestedInvestment} />
          <NumericInput label="Probability of success %" help="Confidence the uplift will happen." placeholder="e.g. 65" required={false} value={probability} onChange={setProbability} />
          <NumericInput label="Contract length in months" help="Period for the investment ask." placeholder="e.g. 12" required={false} value={contractMonths} onChange={setContractMonths} step="1" />
          <NumericInput label="Other deductions %" help="Extra deductions to include in trade spend." placeholder="e.g. 1" required={false} value={otherDeductions} onChange={setOtherDeductions} />
          <NumericInput label="Retention value" help="Optional value of defending current business." placeholder="e.g. 0" required={false} value={retentionValue} onChange={setRetentionValue} />
        </AdvancedAssumptions>
        <details className="advanced-box input-definitions">
          <summary>Input definitions</summary>
          <dl>
            <dt>Retail selling price</dt>
            <dd>The price paid by the shopper/end customer. Retailer pricing is at the sole discretion of the retailer.</dd>
            <dt>Retailer invoice/buy price</dt>
            <dd>The price the retailer/customer pays the supplier per unit before any shopper retail price is applied.</dd>
            <dt>Supplier COGS</dt>
            <dd>Your internal cost of goods sold per unit. This is not the retailer invoice/buy price.</dd>
            <dt>SOA / supplier support</dt>
            <dd>Supplier-funded per-unit promotional support, such as saving on allowance, off-invoice support or scan support.</dd>
            <dt>Fixed supplier support</dt>
            <dd>Fixed customer funding such as media, feature fees, activation support or lump-sum investment.</dd>
            <dt>Sales tax / VAT / IVA basis</dt>
            <dd>Whether the entered retail selling price includes sales tax / VAT / IVA. Retailer margin is estimated from an excluding-tax retail selling price.</dd>
          </dl>
        </details>
      </section>

      <section className="deal-tabs" aria-label="Commercial deal calculation tabs">
        <div className="tab-list" role="tablist" aria-label="Calculator views">
          {dealTabs.map((tab) => (
            <button
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? "tab-button tab-button-active" : "tab-button"}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTabReady ? (
        <div className="result-box" role="tabpanel">
          <div className="output-header">
            <div>
              <span className="pill">Free result</span>
              <h2>{dealTabTitle(activeTab)}</h2>
            </div>
            <div className="summary-actions">
              <CopyButton text={simpleSummaries[activeTab]} label="Copy summary" />
              <DownloadCsvButton filename={`apt-${slugifyFilename(dealTabTitle(activeTab))}-summary.csv`} rows={dealCsvRows} />
            </div>
          </div>
          <RetailerPricingCaveat />
          {activeTab === "margin" || hasValues([srp, promoSrp, vatRate]) ? (
            <p className="vat-note">{retailerVatSummary}</p>
          ) : null}
          <p className="tab-summary">{tabSummaries[activeTab]}</p>
          <section className="result-explanation">
            <h4>What this means</h4>
            <p className="tab-summary">{tabExplanations[activeTab]}</p>
          </section>

          {activeTab === "promo" && (
            <>
              <ResultGrid
                items={[
                  { label: "Baseline invoice revenue", value: currency.format(result.baselineInvoiceRevenue) },
                  { label: "Promo invoice revenue", value: currency.format(result.promoInvoiceRevenue) },
                  { label: "Revenue impact", value: currency.format(result.invoiceRevenueImpact), tone: result.invoiceRevenueImpact >= 0 ? "good" : "bad" },
                  { label: "Total SOA / supplier support", value: currency.format(result.totalInvestment) },
                  { label: "Effective promo invoice price", value: money2.format(result.effectivePromoInvoice) },
                  { label: "Verdict", value: result.invoiceVerdict, tone: result.invoiceRevenueImpact >= 0 ? "good" : "bad" },
                ]}
              />
              <CalculationDetail summary={detailedSummaries.promo}>
                <ResultGrid
                  items={[
                    { label: "Net incremental units", value: number.format(result.netIncrementalUnits), tone: result.netIncrementalUnits >= 0 ? "good" : "bad" },
                    { label: "SOA / supplier support per unit", value: money2.format(result.soaPerUnit) },
                    { label: "SOA / supplier support value", value: currency.format(result.soaValue) },
                    { label: "Fixed supplier support", value: currency.format(result.fixed) },
                    { label: "Promotional invoice price", value: money2.format(result.effectivePromoInvoice) },
                  ]}
                />
              </CalculationDetail>
            </>
          )}

          {activeTab === "margin" && (
            <>
              <ResultGrid
                items={[
                  { label: "Retailer estimated profit", value: currency.format(result.retailerEstimatedProfitAfterFunding), tone: result.retailerEstimatedProfitAfterFunding >= 0 ? "good" : "bad" },
                  { label: "Retailer margin after support", value: safePercent(result.retailerMarginAfterFunding), tone: result.retailerMarginAfterFunding >= rate(retailerMarginRequirement) ? "good" : "bad" },
                  { label: "SOA / supplier support received", value: currency.format(result.supplierFundingReceived) },
                  { label: "Retailer cash profit per unit", value: money2.format(result.retailerCashProfitPerUnitAfterFunding) },
                  { label: "Retailer verdict", value: retailerVerdict, tone: result.retailerMarginAfterFunding >= rate(retailerMarginRequirement) ? "good" : "neutral" },
                ]}
              />
              <CalculationDetail summary={detailedSummaries.margin}>
                <ResultGrid
                  items={[
                    { label: "Promotional retail selling price entered", value: money2.format(result.retailerSellOutEntered) },
                    { label: "Retail selling price before promotion entered", value: money2.format(result.retailBaseEntered) },
                    { label: "Retail price tax basis", value: retailerVatBasisLabel },
                    { label: "Sales tax / VAT / IVA rate", value: safePercent(result.vatRateValue) },
                    { label: "Retail selling price before promotion excluding tax", value: money2.format(result.retailBaseExTax) },
                    { label: "Promotional retail price excluding tax", value: money2.format(result.retailerSellOutExVat) },
                    { label: "Retailer gross sales excluding tax", value: currency.format(result.retailerGrossSales) },
                    { label: "Retailer invoice/buy value", value: currency.format(result.retailerCostOfGoods) },
                    { label: "Retailer profit before support", value: currency.format(result.retailerGpBeforeFunding), tone: result.retailerGpBeforeFunding >= 0 ? "good" : "bad" },
                    { label: "Retailer margin before support", value: safePercent(result.retailerMarginBeforeFunding) },
                    { label: "Retailer margin gap vs requirement", value: safePercent(result.retailerMarginGapVsRequirement), tone: result.retailerMarginGapVsRequirement > 0 ? "bad" : "good" },
                  ]}
                />
              </CalculationDetail>
            </>
          )}

          {activeTab === "spend" && (
            <>
              <ResultGrid
                items={[
                  { label: "Total trade spend", value: currency.format(result.totalTradeSpend), tone: result.spendIntensity === "heavy" ? "bad" : "neutral" },
                  { label: "Trade spend % of gross sales", value: safePercent(result.tradeSpendGrossRate), tone: result.spendIntensity === "heavy" ? "bad" : "good" },
                  { label: "Net sales after SOA / supplier support", value: currency.format(result.netSalesAfterTradeSpend), tone: result.netSalesAfterTradeSpend >= 0 ? "good" : "bad" },
                  { label: "Variable SOA / supplier support", value: currency.format(result.variableDiscountValue + result.rebateValue + result.otherDeductionValue) },
                  { label: "Fixed supplier support", value: currency.format(result.fixed + result.marketingContributionValue) },
                ]}
              />
              <CalculationDetail summary={detailedSummaries.spend}>
                <ResultGrid
                  items={[
                    { label: "Gross sales value", value: currency.format(result.grossSales) },
                    { label: "Variable discount value", value: currency.format(result.variableDiscountValue) },
                    { label: "Rebate/overrider value", value: currency.format(result.rebateValue) },
                    { label: "Marketing contribution", value: currency.format(result.marketingContributionValue) },
                    { label: "Other deductions", value: currency.format(result.otherDeductionValue) },
                    { label: "Trade spend % of invoice sales", value: safePercent(result.tradeSpendInvoiceRate) },
                  ]}
                />
              </CalculationDetail>
            </>
          )}

          {activeTab === "investment" && (
            <>
              <ResultGrid
                items={[
                  { label: "Gross profit before", value: currency.format(result.baselineGrossProfit) },
                  { label: "Gross profit during promotion", value: currency.format(result.promoGpAfterSoaFixed) },
                  { label: "Net profit impact", value: currency.format(result.netProfitImpact), tone: result.netProfitImpact >= 0 ? "good" : "bad" },
                  { label: "ROI", value: safePercent(result.roi), tone: result.roi >= 0 ? "good" : "bad" },
                  { label: "Break-even units", value: number.format(result.breakEvenIncrementalUnits) },
                  { label: "Verdict", value: result.promoVerdict, tone: result.netProfitImpact >= 0 ? "good" : "bad" },
                ]}
              />
              <CalculationDetail summary={detailedSummaries.investment}>
                <ResultGrid
                  items={[
                    { label: "Probability-adjusted revenue", value: currency.format(result.probabilityAdjustedRevenue) },
                    { label: "Monthly payback / contract period view", value: currency.format(result.monthlyPayback), tone: result.monthlyPayback >= 0 ? "good" : "bad" },
                    { label: "Retention value", value: currency.format(num(retentionValue)) },
                  ]}
                />
              </CalculationDetail>
            </>
          )}
          <LockedProActions />
        </div>
        ) : (
        <div className="result-box empty-result" role="tabpanel">
          <div>
            <span className="pill">Free result</span>
            <h2>{dealTabTitle(activeTab)}</h2>
          </div>
          <p className="empty-state">{activePrompt}</p>
        </div>
        )}
      </section>

      <DealProPreview />
    </article>
  );
}

export function PromotionRoiCalculator() {
  return <CommercialDealCalculator defaultTab="promo" />;
}

export function TradeSpendCalculator() {
  return <CommercialDealCalculator defaultTab="spend" />;
}

export function GrossMarginCalculator() {
  return <CommercialDealCalculator defaultTab="margin" />;
}

export function TermsInvestmentCalculator() {
  return <CommercialDealCalculator defaultTab="investment" />;
}

function vatAdjustedPrice(price: number, basis: VatBasis, vat: number) {
  const exVat = basis === "includes" ? price / (1 + vat) : price;
  return {
    entered: price,
    basis,
    exVat,
    incVat: basis === "includes" ? price : price * (1 + vat),
    vatAmount: basis === "includes" ? price - exVat : price * vat,
  };
}

function QuickCalculatorCard({
  id,
  title,
  question,
  children,
  summary,
  inputs,
  results,
  explanation,
  isReady,
  onLoadExample,
  exampleMessage,
}: {
  id?: string;
  title: string;
  question: string;
  children: React.ReactNode;
  summary: string;
  inputs?: CsvRow[];
  results: { label: string; value: string; tone?: "good" | "bad" | "neutral" }[];
  explanation?: React.ReactNode;
  isReady: boolean;
  onLoadExample?: () => void;
  exampleMessage?: string;
}) {
  const csvRows = [
    { label: "Calculator name", value: title },
    { label: "Timestamp", value: new Date().toISOString() },
    ...(inputs ?? []),
    ...results.map((item) => ({ label: item.label, value: item.value })),
    { label: "Summary", value: summary },
    { label: "Disclaimer", value: DISCLAIMER_LINE },
  ];
  const defaultExplanation =
    explanation ??
    (id?.includes("margin") || id === "markup-vs-margin-helper" ? (
      <p className="tab-summary">
        This shows the estimated margin based on the inputs provided. If retail prices include tax, the excluding-tax price is used for margin estimates.
      </p>
    ) : id?.includes("soa") || id === "promo-invoice-calculator" ? (
      <p className="tab-summary">
        This helps estimate how much funding is being added to the deal and whether that support is fixed, per unit or both.
      </p>
    ) : id === "sales-tax-vat-iva-retail-price-converter" ? (
      <p className="tab-summary">
        This converts retail prices between including-tax and excluding-tax views so margin checks use the right price basis.
      </p>
    ) : (
      <p className="tab-summary">
        This is a revenue view only. It does not include COGS, margin impact or retailer profitability.
      </p>
    ));

  return (
    <article className="card quick-calculator-card" id={id}>
      <div className="output-header">
        <div>
          <span className="pill">Quick calculator</span>
          <h2>{title}</h2>
          <p>{question}</p>
        </div>
        {onLoadExample ? (
          <button className="button button-secondary button-small" onClick={onLoadExample} type="button">
            Load example
          </button>
        ) : null}
      </div>
      {exampleMessage ? <p className="settings-message settings-message-success">{exampleMessage}</p> : null}
      <div className="form-grid">{children}</div>
      <div className="result-box">
        {isReady ? (
          <>
            <div className="output-header">
              <h3>Answer</h3>
              <div className="summary-actions">
                <CopyButton text={summary} label="Copy summary" />
                <DownloadCsvButton filename={`apt-${slugifyFilename(title)}-summary.csv`} rows={csvRows} />
              </div>
            </div>
            <section className="result-explanation">
              <h4>What this means</h4>
              {defaultExplanation}
            </section>
            <ResultGrid items={results} />
            <RetailerPricingCaveat />
            <LockedProActions />
          </>
        ) : (
          <p className="empty-state">Enter the required fields to see your result.</p>
        )}
      </div>
    </article>
  );
}

export function QuickCommercialCalculators({ only }: { only?: QuickCalculatorId } = {}) {
  const { aptMode } = useAptMode();
  const storageId = only ?? "quick-commercial-calculators";
  const lastUsed = readLastUsedCalculatorValues(storageId);
  const savedDefaults = readCalculatorDefaults();
  const [exampleMessage, setExampleMessage] = useState<{ id?: QuickCalculatorId; text: string }>({ text: "" });
  const [currencyCode, setCurrencyCode] = useState(lastUsed.currency ?? savedDefaults.currency);
  const [quickRetailTaxBasis, setQuickRetailTaxBasis] = useState<VatBasis>((lastUsed.retailTaxBasis as VatBasis) ?? retailTaxBasisToVatBasis(savedDefaults.retailTaxBasis));
  const [quickTaxRate, setQuickTaxRate] = useState(lastUsed.taxRate ?? String(savedDefaults.taxRate || ""));
  const [soaInvoice, setSoaInvoice] = useState(lastUsed.soaInvoice ?? "");
  const [soaRetail, setSoaRetail] = useState(lastUsed.soaRetail ?? "");
  const [soaMargin, setSoaMargin] = useState(lastUsed.soaMargin ?? "");
  const [soaFixed, setSoaFixed] = useState(lastUsed.soaFixed ?? "");

  const requiredSoa = useMemo(() => {
    const retail = vatAdjustedPrice(num(soaRetail), quickRetailTaxBasis, rate(quickTaxRate));
    const requiredCost = retail.exVat * (1 - rate(soaMargin));
    const support = num(soaInvoice) - requiredCost;
    const promoInvoice = num(soaInvoice) - support;
    return {
      retail,
      requiredCost,
      support,
      promoInvoice,
      supportInvoiceRate: num(soaInvoice) > 0 ? support / num(soaInvoice) : 0,
      supportRetailRate: retail.exVat > 0 ? support / retail.exVat : 0,
    };
  }, [soaInvoice, soaRetail, quickRetailTaxBasis, quickTaxRate, soaMargin]);

  const [rspInvoice, setRspInvoice] = useState(lastUsed.rspInvoice ?? "");
  const [rspMargin, setRspMargin] = useState(lastUsed.rspMargin ?? "");

  const retailFromInvoice = useMemo(() => {
    const exVat = num(rspInvoice) / Math.max(1 - rate(rspMargin), 0.01);
    const incVat = exVat * (1 + rate(quickTaxRate));
    return { exVat, incVat, cashMargin: exVat - num(rspInvoice), margin: exVat > 0 ? (exVat - num(rspInvoice)) / exVat : 0 };
  }, [rspInvoice, rspMargin, quickTaxRate]);

  const [actualInvoice, setActualInvoice] = useState(lastUsed.actualInvoice ?? "");
  const [actualMode, setActualMode] = useState(lastUsed.actualMode ?? "soa");
  const [actualSupport, setActualSupport] = useState(lastUsed.actualSupport ?? "");
  const [actualPromoInvoice, setActualPromoInvoice] = useState(lastUsed.actualPromoInvoice ?? "");
  const [actualRetail, setActualRetail] = useState(lastUsed.actualRetail ?? "");
  const [actualFixed, setActualFixed] = useState(lastUsed.actualFixed ?? "");
  const [actualUnits, setActualUnits] = useState(lastUsed.actualUnits ?? "");

  const actualMargin = useMemo(() => {
    const retail = vatAdjustedPrice(num(actualRetail), quickRetailTaxBasis, rate(quickTaxRate));
    const effectiveCost = actualMode === "soa" ? num(actualInvoice) - num(actualSupport) : num(actualPromoInvoice);
    const perUnitSupport = actualMode === "soa" ? num(actualSupport) : num(actualInvoice) - num(actualPromoInvoice);
    const cashMargin = retail.exVat - effectiveCost;
    const units = num(actualUnits);
    return {
      retail,
      effectiveCost,
      cashMargin,
      margin: retail.exVat > 0 ? cashMargin / retail.exVat : 0,
      totalRetailerProfit: units > 0 ? cashMargin * units + num(actualFixed) : 0,
      totalSupport: units > 0 ? perUnitSupport * units + num(actualFixed) : 0,
    };
  }, [actualInvoice, actualMode, actualSupport, actualPromoInvoice, actualRetail, quickRetailTaxBasis, quickTaxRate, actualFixed, actualUnits]);

  const [invoiceRetail, setInvoiceRetail] = useState(lastUsed.invoiceRetail ?? "");
  const [invoiceMargin, setInvoiceMargin] = useState(lastUsed.invoiceMargin ?? "");

  const impliedInvoice = useMemo(() => {
    const retail = vatAdjustedPrice(num(invoiceRetail), quickRetailTaxBasis, rate(quickTaxRate));
    const invoice = retail.exVat * (1 - rate(invoiceMargin));
    return { retail, invoice, cashMargin: retail.exVat - invoice };
  }, [invoiceRetail, quickRetailTaxBasis, quickTaxRate, invoiceMargin]);

  const [supportValue, setSupportValue] = useState(lastUsed.supportValue ?? "");
  const [supportInvoice, setSupportInvoice] = useState(lastUsed.supportInvoice ?? "");
  const [supportRetail, setSupportRetail] = useState(lastUsed.supportRetail ?? "");

  const supportPercent = useMemo(() => {
    const retail = vatAdjustedPrice(num(supportRetail), quickRetailTaxBasis, rate(quickTaxRate));
    return {
      retail,
      invoiceRate: num(supportInvoice) > 0 ? num(supportValue) / num(supportInvoice) : 0,
      exVatRate: retail.exVat > 0 ? num(supportValue) / retail.exVat : 0,
      incVatRate: retail.incVat > 0 ? num(supportValue) / retail.incVat : 0,
    };
  }, [supportValue, supportInvoice, supportRetail, quickRetailTaxBasis, quickTaxRate]);

  const [promoInvoiceCurrent, setPromoInvoiceCurrent] = useState(lastUsed.promoInvoiceCurrent ?? "");
  const [promoInvoiceSupport, setPromoInvoiceSupport] = useState(lastUsed.promoInvoiceSupport ?? "");
  const [promoInvoiceUnits, setPromoInvoiceUnits] = useState(lastUsed.promoInvoiceUnits ?? "");

  const promoInvoice = useMemo(() => {
    const effective = num(promoInvoiceCurrent) - num(promoInvoiceSupport);
    return {
      effective,
      totalSupport: num(promoInvoiceUnits) > 0 ? num(promoInvoiceSupport) * num(promoInvoiceUnits) : 0,
      supportRate: num(promoInvoiceCurrent) > 0 ? num(promoInvoiceSupport) / num(promoInvoiceCurrent) : 0,
    };
  }, [promoInvoiceCurrent, promoInvoiceSupport, promoInvoiceUnits]);

  const [converterPrice, setConverterPrice] = useState(lastUsed.converterPrice ?? "");
  const convertedVat = useMemo(() => vatAdjustedPrice(num(converterPrice), quickRetailTaxBasis, rate(quickTaxRate)), [converterPrice, quickRetailTaxBasis, quickTaxRate]);

  const [markupCost, setMarkupCost] = useState(lastUsed.markupCost ?? "");
  const [markupRetail, setMarkupRetail] = useState(lastUsed.markupRetail ?? "");
  const markup = useMemo(() => {
    const retail = vatAdjustedPrice(num(markupRetail), quickRetailTaxBasis, rate(quickTaxRate));
    const profit = retail.exVat - num(markupCost);
    return {
      retail,
      profit,
      margin: retail.exVat > 0 ? profit / retail.exVat : 0,
      markup: num(markupCost) > 0 ? profit / num(markupCost) : 0,
    };
  }, [markupCost, markupRetail, quickRetailTaxBasis, quickTaxRate]);

  useEffect(() => {
    if (aptMode !== "free") return;
    writeLastUsedCalculatorValues(storageId, {
      currency: currencyCode,
      retailTaxBasis: quickRetailTaxBasis,
      taxRate: quickTaxRate,
      soaInvoice,
      soaRetail,
      soaMargin,
      soaFixed,
      rspInvoice,
      rspMargin,
      actualInvoice,
      actualMode,
      actualSupport,
      actualPromoInvoice,
      actualRetail,
      actualFixed,
      actualUnits,
      invoiceRetail,
      invoiceMargin,
      supportValue,
      supportInvoice,
      supportRetail,
      promoInvoiceCurrent,
      promoInvoiceSupport,
      promoInvoiceUnits,
      converterPrice,
      markupCost,
      markupRetail,
    });
  }, [
    storageId,
    aptMode,
    currencyCode,
    quickRetailTaxBasis,
    quickTaxRate,
    soaInvoice,
    soaRetail,
    soaMargin,
    soaFixed,
    rspInvoice,
    rspMargin,
    actualInvoice,
    actualMode,
    actualSupport,
    actualPromoInvoice,
    actualRetail,
    actualFixed,
    actualUnits,
    invoiceRetail,
    invoiceMargin,
    supportValue,
    supportInvoice,
    supportRetail,
    promoInvoiceCurrent,
    promoInvoiceSupport,
    promoInvoiceUnits,
    converterPrice,
    markupCost,
    markupRetail,
  ]);

  function markExampleLoaded(id: QuickCalculatorId) {
    setExampleMessage({ id, text: "Example loaded. Adjust the numbers to match your deal." });
    window.setTimeout(() => setExampleMessage({ text: "" }), 2600);
  }

  function loadExample(id: QuickCalculatorId) {
    if (id !== "promo-invoice-calculator") {
      setCurrencyCode("GBP");
      setQuickRetailTaxBasis("includes");
      setQuickTaxRate("20");
    }
    if (id === "required-soa-calculator") {
      setSoaInvoice("10.00");
      setSoaRetail("14.99");
      setSoaMargin("30");
      setSoaFixed("2000");
    }
    if (id === "retail-selling-price-calculator") {
      setRspInvoice("10.00");
      setRspMargin("30");
      setQuickTaxRate("20");
    }
    if (id === "actual-retailer-margin-calculator") {
      setActualInvoice("10.00");
      setActualMode("promoInvoice");
      setActualSupport("0.50");
      setActualPromoInvoice("8.50");
      setActualRetail("11.99");
      setActualFixed("2000");
      setActualUnits("5000");
    }
    if (id === "invoice-price-calculator") {
      setInvoiceRetail("14.99");
      setInvoiceMargin("30");
    }
    if (id === "soa-support-percent-calculator") {
      setSupportValue("0.50");
      setSupportInvoice("10.00");
      setSupportRetail("14.99");
    }
    if (id === "promo-invoice-calculator") {
      setCurrencyCode("GBP");
      setPromoInvoiceCurrent("10.00");
      setPromoInvoiceSupport("0.50");
      setPromoInvoiceUnits("5000");
    }
    if (id === "sales-tax-vat-iva-retail-price-converter") {
      setConverterPrice("14.99");
    }
    if (id === "markup-vs-margin-helper") {
      setMarkupCost("10.00");
      setMarkupRetail("14.99");
    }
    markExampleLoaded(id);
  }

  const currency = useMemo(
    () => ({ format: (value: number) => formatCurrencyValue(value, currencyCode, 0) }),
    [currencyCode],
  );
  const money2 = useMemo(
    () => ({ format: (value: number) => formatCurrencyValue(value, currencyCode, 2) }),
    [currencyCode],
  );

  const quickTaxBasisLabel = taxBasisLabel(quickRetailTaxBasis);
  const quickTaxSummary = `Retail price tax basis: ${quickTaxBasisLabel}. Sales tax / VAT / IVA rate: ${safePercent(rate(quickTaxRate))}.`;
  const shouldShow = (id: QuickCalculatorId) => !only || only === id;
  const calculatorRequirements = getCalculatorRequirements(only);
  const hasQuickTax = hasValues([quickTaxRate]);
  const ready = {
    requiredSoa: hasValues([soaInvoice, soaRetail, soaMargin]) && hasQuickTax,
    retailFromInvoice: hasValues([rspInvoice, rspMargin]) && hasQuickTax,
    actualMargin:
      hasValues([
        actualInvoice,
        actualMode === "soa" ? actualSupport : actualPromoInvoice,
        actualRetail,
      ]) && hasQuickTax,
    impliedInvoice: hasValues([invoiceRetail, invoiceMargin]) && hasQuickTax,
    supportPercent: hasValues([supportValue, supportInvoice, supportRetail]) && hasQuickTax,
    promoInvoice: hasValues([promoInvoiceCurrent, promoInvoiceSupport]),
    convertedVat: hasValues([converterPrice]) && hasQuickTax,
    markup: hasValues([markupCost, markupRetail]) && hasQuickTax,
  };

  return (
    <div className="quick-calculator-list">
      <ContextualCalculatorSettings
        compact
        requirements={calculatorRequirements}
        currencyCode={currencyCode}
        setCurrencyCode={setCurrencyCode}
        vatBasis={quickRetailTaxBasis}
        setVatBasis={setQuickRetailTaxBasis}
        vatRate={quickTaxRate}
        setVatRate={setQuickTaxRate}
      />
      {shouldShow("required-soa-calculator") ? (
      <QuickCalculatorCard
        id="required-soa-calculator"
        isReady={ready.requiredSoa}
        title="Required SOA Calculator"
        question="I have current invoice price, promotional retail selling price and target retailer margin. What SOA or promo invoice is needed?"
        onLoadExample={() => loadExample("required-soa-calculator")}
        exampleMessage={exampleMessage.id === "required-soa-calculator" ? exampleMessage.text : ""}
        inputs={[
          { label: "Currency", value: currencyCode },
          { label: "Current retailer invoice/buy price", value: soaInvoice },
          { label: "Promotional retail selling price", value: soaRetail },
          { label: "Target retailer margin %", value: soaMargin },
          { label: "Optional fixed supplier support", value: soaFixed || "0" },
          { label: "Retail price tax basis", value: quickTaxBasisLabel },
          { label: "Sales tax / VAT / IVA rate", value: quickTaxRate },
        ]}
        summary={`Required SOA: ${money2.format(requiredSoa.support)} per unit. Promo invoice: ${money2.format(requiredSoa.promoInvoice)}. Entered promotional retail selling price: ${money2.format(requiredSoa.retail.entered)}. ${quickTaxSummary} Retail price excluding tax used: ${money2.format(requiredSoa.retail.exVat)}. Pricing is at the sole discretion of the retailer. Currency is for formatting only; this tool does not convert exchange rates.`}
        results={[
          { label: "Entered retail price", value: money2.format(requiredSoa.retail.entered) },
          { label: "Retail price tax basis", value: quickTaxBasisLabel },
          { label: "Retail price excluding tax", value: money2.format(requiredSoa.retail.exVat) },
          { label: "Required retailer cost price", value: money2.format(requiredSoa.requiredCost) },
          { label: "Required SOA per unit", value: money2.format(requiredSoa.support), tone: requiredSoa.support >= 0 ? "neutral" : "bad" },
          { label: "New effective promo invoice price", value: money2.format(requiredSoa.promoInvoice) },
          { label: "SOA % of current invoice", value: safePercent(requiredSoa.supportInvoiceRate) },
          { label: "SOA % of promo retail price", value: safePercent(requiredSoa.supportRetailRate) },
        ]}
      >
        <NumericInput label="Current retailer invoice/buy price" help="Current price the retailer pays the supplier per unit." placeholder="e.g. 1.75" value={soaInvoice} onChange={setSoaInvoice} />
        <NumericInput label="Promotional retail selling price" help="Promo price paid by the shopper/end customer. Uses the tax setting above." placeholder="e.g. 2.00" value={soaRetail} onChange={setSoaRetail} />
        <NumericInput label="Target retailer margin %" help="Retailer/customer target margin on excluding-tax retail selling price." placeholder="e.g. 25" value={soaMargin} onChange={setSoaMargin} />
        <NumericInput label="Optional fixed supplier support" help="Fixed support to remember separately. Not included in per-unit SOA." placeholder="e.g. 0" required={false} value={soaFixed} onChange={setSoaFixed} />
      </QuickCalculatorCard>
      ) : null}

      {shouldShow("retail-selling-price-calculator") ? (
      <QuickCalculatorCard
        id="retail-selling-price-calculator"
        isReady={ready.retailFromInvoice}
        title="Retail Selling Price from Invoice + Margin"
        question="Estimate retail/sale price from invoice price and target retailer margin."
        onLoadExample={() => loadExample("retail-selling-price-calculator")}
        exampleMessage={exampleMessage.id === "retail-selling-price-calculator" ? exampleMessage.text : ""}
        inputs={[
          { label: "Currency", value: currencyCode },
          { label: "Retailer invoice/buy price", value: rspInvoice },
          { label: "Target retailer margin %", value: rspMargin },
          { label: "Sales tax / VAT / IVA rate", value: quickTaxRate },
        ]}
        summary={`Estimated retail/sale price excluding sales tax / VAT / IVA: ${money2.format(retailFromInvoice.exVat)}. Estimated retail/sale price including sales tax / VAT / IVA: ${money2.format(retailFromInvoice.incVat)}. Margin: ${safePercent(retailFromInvoice.margin)}. Pricing is at the sole discretion of the retailer.`}
        results={[
          { label: "Estimated retail/sale price excluding sales tax / VAT / IVA", value: money2.format(retailFromInvoice.exVat) },
          { label: "Estimated retail/sale price including sales tax / VAT / IVA", value: money2.format(retailFromInvoice.incVat) },
          { label: "Sales tax / VAT / IVA rate", value: safePercent(rate(quickTaxRate)) },
          { label: "Cash margin per unit", value: money2.format(retailFromInvoice.cashMargin) },
          { label: "Margin %", value: safePercent(retailFromInvoice.margin) },
        ]}
      >
        <NumericInput label="Retailer invoice/buy price" help="Price the retailer pays the supplier per unit." placeholder="e.g. 1.75" value={rspInvoice} onChange={setRspInvoice} />
        <NumericInput label="Target retailer margin %" help="Target margin on excluding-tax retail selling price." placeholder="e.g. 25" value={rspMargin} onChange={setRspMargin} />
      </QuickCalculatorCard>
      ) : null}

      {shouldShow("actual-retailer-margin-calculator") ? (
      <QuickCalculatorCard
        id="actual-retailer-margin-calculator"
        isReady={ready.actualMargin}
        title="Actual Retailer Margin Calculator"
        question="I know the invoice price, SOA/promo invoice and promo retail price. What margin is the retailer actually making?"
        onLoadExample={() => loadExample("actual-retailer-margin-calculator")}
        exampleMessage={exampleMessage.id === "actual-retailer-margin-calculator" ? exampleMessage.text : ""}
        inputs={[
          { label: "Currency", value: currencyCode },
          { label: "Normal retailer invoice/buy price", value: actualInvoice },
          { label: "Support input mode", value: actualMode },
          { label: "SOA / supplier support per unit", value: actualSupport },
          { label: "Promo invoice price", value: actualPromoInvoice },
          { label: "Promotional retail selling price", value: actualRetail },
          { label: "Fixed support", value: actualFixed || "0" },
          { label: "Units", value: actualUnits || "0" },
          { label: "Retail price tax basis", value: quickTaxBasisLabel },
          { label: "Sales tax / VAT / IVA rate", value: quickTaxRate },
        ]}
        summary={`Retailer margin: ${safePercent(actualMargin.margin)}. Effective retailer cost: ${money2.format(actualMargin.effectiveCost)}. Retailer cash margin/unit: ${money2.format(actualMargin.cashMargin)}. Entered promotional retail selling price: ${money2.format(actualMargin.retail.entered)}. ${quickTaxSummary} Retail price excluding tax used: ${money2.format(actualMargin.retail.exVat)}. Pricing is at the sole discretion of the retailer.`}
        results={[
          { label: "Entered retail price", value: money2.format(actualMargin.retail.entered) },
          { label: "Retail price tax basis", value: quickTaxBasisLabel },
          { label: "Retail price excluding tax", value: money2.format(actualMargin.retail.exVat) },
          { label: "Effective retailer cost price", value: money2.format(actualMargin.effectiveCost) },
          { label: "Retailer cash margin per unit", value: money2.format(actualMargin.cashMargin), tone: actualMargin.cashMargin >= 0 ? "good" : "bad" },
          { label: "Retailer margin %", value: safePercent(actualMargin.margin), tone: actualMargin.margin >= 0 ? "good" : "bad" },
          { label: "Total retailer cash profit", value: num(actualUnits) > 0 ? currency.format(actualMargin.totalRetailerProfit) : "Enter units" },
          { label: "Total supplier support", value: num(actualUnits) > 0 ? currency.format(actualMargin.totalSupport) : "Enter units" },
        ]}
      >
        <NumericInput label="Normal retailer invoice/buy price" help="Normal price the retailer pays the supplier per unit." placeholder="e.g. 1.75" value={actualInvoice} onChange={setActualInvoice} />
        <SelectInput label="Support input mode" help="Use SOA per unit or enter the final promo invoice price." value={actualMode} onChange={setActualMode} options={[{ label: "SOA / supplier support", value: "soa" }, { label: "Promo invoice price", value: "promoInvoice" }]} />
        <NumericInput label="SOA / supplier support per unit" help="Per-unit support funded by the supplier." placeholder="e.g. 0.35" required={actualMode === "soa"} value={actualSupport} onChange={setActualSupport} />
        <NumericInput label="Promo invoice price" help="Effective invoice/buy price during the promotion." placeholder="e.g. 1.40" required={actualMode === "promoInvoice"} value={actualPromoInvoice} onChange={setActualPromoInvoice} />
        <NumericInput label="Promotional retail selling price" help="Promo price paid by the shopper/end customer. Uses the tax setting above." placeholder="e.g. 2.00" value={actualRetail} onChange={setActualRetail} />
        <NumericInput label="Fixed support" help="Optional fixed supplier support." placeholder="e.g. 0" required={false} value={actualFixed} onChange={setActualFixed} />
        <NumericInput label="Units" help="Optional units for total profit/support." placeholder="e.g. 10,000" required={false} value={actualUnits} onChange={setActualUnits} step="1" />
      </QuickCalculatorCard>
      ) : null}

      {shouldShow("invoice-price-calculator") ? (
      <QuickCalculatorCard
        id="invoice-price-calculator"
        isReady={ready.impliedInvoice}
        title="Invoice Price from Retail Price + Margin"
        question="Calculate the implied retailer invoice/buy price from retail price and target margin."
        onLoadExample={() => loadExample("invoice-price-calculator")}
        exampleMessage={exampleMessage.id === "invoice-price-calculator" ? exampleMessage.text : ""}
        inputs={[
          { label: "Currency", value: currencyCode },
          { label: "Retail selling price", value: invoiceRetail },
          { label: "Target retailer margin %", value: invoiceMargin },
          { label: "Retail price tax basis", value: quickTaxBasisLabel },
          { label: "Sales tax / VAT / IVA rate", value: quickTaxRate },
        ]}
        summary={`Implied retailer invoice/buy price: ${money2.format(impliedInvoice.invoice)}. Entered retail selling price: ${money2.format(impliedInvoice.retail.entered)}. ${quickTaxSummary} Retail price excluding tax used: ${money2.format(impliedInvoice.retail.exVat)}. Pricing is at the sole discretion of the retailer.`}
        results={[
          { label: "Entered retail price", value: money2.format(impliedInvoice.retail.entered) },
          { label: "Retail price tax basis", value: quickTaxBasisLabel },
          { label: "Retail price excluding tax", value: money2.format(impliedInvoice.retail.exVat) },
          { label: "Implied retailer invoice/buy price", value: money2.format(impliedInvoice.invoice) },
          { label: "Retailer cash margin per unit", value: money2.format(impliedInvoice.cashMargin) },
        ]}
      >
        <NumericInput label="Retail selling price" help="Price paid by the shopper/end customer. Uses the tax setting above." placeholder="e.g. 2.00" value={invoiceRetail} onChange={setInvoiceRetail} />
        <NumericInput label="Target retailer margin %" help="Target margin on excluding-tax retail price." placeholder="e.g. 25" value={invoiceMargin} onChange={setInvoiceMargin} />
      </QuickCalculatorCard>
      ) : null}

      {shouldShow("soa-support-percent-calculator") ? (
      <QuickCalculatorCard
        id="soa-support-percent-calculator"
        isReady={ready.supportPercent}
        title="SOA % / Support % Calculator"
        question="What percentage support am I giving?"
        onLoadExample={() => loadExample("soa-support-percent-calculator")}
        exampleMessage={exampleMessage.id === "soa-support-percent-calculator" ? exampleMessage.text : ""}
        inputs={[
          { label: "Currency", value: currencyCode },
          { label: "SOA / supplier support per unit", value: supportValue },
          { label: "Retailer invoice/buy price", value: supportInvoice },
          { label: "Retail selling price", value: supportRetail },
          { label: "Retail price tax basis", value: quickTaxBasisLabel },
          { label: "Sales tax / VAT / IVA rate", value: quickTaxRate },
        ]}
        summary={`SOA as % of invoice: ${safePercent(supportPercent.invoiceRate)}. SOA as % of retail price excluding tax: ${safePercent(supportPercent.exVatRate)}. Entered retail selling price: ${money2.format(supportPercent.retail.entered)}. ${quickTaxSummary} Retail price excluding tax used: ${money2.format(supportPercent.retail.exVat)}. Pricing is at the sole discretion of the retailer.`}
        results={[
          { label: "Entered retail price", value: money2.format(supportPercent.retail.entered) },
          { label: "Retail price tax basis", value: quickTaxBasisLabel },
          { label: "Retail price excluding tax", value: money2.format(supportPercent.retail.exVat) },
          { label: "SOA as % of invoice price", value: safePercent(supportPercent.invoiceRate) },
          { label: "SOA as % of retail price excluding tax", value: safePercent(supportPercent.exVatRate) },
          { label: "SOA as % of retail price including tax", value: safePercent(supportPercent.incVatRate) },
        ]}
      >
        <NumericInput label="SOA / supplier support per unit" help="Per-unit support funded by the supplier." placeholder="e.g. 0.35" value={supportValue} onChange={setSupportValue} />
        <NumericInput label="Retailer invoice/buy price" help="Price the retailer pays the supplier per unit." placeholder="e.g. 1.75" value={supportInvoice} onChange={setSupportInvoice} />
        <NumericInput label="Retail selling price" help="Price paid by the shopper/end customer. Uses the tax setting above." placeholder="e.g. 2.00" value={supportRetail} onChange={setSupportRetail} />
      </QuickCalculatorCard>
      ) : null}

      {shouldShow("promo-invoice-calculator") ? (
      <QuickCalculatorCard
        id="promo-invoice-calculator"
        isReady={ready.promoInvoice}
        title="Promo Invoice Calculator"
        question="If I give a per-unit SOA, what is the promo invoice price?"
        onLoadExample={() => loadExample("promo-invoice-calculator")}
        exampleMessage={exampleMessage.id === "promo-invoice-calculator" ? exampleMessage.text : ""}
        inputs={[
          { label: "Currency", value: currencyCode },
          { label: "Current retailer invoice/buy price", value: promoInvoiceCurrent },
          { label: "SOA / supplier support per unit", value: promoInvoiceSupport },
          { label: "Units", value: promoInvoiceUnits || "0" },
        ]}
        summary={`Effective promo invoice price: ${money2.format(promoInvoice.effective)}. Support % of invoice: ${safePercent(promoInvoice.supportRate)}.`}
        results={[
          { label: "Effective promo invoice price", value: money2.format(promoInvoice.effective), tone: promoInvoice.effective >= 0 ? "good" : "bad" },
          { label: "Total supplier support", value: num(promoInvoiceUnits) > 0 ? currency.format(promoInvoice.totalSupport) : "Enter units" },
          { label: "Support % of invoice", value: safePercent(promoInvoice.supportRate) },
        ]}
      >
        <NumericInput label="Current retailer invoice/buy price" help="Current price the retailer pays the supplier per unit." placeholder="e.g. 1.75" value={promoInvoiceCurrent} onChange={setPromoInvoiceCurrent} />
        <NumericInput label="SOA / supplier support per unit" help="Per-unit support funded by the supplier." placeholder="e.g. 0.35" value={promoInvoiceSupport} onChange={setPromoInvoiceSupport} />
        <NumericInput label="Units" help="Optional units for total supplier support." placeholder="e.g. 10,000" required={false} value={promoInvoiceUnits} onChange={setPromoInvoiceUnits} step="1" />
      </QuickCalculatorCard>
      ) : null}

      {shouldShow("sales-tax-vat-iva-retail-price-converter") ? (
      <QuickCalculatorCard
        id="sales-tax-vat-iva-retail-price-converter"
        isReady={ready.convertedVat}
        title="Sales Tax / VAT / IVA Retail Price Converter"
        question="Convert retail price including tax to excluding tax, or excluding tax to including tax."
        onLoadExample={() => loadExample("sales-tax-vat-iva-retail-price-converter")}
        exampleMessage={exampleMessage.id === "sales-tax-vat-iva-retail-price-converter" ? exampleMessage.text : ""}
        inputs={[
          { label: "Currency", value: currencyCode },
          { label: "Retail selling price", value: converterPrice },
          { label: "Retail price tax basis", value: quickTaxBasisLabel },
          { label: "Sales tax / VAT / IVA rate", value: quickTaxRate },
        ]}
        summary={`Entered retail selling price: ${money2.format(convertedVat.entered)}. ${quickTaxSummary} Retail price excluding tax: ${money2.format(convertedVat.exVat)}. Sales tax / VAT / IVA amount: ${money2.format(convertedVat.vatAmount)}. Retail price including tax: ${money2.format(convertedVat.incVat)}. Pricing is at the sole discretion of the retailer.`}
        results={[
          { label: "Entered retail price", value: money2.format(convertedVat.entered) },
          { label: "Retail price tax basis", value: quickTaxBasisLabel },
          { label: "Retail price excluding tax", value: money2.format(convertedVat.exVat) },
          { label: "Sales tax / VAT / IVA amount", value: money2.format(convertedVat.vatAmount) },
          { label: "Retail price including tax", value: money2.format(convertedVat.incVat) },
        ]}
      >
        <NumericInput label="Retail selling price" help="Price paid by the shopper/end customer. Uses the tax setting above." placeholder="e.g. 2.00" value={converterPrice} onChange={setConverterPrice} />
      </QuickCalculatorCard>
      ) : null}

      {shouldShow("markup-vs-margin-helper") ? (
      <QuickCalculatorCard
        id="markup-vs-margin-helper"
        isReady={ready.markup}
        title="Markup vs Margin Helper"
        question="What is the difference between markup and margin on this deal?"
        onLoadExample={() => loadExample("markup-vs-margin-helper")}
        exampleMessage={exampleMessage.id === "markup-vs-margin-helper" ? exampleMessage.text : ""}
        inputs={[
          { label: "Currency", value: currencyCode },
          { label: "Cost / invoice price", value: markupCost },
          { label: "Retail selling price", value: markupRetail },
          { label: "Retail price tax basis", value: quickTaxBasisLabel },
          { label: "Sales tax / VAT / IVA rate", value: quickTaxRate },
        ]}
        summary={`Cash profit: ${money2.format(markup.profit)}. Margin: ${safePercent(markup.margin)}. Markup: ${safePercent(markup.markup)}. Entered retail selling price: ${money2.format(markup.retail.entered)}. ${quickTaxSummary} Retail price excluding tax used: ${money2.format(markup.retail.exVat)}. Pricing is at the sole discretion of the retailer.`}
        results={[
          { label: "Entered retail price", value: money2.format(markup.retail.entered) },
          { label: "Retail price tax basis", value: quickTaxBasisLabel },
          { label: "Retail price excluding tax", value: money2.format(markup.retail.exVat) },
          { label: "Cash profit", value: money2.format(markup.profit), tone: markup.profit >= 0 ? "good" : "bad" },
          { label: "Margin %", value: safePercent(markup.margin), tone: markup.margin >= 0 ? "good" : "bad" },
          { label: "Markup %", value: safePercent(markup.markup), tone: markup.markup >= 0 ? "good" : "bad" },
        ]}
        explanation={<p className="tab-summary">Margin is profit as a percentage of retail selling price excluding tax. Markup is profit as a percentage of cost.</p>}
      >
        <NumericInput label="Cost / invoice price" help="Cost or invoice/buy price used as the base." placeholder="e.g. 1.75" value={markupCost} onChange={setMarkupCost} />
        <NumericInput label="Retail selling price" help="Price paid by the shopper/end customer. Uses the tax setting above." placeholder="e.g. 2.50" value={markupRetail} onChange={setMarkupRetail} />
      </QuickCalculatorCard>
      ) : null}
    </div>
  );
}

export function BuyerMeetingPrepTool() {
  const [customer, setCustomer] = useState("Retailer A");
  const [objective, setObjective] = useState("Secure agreement for a summer promotional plan");
  const [issue, setIssue] = useState("The buyer needs stronger value perception without adding range complexity.");
  const [ask, setAsk] = useState("Approve a 6-week feature and display plan on the core range.");
  const [evidence, setEvidence] = useState("Last event delivered +18% units, 94% availability and positive shopper feedback.");
  const [nextStep, setNextStep] = useState("Agree the mechanic, timing and approval route this week.");

  const sections: [string, string][] = [
    ["Meeting objective", `For ${customer}, the objective is to ${objective.toLowerCase()}. Desired next step: ${nextStep}`],
    ["5-minute opening", `Thanks for making the time. I want to focus on ${issue.toLowerCase()} and show a practical way forward: ${ask}`],
    ["Commercial story", `The case is built on this evidence: ${evidence}. The recommendation is to keep the plan focused, measurable and easy to execute.`],
    ["Likely buyer objections", "The investment is too high.\nThe timing is difficult.\nThe uplift is not proven.\nThe plan adds store workload.\nThere is not enough space or support."],
    ["Suggested responses", "Link the investment to the customer objective.\nOffer a controlled test if full approval is hard.\nUse the evidence and define success measures.\nShow how execution is kept simple.\nAsk what condition would make the plan acceptable."],
    ["Questions to ask the buyer", "What would make this worth approving?\nWhich measure matters most for this event?\nWhat execution risk worries you?\nWhat internal approval is needed?\nWhat timing would work best?"],
    ["Closing ask", `Can we agree ${nextStep.toLowerCase()}?`],
    ["Follow-up email draft", `Thanks for your time today. As discussed, the opportunity is: ${issue}. My proposed ask is: ${ask}. The supporting evidence is: ${evidence}. The next step we discussed is: ${nextStep}.`],
  ];

  return (
    <GeneratorShell
      fields={<>
        <TextInput label="Customer name" help="Retailer, channel or buyer group." value={customer} onChange={setCustomer} />
        <TextInput label="Meeting objective" help="The decision you want from the meeting." value={objective} onChange={setObjective} multiline />
        <TextInput label="Current issue/opportunity" help="The buyer pressure point or growth opportunity." value={issue} onChange={setIssue} multiline />
        <TextInput label="Proposed ask" help="The specific commitment you want." value={ask} onChange={setAsk} multiline />
        <TextInput label="Evidence or numbers" help="The proof you will bring." value={evidence} onChange={setEvidence} multiline />
        <TextInput label="Desired next step" help="The action you want agreed." value={nextStep} onChange={setNextStep} multiline />
      </>}
      sections={sections}
      proFeatures={["Full meeting pack", "Objection handling library", "Senior stakeholder version", "Follow-up email variations", "Negotiation plan"]}
    />
  );
}

export function JbpBuilder() {
  const [customer, setCustomer] = useState("Retailer A");
  const [opportunity, setOpportunity] = useState("Grow premium penetration in high-value missions.");
  const [objective, setObjective] = useState("Deliver profitable category growth over the next 12 months.");
  const [initiative, setInitiative] = useState("Quarterly feature plan, range optimisation and joint digital support.");
  const [investment, setInvestment] = useState("£45k trade and media investment");
  const [measure, setMeasure] = useState("Incremental revenue, margin, distribution gains and repeat rate.");

  const sections: [string, string][] = [
    ["One-page JBP summary", `${customer} can grow ${opportunity.toLowerCase()} through ${initiative.toLowerCase()}`],
    ["Shared objective", objective],
    ["Growth pillars", "Grow the priority shopper mission.\nImprove distribution and availability on priority SKUs.\nExecute fewer, stronger activations with clearer measures."],
    ["Activation plan", initiative],
    ["Investment ask", investment],
    ["Measures of success", measure],
    ["Risks and dependencies", "Customer feature space, internal funding approval, availability, accurate baseline data and clear review ownership."],
    ["Next steps", "Confirm owners, validate the financial case, agree timings and schedule the first review checkpoint."],
  ];

  return (
    <GeneratorShell
      fields={<>
        <TextInput label="Customer" help="Customer or account name." value={customer} onChange={setCustomer} />
        <TextInput label="Category opportunity" help="The category or shopper growth prize." value={opportunity} onChange={setOpportunity} multiline />
        <TextInput label="Joint objective" help="The shared commercial outcome." value={objective} onChange={setObjective} multiline />
        <TextInput label="Growth initiative" help="The core activation or growth idea." value={initiative} onChange={setInitiative} multiline />
        <TextInput label="Investment needed" help="Funding, media, range support or resource." value={investment} onChange={setInvestment} />
        <TextInput label="Success measure" help="How success will be judged." value={measure} onChange={setMeasure} multiline />
      </>}
      sections={sections}
      proFeatures={["Full JBP pack", "Quarterly milestones", "Customer-specific action tracker", "PDF/export", "Internal sell-in version"]}
    />
  );
}

export function AccountPlanGenerator() {
  const [account, setAccount] = useState("Retailer A");
  const [performance, setPerformance] = useState("Sales are growing behind promotions, but base rate of sale is flat.");
  const [opportunity, setOpportunity] = useState("Improve distribution on priority SKUs and sharpen promotional mix.");
  const [risk, setRisk] = useState("Margin pressure and competitor space gains.");
  const [products, setProducts] = useState("Core range, premium formats and seasonal packs.");
  const [action, setAction] = useState("Book buyer meeting to agree range and promo recommendations.");

  const sections: [string, string][] = [
    ["Account overview", `${account}: ${performance}`],
    ["Opportunity summary", opportunity],
    ["Risk summary", risk],
    ["Commercial strategy", `Prioritise ${products}. Focus investment on actions that improve rate of sale, distribution quality and margin.`],
    ["30/60/90 day plan", `30 days: validate numbers and align internal owners.\n60 days: present recommendation and secure customer agreement.\n90 days: review execution and scale what works. Next action: ${action}`],
    ["Internal support needed", "Pricing guardrails, trade spend envelope, supply readiness, category evidence and senior sponsorship."],
    ["Review cadence", "Weekly internal action check, monthly customer trading review and quarterly strategic review."],
  ];

  return (
    <GeneratorShell
      fields={<>
        <TextInput label="Account name" help="Retailer, customer or channel." value={account} onChange={setAccount} />
        <TextInput label="Current performance" help="What is happening now?" value={performance} onChange={setPerformance} multiline />
        <TextInput label="Biggest growth opportunity" help="Where growth is most likely." value={opportunity} onChange={setOpportunity} multiline />
        <TextInput label="Biggest risk" help="What could derail the plan." value={risk} onChange={setRisk} multiline />
        <TextInput label="Priority products/ranges" help="The range or products to focus on." value={products} onChange={setProducts} multiline />
        <TextInput label="Next commercial action" help="The next real action." value={action} onChange={setAction} multiline />
      </>}
      sections={sections}
      proFeatures={["Full account plan template", "Range review prep", "Annual customer plan", "Saved account plans", "Team sharing"]}
    />
  );
}

export function CustomerReviewTemplate() {
  const [customer, setCustomer] = useState("Retailer A");
  const [period, setPeriod] = useState("Q2");
  const [performance, setPerformance] = useState("Revenue grew 6%, with strong promo weeks but weaker base sales.");
  const [worked, setWorked] = useState("Distribution gains, better feature compliance and improved availability.");
  const [missed, setMissed] = useState("Promotion margin was below target and one launch missed the timing window.");
  const [priority, setPriority] = useState("Improve base rate of sale, protect margin and tighten launch planning.");

  const sections: [string, string][] = [
    ["Executive summary", `${customer} ${period}: ${performance} The next priority is to ${priority.toLowerCase()}`],
    ["Performance narrative", performance],
    ["Wins", worked],
    ["Misses", missed],
    ["Recommended actions", `Focus the next period on: ${priority}`],
    ["Proposed asks", "Agree the priority actions, confirm support levels, align success measures and remove execution blockers."],
    ["Follow-up actions", "Send agreed numbers, owners and timings within 24 hours. Schedule the next checkpoint and document decisions."],
  ];

  return (
    <GeneratorShell
      fields={<>
        <TextInput label="Customer" help="Customer or account name." value={customer} onChange={setCustomer} />
        <TextInput label="Review period" help="Quarter, half year or trading period." value={period} onChange={setPeriod} />
        <TextInput label="Sales performance" help="Headline sales and margin story." value={performance} onChange={setPerformance} multiline />
        <TextInput label="What worked" help="What went well and why." value={worked} onChange={setWorked} multiline />
        <TextInput label="What missed" help="What underperformed or caused friction." value={missed} onChange={setMissed} multiline />
        <TextInput label="Next priority" help="The main focus for the next period." value={priority} onChange={setPriority} multiline />
      </>}
      sections={sections}
      proFeatures={["Full QBR pack", "Customer-ready review deck structure", "Promo performance review", "Action tracker", "PDF/export"]}
    />
  );
}

function GeneratorShell({
  fields,
  sections,
  proFeatures,
}: {
  fields: React.ReactNode;
  sections: [string, string][];
  proFeatures: string[];
}) {
  const output = sections.map(([title, body]) => `${title}\n${body}`).join("\n\n");

  return (
    <article className="card tool-form">
      <BadgeRow />
      <div className="form-grid">{fields}</div>
      <div className="result-box output-block">
        <div className="output-header">
          <div>
            <span className="pill">Free result</span>
            <h2>Copy-ready output</h2>
          </div>
          <CopyButton text={output} />
        </div>
        <PlanningDisclaimer />
        {sections.map(([title, body]) => (
          <section key={title}>
            <h3>{title}</h3>
            {body.includes("\n") ? (
              <ul>
                {body.split("\n").map((line) => (
                  <li key={line}>{line.replace(/^\d+\.\s*/, "")}</li>
                ))}
              </ul>
            ) : (
              <p>{body}</p>
            )}
          </section>
        ))}
        <InfoPanel title="Watch-outs">
          <ul>
            <li>Add real sales, margin, distribution and customer context before sharing externally.</li>
            <li>Use the output as a structured first draft, not a final approved recommendation.</li>
          </ul>
        </InfoPanel>
      </div>
      <ProPreview features={proFeatures} />
    </article>
  );
}
