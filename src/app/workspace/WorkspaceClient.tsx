"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  deleteDeckBrief,
  deleteRoiPlan,
  deleteSavedAnalysis,
  deleteSavedScenario,
  duplicateDeckBrief,
  duplicateSavedAnalysis,
  duplicateRoiPlan,
  duplicateSavedScenario,
  listDeckBriefs,
  listRoiPlans,
  listSavedAnalyses,
  listSavedScenarios,
  saveAnalysis,
  saveDeckBrief,
  saveRoiPlan,
  saveScenario,
} from "../../lib/saveStore";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";
import { AccountMenu } from "../components/AccountMenu";

type SavedRecord = Record<string, unknown>;
type SavedItemType = "Analysis" | "Comparison" | "Scenario" | "Deck";
type WorkspaceSort = "updated-desc" | "updated-asc" | "name-asc" | "name-desc";

type SavedWorkItem = {
  id: string;
  type: SavedItemType;
  record: SavedRecord;
};

function deckSelectionKey(id: string) {
  return `deck:${id}`;
}

function standaloneScenarioSelectionKey(id: string) {
  return `scenario:${id}`;
}

function comparisonScenarioSelectionKey(comparisonId: string, scenarioId: string) {
  return `comparison-scenario:${comparisonId}:${scenarioId}`;
}

function parseSelectionKey(key: string) {
  const [type, firstId, ...rest] = key.split(":");
  return { type, firstId, secondId: rest.join(":") };
}

function getText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function isRecord(value: unknown): value is SavedRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nowIso() {
  return new Date().toISOString();
}

function getSavedItemTitle(item: SavedRecord, type: SavedItemType) {
  return getText(
    item.title ?? item.name ?? item.group_name ?? item.deck_name,
    type === "Deck" ? "Saved deck" : type === "Comparison" ? "Saved comparison" : type === "Scenario" ? "Saved scenario" : "Saved calculator result",
  );
}

function getTimestamp(item: SavedRecord) {
  const raw = item.updated_at ?? item.updatedAt ?? item.savedAt ?? item.created_at ?? item.createdAt;
  if (typeof raw !== "string") return 0;
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getUpdatedDate(item: SavedRecord) {
  const time = getTimestamp(item);
  if (!time) return "Date not available";
  return `Last updated ${new Date(time).toLocaleDateString("en-GB")}`;
}

function getDeckDescription(item: SavedRecord) {
  const template = getText(item.template_type, "Presentation deck");
  const customer = getText(item.customer, "");
  return customer ? `${template} for ${customer}` : template;
}

function getAnalysisDescription(item: SavedRecord) {
  const calculatorName = getText(item.calculatorName, "Calculator");
  const summary = getText(item.summaryText, "");
  return summary ? summary.slice(0, 120) : `${calculatorName} result`;
}

function getComparisonScenarios(item: SavedRecord) {
  return Array.isArray(item.scenarios) ? item.scenarios.filter(isRecord) : [];
}

function getComparisonScenarioId(comparisonId: string, scenario: SavedRecord, index: number) {
  return getText(scenario.id, `${comparisonId}-scenario-${index}`);
}

function getScenarioLineCount(scenario: SavedRecord) {
  return Array.isArray(scenario.lines) ? scenario.lines.length : 0;
}

function getScenarioSummary(scenario: SavedRecord) {
  const lines = getScenarioLineCount(scenario);
  const products = Array.isArray(scenario.lines)
    ? scenario.lines
        .map((line) => (isRecord(line) ? getText(line.product ?? line.sku, "") : ""))
        .filter(Boolean)
        .slice(0, 3)
    : [];
  return products.length ? `${lines} line(s) · ${products.join(", ")}` : `${lines} line(s)`;
}

function getComparisonDescription(item: SavedRecord) {
  const scenarios = getComparisonScenarios(item);
  const lineCount = scenarios.reduce((total, scenario) => total + getScenarioLineCount(scenario), 0);
  return `${scenarios.length || 0} scenario(s) · ${lineCount} product line(s)`;
}

function getScenarioRecord(item: SavedRecord) {
  return isRecord(item.scenarioData) ? item.scenarioData : item;
}

function getScenarioDescription(item: SavedRecord) {
  const scenario = getScenarioRecord(item);
  const outputs = isRecord(item.outputs) ? item.outputs : {};
  const lines = outputs.lines ? `${outputs.lines} line(s)` : getScenarioSummary(scenario) || "Saved deal version";
  const incrementalRevenue = getText(outputs.incrementalRevenue, "");
  return incrementalRevenue ? `${lines} · ${incrementalRevenue} incremental revenue` : lines;
}

function getItemDescription(item: SavedRecord, type: SavedItemType) {
  if (type === "Deck") return getDeckDescription(item);
  if (type === "Comparison") return getComparisonDescription(item);
  if (type === "Scenario") return getScenarioDescription(item);
  return getAnalysisDescription(item);
}

function getItemHref(item: SavedRecord, type: SavedItemType) {
  const defaultPath = type === "Deck" ? "/presentation-templates" : type === "Analysis" ? "/calculators" : "/roi-tool";
  const sourcePath = getText(item.sourcePath, defaultPath);
  if (type === "Comparison" && item.id) return `${sourcePath}?comparison=${String(item.id)}`;
  if (type === "Scenario" && item.id) return `${sourcePath}?saved=${String(item.id)}`;
  return sourcePath;
}

function recordSearchText(item: SavedRecord, type: SavedItemType) {
  const chunks = [getSavedItemTitle(item, type), getUpdatedDate(item), getItemDescription(item, type)];
  if (type === "Comparison") {
    getComparisonScenarios(item).forEach((scenario) => {
      chunks.push(getText(scenario.name, ""));
      if (Array.isArray(scenario.lines)) {
        scenario.lines.forEach((line) => {
          if (!isRecord(line)) return;
          chunks.push(getText(line.sku, ""));
          chunks.push(getText(line.product, ""));
          chunks.push(getText(line.notes, ""));
        });
      }
    });
  }
  if (type === "Scenario") {
    const scenario = getScenarioRecord(item);
    chunks.push(getText(scenario.name, ""));
    if (Array.isArray(scenario.lines)) {
      scenario.lines.forEach((line) => {
        if (!isRecord(line)) return;
        chunks.push(getText(line.sku, ""));
        chunks.push(getText(line.product, ""));
        chunks.push(getText(line.notes, ""));
      });
    }
  }
  return chunks.join(" ").toLowerCase();
}

function filterAndSortItems(items: SavedWorkItem[], search: string, sort: WorkspaceSort) {
  const query = search.trim().toLowerCase();
  return items
    .filter((item) => !query || recordSearchText(item.record, item.type).includes(query))
    .toSorted((left, right) => {
      if (sort === "name-asc" || sort === "name-desc") {
        const direction = sort === "name-asc" ? 1 : -1;
        return direction * getSavedItemTitle(left.record, left.type).localeCompare(getSavedItemTitle(right.record, right.type), "en-GB", { sensitivity: "base" });
      }
      const direction = sort === "updated-desc" ? -1 : 1;
      return direction * (getTimestamp(left.record) - getTimestamp(right.record));
    });
}

function getRecordEntries(value: unknown) {
  if (!isRecord(value)) return [];
  return Object.entries(value).filter(([, entryValue]) => entryValue !== "" && entryValue !== null && entryValue !== undefined);
}

function buildStandaloneScenarioSave(scenario: SavedRecord, title: string) {
  const scenarioData = getScenarioRecord(scenario);
  return {
    title,
    toolId: "roi-tool",
    toolName: "ROI planner",
    scenarioData: { ...scenarioData, name: title },
    inputs: { lines: Array.isArray(scenarioData.lines) ? scenarioData.lines : [] },
    outputs: { lines: Array.isArray(scenarioData.lines) ? scenarioData.lines.length : 0 },
    defaults: {},
    sourcePath: "/roi-tool",
  };
}

function buildUpdatedComparison(comparison: SavedRecord, scenarios: SavedRecord[]) {
  const now = nowIso();
  const name = getSavedItemTitle(comparison, "Comparison");
  return {
    ...comparison,
    name,
    group_name: name,
    scenarios,
    savedAt: now,
    updatedAt: now,
    updated_at: now,
  };
}

function cloneScenarioForDestination(scenario: SavedRecord, title?: string) {
  const scenarioData = getScenarioRecord(scenario);
  const name = title ?? `${getText(scenarioData.name ?? scenario.name, "ROI scenario")} copy`;
  return {
    ...scenarioData,
    id: crypto.randomUUID(),
    name,
  };
}

function SavedItemDetails({ item, type }: { item: SavedRecord; type: SavedItemType }) {
  if (type === "Comparison" || type === "Deck") return null;
  const inputs = getRecordEntries(item.inputs).slice(0, 6);
  const outputs = getRecordEntries(item.outputs).slice(0, 6);
  const summary = getText(item.summaryText, "");

  if (!inputs.length && !outputs.length && !summary) return null;

  return (
    <details className="saved-item-details">
      <summary>View details</summary>
      {summary ? <p>{summary}</p> : null}
      {inputs.length ? (
        <dl>
          {inputs.map(([label, value]) => (
            <div key={`input-${label}`}>
              <dt>{label}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {outputs.length ? (
        <dl>
          {outputs.map(([label, value]) => (
            <div key={`output-${label}`}>
              <dt>{label}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </details>
  );
}

function formatDetailValue(value: unknown) {
  if (Array.isArray(value)) return `${value.length} item(s)`;
  if (isRecord(value)) return JSON.stringify(value);
  return String(value);
}

function firstTextValue(record: SavedRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function parseScenarioNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasScenarioValue(value: unknown) {
  return typeof value === "string" ? value.trim() !== "" : typeof value === "number" && Number.isFinite(value);
}

function formatScenarioMoney(value: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency || "GBP",
    maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 2,
  }).format(value);
}

function formatScenarioNumber(value: number) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value);
}

function formatScenarioRatio(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "n/a";
  return `${value.toFixed(1)}x`;
}

function calculateScenarioLine(line: SavedRecord) {
  const currentInvoice = parseScenarioNumber(firstTextValue(line, ["currentInvoice", "current_invoice", "current_retailer_invoice_buy_price"]));
  const fixedSupport = parseScenarioNumber(firstTextValue(line, ["fixedSupport", "fixed_support"]));
  const promoInvoiceRaw = firstTextValue(line, ["promoInvoice", "promo_invoice", "promo_retailer_invoice_buy_price"]);
  const soaRaw = firstTextValue(line, ["soa", "support", "supportPerUnit", "support_per_unit"]);
  const hasPromoInvoice = hasScenarioValue(promoInvoiceRaw);
  const hasSoa = hasScenarioValue(soaRaw);
  const supportPerUnit = hasSoa ? parseScenarioNumber(soaRaw) : hasPromoInvoice ? currentInvoice - parseScenarioNumber(promoInvoiceRaw) : 0;
  const promoInvoice = hasPromoInvoice ? parseScenarioNumber(promoInvoiceRaw) : hasSoa ? currentInvoice - supportPerUnit : currentInvoice;
  const baselineUnits = parseScenarioNumber(firstTextValue(line, ["baselineUnits", "baseline_units"]));
  const promoUnits = parseScenarioNumber(firstTextValue(line, ["promoUnits", "promo_units"]));
  const incrementalUnits = promoUnits - baselineUnits;
  const baselineRevenue = baselineUnits * currentInvoice;
  const promoRevenue = promoUnits * promoInvoice;
  const incrementalRevenue = promoRevenue - baselineRevenue;
  const supportCost = supportPerUnit * promoUnits + fixedSupport;
  const cogsRaw = firstTextValue(line, ["cogs", "supplierCogs", "supplier_cogs"]);
  const hasCogs = hasScenarioValue(cogsRaw);
  const cogs = parseScenarioNumber(cogsRaw);
  const baselineProfit = hasCogs ? (currentInvoice - cogs) * baselineUnits : 0;
  const promoProfit = hasCogs ? (promoInvoice - cogs) * promoUnits - fixedSupport : 0;
  const profitImpact = hasCogs ? promoProfit - baselineProfit : 0;

  return {
    currentInvoice,
    promoInvoice,
    supportPerUnit,
    baselineUnits,
    promoUnits,
    incrementalUnits,
    incrementalRevenue,
    supportCost,
    profitImpact,
    revenueRoi: supportCost > 0 ? incrementalRevenue / supportCost : null,
    profitRoi: hasCogs && supportCost > 0 ? profitImpact / supportCost : null,
    hasCogs,
  };
}

function getScenarioLineCurrency(line: SavedRecord) {
  return firstTextValue(line, ["currency"]) || "GBP";
}

function getScenarioLineDetails(line: SavedRecord) {
  const currency = getScenarioLineCurrency(line);
  const calc = calculateScenarioLine(line);
  return {
    sku: firstTextValue(line, ["sku", "model", "modelNumber", "model_number", "sku_model_item_number"]) || "Not set",
    product: firstTextValue(line, ["product", "productName", "product_name"]) || "Not set",
    currentInvoice: calc.currentInvoice ? formatScenarioMoney(calc.currentInvoice, currency) : firstTextValue(line, ["currentInvoice", "current_invoice"]) || "n/a",
    promoInvoice: calc.promoInvoice ? formatScenarioMoney(calc.promoInvoice, currency) : firstTextValue(line, ["promoInvoice", "promo_invoice"]) || "n/a",
    support: calc.supportPerUnit ? formatScenarioMoney(calc.supportPerUnit, currency) : firstTextValue(line, ["soa", "support"]) || "n/a",
    units: `${formatScenarioNumber(calc.baselineUnits)} -> ${formatScenarioNumber(calc.promoUnits)}`,
    incrementalRevenue: formatScenarioMoney(calc.incrementalRevenue, currency),
    supportCost: formatScenarioMoney(calc.supportCost, currency),
    roi: formatScenarioRatio(calc.hasCogs ? calc.profitRoi : calc.revenueRoi),
    notes: firstTextValue(line, ["notes"]),
  };
}

function getScenarioLineAggregate(lines: SavedRecord[]) {
  type ScenarioLineAggregate = {
    baselineUnits: number;
    promoUnits: number;
    incrementalUnits: number;
    incrementalRevenue: number;
    supportCost: number;
    profitImpact: number;
    linesWithCogs: number;
  };

  return lines.reduce<ScenarioLineAggregate>(
    (total, line) => {
      const calc = calculateScenarioLine(line);
      total.baselineUnits += calc.baselineUnits;
      total.promoUnits += calc.promoUnits;
      total.incrementalUnits += calc.incrementalUnits;
      total.incrementalRevenue += calc.incrementalRevenue;
      total.supportCost += calc.supportCost;
      total.profitImpact += calc.profitImpact;
      total.linesWithCogs += calc.hasCogs ? 1 : 0;
      return total;
    },
    {
      baselineUnits: 0,
      promoUnits: 0,
      incrementalUnits: 0,
      incrementalRevenue: 0,
      supportCost: 0,
      profitImpact: 0,
      linesWithCogs: 0,
    },
  );
}

function ScenarioDetailsPanel({ scenario, savedRecord }: { scenario: SavedRecord; savedRecord?: SavedRecord }) {
  const savedInputs = getRecordEntries(savedRecord?.inputs).slice(0, 8);
  const savedOutputs = getRecordEntries(savedRecord?.outputs).slice(0, 8);
  const scenarioEntries = getRecordEntries(scenario).filter(([label]) => !["id", "name", "lines"].includes(label)).slice(0, 8);
  const lines = Array.isArray(scenario.lines) ? scenario.lines.filter(isRecord) : [];
  const summary = savedRecord ? getText(savedRecord.summaryText, "") : "";
  const aggregate = getScenarioLineAggregate(lines);
  const aggregateCurrency = lines[0] ? getScenarioLineCurrency(lines[0]) : "GBP";

  if (!savedInputs.length && !savedOutputs.length && !scenarioEntries.length && !lines.length && !summary) {
    return <div className="workspace-subrow-detail-panel">No extra scenario details saved.</div>;
  }

  return (
    <div className="workspace-subrow-detail-panel">
      {summary ? <p>{summary}</p> : null}
      {lines.length ? (
        <div className="workspace-scenario-summary-grid">
          <div>
            <span>Product lines</span>
            <strong>{lines.length}</strong>
          </div>
          <div>
            <span>Units</span>
            <strong>
              {formatScenarioNumber(aggregate.baselineUnits)} &rarr; {formatScenarioNumber(aggregate.promoUnits)}
            </strong>
          </div>
          <div>
            <span>Incremental revenue</span>
            <strong>{formatScenarioMoney(aggregate.incrementalRevenue, aggregateCurrency)}</strong>
          </div>
          <div>
            <span>Support cost</span>
            <strong>{formatScenarioMoney(aggregate.supportCost, aggregateCurrency)}</strong>
          </div>
          {aggregate.linesWithCogs ? (
            <div>
              <span>Profit impact</span>
              <strong>{formatScenarioMoney(aggregate.profitImpact, aggregateCurrency)}</strong>
            </div>
          ) : null}
        </div>
      ) : null}
      {scenarioEntries.length ? (
        <dl>
          {scenarioEntries.map(([label, value]) => (
            <div key={`scenario-${label}`}>
              <dt>{label}</dt>
              <dd>{formatDetailValue(value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {savedInputs.length ? (
        <dl>
          {savedInputs.map(([label, value]) => (
            <div key={`input-${label}`}>
              <dt>{label}</dt>
              <dd>{formatDetailValue(value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {savedOutputs.length ? (
        <dl>
          {savedOutputs.map(([label, value]) => (
            <div key={`output-${label}`}>
              <dt>{label}</dt>
              <dd>{formatDetailValue(value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {lines.length ? (
        <div className="workspace-scenario-line-table">
          <div className="workspace-scenario-line-header" aria-hidden="true">
            <span>SKU / model</span>
            <span>Product</span>
            <span>Invoice</span>
            <span>Promo / support</span>
            <span>Units</span>
            <span>Revenue</span>
            <span>ROI</span>
          </div>
          {lines.slice(0, 10).map((line, index) => {
            const detail = getScenarioLineDetails(line);
            return (
              <div className="workspace-scenario-line-row" key={`${getText(line.id, "")}-${index}`}>
                <span>{detail.sku}</span>
                <span>{detail.product}</span>
                <span>{detail.currentInvoice}</span>
                <span>
                  {detail.promoInvoice} / {detail.support}
                </span>
                <span>{detail.units}</span>
                <span>{detail.incrementalRevenue}</span>
                <span>{detail.roi}</span>
                {detail.notes ? <small>{detail.notes}</small> : null}
              </div>
            );
          })}
          {lines.length > 10 ? <p>{lines.length - 10} more line(s) not shown.</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function WorkspaceControls({
  search,
  sort,
  onSearch,
  onSort,
}: {
  search: string;
  sort: WorkspaceSort;
  onSearch: (value: string) => void;
  onSort: (value: WorkspaceSort) => void;
}) {
  return (
    <div className="workspace-controls" aria-label="Saved work controls">
      <label className="field workspace-search-field">
        <span>Search saved work</span>
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search comparisons, scenarios, SKUs, results or decks" />
      </label>
      <label className="field workspace-sort-field">
        <span>Sort by</span>
        <select value={sort} onChange={(event) => onSort(event.target.value as WorkspaceSort)}>
          <option value="updated-desc">Newest first</option>
          <option value="updated-asc">Oldest first</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
        </select>
      </label>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="workspace-empty">
      <strong>No saved work found.</strong>
      <p>Create an ROI comparison, save a standalone scenario, save a calculator result or adjust your search.</p>
      <div className="summary-actions">
        <Link className="button button-secondary button-small" href="/roi-tool">
          Create ROI comparison
        </Link>
        <Link className="button button-secondary button-small" href="/calculators">
          Open calculators
        </Link>
      </div>
    </div>
  );
}

function CreateComparisonGroup({
  onCreate,
}: {
  onCreate: (name: string) => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || isSaving) return;
    setIsSaving(true);
    try {
      await onCreate(trimmed);
      setName("");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="workspace-create-group" onSubmit={submit}>
      <label>
        <span>New comparison group</span>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Q4 promo options" />
      </label>
      <button className="button button-secondary button-small" disabled={!name.trim() || isSaving} type="submit">
        {isSaving ? "Creating..." : "Add group"}
      </button>
    </form>
  );
}

function WorkspaceIconLink({ href, label }: { href: string; label: string }) {
  return (
    <Link aria-label={label} className="workspace-icon-button" href={href} title={label}>
      <span aria-hidden="true">↗</span>
    </Link>
  );
}

function WorkspaceMenuShell({ children }: { children: ReactNode }) {
  return (
    <details className="workspace-row-menu">
      <summary aria-label="More actions" title="More actions">
        <span aria-hidden="true">⋯</span>
      </summary>
      <div className="workspace-row-menu-panel">{children}</div>
    </details>
  );
}

function WorkspaceBulkActions({
  selectedCount,
  selectLabel = "Select visible",
  onClear,
  onDelete,
  onSelectVisible,
}: {
  selectedCount: number;
  selectLabel?: string;
  onClear: () => void;
  onDelete: () => void | Promise<void>;
  onSelectVisible: () => void;
}) {
  return (
    <div className="workspace-bulk-actions">
      <button className="button button-secondary button-small" onClick={onSelectVisible} type="button">
        {selectLabel}
      </button>
      {selectedCount ? (
        <>
          <span>{selectedCount} selected</span>
          <button className="button button-secondary button-small" onClick={onClear} type="button">
            Clear
          </button>
          <button className="button button-small workspace-danger-button" onClick={onDelete} type="button">
            Delete selected
          </button>
        </>
      ) : null}
    </div>
  );
}

function GeneralItemMenu({
  id,
  type,
  editHref,
  onRename,
  onDuplicate,
  onDelete,
}: {
  id: string;
  type: SavedItemType;
  editHref?: string;
  onRename: (id: string, type: SavedItemType) => void | Promise<void>;
  onDuplicate: (id: string, type: SavedItemType) => void | Promise<void>;
  onDelete: (id: string, type: SavedItemType) => void | Promise<void>;
}) {
  return (
    <WorkspaceMenuShell>
      {editHref ? (
        <Link className="workspace-menu-action" href={editHref}>
          Edit
        </Link>
      ) : null}
      <button className="workspace-menu-action" onClick={() => onRename(id, type)} type="button">
        Rename
      </button>
      <button className="workspace-menu-action" onClick={() => onDuplicate(id, type)} type="button">
        Duplicate
      </button>
      <button className="workspace-menu-action workspace-menu-danger" onClick={() => onDelete(id, type)} type="button">
        Delete
      </button>
    </WorkspaceMenuShell>
  );
}

function ScenarioItemMenu({
  scenarioId,
  comparisonId,
  editHref,
  comparisons,
  onRenameScenario,
  onDuplicateScenario,
  onDelete,
  onMoveScenarioIntoComparison,
  onMoveScenarioOut,
  onMoveScenarioBetweenComparisons,
  onDeleteScenarioFromComparison,
}: {
  scenarioId: string;
  comparisonId?: string;
  editHref: string;
  comparisons: SavedRecord[];
  onRenameScenario: (scenarioId: string, sourceComparisonId?: string) => void | Promise<void>;
  onDuplicateScenario: (scenarioId: string, targetComparisonId?: string, sourceComparisonId?: string) => void | Promise<void>;
  onDelete?: (id: string, type: SavedItemType) => void | Promise<void>;
  onMoveScenarioIntoComparison?: (scenarioId: string, comparisonId: string) => void | Promise<void>;
  onMoveScenarioOut?: (comparisonId: string, scenarioId: string) => void | Promise<void>;
  onMoveScenarioBetweenComparisons?: (fromComparisonId: string, scenarioId: string, targetComparisonId: string) => void | Promise<void>;
  onDeleteScenarioFromComparison?: (comparisonId: string, scenarioId: string) => void | Promise<void>;
}) {
  const [duplicateTarget, setDuplicateTarget] = useState("standalone");
  const [moveTarget, setMoveTarget] = useState("");
  const moveTargets = comparisonId ? comparisons.filter((comparison) => comparison.id !== comparisonId) : comparisons;

  return (
    <WorkspaceMenuShell>
      <Link className="workspace-menu-action" href={editHref}>
        Edit
      </Link>
      <button className="workspace-menu-action" onClick={() => onRenameScenario(scenarioId, comparisonId)} type="button">
        Rename
      </button>

      <div className="workspace-menu-field">
        <label htmlFor={`duplicate-${comparisonId ?? "standalone"}-${scenarioId}`}>Duplicate to</label>
        <select id={`duplicate-${comparisonId ?? "standalone"}-${scenarioId}`} value={duplicateTarget} onChange={(event) => setDuplicateTarget(event.target.value)}>
          <option value="standalone">Standalone scenario</option>
          {comparisons.map((comparison) => (
            <option key={String(comparison.id)} value={String(comparison.id)}>
              {getSavedItemTitle(comparison, "Comparison")}
            </option>
          ))}
        </select>
        <button
          className="workspace-menu-action"
          onClick={() => onDuplicateScenario(scenarioId, duplicateTarget === "standalone" ? undefined : duplicateTarget, comparisonId)}
          type="button"
        >
          Duplicate
        </button>
      </div>

      {moveTargets.length ? (
        <div className="workspace-menu-field">
          <label htmlFor={`move-${comparisonId ?? "standalone"}-${scenarioId}`}>Move to comparison</label>
          <select id={`move-${comparisonId ?? "standalone"}-${scenarioId}`} value={moveTarget} onChange={(event) => setMoveTarget(event.target.value)}>
            <option value="">Choose comparison</option>
            {moveTargets.map((comparison) => (
              <option key={String(comparison.id)} value={String(comparison.id)}>
                {getSavedItemTitle(comparison, "Comparison")}
              </option>
            ))}
          </select>
          <button
            className="workspace-menu-action"
            disabled={!moveTarget}
            onClick={() =>
              comparisonId
                ? onMoveScenarioBetweenComparisons?.(comparisonId, scenarioId, moveTarget)
                : onMoveScenarioIntoComparison?.(scenarioId, moveTarget)
            }
            type="button"
          >
            Move
          </button>
        </div>
      ) : null}

      {comparisonId ? (
        <button className="workspace-menu-action" onClick={() => onMoveScenarioOut?.(comparisonId, scenarioId)} type="button">
          Move out as standalone
        </button>
      ) : null}

      {comparisonId ? (
        <button className="workspace-menu-action workspace-menu-danger" onClick={() => onDeleteScenarioFromComparison?.(comparisonId, scenarioId)} type="button">
          Delete
        </button>
      ) : null}

      {!comparisonId && onDelete ? (
        <button className="workspace-menu-action workspace-menu-danger" onClick={() => onDelete(scenarioId, "Scenario")} type="button">
          Delete
        </button>
      ) : null}
    </WorkspaceMenuShell>
  );
}

function SavedWorkRow({
  item,
  onRename,
  onDuplicate,
  onDelete,
  selected,
  selectionKey,
  onToggleSelected,
}: {
  item: SavedWorkItem;
  onRename: (id: string, type: SavedItemType) => void | Promise<void>;
  onDuplicate: (id: string, type: SavedItemType) => void | Promise<void>;
  onDelete: (id: string, type: SavedItemType) => void | Promise<void>;
  selected?: boolean;
  selectionKey?: string;
  onToggleSelected?: (key: string) => void;
}) {
  const title = getSavedItemTitle(item.record, item.type);
  const href = getItemHref(item.record, item.type);

  return (
    <article className="workspace-list-row">
      <div className="workspace-list-main">
        <span className="workspace-table-type">
          {selectionKey && onToggleSelected ? (
            <input
              aria-label={`Select ${title}`}
              checked={Boolean(selected)}
              className="workspace-select-checkbox"
              type="checkbox"
              onChange={() => onToggleSelected(selectionKey)}
            />
          ) : null}
          {item.type === "Analysis" ? "Calculator result" : "Deck brief"}
        </span>
        <div className="workspace-list-copy">
          <h3>{title}</h3>
          <p>{getItemDescription(item.record, item.type)}</p>
        </div>
        <small className="workspace-table-date">{getUpdatedDate(item.record)}</small>
        <div className="workspace-list-actions">
          <WorkspaceIconLink href={href} label={`Open ${title}`} />
          <GeneralItemMenu
            id={item.id}
            type={item.type}
            editHref={item.type === "Comparison" || item.type === "Scenario" ? href : undefined}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onRename={onRename}
          />
        </div>
      </div>

      <SavedItemDetails item={item.record} type={item.type} />
    </article>
  );
}

function ScenarioSubRow({
  scenario,
  scenarioId,
  title,
  href,
  comparisons,
  sourceComparisonId,
  savedRecord,
  onRenameScenario,
  onDelete,
  onDuplicateScenario,
  onMoveScenarioIntoComparison,
  onMoveScenarioOut,
  onMoveScenarioBetweenComparisons,
  onDeleteScenarioFromComparison,
  updatedDate,
  selected,
  selectionKey,
  onToggleSelected,
}: {
  scenario: SavedRecord;
  scenarioId: string;
  title: string;
  href: string;
  comparisons: SavedRecord[];
  sourceComparisonId?: string;
  savedRecord?: SavedRecord;
  updatedDate: string;
  onRenameScenario: (scenarioId: string, sourceComparisonId?: string) => void | Promise<void>;
  onDelete: (id: string, type: SavedItemType) => void | Promise<void>;
  onDuplicateScenario: (scenarioId: string, targetComparisonId?: string, sourceComparisonId?: string) => void | Promise<void>;
  onMoveScenarioIntoComparison: (scenarioId: string, comparisonId: string) => void | Promise<void>;
  onMoveScenarioOut: (comparisonId: string, scenarioId: string) => void | Promise<void>;
  onMoveScenarioBetweenComparisons: (fromComparisonId: string, scenarioId: string, targetComparisonId: string) => void | Promise<void>;
  onDeleteScenarioFromComparison: (comparisonId: string, scenarioId: string) => void | Promise<void>;
  selected?: boolean;
  selectionKey?: string;
  onToggleSelected?: (key: string) => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div className="workspace-subrow-wrap">
      <div className="workspace-subrow">
        <div className="workspace-subrow-title">
          <strong>
            {selectionKey && onToggleSelected ? (
              <input
                aria-label={`Select ${title}`}
                checked={Boolean(selected)}
                className="workspace-select-checkbox"
                type="checkbox"
                onChange={() => onToggleSelected(selectionKey)}
              />
            ) : null}
            {title}
          </strong>
          <span>{getScenarioSummary(scenario)}</span>
        </div>
        <small className="workspace-table-date">{updatedDate}</small>
        <div className="workspace-subrow-actions">
          <button
            aria-expanded={detailsOpen}
            aria-label={`${detailsOpen ? "Hide" : "View"} details for ${title}`}
            className="workspace-icon-button"
            onClick={() => setDetailsOpen((current) => !current)}
            title={`${detailsOpen ? "Hide" : "View"} details`}
            type="button"
          >
            <span aria-hidden="true">i</span>
          </button>
          <WorkspaceIconLink href={href} label={`Open ${title}`} />
          <ScenarioItemMenu
            scenarioId={scenarioId}
            comparisonId={sourceComparisonId}
            editHref={href}
            comparisons={comparisons}
            onDelete={sourceComparisonId ? undefined : onDelete}
            onRenameScenario={onRenameScenario}
            onDuplicateScenario={onDuplicateScenario}
            onDeleteScenarioFromComparison={onDeleteScenarioFromComparison}
            onMoveScenarioBetweenComparisons={onMoveScenarioBetweenComparisons}
            onMoveScenarioIntoComparison={onMoveScenarioIntoComparison}
            onMoveScenarioOut={onMoveScenarioOut}
          />
        </div>
      </div>
      {detailsOpen ? <ScenarioDetailsPanel scenario={scenario} savedRecord={savedRecord} /> : null}
    </div>
  );
}

function ComparisonGroupRow({
  item,
  comparisons,
  onRename,
  onDuplicate,
  onDelete,
  onRenameScenario,
  onDuplicateScenario,
  onMoveScenarioOut,
  onMoveScenarioBetweenComparisons,
  onDeleteScenarioFromComparison,
  selectedKeys,
  onToggleSelected,
}: {
  item: SavedWorkItem;
  comparisons: SavedRecord[];
  onRename: (id: string, type: SavedItemType) => void | Promise<void>;
  onDuplicate: (id: string, type: SavedItemType) => void | Promise<void>;
  onDelete: (id: string, type: SavedItemType) => void | Promise<void>;
  onRenameScenario: (scenarioId: string, sourceComparisonId?: string) => void | Promise<void>;
  onDuplicateScenario: (scenarioId: string, targetComparisonId?: string, sourceComparisonId?: string) => void | Promise<void>;
  onMoveScenarioOut: (comparisonId: string, scenarioId: string) => void | Promise<void>;
  onMoveScenarioBetweenComparisons: (fromComparisonId: string, scenarioId: string, targetComparisonId: string) => void | Promise<void>;
  onDeleteScenarioFromComparison: (comparisonId: string, scenarioId: string) => void | Promise<void>;
  selectedKeys: Set<string>;
  onToggleSelected: (key: string) => void;
}) {
  const title = getSavedItemTitle(item.record, "Comparison");
  const href = getItemHref(item.record, "Comparison");
  const scenarios = getComparisonScenarios(item.record);

  return (
    <article className="workspace-group-block">
      <div className="workspace-group-row">
        <div className="workspace-group-title">
          <h3>{title}</h3>
          <span>{getComparisonDescription(item.record)}</span>
        </div>
        <small className="workspace-table-date">{getUpdatedDate(item.record)}</small>
        <div className="workspace-list-actions">
          <WorkspaceIconLink href={href} label={`Open ${title}`} />
          <GeneralItemMenu id={item.id} type="Comparison" editHref={href} onDelete={onDelete} onDuplicate={onDuplicate} onRename={onRename} />
        </div>
      </div>
      <div className="workspace-subrows">
        {scenarios.length ? (
          scenarios.map((scenario, index) => {
            const scenarioId = getComparisonScenarioId(item.id, scenario, index);
            const scenarioTitle = getText(scenario.name, `Scenario ${index + 1}`);
            const selectionKey = comparisonScenarioSelectionKey(item.id, scenarioId);
            return (
              <ScenarioSubRow
                key={scenarioId}
                scenario={scenario}
                scenarioId={scenarioId}
                title={scenarioTitle}
                href={`${href}&scenario=${scenarioId}`}
                comparisons={comparisons}
                sourceComparisonId={item.id}
                selected={selectedKeys.has(selectionKey)}
                selectionKey={selectionKey}
                updatedDate={getUpdatedDate(item.record)}
                onDelete={onDelete}
                onRenameScenario={onRenameScenario}
                onDuplicateScenario={onDuplicateScenario}
                onDeleteScenarioFromComparison={onDeleteScenarioFromComparison}
                onMoveScenarioBetweenComparisons={onMoveScenarioBetweenComparisons}
                onMoveScenarioIntoComparison={() => undefined}
                onMoveScenarioOut={onMoveScenarioOut}
                onToggleSelected={onToggleSelected}
              />
            );
          })
        ) : (
          <div className="workspace-subrow workspace-subrow-empty">No scenarios in this comparison yet.</div>
        )}
      </div>
    </article>
  );
}

function StandaloneScenarioGroup({
  items,
  comparisons,
  onRenameScenario,
  onDelete,
  onDuplicateScenario,
  onMoveScenarioIntoComparison,
  onMoveScenarioOut,
  onMoveScenarioBetweenComparisons,
  onDeleteScenarioFromComparison,
  selectedKeys,
  onToggleSelected,
}: {
  items: SavedWorkItem[];
  comparisons: SavedRecord[];
  onRenameScenario: (scenarioId: string, sourceComparisonId?: string) => void | Promise<void>;
  onDelete: (id: string, type: SavedItemType) => void | Promise<void>;
  onDuplicateScenario: (scenarioId: string, targetComparisonId?: string, sourceComparisonId?: string) => void | Promise<void>;
  onMoveScenarioIntoComparison: (scenarioId: string, comparisonId: string) => void | Promise<void>;
  onMoveScenarioOut: (comparisonId: string, scenarioId: string) => void | Promise<void>;
  onMoveScenarioBetweenComparisons: (fromComparisonId: string, scenarioId: string, targetComparisonId: string) => void | Promise<void>;
  onDeleteScenarioFromComparison: (comparisonId: string, scenarioId: string) => void | Promise<void>;
  selectedKeys: Set<string>;
  onToggleSelected: (key: string) => void;
}) {
  if (!items.length) return null;

  return (
    <article className="workspace-group-block">
      <div className="workspace-group-row workspace-standalone-group-row">
        <div className="workspace-group-title">
          <h3>Standalone scenarios</h3>
          <span>{items.length} scenario(s) not assigned to a comparison</span>
        </div>
      </div>
      <div className="workspace-subrows">
        {items.map((item) => {
          const scenario = getScenarioRecord(item.record);
          const title = getSavedItemTitle(item.record, "Scenario");
          const selectionKey = standaloneScenarioSelectionKey(item.id);
          return (
            <ScenarioSubRow
              key={item.id}
              scenario={scenario}
              scenarioId={item.id}
              title={title}
              href={getItemHref(item.record, "Scenario")}
              comparisons={comparisons}
              savedRecord={item.record}
              selected={selectedKeys.has(selectionKey)}
              selectionKey={selectionKey}
              updatedDate={getUpdatedDate(item.record)}
              onDelete={onDelete}
              onRenameScenario={onRenameScenario}
              onDuplicateScenario={onDuplicateScenario}
              onDeleteScenarioFromComparison={onDeleteScenarioFromComparison}
              onMoveScenarioBetweenComparisons={onMoveScenarioBetweenComparisons}
              onMoveScenarioIntoComparison={onMoveScenarioIntoComparison}
              onMoveScenarioOut={onMoveScenarioOut}
              onToggleSelected={onToggleSelected}
            />
          );
        })}
      </div>
    </article>
  );
}

function WorkspaceSectionList({
  id,
  title,
  description,
  action,
  items,
  onRename,
  onDuplicate,
  onDelete,
  selectedKeys,
  onBulkDelete,
  onSelectVisible,
  onToggleSelected,
}: {
  id: string;
  title: string;
  description: string;
  action?: ReactNode;
  items: SavedWorkItem[];
  onRename: (id: string, type: SavedItemType) => void | Promise<void>;
  onDuplicate: (id: string, type: SavedItemType) => void | Promise<void>;
  onDelete: (id: string, type: SavedItemType) => void | Promise<void>;
  selectedKeys?: Set<string>;
  onBulkDelete?: () => void | Promise<void>;
  onSelectVisible?: () => void;
  onToggleSelected?: (key: string) => void;
}) {
  const selectedCount = items.filter((item) => selectedKeys?.has(deckSelectionKey(item.id))).length;

  return (
    <article className="card workspace-card workspace-saved-work-card" id={id}>
      <div className="workspace-card-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action}
      </div>
      {selectedKeys && onBulkDelete && onSelectVisible && onToggleSelected ? (
        <WorkspaceBulkActions
          selectedCount={selectedCount}
          onClear={() => items.forEach((item) => selectedKeys.has(deckSelectionKey(item.id)) && onToggleSelected(deckSelectionKey(item.id)))}
          onDelete={onBulkDelete}
          onSelectVisible={onSelectVisible}
        />
      ) : null}
      {items.length ? (
        <div className="workspace-table-list">
          <div className="workspace-table-header" aria-hidden="true">
            <span>Type</span>
            <span>Name</span>
            <span>Last updated</span>
            <span>Actions</span>
          </div>
          {items.map((item) => (
            <SavedWorkRow
              item={item}
              key={`${item.type}-${item.id}`}
              selected={selectedKeys?.has(deckSelectionKey(item.id))}
              selectionKey={onToggleSelected ? deckSelectionKey(item.id) : undefined}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onRename={onRename}
              onToggleSelected={onToggleSelected}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </article>
  );
}

function ComparisonScenarioList({
  id,
  title,
  description,
  action,
  comparisons,
  allComparisons,
  standaloneScenarios,
  analyses,
  onRename,
  onRenameScenario,
  onDuplicate,
  onDuplicateScenario,
  onDelete,
  onMoveScenarioIntoComparison,
  onMoveScenarioOut,
  onMoveScenarioBetweenComparisons,
  onDeleteScenarioFromComparison,
  selectedKeys,
  onBulkDeleteScenarios,
  onSelectVisibleScenarios,
  onToggleSelected,
}: {
  id: string;
  title: string;
  description: string;
  action?: ReactNode;
  comparisons: SavedWorkItem[];
  allComparisons: SavedRecord[];
  standaloneScenarios: SavedWorkItem[];
  analyses: SavedWorkItem[];
  onRename: (id: string, type: SavedItemType) => void | Promise<void>;
  onRenameScenario: (scenarioId: string, sourceComparisonId?: string) => void | Promise<void>;
  onDuplicate: (id: string, type: SavedItemType) => void | Promise<void>;
  onDuplicateScenario: (scenarioId: string, targetComparisonId?: string, sourceComparisonId?: string) => void | Promise<void>;
  onDelete: (id: string, type: SavedItemType) => void | Promise<void>;
  onMoveScenarioIntoComparison: (scenarioId: string, comparisonId: string) => void | Promise<void>;
  onMoveScenarioOut: (comparisonId: string, scenarioId: string) => void | Promise<void>;
  onMoveScenarioBetweenComparisons: (fromComparisonId: string, scenarioId: string, targetComparisonId: string) => void | Promise<void>;
  onDeleteScenarioFromComparison: (comparisonId: string, scenarioId: string) => void | Promise<void>;
  selectedKeys: Set<string>;
  onBulkDeleteScenarios: () => void | Promise<void>;
  onSelectVisibleScenarios: () => void;
  onToggleSelected: (key: string) => void;
}) {
  const hasItems = comparisons.length || standaloneScenarios.length || analyses.length;
  const visibleScenarioKeys = [
    ...comparisons.flatMap((item) =>
      getComparisonScenarios(item.record).map((scenario, index) =>
        comparisonScenarioSelectionKey(item.id, getComparisonScenarioId(item.id, scenario, index)),
      ),
    ),
    ...standaloneScenarios.map((item) => standaloneScenarioSelectionKey(item.id)),
  ];
  const selectedScenarioCount = visibleScenarioKeys.filter((key) => selectedKeys.has(key)).length;

  return (
    <article className="card workspace-card workspace-saved-work-card" id={id}>
      <div className="workspace-card-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action}
      </div>
      {visibleScenarioKeys.length ? (
        <WorkspaceBulkActions
          selectedCount={selectedScenarioCount}
          selectLabel="Select visible scenarios"
          onClear={() => visibleScenarioKeys.forEach((key) => selectedKeys.has(key) && onToggleSelected(key))}
          onDelete={onBulkDeleteScenarios}
          onSelectVisible={onSelectVisibleScenarios}
        />
      ) : null}
      {hasItems ? (
        <div className="workspace-grouped-list">
          <div className="workspace-grouped-header" aria-hidden="true">
            <span>Name</span>
            <span>Last updated</span>
            <span>Actions</span>
          </div>
          {comparisons.map((item) => (
            <ComparisonGroupRow
              item={item}
              key={`${item.type}-${item.id}`}
              comparisons={allComparisons}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onRename={onRename}
              onRenameScenario={onRenameScenario}
              onDuplicateScenario={onDuplicateScenario}
              onDeleteScenarioFromComparison={onDeleteScenarioFromComparison}
              onMoveScenarioBetweenComparisons={onMoveScenarioBetweenComparisons}
              onMoveScenarioOut={onMoveScenarioOut}
              selectedKeys={selectedKeys}
              onToggleSelected={onToggleSelected}
            />
          ))}
          <StandaloneScenarioGroup
            items={standaloneScenarios}
            comparisons={allComparisons}
            onDelete={onDelete}
            onRenameScenario={onRenameScenario}
            onDuplicateScenario={onDuplicateScenario}
            onDeleteScenarioFromComparison={onDeleteScenarioFromComparison}
            onMoveScenarioBetweenComparisons={onMoveScenarioBetweenComparisons}
            onMoveScenarioIntoComparison={onMoveScenarioIntoComparison}
            onMoveScenarioOut={onMoveScenarioOut}
            selectedKeys={selectedKeys}
            onToggleSelected={onToggleSelected}
          />
          {analyses.length ? (
            <div className="workspace-analysis-rows">
              {analyses.map((item) => (
                <SavedWorkRow
                  item={item}
                  key={`${item.type}-${item.id}`}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  onRename={onRename}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState />
      )}
    </article>
  );
}

export function WorkspaceClient() {
  const { isAuthenticated, isLoading, plan } = useSupabaseAuth();
  const [savedAnalyses, setSavedAnalyses] = useState<SavedRecord[]>([]);
  const [savedComparisons, setSavedComparisons] = useState<SavedRecord[]>([]);
  const [savedScenarios, setSavedScenarios] = useState<SavedRecord[]>([]);
  const [deckBriefs, setDeckBriefs] = useState<SavedRecord[]>([]);
  const [loadMessage, setLoadMessage] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<WorkspaceSort>("updated-desc");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
  const isPro = plan === "pro" || plan === "team";
  const commercialItems = useMemo(
    () => [
      ...savedComparisons.map((record) => ({ id: String(record.id), type: "Comparison" as const, record })),
      ...savedScenarios.map((record) => ({ id: String(record.id), type: "Scenario" as const, record })),
      ...savedAnalyses.map((record) => ({ id: String(record.id), type: "Analysis" as const, record })),
    ].filter((item) => item.id && item.id !== "undefined"),
    [savedAnalyses, savedComparisons, savedScenarios],
  );
  const deckItems = useMemo(
    () => deckBriefs.map((record) => ({ id: String(record.id), type: "Deck" as const, record })).filter((item) => item.id && item.id !== "undefined"),
    [deckBriefs],
  );
  const visibleComparisonItems = useMemo(
    () => filterAndSortItems(savedComparisons.map((record) => ({ id: String(record.id), type: "Comparison" as const, record })).filter((item) => item.id && item.id !== "undefined"), search, sort),
    [savedComparisons, search, sort],
  );
  const visibleStandaloneScenarioItems = useMemo(
    () => filterAndSortItems(savedScenarios.map((record) => ({ id: String(record.id), type: "Scenario" as const, record })).filter((item) => item.id && item.id !== "undefined"), search, sort),
    [savedScenarios, search, sort],
  );
  const visibleAnalysisItems = useMemo(
    () => filterAndSortItems(savedAnalyses.map((record) => ({ id: String(record.id), type: "Analysis" as const, record })).filter((item) => item.id && item.id !== "undefined"), search, sort),
    [savedAnalyses, search, sort],
  );
  const visibleDeckItems = useMemo(() => filterAndSortItems(deckItems, search, sort), [deckItems, search, sort]);
  const savedItemCount = commercialItems.length + deckItems.length;

  useEffect(() => {
    if (!isAuthenticated || !isPro) return;

    let isMounted = true;
    Promise.all([listSavedAnalyses(), listRoiPlans(), listSavedScenarios(), listDeckBriefs()])
      .then(([analyses, comparisons, scenarios, decks]) => {
        if (!isMounted) return;
        setSavedAnalyses(analyses.data);
        setSavedComparisons(comparisons.data);
        setSavedScenarios(scenarios.data);
        setDeckBriefs(decks.data);
        setLoadMessage(analyses.message ?? comparisons.message ?? scenarios.message ?? decks.message ?? "");
      })
      .catch(() => {
        if (!isMounted) return;
        setSavedAnalyses([]);
        setSavedComparisons([]);
        setSavedScenarios([]);
        setDeckBriefs([]);
        setLoadMessage("Could not load saved work right now.");
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isPro]);

  async function refreshSavedWork() {
    const [analyses, comparisons, scenarios, decks] = await Promise.all([listSavedAnalyses(), listRoiPlans(), listSavedScenarios(), listDeckBriefs()]);
    setSavedAnalyses(analyses.data);
    setSavedComparisons(comparisons.data);
    setSavedScenarios(scenarios.data);
    setDeckBriefs(decks.data);
    setLoadMessage(analyses.message ?? comparisons.message ?? scenarios.message ?? decks.message ?? "");
  }

  function toggleSelected(key: string) {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function selectVisibleDecks() {
    setSelectedKeys((current) => {
      const next = new Set(current);
      visibleDeckItems.forEach((item) => next.add(deckSelectionKey(item.id)));
      return next;
    });
  }

  function selectVisibleScenarios() {
    setSelectedKeys((current) => {
      const next = new Set(current);
      visibleStandaloneScenarioItems.forEach((item) => next.add(standaloneScenarioSelectionKey(item.id)));
      visibleComparisonItems.forEach((item) => {
        getComparisonScenarios(item.record).forEach((scenario, index) => {
          next.add(comparisonScenarioSelectionKey(item.id, getComparisonScenarioId(item.id, scenario, index)));
        });
      });
      return next;
    });
  }

  async function bulkDeleteDecks() {
    const deckIds = [...selectedKeys]
      .map(parseSelectionKey)
      .filter((item) => item.type === "deck" && item.firstId)
      .map((item) => item.firstId);
    if (!deckIds.length) return;
    const confirmed = window.confirm(`Delete ${deckIds.length} selected deck${deckIds.length === 1 ? "" : "s"}?`);
    if (!confirmed) return;

    const results = await Promise.all(deckIds.map((id) => deleteDeckBrief(id)));
    const deletedCount = results.filter((result) => result.data).length;
    setSelectedKeys((current) => {
      const next = new Set(current);
      deckIds.forEach((id) => next.delete(deckSelectionKey(id)));
      return next;
    });
    setLoadMessage(deletedCount === deckIds.length ? `${deletedCount} deck${deletedCount === 1 ? "" : "s"} deleted.` : `${deletedCount} of ${deckIds.length} decks deleted.`);
    await refreshSavedWork();
  }

  async function bulkDeleteScenarios() {
    const selected = [...selectedKeys].map(parseSelectionKey);
    const standaloneIds = selected.filter((item) => item.type === "scenario" && item.firstId).map((item) => item.firstId);
    const comparisonSelections = selected.filter((item) => item.type === "comparison-scenario" && item.firstId && item.secondId);
    const selectedCount = standaloneIds.length + comparisonSelections.length;
    if (!selectedCount) return;
    const confirmed = window.confirm(`Delete ${selectedCount} selected scenario${selectedCount === 1 ? "" : "s"}?`);
    if (!confirmed) return;

    const standaloneResults = await Promise.all(standaloneIds.map((id) => deleteSavedScenario(id)));
    const byComparison = new Map<string, Set<string>>();
    comparisonSelections.forEach((item) => {
      const ids = byComparison.get(item.firstId) ?? new Set<string>();
      ids.add(item.secondId);
      byComparison.set(item.firstId, ids);
    });
    const comparisonResults = await Promise.all(
      [...byComparison.entries()].map(async ([comparisonId, scenarioIds]) => {
        const comparison = savedComparisons.find((group) => group.id === comparisonId);
        if (!comparison) return false;
        const updated = await saveRoiPlan(
          buildUpdatedComparison(
            comparison,
            getComparisonScenarios(comparison).filter((scenario, index) => !scenarioIds.has(getComparisonScenarioId(comparisonId, scenario, index))),
          ),
        );
        return Boolean(updated.data);
      }),
    );
    const deletedStandaloneCount = standaloneResults.filter((result) => result.data).length;
    const updatedComparisonCount = comparisonResults.filter(Boolean).length;
    setSelectedKeys((current) => {
      const next = new Set(current);
      standaloneIds.forEach((id) => next.delete(standaloneScenarioSelectionKey(id)));
      comparisonSelections.forEach((item) => next.delete(comparisonScenarioSelectionKey(item.firstId, item.secondId)));
      return next;
    });
    setLoadMessage(`${deletedStandaloneCount} standalone scenario(s) deleted. ${updatedComparisonCount} comparison group(s) updated.`);
    await refreshSavedWork();
  }

  async function duplicateSavedItem(id: string, type: SavedItemType) {
    if (type === "Analysis") {
      const result = await duplicateSavedAnalysis(id);
      setLoadMessage(result.data ? "Calculator result duplicated." : result.message ?? "Could not duplicate calculator result.");
    }
    if (type === "Comparison") {
      const result = await duplicateRoiPlan(id);
      setLoadMessage(result.data ? "Comparison duplicated." : result.message ?? "Could not duplicate comparison.");
    }
    if (type === "Scenario") {
      const result = await duplicateSavedScenario(id);
      setLoadMessage(result.data ? "Scenario duplicated." : result.message ?? "Could not duplicate scenario.");
    }
    if (type === "Deck") {
      const result = await duplicateDeckBrief(id);
      setLoadMessage(result.data ? "Deck duplicated." : result.message ?? "Could not duplicate deck.");
    }
    await refreshSavedWork();
  }

  async function renameSavedItem(id: string, type: SavedItemType) {
    const source =
      type === "Analysis"
        ? savedAnalyses.find((item) => item.id === id)
        : type === "Comparison"
          ? savedComparisons.find((item) => item.id === id)
          : type === "Scenario"
            ? savedScenarios.find((item) => item.id === id)
            : deckBriefs.find((item) => item.id === id);
    if (!source) return;

    const currentName = getSavedItemTitle(source, type);
    const nextName = window.prompt(`Rename ${type === "Analysis" ? "calculator result" : type.toLowerCase()}`, currentName)?.trim();
    if (!nextName || nextName === currentName) return;

    const now = nowIso();
    if (type === "Analysis") {
      const result = await saveAnalysis({ ...source, id, title: nextName, name: nextName, updatedAt: now, updated_at: now });
      setLoadMessage(result.data ? "Calculator result renamed." : result.message ?? "Could not rename calculator result.");
    }
    if (type === "Comparison") {
      const result = await saveRoiPlan({ ...source, id, name: nextName, group_name: nextName, savedAt: now, updatedAt: now, updated_at: now });
      setLoadMessage(result.data ? "Comparison renamed." : result.message ?? "Could not rename comparison.");
    }
    if (type === "Scenario") {
      const scenarioData = getScenarioRecord(source);
      const result = await saveScenario({
        ...source,
        id,
        title: nextName,
        name: nextName,
        scenarioData: { ...scenarioData, name: nextName },
        savedAt: now,
        updatedAt: now,
        updated_at: now,
      });
      setLoadMessage(result.data ? "Scenario renamed." : result.message ?? "Could not rename scenario.");
    }
    if (type === "Deck") {
      const result = await saveDeckBrief({ ...source, id, name: nextName, deck_name: nextName, savedAt: now, updatedAt: now, updated_at: now });
      setLoadMessage(result.data ? "Deck renamed." : result.message ?? "Could not rename deck.");
    }
    await refreshSavedWork();
  }

  async function renameScenario(scenarioId: string, sourceComparisonId?: string) {
    if (!sourceComparisonId) {
      await renameSavedItem(scenarioId, "Scenario");
      return;
    }

    const comparison = savedComparisons.find((group) => group.id === sourceComparisonId);
    if (!comparison) return;
    const scenarios = getComparisonScenarios(comparison);
    const scenarioIndex = scenarios.findIndex((scenario, index) => getComparisonScenarioId(sourceComparisonId, scenario, index) === scenarioId);
    if (scenarioIndex < 0) return;

    const currentName = getText(scenarios[scenarioIndex].name, `Scenario ${scenarioIndex + 1}`);
    const nextName = window.prompt("Rename scenario", currentName)?.trim();
    if (!nextName || nextName === currentName) return;

    const updatedScenarios = scenarios.map((scenario, index) =>
      index === scenarioIndex ? { ...scenario, id: getComparisonScenarioId(sourceComparisonId, scenario, index), name: nextName } : scenario,
    );
    const result = await saveRoiPlan(buildUpdatedComparison(comparison, updatedScenarios));
    setLoadMessage(result.data ? "Scenario renamed." : result.message ?? "Could not rename scenario.");
    await refreshSavedWork();
  }

  async function duplicateScenarioToDestination(scenarioId: string, targetComparisonId?: string, sourceComparisonId?: string) {
    const sourceComparison = sourceComparisonId ? savedComparisons.find((group) => group.id === sourceComparisonId) : null;
    const sourceScenario = sourceComparison
      ? getComparisonScenarios(sourceComparison).find((scenario, index) => getComparisonScenarioId(String(sourceComparison.id), scenario, index) === scenarioId)
      : savedScenarios.find((scenario) => scenario.id === scenarioId);
    if (!sourceScenario) return;

    const title = `${getText(getScenarioRecord(sourceScenario).name ?? sourceScenario.name, "ROI scenario")} copy`;
    const copiedScenario = cloneScenarioForDestination(sourceScenario, title);

    if (!targetComparisonId) {
      const result = await saveScenario(buildStandaloneScenarioSave(copiedScenario, title));
      setLoadMessage(result.data ? "Scenario duplicated as standalone." : result.message ?? "Could not duplicate scenario.");
      await refreshSavedWork();
      return;
    }

    const targetComparison = savedComparisons.find((comparison) => comparison.id === targetComparisonId);
    if (!targetComparison) return;
    const saved = await saveRoiPlan(buildUpdatedComparison(targetComparison, [...getComparisonScenarios(targetComparison), copiedScenario]));
    setLoadMessage(saved.data ? "Scenario duplicated into comparison." : saved.message ?? "Could not duplicate scenario into comparison.");
    await refreshSavedWork();
  }

  async function deleteSavedItem(id: string, type: SavedItemType) {
    const confirmed = window.confirm(`Delete this saved ${type === "Analysis" ? "calculator result" : type.toLowerCase()}?`);
    if (!confirmed) return;

    if (type === "Analysis") {
      const result = await deleteSavedAnalysis(id);
      setLoadMessage(result.data ? "Calculator result deleted." : result.message ?? "Could not delete calculator result.");
    }
    if (type === "Comparison") {
      const result = await deleteRoiPlan(id);
      setLoadMessage(result.data ? "Comparison deleted." : result.message ?? "Could not delete comparison.");
    }
    if (type === "Scenario") {
      const result = await deleteSavedScenario(id);
      setLoadMessage(result.data ? "Scenario deleted." : result.message ?? "Could not delete scenario.");
    }
    if (type === "Deck") {
      const result = await deleteDeckBrief(id);
      setLoadMessage(result.data ? "Deck deleted." : result.message ?? "Could not delete deck.");
    }
    await refreshSavedWork();
  }

  async function createComparisonGroup(name: string) {
    const now = nowIso();
    const result = await saveRoiPlan({
      id: crypto.randomUUID(),
      name,
      group_name: name,
      scenarios: [],
      sourcePath: "/roi-tool",
      savedAt: now,
      createdAt: now,
      updatedAt: now,
      created_at: now,
      updated_at: now,
    });
    setLoadMessage(result.data ? `Created comparison group "${name}".` : result.message ?? "Could not create comparison group.");
    await refreshSavedWork();
  }

  async function moveStandaloneScenarioIntoComparison(scenarioId: string, comparisonId: string) {
    const standalone = savedScenarios.find((scenario) => scenario.id === scenarioId);
    const comparison = savedComparisons.find((group) => group.id === comparisonId);
    if (!standalone || !comparison) return;
    const scenarioData = getScenarioRecord(standalone);
    const movedScenario = {
      ...scenarioData,
      id: getText(scenarioData.id, scenarioId),
      name: getSavedItemTitle(standalone, "Scenario"),
    };
    const nextComparison = buildUpdatedComparison(comparison, [...getComparisonScenarios(comparison), movedScenario]);
    const saved = await saveRoiPlan(nextComparison);
    if (!saved.data) {
      setLoadMessage(saved.message ?? "Could not move scenario into comparison.");
      return;
    }
    const deleted = await deleteSavedScenario(scenarioId);
    setLoadMessage(deleted.data ? "Scenario moved into comparison." : deleted.message ?? "Scenario added to comparison, but standalone copy could not be removed.");
    await refreshSavedWork();
  }

  async function moveScenarioOutOfComparison(comparisonId: string, scenarioId: string) {
    const comparison = savedComparisons.find((group) => group.id === comparisonId);
    if (!comparison) return;
    const scenarios = getComparisonScenarios(comparison);
    const scenario = scenarios.find((item, index) => getComparisonScenarioId(comparisonId, item, index) === scenarioId);
    if (!scenario) return;
    const title = getText(scenario.name, "ROI scenario");
    const saved = await saveScenario(buildStandaloneScenarioSave(scenario, title));
    if (!saved.data) {
      setLoadMessage(saved.message ?? "Could not save standalone scenario.");
      return;
    }
    const nextComparison = buildUpdatedComparison(comparison, scenarios.filter((item, index) => getComparisonScenarioId(comparisonId, item, index) !== scenarioId));
    const updated = await saveRoiPlan(nextComparison);
    setLoadMessage(updated.data ? "Scenario moved out as standalone." : updated.message ?? "Standalone scenario saved, but comparison could not be updated.");
    await refreshSavedWork();
  }

  async function moveScenarioBetweenComparisons(fromComparisonId: string, scenarioId: string, targetComparisonId: string) {
    const source = savedComparisons.find((group) => group.id === fromComparisonId);
    const target = savedComparisons.find((group) => group.id === targetComparisonId);
    if (!source || !target) return;
    const sourceScenarios = getComparisonScenarios(source);
    const scenario = sourceScenarios.find((item, index) => getComparisonScenarioId(fromComparisonId, item, index) === scenarioId);
    if (!scenario) return;
    const updatedSource = buildUpdatedComparison(source, sourceScenarios.filter((item, index) => getComparisonScenarioId(fromComparisonId, item, index) !== scenarioId));
    const updatedTarget = buildUpdatedComparison(target, [...getComparisonScenarios(target), { ...scenario, id: getText(scenario.id, scenarioId) }]);
    const [sourceResult, targetResult] = await Promise.all([saveRoiPlan(updatedSource), saveRoiPlan(updatedTarget)]);
    setLoadMessage(sourceResult.data && targetResult.data ? "Scenario moved between comparisons." : sourceResult.message ?? targetResult.message ?? "Could not move scenario.");
    await refreshSavedWork();
  }

  async function deleteScenarioFromComparison(comparisonId: string, scenarioId: string) {
    const confirmed = window.confirm("Delete this scenario from the comparison?");
    if (!confirmed) return;
    const comparison = savedComparisons.find((group) => group.id === comparisonId);
    if (!comparison) return;
    const scenarios = getComparisonScenarios(comparison);
    const updated = await saveRoiPlan(buildUpdatedComparison(comparison, scenarios.filter((scenario, index) => getComparisonScenarioId(comparisonId, scenario, index) !== scenarioId)));
    setLoadMessage(updated.data ? "Scenario deleted from comparison." : updated.message ?? "Could not delete scenario from comparison.");
    await refreshSavedWork();
  }

  if (isLoading) {
    return (
      <section className="shell section">
        <article className="card workspace-message">
          <h2>Loading workspace...</h2>
        </article>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="shell section">
        <article className="card workspace-message">
          <div className="workspace-message-copy">
            <h2>Create a free account or sign in.</h2>
            <p>
              Use free calculators without an account, or create a free account to save calculator defaults. APT Pro adds
              saved work and exports.
            </p>
            <div className="workspace-actions">
              <Link className="button" href="/create-account?returnTo=/workspace">
                Create free account
              </Link>
              <Link className="button button-secondary" href="/login?returnTo=/workspace">
                Sign in
              </Link>
              <Link className="text-link" href="/calculators">
                Try free calculators
              </Link>
            </div>
          </div>
        </article>
      </section>
    );
  }

  if (!isPro) {
    return (
      <section className="shell section">
        <div className="account-section-layout">
          <article className="card workspace-message">
            <div className="workspace-message-copy">
              <h2>My workspace is included with APT Pro.</h2>
              <p>
                Free accounts can save calculator defaults. APT Pro adds comparison groups, standalone scenarios,
                calculator results, decks and exports.
              </p>
              <div className="workspace-actions">
                <Link className="button" href="/pricing">
                  See APT Pro
                </Link>
                <Link className="button button-secondary" href="/calculators">
                  Use free calculators
                </Link>
              </div>
            </div>
          </article>
          <AccountMenu active="workspace" actualPlan={plan} />
        </div>
      </section>
    );
  }

  return (
    <section className="shell section">
      <div className="account-section-layout">
        <div className="settings-layout">
          <article className="card workspace-message">
            <div className="workspace-message-copy">
              <h2>Your Pro workspace</h2>
              <p>
                Search all saved items from one place. ROI comparisons are groups of scenarios, and standalone scenarios
                can be moved into groups when plans evolve.
              </p>
              <div className="workspace-sync-note">
                <span className="save-mode-badge save-mode-account">Account saves</span>
                <span>{savedItemCount} saved item(s) across decks, comparisons, scenarios and calculator results.</span>
              </div>
              {loadMessage ? <small className="workspace-kicker">{loadMessage}</small> : null}
            </div>
            <Image
              alt="APT workspace showing saved analyses, scenarios, decks and exports"
              className="workspace-preview-image"
              height={270}
              loading="lazy"
              src="/images/apt/apt-workspace-dashboard-preview.webp"
              width={547}
            />
          </article>

          <WorkspaceControls search={search} sort={sort} onSearch={setSearch} onSort={setSort} />

          <ComparisonScenarioList
            id="comparison-scenarios"
            title="Comparisons & scenarios"
            description="Comparison groups, standalone ROI scenarios and saved calculator results. Expand a comparison to manage the scenarios inside it."
            action={
              <div className="workspace-header-actions">
                <CreateComparisonGroup onCreate={createComparisonGroup} />
                <Link className="button button-secondary button-small" href="/roi-tool">
                  Build in ROI tool
                </Link>
              </div>
            }
            comparisons={visibleComparisonItems}
            allComparisons={savedComparisons}
            standaloneScenarios={visibleStandaloneScenarioItems}
            analyses={visibleAnalysisItems}
            onDelete={deleteSavedItem}
            onDeleteScenarioFromComparison={deleteScenarioFromComparison}
            onBulkDeleteScenarios={bulkDeleteScenarios}
            onDuplicate={duplicateSavedItem}
            onDuplicateScenario={duplicateScenarioToDestination}
            onRename={renameSavedItem}
            onRenameScenario={renameScenario}
            onMoveScenarioBetweenComparisons={moveScenarioBetweenComparisons}
            onMoveScenarioIntoComparison={moveStandaloneScenarioIntoComparison}
            onMoveScenarioOut={moveScenarioOutOfComparison}
            onSelectVisibleScenarios={selectVisibleScenarios}
            onToggleSelected={toggleSelected}
            selectedKeys={selectedKeys}
          />

          <WorkspaceSectionList
            id="decks"
            title="Decks"
            description="Custom deck briefs and generated deck requests."
            action={
              <Link className="button button-secondary button-small" href="/presentation-templates">
                New deck
              </Link>
            }
            items={visibleDeckItems}
            selectedKeys={selectedKeys}
            onBulkDelete={bulkDeleteDecks}
            onDelete={deleteSavedItem}
            onDuplicate={duplicateSavedItem}
            onRename={renameSavedItem}
            onSelectVisible={selectVisibleDecks}
            onToggleSelected={toggleSelected}
          />
        </div>
        <AccountMenu active="workspace" actualPlan={plan} />
      </div>
    </section>
  );
}
