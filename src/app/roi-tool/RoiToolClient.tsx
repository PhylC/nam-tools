"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { trackCalculatorCompleted, trackCalculatorOpened, trackUpgradeClicked } from "../../lib/analytics";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";
import { EXPORT_PLANNING_CAVEAT } from "../../lib/commercialCaveats";
import { CalculatorCaveat } from "../components/CalculatorCaveat";
import { buildUpgradeHref, useProAction } from "../components/ProActionGuard";
import {
  deleteRoiPlan,
  duplicateRoiPlan,
  listRoiPlans,
  loadSavedScenario,
  loadRoiPlan,
  saveScenario,
  saveRoiPlan,
} from "../../lib/saveStore";

type SupportMode = "soa" | "promoInvoice";

type RoiLine = {
  id: string;
  sku: string;
  product: string;
  notes: string;
  currentInvoice: string;
  promoInvoice: string;
  soa: string;
  currentSrp: string;
  promoSrp: string;
  baselineUnits: string;
  promoUnits: string;
  cogs: string;
  fixedSupport: string;
  vatRate: string;
  currency: string;
  supportMode: SupportMode;
};

type RoiScenario = {
  id: string;
  name: string;
  lines: RoiLine[];
};

type RoiGroup = {
  id: string;
  name: string;
  scenarios: RoiScenario[];
};

type SavedRoiGroup = RoiGroup & {
  group_name: string;
  savedAt: string;
  createdAt: string;
  updatedAt: string;
  created_at?: string;
  updated_at?: string;
};

type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

type RoiFieldKey =
  | "sku"
  | "product"
  | "currentInvoice"
  | "promoInvoice"
  | "soa"
  | "baselineUnits"
  | "promoUnits"
  | "cogs"
  | "fixedSupport"
  | "currentSrp"
  | "promoSrp"
  | "vatRate"
  | "currency"
  | "notes";

const roiFieldMeta: Record<RoiFieldKey, { label: string; required: boolean; info: string }> = {
  sku: {
    label: "SKU / item",
    required: false,
    info: "Use this to name the product, SKU or line being modelled.",
  },
  product: {
    label: "Product",
    required: false,
    info: "Add the product name if you want a clearer summary or export.",
  },
  currentInvoice: {
    label: "Current retailer invoice/buy price",
    required: true,
    info: "The current invoice or buy price charged to the retailer/customer per unit.",
  },
  promoInvoice: {
    label: "Promo retailer invoice/buy price",
    required: false,
    info: "The promotional retailer/customer invoice price during the deal. Leave blank if you are modelling support separately.",
  },
  soa: {
    label: "SOA/support",
    required: false,
    info: "Supplier-funded support per unit, such as off-invoice support, allowance or trade funding.",
  },
  baselineUnits: {
    label: "Baseline units",
    required: true,
    info: "Expected units sold in the normal comparison period before the promotion.",
  },
  promoUnits: {
    label: "Promo units",
    required: true,
    info: "Expected units sold during the promotion or deal period.",
  },
  cogs: {
    label: "Supplier COGS",
    required: false,
    info: "The supplier/user cost of goods per unit. Leave blank if you only want a revenue-based view.",
  },
  fixedSupport: {
    label: "Fixed support",
    required: false,
    info: "Fixed investment such as media, feature fee, activation support, listing support or lump-sum customer funding.",
  },
  currentSrp: {
    label: "Current SRP",
    required: false,
    info: "Normal consumer selling price. Use this for extra context where retail price matters.",
  },
  promoSrp: {
    label: "Promo SRP",
    required: false,
    info: "Promotional consumer selling price. Use this for extra context where retail price matters.",
  },
  vatRate: {
    label: "VAT rate",
    required: false,
    info: "Optional tax rate for retail-price context. ROI calculations use invoice, support and volume inputs.",
  },
  currency: {
    label: "Currency",
    required: false,
    info: "Used for notes and export context. The planner currently formats results in GBP.",
  },
  notes: {
    label: "Notes",
    required: false,
    info: "Add any assumptions or buyer context you want to keep with this line.",
  },
};

function initialRoiPlannerState() {
  const group = blankGroup();
  return {
    groups: [group],
    activeGroupId: group.id,
    activeScenarioId: group.scenarios[0]?.id ?? "",
  };
}

const blankLine = (): RoiLine => ({
  id: crypto.randomUUID(),
  sku: "",
  product: "",
  notes: "",
  currentInvoice: "",
  promoInvoice: "",
  soa: "",
  currentSrp: "",
  promoSrp: "",
  baselineUnits: "",
  promoUnits: "",
  cogs: "",
  fixedSupport: "",
  vatRate: "",
  currency: "",
  supportMode: "promoInvoice",
});

const blankScenario = (name = "Scenario 1"): RoiScenario => ({
  id: crypto.randomUUID(),
  name,
  lines: [blankLine()],
});

const blankGroup = (name = "Q4 Retailer Promo Plan"): RoiGroup => ({
  id: crypto.randomUUID(),
  name,
  scenarios: [blankScenario()],
});

function n(value: string) {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function has(value: string) {
  return value.trim() !== "";
}

function money(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function pct(value: number | null) {
  return value !== null && Number.isFinite(value)
    ? new Intl.NumberFormat("en-GB", { style: "percent", maximumFractionDigits: 1 }).format(value)
    : "n/a";
}

function calculateLine(line: RoiLine) {
  const currentInvoice = n(line.currentInvoice);
  const fixedSupport = n(line.fixedSupport);
  const hasPromoInvoice = has(line.promoInvoice);
  const hasSoa = has(line.soa);
  const supportPerUnit = hasSoa ? n(line.soa) : hasPromoInvoice ? currentInvoice - n(line.promoInvoice) : 0;
  const promoInvoice = hasPromoInvoice ? n(line.promoInvoice) : hasSoa ? currentInvoice - n(line.soa) : currentInvoice;
  const baselineUnits = n(line.baselineUnits);
  const promoUnits = n(line.promoUnits);
  const incrementalUnits = promoUnits - baselineUnits;
  const baselineRevenue = baselineUnits * currentInvoice;
  const promoRevenue = promoUnits * promoInvoice;
  const incrementalRevenue = promoRevenue - baselineRevenue;
  const supportCost = supportPerUnit * promoUnits + fixedSupport;
  const hasCogs = has(line.cogs);
  const baselineProfit = hasCogs ? (currentInvoice - n(line.cogs)) * baselineUnits : 0;
  const promoProfit = hasCogs ? (promoInvoice - n(line.cogs)) * promoUnits - fixedSupport : 0;
  const profitImpact = hasCogs ? promoProfit - baselineProfit : 0;
  const revenueRoi = supportCost > 0 ? incrementalRevenue / supportCost : null;
  const profitRoi = hasCogs && supportCost > 0 ? profitImpact / supportCost : null;

  return {
    supportPerUnit,
    promoInvoice,
    incrementalUnits,
    baselineRevenue,
    promoRevenue,
    incrementalRevenue,
    supportCost,
    hasCogs,
    baselineProfit,
    promoProfit,
    profitImpact,
    revenueRoi,
    profitRoi,
  };
}

function aggregate(lines: RoiLine[]) {
  return lines.reduce(
    (total, line) => {
      const calc = calculateLine(line);
      total.baselineUnits += n(line.baselineUnits);
      total.promoUnits += n(line.promoUnits);
      total.incrementalUnits += calc.incrementalUnits;
      total.baselineRevenue += calc.baselineRevenue;
      total.promoRevenue += calc.promoRevenue;
      total.revenueImpact += calc.incrementalRevenue;
      total.supportCost += calc.supportCost;
      total.profitImpact += calc.hasCogs ? calc.profitImpact : 0;
      total.baselineProfit += calc.hasCogs ? calc.baselineProfit : 0;
      total.promoProfit += calc.hasCogs ? calc.promoProfit : 0;
      total.profitRows += calc.hasCogs ? 1 : 0;
      return total;
    },
    {
      baselineUnits: 0,
      promoUnits: 0,
      incrementalUnits: 0,
      baselineRevenue: 0,
      promoRevenue: 0,
      revenueImpact: 0,
      supportCost: 0,
      baselineProfit: 0,
      promoProfit: 0,
      profitImpact: 0,
      profitRows: 0,
    },
  );
}

function updateLine(lines: RoiLine[], id: string, patch: Partial<RoiLine>) {
  return lines.map((line) => (line.id === id ? { ...line, ...patch } : line));
}

function copyLine(line: RoiLine): RoiLine {
  return { ...line, id: crypto.randomUUID(), sku: line.sku ? `${line.sku} copy` : "" };
}

function copyScenario(scenario: RoiScenario): RoiScenario {
  return {
    ...scenario,
    id: crypto.randomUUID(),
    name: `${scenario.name} copy`,
    lines: scenario.lines.map((line) => ({ ...line, id: crypto.randomUUID() })),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function restoreSavedLine(value: unknown): RoiLine {
  const line = isRecord(value) ? value : {};
  const supportMode = line.supportMode === "soa" || line.supportMode === "promoInvoice" ? line.supportMode : "promoInvoice";
  return {
    ...blankLine(),
    id: typeof line.id === "string" ? line.id : crypto.randomUUID(),
    sku: typeof line.sku === "string" ? line.sku : "",
    product: typeof line.product === "string" ? line.product : "",
    notes: typeof line.notes === "string" ? line.notes : "",
    currentInvoice: typeof line.currentInvoice === "string" ? line.currentInvoice : "",
    promoInvoice: typeof line.promoInvoice === "string" ? line.promoInvoice : "",
    soa: typeof line.soa === "string" ? line.soa : "",
    currentSrp: typeof line.currentSrp === "string" ? line.currentSrp : "",
    promoSrp: typeof line.promoSrp === "string" ? line.promoSrp : "",
    baselineUnits: typeof line.baselineUnits === "string" ? line.baselineUnits : "",
    promoUnits: typeof line.promoUnits === "string" ? line.promoUnits : "",
    cogs: typeof line.cogs === "string" ? line.cogs : "",
    fixedSupport: typeof line.fixedSupport === "string" ? line.fixedSupport : "",
    vatRate: typeof line.vatRate === "string" ? line.vatRate : "",
    currency: typeof line.currency === "string" ? line.currency : "",
    supportMode,
  };
}

function restoreSavedScenario(value: unknown, fallbackName = "ROI scenario"): RoiScenario | null {
  const scenario = isRecord(value) ? value : {};
  const rawLines = Array.isArray(scenario.lines) ? scenario.lines : [];
  const lines = rawLines.length ? rawLines.map(restoreSavedLine) : [blankLine()];
  return {
    id: typeof scenario.id === "string" ? scenario.id : crypto.randomUUID(),
    name: typeof scenario.name === "string" && scenario.name.trim() ? scenario.name : fallbackName,
    lines,
  };
}

function limitGroupsForFree(nextGroups: RoiGroup[]) {
  const group = nextGroups[0] ?? blankGroup();
  const scenario = group.scenarios[0] ?? blankScenario();
  const lines = scenario.lines.length ? scenario.lines.slice(0, 1) : [blankLine()];

  return [
    {
      ...group,
      scenarios: [{ ...scenario, lines }],
    },
  ];
}

function groupHasDraftContent(group: RoiGroup | undefined) {
  if (!group) return false;
  if (group.name.trim() && group.name !== "Q4 Retailer Promo Plan") return true;
  if (group.scenarios.length > 1) return true;
  return group.scenarios.some(
    (scenario, scenarioIndex) =>
      (scenario.name.trim() && (scenarioIndex > 0 || scenario.name !== "Scenario 1")) ||
      scenario.lines.length > 1 ||
      scenario.lines.some((line) =>
        [
          line.sku,
          line.product,
          line.notes,
          line.currentInvoice,
          line.promoInvoice,
          line.soa,
          line.currentSrp,
          line.promoSrp,
          line.baselineUnits,
          line.promoUnits,
          line.cogs,
          line.fixedSupport,
          line.vatRate,
          line.currency,
        ].some((value) => value.trim() !== ""),
      ),
  );
}

function buildRoiPlanSnapshot(group: RoiGroup, existing?: Partial<SavedRoiGroup>) {
  const now = new Date().toISOString();
  const comparisonName = group.name.trim() || "ROI comparison";
  return {
    ...group,
    name: comparisonName,
    group_name: comparisonName,
    savedAt: now,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    created_at: existing?.created_at ?? existing?.createdAt ?? now,
    updated_at: now,
  };
}

function csvEscape(value: string | number | null) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, rows: Array<Array<string | number | null>>) {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function splitCsvRow(row: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < row.length; index += 1) {
    const char = row[index];
    const nextChar = row[index + 1];
    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(text: string) {
  const rows = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((row) => row.trim().length > 0)
    .map(splitCsvRow);
  const [headers = [], ...body] = rows;
  return body.map((row) =>
    headers.reduce<Record<string, string>>((record, header, index) => {
      record[header.trim().toLowerCase().split(" ")[0]] = row[index] ?? "";
      return record;
    }, {}),
  );
}

// These required/optional fields may change as the ROI model evolves.
const inputTemplateHeaders = [
  "scenario_name OPTIONAL",
  "sku_model_item_number OPTIONAL",
  "product_name OPTIONAL",
  "current_retailer_invoice_buy_price REQUIRED",
  "promo_retailer_invoice_buy_price OPTIONAL",
  "support_per_unit_soa OPTIONAL",
  "current_srp OPTIONAL",
  "promo_srp OPTIONAL",
  "baseline_units REQUIRED",
  "promo_units REQUIRED",
  "supplier_cogs_per_unit OPTIONAL",
  "fixed_support OPTIONAL",
  "vat_rate OPTIONAL",
  "currency OPTIONAL",
  "notes OPTIONAL",
];

function downloadInputTemplate() {
  downloadCsv("apt-roi-input-template.csv", [
    inputTemplateHeaders,
    [
      "Scenario 1",
      "SKU-1001",
      "Core 500ml pack",
      "1.75",
      "1.40",
      "",
      "2.50",
      "2.00",
      "10000",
      "18000",
      "1.10",
      "2500",
      "",
      "GBP",
      "Example row - delete or replace",
    ],
  ]);
}

function lineFromUploadRow(row: Record<string, string>): RoiLine {
  const promoInvoice = row.promo_retailer_invoice_buy_price ?? row.promo_invoice_price ?? "";
  const soa = row.support_per_unit_soa ?? "";
  return {
    ...blankLine(),
    sku: row.sku_model_item_number ?? "",
    product: row.product_name ?? "",
    notes: row.notes ?? "",
    currentInvoice: row.current_retailer_invoice_buy_price ?? row.current_invoice_price ?? "",
    promoInvoice,
    soa,
    currentSrp: row.current_srp ?? "",
    promoSrp: row.promo_srp ?? "",
    baselineUnits: row.baseline_units ?? "",
    promoUnits: row.promo_units ?? "",
    cogs: row.supplier_cogs_per_unit ?? row.cogs_per_unit ?? "",
    fixedSupport: row.fixed_support ?? "",
    vatRate: row.vat_rate ?? "",
    currency: row.currency ?? "",
    supportMode: soa && !promoInvoice ? "soa" : "promoInvoice",
  };
}

function validateUploadRows(rows: Record<string, string>[]) {
  const errors: string[] = [];
  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    if (!has(row.current_retailer_invoice_buy_price ?? row.current_invoice_price ?? "")) {
      errors.push(`Row ${rowNumber}: current_retailer_invoice_buy_price is required.`);
    }
    if (!has(row.baseline_units ?? "")) errors.push(`Row ${rowNumber}: baseline_units is required.`);
    if (!has(row.promo_units ?? "")) errors.push(`Row ${rowNumber}: promo_units is required.`);
  });
  return errors;
}

function isLineCalculationComplete(line: RoiLine) {
  return has(line.baselineUnits) && has(line.promoUnits) && has(line.currentInvoice);
}

function CsvExportButton({ groups, onBeforeExport }: { groups: RoiGroup[]; onBeforeExport?: () => boolean }) {
  function exportCsv() {
    if (onBeforeExport && !onBeforeExport()) return;
    const rows: Array<Array<string | number | null>> = [
      [
        "group_name",
        "scenario_name",
        "row_type",
        "sku_model_item_number",
        "product_name",
        "notes",
        "current_retailer_invoice_buy_price",
        "promo_retailer_invoice_buy_price",
        "support_per_unit_soa",
        "current_srp",
        "promo_srp",
        "baseline_units",
        "promo_units",
        "supplier_cogs_per_unit",
        "fixed_support",
        "vat_rate",
        "currency",
        "incremental_units",
        "baseline_supplier_invoice_revenue",
        "promo_supplier_invoice_revenue",
        "incremental_supplier_invoice_revenue",
        "total_supplier_support",
        "baseline_supplier_gross_profit",
        "promo_supplier_gross_profit",
        "incremental_profit",
        "supplier_revenue_roi",
        "profit_roi",
      ],
    ];

    groups.forEach((group) => {
      group.scenarios.forEach((scenario) => {
        scenario.lines.forEach((line) => {
          const calc = calculateLine(line);
          rows.push([
            group.name,
            scenario.name,
            "line",
            line.sku,
            line.product,
            line.notes,
            line.currentInvoice,
            line.promoInvoice,
            line.soa,
            line.currentSrp,
            line.promoSrp,
            line.baselineUnits,
            line.promoUnits,
            line.cogs,
            line.fixedSupport,
            line.vatRate,
            line.currency,
            calc.incrementalUnits,
            calc.baselineRevenue,
            calc.promoRevenue,
            calc.incrementalRevenue,
            calc.supportCost,
            calc.hasCogs ? calc.baselineProfit : "",
            calc.hasCogs ? calc.promoProfit : "",
            calc.hasCogs ? calc.profitImpact : "",
            calc.revenueRoi,
            calc.profitRoi,
          ]);
        });

        const total = aggregate(scenario.lines);
        rows.push([
          group.name,
          scenario.name,
          "scenario_summary",
          "",
          `${scenario.name} summary`,
          `${scenario.lines.length} line(s)`,
          "",
          "",
          "",
          "",
          "",
          total.baselineUnits,
          total.promoUnits,
          "",
          "",
          "",
          "",
          total.incrementalUnits,
          total.baselineRevenue,
          total.promoRevenue,
          total.revenueImpact,
          total.supportCost,
          total.profitRows ? total.baselineProfit : "",
          total.profitRows ? total.promoProfit : "",
          total.profitRows ? total.profitImpact : "",
          total.supportCost > 0 ? total.revenueImpact / total.supportCost : "",
          total.profitRows && total.supportCost > 0 ? total.profitImpact / total.supportCost : "",
        ]);
      });
    });

    rows.push(["disclaimer", EXPORT_PLANNING_CAVEAT]);
    downloadCsv("apt-roi-results.csv", rows);
  }

  return (
    <button className="button button-secondary button-small roi-locked-action" onClick={exportCsv} type="button">
      Export results
    </button>
  );
}

function ProBadge() {
  return <span className="roi-pro-badge">Pro</span>;
}

function ProOnlyAction({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="button button-secondary button-small roi-locked-action" onClick={onClick} type="button">
      <span>{children}</span>
      <ProBadge />
    </button>
  );
}

function RoiFieldLabel({
  field,
  compact = false,
}: {
  field: RoiFieldKey;
  compact?: boolean;
}) {
  const meta = roiFieldMeta[field];
  const status = meta.required ? "Required" : "Optional";

  return (
    <span className={compact ? "roi-field-label roi-field-label-compact" : "roi-field-label"}>
      <span className="roi-field-label-text">{meta.label}</span>
      <span className={meta.required ? "field-status field-required calc-required-badge" : "field-status calc-optional-badge"}>
        {status}
      </span>
      <span aria-label={`${meta.label}: ${meta.info}`} className="info-dot calc-info-button" tabIndex={0} title={meta.info}>
        i
        <span className="info-tooltip" role="tooltip">
          {meta.info}
        </span>
      </span>
    </span>
  );
}

function TableInput({
  ariaLabel,
  value,
  onChange,
}: {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      aria-label={ariaLabel}
      className="roi-table-input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function MobileField({
  field,
  value,
  onChange,
  type = "text",
}: {
  field: RoiFieldKey;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  const meta = roiFieldMeta[field];

  return (
    <label className="roi-mobile-field">
      <RoiFieldLabel field={field} />
      <input
        aria-label={meta.label}
        inputMode={type === "number" ? "decimal" : undefined}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function derivedCurrentInvoice(promoInvoice: string, soa: string) {
  if (!has(promoInvoice)) return "";
  return String(n(promoInvoice) + (has(soa) ? n(soa) : 0));
}

function RoiFreeLineForm({
  lines,
  onChangeLines,
}: {
  lines: RoiLine[];
  onChangeLines: (lines: RoiLine[]) => void;
}) {
  const line = lines[0];

  if (!line) return null;

  function changeLine(patch: Partial<RoiLine>) {
    const nextPromoInvoice = patch.promoInvoice ?? line.promoInvoice;
    const nextSoa = patch.soa ?? line.soa;
    const shouldDeriveInvoice = "promoInvoice" in patch || "soa" in patch;
    const nextPatch: Partial<RoiLine> = {
      ...patch,
      ...(shouldDeriveInvoice
        ? {
            currentInvoice: derivedCurrentInvoice(nextPromoInvoice, nextSoa),
            supportMode: has(nextSoa) ? "soa" : "promoInvoice",
          }
        : null),
    };

    onChangeLines(updateLine(lines, line.id, nextPatch));
  }

  return (
    <div className="roi-free-line-form">
      <div className="roi-free-form-heading">
        <h4>Calculator inputs</h4>
        <p>Enter the one product line you want to model.</p>
      </div>
      <div className="roi-free-input-grid">
        <MobileField field="sku" value={line.sku} onChange={(value) => changeLine({ sku: value })} />
        <MobileField field="promoInvoice" type="number" value={line.promoInvoice} onChange={(value) => changeLine({ promoInvoice: value })} />
        <MobileField field="soa" type="number" value={line.soa} onChange={(value) => changeLine({ soa: value })} />
        <MobileField field="baselineUnits" type="number" value={line.baselineUnits} onChange={(value) => changeLine({ baselineUnits: value })} />
        <MobileField field="promoUnits" type="number" value={line.promoUnits} onChange={(value) => changeLine({ promoUnits: value })} />
        <MobileField field="cogs" type="number" value={line.cogs} onChange={(value) => changeLine({ cogs: value })} />
      </div>
    </div>
  );
}

function RoiMobileLineBuilder({
  lines,
  onChangeLines,
  lineActions,
}: {
  lines: RoiLine[];
  onChangeLines: (lines: RoiLine[]) => void;
  lineActions: boolean;
}) {
  function changeLine(id: string, patch: Partial<RoiLine>) {
    onChangeLines(updateLine(lines, id, patch));
  }

  function duplicateLine(id: string) {
    if (!lineActions) return;
    const index = lines.findIndex((line) => line.id === id);
    if (index < 0) return;
    onChangeLines([...lines.slice(0, index + 1), copyLine(lines[index]), ...lines.slice(index + 1)]);
  }

  function deleteLine(id: string) {
    if (!lineActions) return;
    onChangeLines(lines.length > 1 ? lines.filter((item) => item.id !== id) : [blankLine()]);
  }

  return (
    <div className="roi-mobile-builder">
      {lines.map((line, index) => {
        const calc = calculateLine(line);
        const supportField =
          line.supportMode === "soa" ? (
            <MobileField field="soa" type="number" value={line.soa} onChange={(value) => changeLine(line.id, { soa: value, supportMode: "soa" })} />
          ) : (
            <MobileField field="promoInvoice" type="number" value={line.promoInvoice} onChange={(value) => changeLine(line.id, { promoInvoice: value, supportMode: "promoInvoice" })} />
          );

        return (
          <article className="roi-mobile-line-card" key={line.id}>
            <div className="roi-mobile-line-header">
              <h4>Line {index + 1}</h4>
              <div className="roi-mobile-line-actions">
                {lineActions ? (
                  <>
                    <button className="table-action" onClick={() => duplicateLine(line.id)} type="button">Copy</button>
                    <button className="table-action" onClick={() => deleteLine(line.id)} type="button">Delete</button>
                  </>
                ) : null}
              </div>
            </div>

            <div className="roi-mobile-field-grid">
              <MobileField field="sku" value={line.sku} onChange={(value) => changeLine(line.id, { sku: value })} />
              <MobileField field="product" value={line.product} onChange={(value) => changeLine(line.id, { product: value })} />
              <MobileField field="currentInvoice" type="number" value={line.currentInvoice} onChange={(value) => changeLine(line.id, { currentInvoice: value })} />
              <MobileField field="baselineUnits" type="number" value={line.baselineUnits} onChange={(value) => changeLine(line.id, { baselineUnits: value })} />
              <div className="roi-linked-promo-fields">
                <label className="roi-mobile-field">
                  <span>Promo input</span>
                  <select value={line.supportMode} onChange={(event) => changeLine(line.id, { supportMode: event.target.value as SupportMode })}>
                    <option value="promoInvoice">Invoice/buy price</option>
                    <option value="soa">SOA/support</option>
                  </select>
                </label>
                {supportField}
              </div>
              <MobileField field="promoUnits" type="number" value={line.promoUnits} onChange={(value) => changeLine(line.id, { promoUnits: value })} />
            </div>

            <details className="roi-mobile-advanced">
              <summary>Show advanced inputs</summary>
              <div className="roi-mobile-field-grid">
                <MobileField field="cogs" type="number" value={line.cogs} onChange={(value) => changeLine(line.id, { cogs: value })} />
                <MobileField field="fixedSupport" type="number" value={line.fixedSupport} onChange={(value) => changeLine(line.id, { fixedSupport: value })} />
                <MobileField field="currentSrp" type="number" value={line.currentSrp} onChange={(value) => changeLine(line.id, { currentSrp: value })} />
                <MobileField field="promoSrp" type="number" value={line.promoSrp} onChange={(value) => changeLine(line.id, { promoSrp: value })} />
                <MobileField field="vatRate" type="number" value={line.vatRate} onChange={(value) => changeLine(line.id, { vatRate: value })} />
                <MobileField field="currency" value={line.currency} onChange={(value) => changeLine(line.id, { currency: value })} />
                <label className="roi-mobile-field roi-mobile-field-full">
                  <RoiFieldLabel field="notes" />
                  <textarea value={line.notes} onChange={(event) => changeLine(line.id, { notes: event.target.value })} />
                </label>
              </div>
            </details>

            <div className="roi-mobile-line-results" aria-label={`Line ${index + 1} results`}>
              <div><span>Inc supplier invoice revenue</span><strong>{money(calc.incrementalRevenue)}</strong></div>
              <div><span>Support</span><strong>{money(calc.supportCost)}</strong></div>
              <div><span>Incremental profit</span><strong>{calc.hasCogs ? money(calc.profitImpact) : "Add supplier COGS"}</strong></div>
              <div><span>ROI</span><strong>{pct(calc.profitRoi ?? calc.revenueRoi)}</strong></div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function RoiEditableTable({
  lines,
  onChangeLines,
  onAddLine,
  lineActions = true,
  newLineProOnly = false,
}: {
  lines: RoiLine[];
  onChangeLines: (lines: RoiLine[]) => void;
  onAddLine: () => void;
  lineActions?: boolean;
  newLineProOnly?: boolean;
}) {
  function changeLine(id: string, patch: Partial<RoiLine>) {
    onChangeLines(updateLine(lines, id, patch));
  }

  function duplicateLine(id: string) {
    const index = lines.findIndex((line) => line.id === id);
    if (index < 0) return;
    onChangeLines([...lines.slice(0, index + 1), copyLine(lines[index]), ...lines.slice(index + 1)]);
  }

  if (!lineActions) {
    return (
      <>
        <RoiFreeLineForm lines={lines} onChangeLines={onChangeLines} />
        <button
          className={newLineProOnly ? "button button-secondary button-small new-line-button pro-only-button" : "button button-secondary new-line-button"}
          onClick={onAddLine}
          type="button"
        >
          {newLineProOnly ? (
            <>
              Add another line
              <ProBadge />
            </>
          ) : (
            "+ New line"
          )}
        </button>
        {newLineProOnly ? <p className="pro-action-note">Available with APT Pro.</p> : null}
      </>
    );
  }

  return (
    <>
      <div className="roi-table-scroll roi-desktop-table">
        <table className="roi-planner-table">
          <thead>
            <tr>
              <th className="sticky-col"><RoiFieldLabel compact field="sku" /></th>
              <th><RoiFieldLabel compact field="product" /></th>
              <th><RoiFieldLabel compact field="currentInvoice" /></th>
              <th><RoiFieldLabel compact field="promoInvoice" /></th>
              <th><RoiFieldLabel compact field="soa" /></th>
              <th><RoiFieldLabel compact field="baselineUnits" /></th>
              <th><RoiFieldLabel compact field="promoUnits" /></th>
              <th><RoiFieldLabel compact field="cogs" /></th>
              <th><RoiFieldLabel compact field="fixedSupport" /></th>
              <th>Incremental supplier invoice revenue</th>
              <th>Support cost</th>
              <th>Incremental profit</th>
              <th>Supplier revenue ROI</th>
              <th>Profit ROI</th>
              {lineActions ? <th>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const calc = calculateLine(line);
              return (
                <tr key={line.id}>
                  <td className="sticky-col">
                    <TableInput ariaLabel="SKU / Item" value={line.sku} onChange={(value) => changeLine(line.id, { sku: value })} />
                  </td>
                  <td><TableInput ariaLabel="Product" value={line.product} onChange={(value) => changeLine(line.id, { product: value })} /></td>
                  <td><TableInput ariaLabel="Current retailer invoice/buy price" value={line.currentInvoice} onChange={(value) => changeLine(line.id, { currentInvoice: value })} /></td>
                  <td><TableInput ariaLabel="Promo retailer invoice/buy price" value={line.promoInvoice} onChange={(value) => changeLine(line.id, { promoInvoice: value, supportMode: "promoInvoice" })} /></td>
                  <td><TableInput ariaLabel="SOA/support" value={line.soa} onChange={(value) => changeLine(line.id, { soa: value, supportMode: "soa" })} /></td>
                  <td><TableInput ariaLabel="Baseline units" value={line.baselineUnits} onChange={(value) => changeLine(line.id, { baselineUnits: value })} /></td>
                  <td><TableInput ariaLabel="Promo units" value={line.promoUnits} onChange={(value) => changeLine(line.id, { promoUnits: value })} /></td>
                  <td><TableInput ariaLabel="Supplier COGS" value={line.cogs} onChange={(value) => changeLine(line.id, { cogs: value })} /></td>
                  <td><TableInput ariaLabel="Fixed supplier support" value={line.fixedSupport} onChange={(value) => changeLine(line.id, { fixedSupport: value })} /></td>
                  <td>{money(calc.incrementalRevenue)}</td>
                  <td>{money(calc.supportCost)}</td>
                  <td>{calc.hasCogs ? money(calc.profitImpact) : "n/a"}</td>
                  <td>{pct(calc.revenueRoi)}</td>
                  <td>{pct(calc.profitRoi)}</td>
                  {lineActions ? (
                    <td>
                      <div className="table-action-group">
                        <button className="table-action" onClick={() => duplicateLine(line.id)} type="button">Copy</button>
                        <button className="table-action" onClick={() => onChangeLines(lines.length > 1 ? lines.filter((item) => item.id !== line.id) : [blankLine()])} type="button">Delete</button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <RoiMobileLineBuilder lines={lines} onChangeLines={onChangeLines} lineActions={lineActions} />
      <button
        className={newLineProOnly ? "button button-secondary button-small new-line-button pro-only-button" : "button button-secondary new-line-button"}
        onClick={onAddLine}
        type="button"
      >
        {newLineProOnly ? (
          <>
            Add another line
            <ProBadge />
          </>
        ) : (
          "+ New line"
        )}
      </button>
      {newLineProOnly ? <p className="pro-action-note">Available with APT Pro.</p> : null}
    </>
  );
}

function ScenarioSummary({ scenario }: { scenario: RoiScenario }) {
  const summary = aggregate(scenario.lines);
  const items = [
    ["Baseline supplier invoice revenue", money(summary.baselineRevenue)],
    ["Promo supplier invoice revenue", money(summary.promoRevenue)],
    ["Incremental supplier invoice revenue", money(summary.revenueImpact)],
    ["Support", money(summary.supportCost)],
    ["Incremental profit", summary.profitRows ? money(summary.profitImpact) : "n/a"],
    ["Supplier revenue ROI", pct(summary.supportCost > 0 ? summary.revenueImpact / summary.supportCost : null)],
    ["Profit ROI", pct(summary.profitRows && summary.supportCost > 0 ? summary.profitImpact / summary.supportCost : null)],
    ["Lines", scenario.lines.length.toLocaleString("en-GB")],
  ];

  return (
    <div className="scenario-summary">
      <h4>Scenario summary</h4>
      <div className="kpi-strip" aria-label={`${scenario.name} summary`}>
        {items.map(([label, value]) => (
          <div className="kpi-chip" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="roi-mobile-summary" aria-label={`${scenario.name} mobile summary`}>
        <div><span>Incremental supplier invoice revenue</span><strong>{money(summary.revenueImpact)}</strong></div>
        <div><span>Incremental profit</span><strong>{summary.profitRows ? money(summary.profitImpact) : "Add supplier COGS to see profit ROI"}</strong></div>
        <div><span>ROI</span><strong>{pct(summary.profitRows && summary.supportCost > 0 ? summary.profitImpact / summary.supportCost : summary.supportCost > 0 ? summary.revenueImpact / summary.supportCost : null)}</strong></div>
        <div><span>Baseline supplier invoice revenue</span><strong>{money(summary.baselineRevenue)}</strong></div>
        <div><span>Promo supplier invoice revenue</span><strong>{money(summary.promoRevenue)}</strong></div>
      </div>
    </div>
  );
}

function scenarioMetrics(scenario: RoiScenario) {
  const summary = aggregate(scenario.lines);
  return {
    scenario,
    summary,
    revenueRoi: summary.supportCost > 0 ? summary.revenueImpact / summary.supportCost : null,
    profitRoi: summary.profitRows && summary.supportCost > 0 ? summary.profitImpact / summary.supportCost : null,
  };
}

function maxBy<T>(items: T[], selector: (item: T) => number | null) {
  return items.reduce<T | null>((best, item) => {
    const value = selector(item);
    if (value === null || !Number.isFinite(value)) return best;
    if (!best) return item;
    const bestValue = selector(best);
    return bestValue === null || value > bestValue ? item : best;
  }, null);
}

function minBy<T>(items: T[], selector: (item: T) => number | null) {
  return items.reduce<T | null>((best, item) => {
    const value = selector(item);
    if (value === null || !Number.isFinite(value)) return best;
    if (!best) return item;
    const bestValue = selector(best);
    return bestValue === null || value < bestValue ? item : best;
  }, null);
}

function ScenarioComparison({
  scenarios,
  onAddScenario,
  onSaveComparison,
}: {
  scenarios: RoiScenario[];
  onAddScenario: () => void;
  onSaveComparison: () => void | Promise<void>;
}) {
  const metrics = scenarios.map(scenarioMetrics);
  const bestRevenue = maxBy(metrics, (item) => item.summary.revenueImpact);
  const bestProfit = maxBy(metrics, (item) => (item.summary.profitRows ? item.summary.profitImpact : null));
  const bestRoi = maxBy(metrics, (item) => item.profitRoi ?? item.revenueRoi);
  const lowestSupport = minBy(metrics, (item) => item.summary.supportCost);
  const highestRisk = maxBy(metrics, (item) => item.summary.supportCost || (item.revenueRoi !== null ? 1 / Math.max(item.revenueRoi, 0.01) : null));
  const recommended = bestProfit?.profitRoi !== null && bestProfit?.profitRoi !== undefined ? bestProfit : bestRoi;

  let narrative = "Add another scenario to compare options.";
  if (scenarios.length > 1 && bestRevenue && lowestSupport && recommended) {
    narrative =
      bestRevenue.scenario.id === lowestSupport.scenario.id
        ? `${bestRevenue.scenario.name} delivers the strongest incremental revenue while also requiring the lowest support cost.`
        : `${bestRevenue.scenario.name} delivers the strongest incremental revenue, but ${lowestSupport.scenario.name} is more efficient on support cost. Recommended route: ${recommended.scenario.name}.`;
  }
  type ComparisonMetric = {
    label: string;
    value: (item: ReturnType<typeof scenarioMetrics>) => string;
    bestScenarioId?: string;
    bestLabel?: string;
  };
  const comparisonRows: ComparisonMetric[] = [
    {
      label: "Baseline supplier invoice revenue",
      value: (item: ReturnType<typeof scenarioMetrics>) => money(item.summary.baselineRevenue),
    },
    {
      label: "Promo supplier invoice revenue",
      value: (item: ReturnType<typeof scenarioMetrics>) => money(item.summary.promoRevenue),
    },
    {
      label: "Incremental supplier invoice revenue",
      value: (item: ReturnType<typeof scenarioMetrics>) => money(item.summary.revenueImpact),
      bestScenarioId: bestRevenue?.scenario.id,
    },
    {
      label: "Support cost",
      value: (item: ReturnType<typeof scenarioMetrics>) => money(item.summary.supportCost),
      bestScenarioId: lowestSupport?.scenario.id,
      bestLabel: "Lowest",
    },
    {
      label: "Incremental profit",
      value: (item: ReturnType<typeof scenarioMetrics>) => (item.summary.profitRows ? money(item.summary.profitImpact) : "Add supplier COGS"),
      bestScenarioId: bestProfit?.scenario.id,
    },
    {
      label: "Supplier revenue ROI",
      value: (item: ReturnType<typeof scenarioMetrics>) => pct(item.revenueRoi),
    },
    {
      label: "Profit ROI",
      value: (item: ReturnType<typeof scenarioMetrics>) => pct(item.profitRoi),
      bestScenarioId: bestRoi?.scenario.id,
    },
    {
      label: "Lines",
      value: (item: ReturnType<typeof scenarioMetrics>) => item.scenario.lines.length.toLocaleString("en-GB"),
    },
  ];

  return (
    <section className="card scenario-comparison">
      <div className="scenario-comparison-desktop">
        <div className="scenario-comparison-heading">
          <div>
            <h3>Scenario comparison</h3>
            <p>{narrative}</p>
          </div>
          {scenarios.length > 1 ? (
            <button className="button button-secondary button-small" onClick={onSaveComparison} type="button">
              Save full comparison
            </button>
          ) : null}
        </div>
        {scenarios.length > 1 ? (
          <div className="comparison-chip-row">
            <div className="kpi-chip"><span>Best revenue</span><strong>{bestRevenue?.scenario.name ?? "n/a"}</strong></div>
            <div className="kpi-chip"><span>Best incremental profit</span><strong>{bestProfit?.scenario.name ?? "n/a"}</strong></div>
            <div className="kpi-chip"><span>Best ROI</span><strong>{bestRoi?.scenario.name ?? "n/a"}</strong></div>
            <div className="kpi-chip"><span>Lowest support</span><strong>{lowestSupport?.scenario.name ?? "n/a"}</strong></div>
            <div className="kpi-chip"><span>Highest risk</span><strong>{highestRisk?.scenario.name ?? "n/a"}</strong></div>
            <div className="kpi-chip"><span>Recommended</span><strong>{recommended?.scenario.name ?? "n/a"}</strong></div>
          </div>
        ) : null}
        {scenarios.length > 1 ? (
          <div className="scenario-comparison-table-wrap" aria-label="Scenario metric comparison">
            <table className="scenario-comparison-table">
              <thead>
                <tr>
                  <th scope="col">Metric</th>
                  {metrics.map((item) => (
                    <th scope="col" key={item.scenario.id}>{item.scenario.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {metrics.map((item) => {
                      const isBest = row.bestScenarioId === item.scenario.id;
                      return (
                        <td className={isBest ? "scenario-comparison-best" : undefined} key={item.scenario.id}>
                          <strong>{row.value(item)}</strong>
                          {isBest ? <span>{row.bestLabel ?? "Best"}</span> : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="roi-mobile-comparison">
        <h3>Scenario comparison</h3>
        {scenarios.length < 2 ? (
          <div className="roi-mobile-comparison-empty">
            <p>Add another scenario to compare options.</p>
            <button className="button button-secondary" onClick={onAddScenario} type="button">+ New scenario</button>
          </div>
        ) : (
          <>
            <p>{narrative}</p>
            <button className="button button-secondary button-small" onClick={onSaveComparison} type="button">
              Save full comparison
            </button>
            <div className="roi-mobile-comparison-list">
              {metrics.map((item) => {
                const badges = [
                  bestRevenue?.scenario.id === item.scenario.id ? "Best revenue" : "",
                  bestProfit?.scenario.id === item.scenario.id ? "Best incremental profit" : "",
                  bestRoi?.scenario.id === item.scenario.id ? "Best ROI" : "",
                  recommended?.scenario.id === item.scenario.id ? "Recommended" : "",
                ].filter(Boolean);

                return (
                  <article className="roi-mobile-comparison-card" key={item.scenario.id}>
                    <div>
                      <h4>{item.scenario.name}</h4>
                      {badges.length ? <span>{badges.join(" · ")}</span> : null}
                    </div>
                    <dl>
                      <div><dt>Incremental supplier invoice revenue</dt><dd>{money(item.summary.revenueImpact)}</dd></div>
                      <div><dt>Support cost</dt><dd>{money(item.summary.supportCost)}</dd></div>
                      <div><dt>Incremental profit</dt><dd>{item.summary.profitRows ? money(item.summary.profitImpact) : "Add supplier COGS"}</dd></div>
                      <div><dt>Supplier revenue ROI</dt><dd>{pct(item.revenueRoi)}</dd></div>
                      <div><dt>Profit ROI</dt><dd>{pct(item.profitRoi)}</dd></div>
                      <div><dt>Lines</dt><dd>{item.scenario.lines.length.toLocaleString("en-GB")}</dd></div>
                    </dl>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function SavedRoiPlansPanel({
  groups,
  isLoading,
  saveMessage,
  onDelete,
  onDuplicate,
  onLoad,
  onRename,
}: {
  groups: SavedRoiGroup[];
  isLoading: boolean;
  saveMessage: string;
  onDelete: (id: string) => void | Promise<void>;
  onDuplicate: (id: string) => void | Promise<void>;
  onLoad: (id: string) => void | Promise<void>;
  onRename: (id: string, name: string) => void | Promise<void>;
}) {
  const isFallbackSave = /device|unavailable|could not/i.test(saveMessage);
  const saveStatusClass = isFallbackSave ? "save-status-message save-status-warning" : "save-status-message save-status-success";

  return (
    <details className="saved-plans-details">
      <summary>Load or manage saved ROI comparisons</summary>
      <aside className="saved-panel saved-panel-compact">
        <div>
          <p>Save a full scenario group and return to the comparison later.</p>
          <p className="saved-panel-note">
            Account saves are available in Workspace on any signed-in device. Device saves stay in this browser.
          </p>
          {isLoading ? <p className="empty-state">Checking account save status...</p> : null}
          {saveMessage ? <p className={saveStatusClass} role="status">{saveMessage}</p> : null}
        </div>
        {groups.length ? (
          <div className="saved-list">
            {groups.map((group) => (
              <div className="saved-row" key={group.id}>
                <label className="field saved-name-field">
                <span>Saved comparison</span>
                  <input value={group.name} onChange={(event) => onRename(group.id, event.target.value)} />
                </label>
                <div>
                  <strong>{group.scenarios.length} scenario(s)</strong>
                  <span>Last edited {new Date(group.updatedAt ?? group.updated_at ?? group.savedAt).toLocaleDateString("en-GB")}</span>
                </div>
                <div className="summary-actions">
                  <button className="button button-secondary button-small" onClick={() => onLoad(group.id)} type="button">Load</button>
                  <button className="button button-secondary button-small" onClick={() => onDuplicate(group.id)} type="button">Duplicate</button>
                  <button className="button button-secondary button-small" onClick={() => onDelete(group.id)} type="button">Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="saved-panel-empty">
            <strong>No saved ROI comparisons yet.</strong>
            <p>Name this plan, add the scenarios you want to compare, then use Save named comparison.</p>
          </div>
        )}
      </aside>
    </details>
  );
}

function FreeProPrompt() {
  return (
    <article className="card pro-upgrade-panel">
      <div>
        <h3>Need to compare more than one option?</h3>
        <p>
                  APT Pro lets you add multiple products, build different scenarios, upload spreadsheets,
                  save full comparisons and export the results.
        </p>
      </div>
      <Link className="button" href={buildUpgradeHref({ from: "roi-tool", feature: "pro-actions" })} onClick={() => trackUpgradeClicked("roi_tool_prompt")}>
        Switch to Pro
      </Link>
    </article>
  );
}

export function RoiPlanner() {
  const { isAuthenticated, isLoading, plan } = useSupabaseAuth();
  const { requirePro } = useProAction({ from: "roi-tool", feature: "pro-action" });
  const isPro = plan === "pro" || plan === "team";
  const hasTrackedCompletion = useRef(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveSignature = useRef("");
  const autoSaveRequest = useRef(0);
  const pendingAutoSave = useRef<{ snapshot: ReturnType<typeof buildRoiPlanSnapshot>; signature: string } | null>(null);
  const [plannerState, setPlannerState] = useState(initialRoiPlannerState);
  const { groups, activeGroupId } = plannerState;
  const [savedGroups, setSavedGroups] = useState<SavedRoiGroup[]>([]);
  const [saveMessage, setSaveMessage] = useState("");
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const [autoSaveMessage, setAutoSaveMessage] = useState("");
  const [proMessage, setProMessage] = useState("");
  const [savingScenarioId, setSavingScenarioId] = useState("");
  const [scenarioSaveName, setScenarioSaveName] = useState("");
  const [scenarioSaveMessage, setScenarioSaveMessage] = useState("");
  const [scenarioMessageId, setScenarioMessageId] = useState("");
  const [savedScenarioId, setSavedScenarioId] = useState("");
  const saveStatusClass = /device|unavailable|could not/i.test(saveMessage)
    ? "pro-inline-message roi-save-status roi-save-status-warning"
    : "pro-inline-message roi-save-status";
  const autoSaveStatusClass =
    autoSaveStatus === "error"
      ? "roi-autosave-status roi-autosave-status-error"
      : autoSaveStatus === "saving"
        ? "roi-autosave-status roi-autosave-status-saving"
        : "roi-autosave-status";

  useEffect(() => {
    if (isPro) refreshSavedGroups();
  }, [isAuthenticated, isPro]);

  useEffect(() => {
    return () => {
      const pending = pendingAutoSave.current;
      if (!pending || pending.signature === autoSaveSignature.current) return;
      void saveRoiPlan(pending.snapshot);
    };
  }, []);

  useEffect(() => {
    if (!isPro || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const comparisonId = params.get("comparison");
    const savedId = params.get("saved");
    const scenarioId = params.get("scenario");
    if (comparisonId) {
      let isMounted = true;
      loadRoiPlan(comparisonId).then((result) => {
        if (!isMounted) return;
        const saved = result.data as SavedRoiGroup | null;
        if (!saved) {
          setSaveMessage(result.message ?? "");
          setProMessage("Could not find that saved comparison.");
          return;
        }
        autoSaveSignature.current = JSON.stringify(saved);
        const activeSavedScenarioId = scenarioId && saved.scenarios.some((scenario) => scenario.id === scenarioId) ? scenarioId : saved.scenarios[0]?.id ?? "";
        setPlannerState({
          groups: [saved],
          activeGroupId: saved.id,
          activeScenarioId: activeSavedScenarioId,
        });
        setSaveMessage(result.message ?? `Loaded comparison "${saved.name}".`);
      });

      return () => {
        isMounted = false;
      };
    }
    if (!savedId) return;

    let isMounted = true;
    loadSavedScenario(savedId).then((result) => {
      if (!isMounted) return;
      setSaveMessage(result.message ?? "");
      const saved = result.data;
      if (!saved) {
        setProMessage("Could not find that saved scenario.");
        return;
      }
      const scenario = restoreSavedScenario(saved.scenarioData, String(saved.title ?? "ROI scenario"));
      if (!scenario) return;
      const group = blankGroup(String(saved.title ?? "Saved ROI scenario"));
      const nextGroup = { ...group, scenarios: [scenario] };
      autoSaveSignature.current = JSON.stringify(nextGroup);
      setPlannerState({
        groups: [nextGroup],
        activeGroupId: nextGroup.id,
        activeScenarioId: scenario.id,
      });
      setScenarioSaveMessage("Loaded saved scenario.");
      setScenarioMessageId(scenario.id);
    });

    return () => {
      isMounted = false;
    };
  }, [isPro]);

  function ensureRoiPro(feature: string) {
    return requirePro(() => undefined, {
      feature,
      location: `roi_tool_${feature.replaceAll("-", "_")}`,
    });
  }

  async function refreshSavedGroups() {
    const result = await listRoiPlans();
    setSavedGroups(result.data as SavedRoiGroup[]);
    setSaveMessage(result.message ?? "");
  }

  function setGroups(nextGroups: RoiGroup[]) {
    const limitedGroups = isPro ? nextGroups : limitGroupsForFree(nextGroups);
    setPlannerState((current) => ({
      ...current,
      groups: limitedGroups.length ? limitedGroups : [blankGroup()],
    }));
  }

  async function saveCurrentGroup() {
    if (!ensureRoiPro("save-plan")) return;
    if (!activeGroup) return;
    const existing = savedGroups.find((group) => group.id === activeGroup.id);
    const snapshot = buildRoiPlanSnapshot(activeGroup, existing);
    const result = await saveRoiPlan(snapshot);
    if (!result.data) {
      setSaveMessage(result.message ?? "Could not save comparison.");
      return;
    }
    await refreshSavedGroups();
    setPlannerState((current) => ({
      ...current,
      groups: current.groups.map((group) => (group.id === activeGroup.id ? { ...group, name: snapshot.name } : group)),
    }));
    autoSaveSignature.current = JSON.stringify(activeGroup);
    pendingAutoSave.current = null;
    setAutoSaveStatus("saved");
    setAutoSaveMessage(`Saved ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`);
    setSaveMessage(`Saved comparison "${snapshot.name}" to your account.`);
  }

  function openSaveScenario(scenario: RoiScenario) {
    if (!ensureRoiPro("save-scenario")) return;
    setSavingScenarioId(scenario.id);
    setScenarioSaveName(scenario.name || "ROI scenario");
    setScenarioSaveMessage("");
    setScenarioMessageId("");
    setSavedScenarioId("");
  }

  async function saveCurrentScenario(scenario: RoiScenario) {
    if (!ensureRoiPro("save-scenario")) return;
    const title = scenarioSaveName.trim() || scenario.name || "ROI scenario";
    const total = aggregate(scenario.lines);
    const result = await saveScenario({
      title,
      toolId: "roi-tool",
      toolName: "ROI planner",
      scenarioData: { ...scenario, name: title },
      inputs: { lines: scenario.lines },
      outputs: {
        baselineSupplierInvoiceRevenue: money(total.baselineRevenue),
        promoSupplierInvoiceRevenue: money(total.promoRevenue),
        incrementalSupplierInvoiceRevenue: money(total.revenueImpact),
        totalSupplierSupport: money(total.supportCost),
        incrementalProfit: total.profitRows ? money(total.profitImpact) : "n/a",
        supplierRevenueRoi: pct(total.supportCost > 0 ? total.revenueImpact / total.supportCost : null),
        profitRoi: total.profitRows && total.supportCost > 0 ? pct(total.profitImpact / total.supportCost) : "n/a",
        lines: scenario.lines.length,
      },
      defaults: {},
      sourcePath: "/roi-tool",
    });
    if (!result.data) {
      setSavedScenarioId("");
      setScenarioSaveMessage(result.message ?? "Could not save scenario.");
      setScenarioMessageId(scenario.id);
      setSavingScenarioId("");
      return;
    }
    setSavedScenarioId(String(result.data.id ?? ""));
    setScenarioSaveMessage("Scenario saved to your account.");
    setScenarioMessageId(scenario.id);
    setSavingScenarioId("");
  }

  async function loadSavedGroup(groupId: string) {
    if (!ensureRoiPro("save-plan")) return;
    const result = await loadRoiPlan(groupId);
    setSaveMessage(result.message ?? "");
    const saved = result.data as SavedRoiGroup | null;
    if (!saved) return;
    autoSaveSignature.current = JSON.stringify(saved);
    setPlannerState((current) => {
      const nextGroups = [saved, ...current.groups.filter((group) => group.id !== saved.id)];
      return {
        groups: nextGroups,
        activeGroupId: saved.id,
        activeScenarioId: saved.scenarios[0]?.id ?? "",
      };
    });
  }

  async function renameSavedGroup(groupId: string, name: string) {
    if (!ensureRoiPro("save-plan")) return;
    const saved = savedGroups.find((group) => group.id === groupId);
    if (!saved) return;
    const now = new Date().toISOString();
    const result = await saveRoiPlan({ ...saved, name, group_name: name, savedAt: now, updatedAt: now, updated_at: now });
    if (!result.data) {
      setSaveMessage(result.message ?? "Could not rename comparison.");
      return;
    }
    setSaveMessage("");
    await refreshSavedGroups();
    setPlannerState((current) => ({
      ...current,
      groups: current.groups.map((group) => (group.id === groupId ? { ...group, name } : group)),
    }));
  }

  async function duplicateSavedGroup(groupId: string) {
    if (!ensureRoiPro("save-plan")) return;
    const result = await duplicateRoiPlan(groupId);
    setSaveMessage(result.message ?? "");
    const copy = result.data as SavedRoiGroup | null;
    if (!copy) return;
    setPlannerState((current) => ({
      groups: [copy, ...current.groups],
      activeGroupId: copy.id,
      activeScenarioId: copy.scenarios[0]?.id ?? "",
    }));
    await refreshSavedGroups();
  }

  async function deleteSavedGroup(groupId: string) {
    if (!ensureRoiPro("save-plan")) return;
    const result = await deleteRoiPlan(groupId);
    setSaveMessage(result.message ?? "");
    await refreshSavedGroups();
  }

  const activeGroupRaw = groups.find((group) => group.id === activeGroupId) ?? groups[0];
  const activeGroup = isPro ? activeGroupRaw : limitGroupsForFree(activeGroupRaw ? [activeGroupRaw] : groups)[0];
  const activeScenarios = activeGroup?.scenarios ?? [];
  const hasCompletedCalculation = activeScenarios.some((scenario) => scenario.lines.some(isLineCalculationComplete));

  useEffect(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }

    if (!isPro || isLoading || !isAuthenticated || !activeGroup) {
      pendingAutoSave.current = null;
      return;
    }

    const existing = savedGroups.find((group) => group.id === activeGroup.id);
    if (!existing && !groupHasDraftContent(activeGroup)) {
      pendingAutoSave.current = null;
      return;
    }

    const snapshot = buildRoiPlanSnapshot(activeGroup, existing);
    const signature = JSON.stringify(activeGroup);
    if (signature === autoSaveSignature.current) return;
    pendingAutoSave.current = { snapshot, signature };

    setAutoSaveStatus("saving");
    setAutoSaveMessage("Autosaving...");

    let isCancelled = false;

    autoSaveTimer.current = setTimeout(() => {
      const requestId = autoSaveRequest.current + 1;
      autoSaveRequest.current = requestId;
      saveRoiPlan(snapshot)
        .then((result) => {
          if (isCancelled || autoSaveRequest.current !== requestId) return;
          if (!result.data) {
            setAutoSaveStatus("error");
            setAutoSaveMessage(result.message ?? "Autosave failed");
            return;
          }

          const saved = result.data as SavedRoiGroup;
          autoSaveSignature.current = signature;
          if (pendingAutoSave.current?.signature === signature) pendingAutoSave.current = null;
          setSavedGroups((current) => [saved, ...current.filter((group) => group.id !== saved.id)]);
          setAutoSaveStatus("saved");
          setAutoSaveMessage(`Saved ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`);
        })
        .catch(() => {
          if (isCancelled || autoSaveRequest.current !== requestId) return;
          setAutoSaveStatus("error");
          setAutoSaveMessage("Autosave failed");
        });
    }, 1200);

    return () => {
      isCancelled = true;
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
    };
  }, [activeGroup, isAuthenticated, isLoading, isPro, savedGroups]);

  useEffect(() => {
    trackCalculatorOpened("roi-tool", "Promotion ROI Planner");
  }, []);

  useEffect(() => {
    if (!hasCompletedCalculation) {
      hasTrackedCompletion.current = false;
      return;
    }
    if (hasTrackedCompletion.current) return;
    hasTrackedCompletion.current = true;
    trackCalculatorCompleted("roi-tool", "Promotion ROI Planner");
  }, [hasCompletedCalculation]);

  function setScenarioLines(scenarioId: string, lines: RoiLine[]) {
    if (!activeGroup) return;
    const nextLines = isPro ? lines : lines.slice(0, 1);
    setPlannerState((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === activeGroup.id
          ? {
              ...group,
              scenarios: group.scenarios.map((scenario) =>
                scenario.id === scenarioId ? { ...scenario, lines: nextLines } : scenario,
              ),
            }
          : group,
      ),
    }));
  }

  function addLineToScenario(scenarioId: string) {
    if (!ensureRoiPro("add-line")) return;
    const scenario = activeScenarios.find((item) => item.id === scenarioId);
    setScenarioLines(scenarioId, [...(scenario?.lines ?? []), blankLine()]);
  }

  function addScenario() {
    if (!ensureRoiPro("add-scenario")) return;
    if (!activeGroup) return;
    const nextScenario = blankScenario(`Scenario ${activeGroup.scenarios.length + 1}`);
    setPlannerState((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === activeGroup.id ? { ...group, scenarios: [...group.scenarios, nextScenario] } : group,
      ),
      activeScenarioId: nextScenario.id,
    }));
  }

  function duplicateScenario(scenarioId: string) {
    if (!ensureRoiPro("add-scenario")) return;
    if (!activeGroup) return;
    const scenario = activeGroup.scenarios.find((item) => item.id === scenarioId);
    if (!scenario) return;
    const nextScenario = copyScenario(scenario);
    const index = activeGroup.scenarios.findIndex((item) => item.id === scenarioId);
    const nextScenarios = [
      ...activeGroup.scenarios.slice(0, index + 1),
      nextScenario,
      ...activeGroup.scenarios.slice(index + 1),
    ];
    setPlannerState((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === activeGroup.id ? { ...group, scenarios: nextScenarios } : group,
      ),
      activeScenarioId: nextScenario.id,
    }));
  }

  function deleteScenario(scenarioId: string) {
    if (!ensureRoiPro("add-scenario")) return;
    if (!activeGroup) return;
    const nextScenarios =
      activeGroup.scenarios.length > 1
        ? activeGroup.scenarios.filter((scenario) => scenario.id !== scenarioId)
        : [blankScenario("Scenario 1")];
    setPlannerState((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === activeGroup.id ? { ...group, scenarios: nextScenarios } : group,
      ),
      activeScenarioId: nextScenarios[0]?.id ?? "",
    }));
  }

  function updateScenarioName(scenarioId: string, name: string) {
    if (!activeGroup) return;
    setGroups(
      groups.map((group) =>
        group.id === activeGroup.id
          ? {
              ...group,
              scenarios: group.scenarios.map((scenario) =>
                scenario.id === scenarioId ? { ...scenario, name } : scenario,
              ),
            }
          : group,
      ),
    );
  }

  function uploadCsv(file: File | undefined) {
    if (!ensureRoiPro("upload-spreadsheet")) return;
    if (!file || !activeGroup) return;
    file.text().then((text) => {
      const rows = parseCsv(text);
      const errors = validateUploadRows(rows);
      if (errors.length > 0) {
        window.alert(errors.slice(0, 8).join("\n"));
        return;
      }

      const scenarios = rows.reduce<RoiScenario[]>((items, row) => {
        const scenarioName = has(row.scenario_name ?? "") ? row.scenario_name : "Scenario 1";
        const existing = items.find((scenario) => scenario.name === scenarioName);
        const line = lineFromUploadRow(row);
        if (existing) {
          existing.lines.push(line);
        } else {
          items.push({ id: crypto.randomUUID(), name: scenarioName, lines: [line] });
        }
        return items;
      }, []);

      setPlannerState((current) => ({
        ...current,
        groups: current.groups.map((group) =>
          group.id === activeGroup.id ? { ...group, scenarios } : group,
        ),
        activeScenarioId: scenarios[0]?.id ?? "",
      }));
    });
  }

  return (
    <section className="shell section">
      <div className="section-header">
        <h2>Build your plan</h2>
        <p className="section-lead">
          Enter the product line, normal trading position and promotional ask.
        </p>
      </div>
      <article className="card roi-planner">
        <div className="roi-plan-header">
          <div>
            {isPro ? (
              <label className="field inline-plan-name">
                <span>Comparison name</span>
                <input
                  aria-describedby="roi-comparison-name-help"
                  value={activeGroup?.name ?? ""}
                  onChange={(event) =>
                    setGroups(groups.map((group) => (group.id === activeGroup.id ? { ...group, name: event.target.value } : group)))
                  }
                />
                <small id="roi-comparison-name-help">This is the name used when you save the comparison.</small>
              </label>
            ) : null}
            <p className="roi-planner-helper">
              {isPro
                ? "Use this template if you prefer to build your plan in Excel first. You can also add lines directly below."
                : "Free lets you model one product line and one scenario. APT Pro adds multiple lines, saved scenarios, spreadsheet upload and exports."}
            </p>
          </div>
          <div className="roi-action-bar roi-action-bar-simple">
            {isPro ? (
              <>
                <button
                  className="button button-secondary button-small roi-locked-action"
                  onClick={() => requirePro(downloadInputTemplate, { feature: "download-template", location: "roi_tool_download_template" })}
                  type="button"
                >
                  Download template
                </button>
                <label className="button button-secondary button-small roi-locked-action">
                  Upload spreadsheet
                  <input accept=".csv,text/csv" className="visually-hidden" type="file" onChange={(event) => uploadCsv(event.target.files?.[0])} />
                </label>
                <CsvExportButton groups={activeGroup ? [activeGroup] : groups} onBeforeExport={() => ensureRoiPro("export-results")} />
                <button className="button button-secondary button-small roi-locked-action" onClick={saveCurrentGroup} type="button">Save named comparison</button>
              </>
            ) : (
              <>
                <ProOnlyAction onClick={() => ensureRoiPro("upload-spreadsheet")}>Upload spreadsheet</ProOnlyAction>
                <ProOnlyAction onClick={() => requirePro(downloadInputTemplate, { feature: "download-template", location: "roi_tool_download_template" })}>
                  Download template
                </ProOnlyAction>
                <ProOnlyAction onClick={() => ensureRoiPro("save-plan")}>Save comparison</ProOnlyAction>
                <ProOnlyAction onClick={() => ensureRoiPro("export-results")}>Export results</ProOnlyAction>
              </>
            )}
            {isPro && autoSaveMessage ? <span className={autoSaveStatusClass} role="status">{autoSaveMessage}</span> : null}
          </div>
        </div>

        {proMessage ? <p className="pro-inline-message" role="status">{proMessage}</p> : null}
        {isPro && saveMessage ? <p className={saveStatusClass} role="status">{saveMessage}</p> : null}

        {isPro ? (
          <SavedRoiPlansPanel
            groups={savedGroups}
            isLoading={isLoading}
            saveMessage={saveMessage}
            onDelete={deleteSavedGroup}
            onDuplicate={duplicateSavedGroup}
            onLoad={loadSavedGroup}
            onRename={renameSavedGroup}
          />
        ) : null}

        <div className="scenario-stack">
          {activeScenarios.map((scenario) => {
            const showNumberedHeading = isPro && activeScenarios.length > 1;
            return (
            <section className="scenario-card" key={scenario.id}>
              <div className="scenario-title-row">
                <div>
                  <h3>{showNumberedHeading ? scenario.name || "Scenario" : "Scenario"}</h3>
                  {!isPro ? <p>Model one scenario for free. Add and compare scenarios with APT Pro.</p> : null}
                </div>
              </div>
              <div className="scenario-card-header">
                <label className="field scenario-name-field">
                  <span>Name</span>
                  <input value={scenario.name} onChange={(event) => updateScenarioName(scenario.id, event.target.value)} />
                </label>
                <div className="scenario-card-actions">
                  {isPro ? (
                    <>
                      <button className="table-action" onClick={() => openSaveScenario(scenario)} type="button">Save scenario</button>
                      <button className="table-action" onClick={() => duplicateScenario(scenario.id)} type="button">Duplicate scenario</button>
                      <button className="table-action" onClick={() => deleteScenario(scenario.id)} type="button">Delete scenario</button>
                    </>
                  ) : (
                    <button className="table-action" onClick={() => openSaveScenario(scenario)} type="button">
                      Save scenario <ProBadge />
                    </button>
                  )}
                </div>
                <details className="roi-mobile-actions">
                  <summary>Scenario actions</summary>
                  <div>
                    <label className="roi-mobile-field">
                      <span>Rename scenario</span>
                      <input value={scenario.name} onChange={(event) => updateScenarioName(scenario.id, event.target.value)} />
                    </label>
                    {isPro ? (
                      <div className="summary-actions">
                        <button className="button button-secondary button-small" onClick={() => openSaveScenario(scenario)} type="button">Save scenario</button>
                        <button className="button button-secondary button-small" onClick={() => duplicateScenario(scenario.id)} type="button">Duplicate scenario</button>
                        <button className="button button-secondary button-small" onClick={() => deleteScenario(scenario.id)} type="button">Delete scenario</button>
                      </div>
                    ) : (
                      <div className="summary-actions">
                        <button className="button button-secondary button-small" onClick={() => openSaveScenario(scenario)} type="button">Save scenario <ProBadge /></button>
                      </div>
                    )}
                  </div>
                </details>
              </div>
              {savingScenarioId === scenario.id ? (
                <div className="save-work-panel roi-save-panel">
                  <label className="field scenario-name-field">
                    <span>Scenario name</span>
                    <input value={scenarioSaveName} onChange={(event) => setScenarioSaveName(event.target.value)} />
                  </label>
                  <div className="summary-actions">
                    <button className="button button-small" onClick={() => saveCurrentScenario(scenario)} type="button">Save scenario</button>
                    <button className="button button-secondary button-small" onClick={() => setSavingScenarioId("")} type="button">Cancel</button>
                  </div>
                </div>
              ) : null}
              {scenarioSaveMessage && scenarioMessageId === scenario.id ? (
                <div className="save-work-message" role="status">
                  <strong>{scenarioSaveMessage}</strong>
                  {savedScenarioId ? <a className="text-link" href="/workspace#scenarios">View in workspace</a> : null}
                  {savedScenarioId ? <button className="text-button" onClick={() => duplicateScenario(scenario.id)} type="button">Duplicate scenario</button> : null}
                  <button className="text-button" onClick={() => { setScenarioSaveMessage(""); setScenarioMessageId(""); }} type="button">Keep working</button>
                </div>
              ) : null}
              <RoiEditableTable
                lines={scenario.lines}
                onAddLine={() => addLineToScenario(scenario.id)}
                onChangeLines={(lines) => setScenarioLines(scenario.id, lines)}
                lineActions={isPro}
                newLineProOnly={!isPro}
              />
              <ScenarioSummary scenario={scenario} />
            </section>
          );
          })}
        </div>

        <CalculatorCaveat />

        <button
          className={isPro ? "button new-scenario-button" : "button button-secondary button-small new-scenario-button pro-only-button"}
          onClick={addScenario}
          type="button"
        >
          {isPro ? (
            "+ New scenario"
          ) : (
            <>
              Add another scenario
              <ProBadge />
            </>
          )}
        </button>

        {isPro ? <ScenarioComparison scenarios={activeScenarios} onAddScenario={addScenario} onSaveComparison={saveCurrentGroup} /> : <FreeProPrompt />}
      </article>
    </section>
  );
}

export function RoiToolProduct() {
  return (
    <>
      <RoiPlanner />
    </>
  );
}
