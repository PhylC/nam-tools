"use client";

import { useEffect, useState } from "react";
import { useAptMode } from "../components/AptMode";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";
import {
  deleteRoiPlan,
  duplicateRoiPlan,
  listRoiPlans,
  loadRoiPlan,
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

type RoiPlannerMode = "free" | "pro";

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
  "scenario_name REQUIRED",
  "sku_model_item_number REQUIRED",
  "product_name REQUIRED",
  "current_invoice_price REQUIRED",
  "promo_invoice_price OPTIONAL",
  "support_per_unit_soa OPTIONAL",
  "current_srp OPTIONAL",
  "promo_srp OPTIONAL",
  "baseline_units REQUIRED",
  "promo_units REQUIRED",
  "cogs_per_unit OPTIONAL",
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
  const promoInvoice = row.promo_invoice_price ?? "";
  const soa = row.support_per_unit_soa ?? "";
  return {
    ...blankLine(),
    sku: row.sku_model_item_number ?? "",
    product: row.product_name ?? "",
    notes: row.notes ?? "",
    currentInvoice: row.current_invoice_price ?? "",
    promoInvoice,
    soa,
    currentSrp: row.current_srp ?? "",
    promoSrp: row.promo_srp ?? "",
    baselineUnits: row.baseline_units ?? "",
    promoUnits: row.promo_units ?? "",
    cogs: row.cogs_per_unit ?? "",
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
    if (!has(row.sku_model_item_number ?? "")) errors.push(`Row ${rowNumber}: sku_model_item_number is required.`);
    if (!has(row.product_name ?? "")) errors.push(`Row ${rowNumber}: product_name is required.`);
    if (!has(row.current_invoice_price ?? "")) errors.push(`Row ${rowNumber}: current_invoice_price is required.`);
    if (!has(row.baseline_units ?? "")) errors.push(`Row ${rowNumber}: baseline_units is required.`);
    if (!has(row.promo_units ?? "")) errors.push(`Row ${rowNumber}: promo_units is required.`);
  });
  return errors;
}

function CsvExportButton({ groups }: { groups: RoiGroup[] }) {
  function exportCsv() {
    const rows: Array<Array<string | number | null>> = [
      [
        "group_name",
        "scenario_name",
        "row_type",
        "sku_model_item_number",
        "product_name",
        "notes",
        "current_invoice_price",
        "promo_invoice_price",
        "support_per_unit_soa",
        "current_srp",
        "promo_srp",
        "baseline_units",
        "promo_units",
        "cogs_per_unit",
        "fixed_support",
        "vat_rate",
        "currency",
        "incremental_units",
        "baseline_revenue",
        "promo_revenue",
        "incremental_revenue",
        "support_cost",
        "baseline_gross_profit",
        "promo_gross_profit",
        "profit_impact",
        "revenue_roi",
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

    downloadCsv("apt-roi-results.csv", rows);
  }

  return (
    <button className="button button-secondary button-small" onClick={exportCsv} type="button">
      Export results
    </button>
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
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <label className="roi-mobile-field">
      <span>{label}</span>
      <input
        inputMode={type === "number" ? "decimal" : undefined}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
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
            <MobileField label="SOA/support" type="number" value={line.soa} onChange={(value) => changeLine(line.id, { soa: value, supportMode: "soa" })} />
          ) : (
            <MobileField label="Promo invoice price" type="number" value={line.promoInvoice} onChange={(value) => changeLine(line.id, { promoInvoice: value, supportMode: "promoInvoice" })} />
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
                ) : (
                  <span className="pill">Available in Pro</span>
                )}
              </div>
            </div>

            <div className="roi-mobile-field-grid">
              <MobileField label="SKU / Item" value={line.sku} onChange={(value) => changeLine(line.id, { sku: value })} />
              <MobileField label="Product" value={line.product} onChange={(value) => changeLine(line.id, { product: value })} />
              <MobileField label="Current invoice price" type="number" value={line.currentInvoice} onChange={(value) => changeLine(line.id, { currentInvoice: value })} />
              <MobileField label="Current volume" type="number" value={line.baselineUnits} onChange={(value) => changeLine(line.id, { baselineUnits: value })} />
              <label className="roi-mobile-field">
                <span>Promo input</span>
                <select value={line.supportMode} onChange={(event) => changeLine(line.id, { supportMode: event.target.value as SupportMode })}>
                  <option value="promoInvoice">Promo invoice price</option>
                  <option value="soa">SOA/support per unit</option>
                </select>
              </label>
              {supportField}
              <MobileField label="Promo volume" type="number" value={line.promoUnits} onChange={(value) => changeLine(line.id, { promoUnits: value })} />
            </div>

            <details className="roi-mobile-advanced">
              <summary>Show advanced inputs</summary>
              <div className="roi-mobile-field-grid">
                <MobileField label="COGS" type="number" value={line.cogs} onChange={(value) => changeLine(line.id, { cogs: value })} />
                <MobileField label="Fixed support" type="number" value={line.fixedSupport} onChange={(value) => changeLine(line.id, { fixedSupport: value })} />
                <MobileField label="Current SRP" type="number" value={line.currentSrp} onChange={(value) => changeLine(line.id, { currentSrp: value })} />
                <MobileField label="Promo SRP" type="number" value={line.promoSrp} onChange={(value) => changeLine(line.id, { promoSrp: value })} />
                <MobileField label="VAT rate" type="number" value={line.vatRate} onChange={(value) => changeLine(line.id, { vatRate: value })} />
                <MobileField label="Currency" value={line.currency} onChange={(value) => changeLine(line.id, { currency: value })} />
                <label className="roi-mobile-field roi-mobile-field-full">
                  <span>Notes</span>
                  <textarea value={line.notes} onChange={(event) => changeLine(line.id, { notes: event.target.value })} />
                </label>
              </div>
            </details>

            <div className="roi-mobile-line-results" aria-label={`Line ${index + 1} results`}>
              <div><span>Inc revenue</span><strong>{money(calc.incrementalRevenue)}</strong></div>
              <div><span>Support</span><strong>{money(calc.supportCost)}</strong></div>
              <div><span>Profit</span><strong>{calc.hasCogs ? money(calc.profitImpact) : "Add COGS"}</strong></div>
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

  return (
    <>
      <div className="roi-table-scroll roi-desktop-table">
        <table className="roi-planner-table">
          <thead>
            <tr>
              <th className="sticky-col">SKU / Item</th>
              <th>Product</th>
              <th>Current invoice</th>
              <th>Promo invoice</th>
              <th>SOA/support</th>
              <th>Baseline units</th>
              <th>Promo units</th>
              <th>COGS optional</th>
              <th>Fixed support optional</th>
              <th>Incremental revenue</th>
              <th>Support cost</th>
              <th>Profit impact</th>
              <th>Revenue ROI</th>
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
                  <td><TableInput ariaLabel="Current invoice" value={line.currentInvoice} onChange={(value) => changeLine(line.id, { currentInvoice: value })} /></td>
                  <td><TableInput ariaLabel="Promo invoice" value={line.promoInvoice} onChange={(value) => changeLine(line.id, { promoInvoice: value, supportMode: "promoInvoice" })} /></td>
                  <td><TableInput ariaLabel="SOA/support" value={line.soa} onChange={(value) => changeLine(line.id, { soa: value, supportMode: "soa" })} /></td>
                  <td><TableInput ariaLabel="Baseline units" value={line.baselineUnits} onChange={(value) => changeLine(line.id, { baselineUnits: value })} /></td>
                  <td><TableInput ariaLabel="Promo units" value={line.promoUnits} onChange={(value) => changeLine(line.id, { promoUnits: value })} /></td>
                  <td><TableInput ariaLabel="COGS optional" value={line.cogs} onChange={(value) => changeLine(line.id, { cogs: value })} /></td>
                  <td><TableInput ariaLabel="Fixed support optional" value={line.fixedSupport} onChange={(value) => changeLine(line.id, { fixedSupport: value })} /></td>
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
        className={newLineProOnly ? "button button-secondary new-line-button pro-only-button" : "button button-secondary new-line-button"}
        onClick={onAddLine}
        type="button"
      >
        + New line{newLineProOnly ? " · Pro" : ""}
      </button>
    </>
  );
}

function ScenarioSummary({ scenario }: { scenario: RoiScenario }) {
  const summary = aggregate(scenario.lines);
  const items = [
    ["Base rev", money(summary.baselineRevenue)],
    ["Promo rev", money(summary.promoRevenue)],
    ["Inc rev", money(summary.revenueImpact)],
    ["Support", money(summary.supportCost)],
    ["Profit", summary.profitRows ? money(summary.profitImpact) : "n/a"],
    ["Rev ROI", pct(summary.supportCost > 0 ? summary.revenueImpact / summary.supportCost : null)],
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
        <div><span>Incremental revenue</span><strong>{money(summary.revenueImpact)}</strong></div>
        <div><span>Incremental profit</span><strong>{summary.profitRows ? money(summary.profitImpact) : "Add COGS to see profit ROI"}</strong></div>
        <div><span>ROI</span><strong>{pct(summary.profitRows && summary.supportCost > 0 ? summary.profitImpact / summary.supportCost : summary.supportCost > 0 ? summary.revenueImpact / summary.supportCost : null)}</strong></div>
        <div><span>Base revenue</span><strong>{money(summary.baselineRevenue)}</strong></div>
        <div><span>Promo revenue</span><strong>{money(summary.promoRevenue)}</strong></div>
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

function ScenarioComparison({ scenarios, onAddScenario }: { scenarios: RoiScenario[]; onAddScenario: () => void }) {
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

  return (
    <section className="card scenario-comparison">
      <div className="scenario-comparison-desktop">
        <div>
          <span className="pill pro-pill">Scenario comparison</span>
          <h3>Scenario comparison</h3>
          <p>{narrative}</p>
        </div>
        {scenarios.length > 1 ? (
          <div className="comparison-chip-row">
            <div className="kpi-chip"><span>Best revenue</span><strong>{bestRevenue?.scenario.name ?? "n/a"}</strong></div>
            <div className="kpi-chip"><span>Best profit</span><strong>{bestProfit?.scenario.name ?? "n/a"}</strong></div>
            <div className="kpi-chip"><span>Best ROI</span><strong>{bestRoi?.scenario.name ?? "n/a"}</strong></div>
            <div className="kpi-chip"><span>Lowest support</span><strong>{lowestSupport?.scenario.name ?? "n/a"}</strong></div>
            <div className="kpi-chip"><span>Highest risk</span><strong>{highestRisk?.scenario.name ?? "n/a"}</strong></div>
            <div className="kpi-chip"><span>Recommended</span><strong>{recommended?.scenario.name ?? "n/a"}</strong></div>
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
            <div className="roi-mobile-comparison-list">
              {metrics.map((item) => {
                const badges = [
                  bestRevenue?.scenario.id === item.scenario.id ? "Best revenue" : "",
                  bestProfit?.scenario.id === item.scenario.id ? "Best profit" : "",
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
                      <div><dt>Inc revenue</dt><dd>{money(item.summary.revenueImpact)}</dd></div>
                      <div><dt>ROI</dt><dd>{pct(item.profitRoi ?? item.revenueRoi)}</dd></div>
                      <div><dt>Profit</dt><dd>{item.summary.profitRows ? money(item.summary.profitImpact) : "Add COGS"}</dd></div>
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
  return (
    <details className="saved-plans-details">
      <summary>Load or manage saved ROI plans</summary>
      <aside className="saved-panel saved-panel-compact">
      <div>
        <p>Save your work and return to it later.</p>
          {isLoading ? <p className="empty-state">Checking account save status...</p> : null}
          {saveMessage ? <p className="empty-state">{saveMessage}</p> : null}
        </div>
        {groups.length ? (
          <div className="saved-list">
            {groups.map((group) => (
              <div className="saved-row" key={group.id}>
                <label className="field saved-name-field">
                  <span>Saved ROI group</span>
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
          <p className="empty-state">No saved ROI plans yet.</p>
        )}
      </aside>
    </details>
  );
}

function ProOnlyAction({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="button button-secondary button-small pro-only-button" onClick={onClick} type="button">
      {children} · Pro
    </button>
  );
}

function FreeProPrompt({ onSwitchToPro }: { onSwitchToPro: () => void }) {
  return (
    <article className="card pro-upgrade-panel">
      <div>
        <span className="pill pro-pill">Pro</span>
        <h3>Need to compare more than one option?</h3>
        <p>
          Pro lets you add multiple products, build different scenarios, upload spreadsheets,
          save plans and export the results.
        </p>
      </div>
      <button className="button" onClick={onSwitchToPro} type="button">Switch to Pro</button>
    </article>
  );
}

export function RoiPlanner({ mode }: { mode: RoiPlannerMode }) {
  const isPro = mode === "pro";
  const { setAptMode } = useAptMode();
  const { isAuthenticated, isLoading } = useSupabaseAuth();
  const [plannerState, setPlannerState] = useState(initialRoiPlannerState);
  const { groups, activeGroupId } = plannerState;
  const [savedGroups, setSavedGroups] = useState<SavedRoiGroup[]>([]);
  const [saveMessage, setSaveMessage] = useState("");
  const [proMessage, setProMessage] = useState("");

  useEffect(() => {
    if (isPro) refreshSavedGroups();
  }, [isAuthenticated, isPro]);

  function showProMessage() {
    setProMessage("Available in Pro.");
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
    if (!isPro) {
      showProMessage();
      return;
    }
    if (!activeGroup) return;
    const existing = savedGroups.find((group) => group.id === activeGroup.id);
    const now = new Date().toISOString();
    const snapshot = {
      ...activeGroup,
      name: activeGroup.name,
      group_name: activeGroup.name,
      savedAt: now,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      created_at: existing?.created_at ?? existing?.createdAt ?? now,
      updated_at: now,
    };
    const result = await saveRoiPlan(snapshot);
    setSaveMessage(result.message ?? "");
    await refreshSavedGroups();
  }

  async function loadSavedGroup(groupId: string) {
    if (!isPro) {
      showProMessage();
      return;
    }
    const result = await loadRoiPlan(groupId);
    setSaveMessage(result.message ?? "");
    const saved = result.data as SavedRoiGroup | null;
    if (!saved) return;
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
    if (!isPro) {
      showProMessage();
      return;
    }
    const saved = savedGroups.find((group) => group.id === groupId);
    if (!saved) return;
    const now = new Date().toISOString();
    const result = await saveRoiPlan({ ...saved, name, group_name: name, savedAt: now, updatedAt: now, updated_at: now });
    setSaveMessage(result.message ?? "");
    await refreshSavedGroups();
    setPlannerState((current) => ({
      ...current,
      groups: current.groups.map((group) => (group.id === groupId ? { ...group, name } : group)),
    }));
  }

  async function duplicateSavedGroup(groupId: string) {
    if (!isPro) {
      showProMessage();
      return;
    }
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
    if (!isPro) {
      showProMessage();
      return;
    }
    const result = await deleteRoiPlan(groupId);
    setSaveMessage(result.message ?? "");
    await refreshSavedGroups();
  }

  const activeGroupRaw = groups.find((group) => group.id === activeGroupId) ?? groups[0];
  const activeGroup = isPro ? activeGroupRaw : limitGroupsForFree(activeGroupRaw ? [activeGroupRaw] : groups)[0];
  const activeScenarios = activeGroup?.scenarios ?? [];

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
    if (!isPro) {
      showProMessage();
      return;
    }
    const scenario = activeScenarios.find((item) => item.id === scenarioId);
    setScenarioLines(scenarioId, [...(scenario?.lines ?? []), blankLine()]);
  }

  function addScenario() {
    if (!isPro) {
      showProMessage();
      return;
    }
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
    if (!isPro) {
      showProMessage();
      return;
    }
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
    if (!isPro) {
      showProMessage();
      return;
    }
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
    if (!isPro) {
      showProMessage();
      return;
    }
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
        <p className="eyebrow">{isPro ? "Pro" : "Free"}</p>
        <h2>ROI planner</h2>
        <p className="section-lead">
          Model one SKU or a full multi-line promotion, compare scenarios and export the numbers.
        </p>
      </div>
      <article className="card roi-planner">
        <div className="roi-plan-header">
          <div>
            <span className={isPro ? "pill pro-pill" : "pill"}>{isPro ? "Pro" : "Free"}</span>
            {isPro ? (
              <label className="field inline-plan-name">
                <span>Plan name</span>
                <input
                  value={activeGroup?.name ?? ""}
                  onChange={(event) =>
                    setGroups(groups.map((group) => (group.id === activeGroup.id ? { ...group, name: event.target.value } : group)))
                  }
                />
              </label>
            ) : null}
            <p className="form-note">
              {isPro
                ? "Use this template if you prefer to build your plan in Excel first. You can also add lines directly below."
                : "Edit the single product line below to calculate one scenario."}
            </p>
          </div>
          <div className="roi-action-bar roi-action-bar-simple">
            {isPro ? (
              <>
                <button className="button button-secondary button-small" onClick={downloadInputTemplate} type="button">Download input template</button>
                <label className="button button-secondary button-small">
                  Upload spreadsheet
                  <input accept=".csv,text/csv" className="visually-hidden" type="file" onChange={(event) => uploadCsv(event.target.files?.[0])} />
                </label>
                <CsvExportButton groups={activeGroup ? [activeGroup] : groups} />
                <button className="button button-secondary button-small" onClick={saveCurrentGroup} type="button">Save plan</button>
              </>
            ) : (
              <>
                <ProOnlyAction onClick={showProMessage}>Upload spreadsheet</ProOnlyAction>
                <ProOnlyAction onClick={showProMessage}>Download input template</ProOnlyAction>
                <ProOnlyAction onClick={showProMessage}>Save plan</ProOnlyAction>
                <ProOnlyAction onClick={showProMessage}>Export results</ProOnlyAction>
              </>
            )}
          </div>
        </div>

        {proMessage ? <p className="pro-inline-message" role="status">{proMessage}</p> : null}

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
          {activeScenarios.map((scenario) => (
            <section className="scenario-card" key={scenario.id}>
              <div className="scenario-card-header">
                <label className="field scenario-name-field">
                  <span>Scenario name</span>
                  <input value={scenario.name} onChange={(event) => updateScenarioName(scenario.id, event.target.value)} />
                </label>
                <div className="scenario-card-actions">
                  {isPro ? (
                    <>
                      <button className="table-action" onClick={() => duplicateScenario(scenario.id)} type="button">Duplicate scenario</button>
                      <button className="table-action" onClick={() => deleteScenario(scenario.id)} type="button">Delete scenario</button>
                    </>
                  ) : (
                    <span className="pill">Available in Pro</span>
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
                        <button className="button button-secondary button-small" onClick={() => duplicateScenario(scenario.id)} type="button">Duplicate scenario</button>
                        <button className="button button-secondary button-small" onClick={() => deleteScenario(scenario.id)} type="button">Delete scenario</button>
                      </div>
                    ) : (
                      <p className="empty-state">Duplicate and delete are available in Pro.</p>
                    )}
                  </div>
                </details>
              </div>
              <RoiEditableTable
                lines={scenario.lines}
                onAddLine={() => addLineToScenario(scenario.id)}
                onChangeLines={(lines) => setScenarioLines(scenario.id, lines)}
                lineActions={isPro}
                newLineProOnly={!isPro}
              />
              <ScenarioSummary scenario={scenario} />
            </section>
          ))}
        </div>

        <button
          className={isPro ? "button new-scenario-button" : "button button-secondary new-scenario-button pro-only-button"}
          onClick={addScenario}
          type="button"
        >
          + New scenario{isPro ? "" : " · Pro"}
        </button>
        {isPro ? null : <p className="form-note">Compare multiple promo options in Pro.</p>}

        {isPro ? <ScenarioComparison scenarios={activeScenarios} onAddScenario={addScenario} /> : <FreeProPrompt onSwitchToPro={() => setAptMode("pro")} />}
        {isPro ? <p className="planning-disclaimer">Save your work and return to it later.</p> : null}
      </article>
    </section>
  );
}

export function RoiToolProduct() {
  const { aptMode } = useAptMode();

  return (
    <>
      <RoiPlanner mode={aptMode} />
    </>
  );
}
