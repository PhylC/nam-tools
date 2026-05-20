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

function Field({
  label,
  value,
  onChange,
  placeholder,
  optional,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
}) {
  return (
    <label className="field">
      <span className="field-label">
        <span>{label}</span>
        <span className={optional ? "field-status" : "field-status field-required"}>
          {optional ? "Optional" : "Required"}
        </span>
      </span>
      <input placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
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

function RoiLineEditor({
  line,
  onChange,
  onDuplicate,
  onDelete,
}: {
  line: RoiLine;
  onChange: (line: RoiLine) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}) {
  return (
    <article className="mini-card">
      <div className="output-header">
        <div>
          <span className="pill">ROI line</span>
          <h3>{line.product || line.sku || "New line"}</h3>
        </div>
        <div className="summary-actions">
          {onDuplicate ? <button className="button button-secondary button-small" onClick={onDuplicate} type="button">Duplicate</button> : null}
          {onDelete ? <button className="button button-secondary button-small" onClick={onDelete} type="button">Delete</button> : null}
        </div>
      </div>
      <div className="form-grid">
        <Field label="SKU / Model / Item Number" placeholder="e.g. SKU-1001" value={line.sku} onChange={(value) => onChange({ ...line, sku: value })} />
        <Field label="Product name" placeholder="e.g. Core 500ml pack" value={line.product} onChange={(value) => onChange({ ...line, product: value })} />
        <Field label="Current invoice price" placeholder="e.g. 1.75" value={line.currentInvoice} onChange={(value) => onChange({ ...line, currentInvoice: value })} />
        <label className="field">
          <span className="field-label">
            <span>Support input</span>
            <span className="field-status field-required">Required</span>
          </span>
          <select value={line.supportMode} onChange={(event) => onChange({ ...line, supportMode: event.target.value as SupportMode })}>
            <option value="promoInvoice">Promo invoice price</option>
            <option value="soa">SOA / supplier support per unit</option>
          </select>
        </label>
        {line.supportMode === "promoInvoice" ? (
          <Field label="Promo invoice price" placeholder="e.g. 1.40" value={line.promoInvoice} onChange={(value) => onChange({ ...line, promoInvoice: value })} />
        ) : (
          <Field label="SOA / supplier support per unit" placeholder="e.g. 0.35" value={line.soa} onChange={(value) => onChange({ ...line, soa: value })} />
        )}
        <Field label="Current SRP" optional placeholder="e.g. 2.50" value={line.currentSrp} onChange={(value) => onChange({ ...line, currentSrp: value })} />
        <Field label="Promo SRP" optional placeholder="e.g. 2.00" value={line.promoSrp} onChange={(value) => onChange({ ...line, promoSrp: value })} />
        <Field label="Units baseline" placeholder="e.g. 10,000" value={line.baselineUnits} onChange={(value) => onChange({ ...line, baselineUnits: value })} />
        <Field label="Units on promotion" placeholder="e.g. 18,000" value={line.promoUnits} onChange={(value) => onChange({ ...line, promoUnits: value })} />
        <Field label="COGS" optional placeholder="e.g. 1.10" value={line.cogs} onChange={(value) => onChange({ ...line, cogs: value })} />
        <Field label="Fixed support" optional placeholder="e.g. 2,500" value={line.fixedSupport} onChange={(value) => onChange({ ...line, fixedSupport: value })} />
      </div>
    </article>
  );
}

function ResultCards({ line }: { line: RoiLine }) {
  const calc = calculateLine(line);
  const ready =
    has(line.currentInvoice) &&
    (line.supportMode === "soa" ? has(line.soa) : has(line.promoInvoice)) &&
    has(line.baselineUnits) &&
    has(line.promoUnits);

  if (!ready) {
    return <p className="empty-state">Enter the required fields to see your result.</p>;
  }

  return (
    <div className="result-grid">
      <div className="result-item"><span className="result-label">Incremental units</span><strong>{calc.incrementalUnits.toLocaleString("en-GB")}</strong></div>
      <div className="result-item"><span className="result-label">Incremental revenue</span><strong>{money(calc.incrementalRevenue)}</strong></div>
      <div className="result-item"><span className="result-label">Total support cost</span><strong>{money(calc.supportCost)}</strong></div>
      <div className="result-item"><span className="result-label">Revenue ROI</span><strong>{pct(calc.revenueRoi)}</strong></div>
      {calc.hasCogs ? (
        <>
          <div className="result-item"><span className="result-label">Gross profit impact</span><strong>{money(calc.profitImpact)}</strong></div>
          <div className="result-item"><span className="result-label">Profit ROI</span><strong>{pct(calc.profitRoi)}</strong></div>
        </>
      ) : (
        <div className="result-item"><span className="result-label">Profit ROI</span><strong>Add COGS</strong></div>
      )}
    </div>
  );
}

export function RoiFreeTool() {
  const [line, setLine] = useState<RoiLine>(blankLine);

  return (
    <section className="shell section">
      <div className="section-header">
        <p className="eyebrow">Free ROI Tool</p>
        <h2>Single-line promotion ROI check.</h2>
        <p className="section-lead">
          Use this for one SKU, model or item. COGS and fixed support are optional, so you can start with a revenue ROI view and add profit later.
        </p>
      </div>
      <article className="card tool-form">
        <RoiLineEditor line={line} onChange={setLine} />
        <div className="result-box">
          <div className="output-header">
            <div>
              <span className="pill">Free result</span>
              <h3>ROI summary</h3>
            </div>
          </div>
          <ResultCards line={line} />
          <p className="planning-disclaimer">
            Pricing is at the sole discretion of the retailer. Outputs are estimates for planning only.
          </p>
        </div>
      </article>
    </section>
  );
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

function RoiEditableTable({
  lines,
  onChangeLines,
  onAddLine,
}: {
  lines: RoiLine[];
  onChangeLines: (lines: RoiLine[]) => void;
  onAddLine: () => void;
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
      <div className="roi-table-scroll">
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
              <th>Actions</th>
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
                  <td>
                    <div className="table-action-group">
                      <button className="table-action" onClick={() => duplicateLine(line.id)} type="button">Copy</button>
                      <button className="table-action" onClick={() => onChangeLines(lines.length > 1 ? lines.filter((item) => item.id !== line.id) : [blankLine()])} type="button">Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button className="button button-secondary new-line-button" onClick={onAddLine} type="button">+ New line</button>
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

function ScenarioComparison({ scenarios }: { scenarios: RoiScenario[] }) {
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

export function RoiProPlanner() {
  const { isAuthenticated, isLoading } = useSupabaseAuth();
  const [plannerState, setPlannerState] = useState(initialRoiPlannerState);
  const { groups, activeGroupId } = plannerState;
  const [savedGroups, setSavedGroups] = useState<SavedRoiGroup[]>([]);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    refreshSavedGroups();
  }, [isAuthenticated]);

  async function refreshSavedGroups() {
    const result = await listRoiPlans();
    setSavedGroups(result.data as SavedRoiGroup[]);
    setSaveMessage(result.message ?? "");
  }

  function setGroups(nextGroups: RoiGroup[]) {
    setPlannerState((current) => ({
      ...current,
      groups: nextGroups.length ? nextGroups : [blankGroup()],
    }));
  }

  async function saveCurrentGroup() {
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
    const result = await deleteRoiPlan(groupId);
    setSaveMessage(result.message ?? "");
    await refreshSavedGroups();
  }

  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? groups[0];
  const activeScenarios = activeGroup?.scenarios ?? [];

  function setScenarioLines(scenarioId: string, lines: RoiLine[]) {
    if (!activeGroup) return;
    setPlannerState((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === activeGroup.id
          ? {
              ...group,
              scenarios: group.scenarios.map((scenario) =>
                scenario.id === scenarioId ? { ...scenario, lines } : scenario,
              ),
            }
          : group,
      ),
    }));
  }

  function addLineToScenario(scenarioId: string) {
    const scenario = activeScenarios.find((item) => item.id === scenarioId);
    setScenarioLines(scenarioId, [...(scenario?.lines ?? []), blankLine()]);
  }

  function addScenario() {
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
        <p className="eyebrow">Pro</p>
        <h2>ROI planner</h2>
        <p className="section-lead">
          Model one SKU or a full multi-line promotion, compare scenarios and export the numbers.
        </p>
      </div>
      <article className="card roi-planner">
        <div className="roi-plan-header">
          <div>
            <span className="pill pro-pill">Pro</span>
            <label className="field inline-plan-name">
              <span>Plan name</span>
              <input
                value={activeGroup?.name ?? ""}
                onChange={(event) =>
                  setGroups(groups.map((group) => (group.id === activeGroup.id ? { ...group, name: event.target.value } : group)))
                }
              />
            </label>
            <p className="form-note">Use this template if you prefer to build your plan in Excel first. You can also add lines directly below.</p>
          </div>
          <div className="roi-action-bar roi-action-bar-simple">
            <button className="button button-secondary button-small" onClick={downloadInputTemplate} type="button">Download input template</button>
            <label className="button button-secondary button-small">
              Upload spreadsheet
              <input accept=".csv,text/csv" className="visually-hidden" type="file" onChange={(event) => uploadCsv(event.target.files?.[0])} />
            </label>
            <CsvExportButton groups={activeGroup ? [activeGroup] : groups} />
            <button className="button button-secondary button-small" onClick={saveCurrentGroup} type="button">
              Save plan
            </button>
          </div>
        </div>

        <SavedRoiPlansPanel
          groups={savedGroups}
          isLoading={isLoading}
          saveMessage={saveMessage}
          onDelete={deleteSavedGroup}
          onDuplicate={duplicateSavedGroup}
          onLoad={loadSavedGroup}
          onRename={renameSavedGroup}
        />

        <div className="scenario-stack">
          {activeScenarios.map((scenario) => (
            <section className="scenario-card" key={scenario.id}>
              <div className="scenario-card-header">
                <label className="field scenario-name-field">
                  <span>Scenario name</span>
                  <input value={scenario.name} onChange={(event) => updateScenarioName(scenario.id, event.target.value)} />
                </label>
                <div className="scenario-card-actions">
                  <button className="table-action" onClick={() => duplicateScenario(scenario.id)} type="button">Duplicate scenario</button>
                  <button className="table-action" onClick={() => deleteScenario(scenario.id)} type="button">Delete scenario</button>
                </div>
              </div>
              <RoiEditableTable
                lines={scenario.lines}
                onAddLine={() => addLineToScenario(scenario.id)}
                onChangeLines={(lines) => setScenarioLines(scenario.id, lines)}
              />
              <ScenarioSummary scenario={scenario} />
            </section>
          ))}
        </div>

        <button className="button new-scenario-button" onClick={addScenario} type="button">+ New scenario</button>

        <ScenarioComparison scenarios={activeScenarios} />
        <p className="planning-disclaimer">
          Save your work and return to it later.
        </p>
      </article>
    </section>
  );
}

export function RoiToolProduct() {
  const { aptMode } = useAptMode();

  return (
    <>
      {aptMode === "pro" ? (
        <RoiProPlanner />
      ) : (
        <>
          <RoiFreeTool />
          <section className="shell section">
            <article className="card split-band">
              <div>
                <p className="eyebrow">Pro</p>
                <h2>Plan one SKU or a full multi-line promotion in one table.</h2>
                <p>
                  Switch the header toggle to Pro to use CSV upload,
                  scenario comparison, editable table rows, CSV export and saved plans.
                </p>
              </div>
              <span className="pill pro-pill">Pro</span>
            </article>
          </section>
        </>
      )}
    </>
  );
}
