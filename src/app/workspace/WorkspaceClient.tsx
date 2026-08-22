"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  deleteDeckBrief,
  deleteRoiPlan,
  deleteSavedAnalysis,
  deleteSavedScenario,
  duplicateSavedAnalysis,
  duplicateRoiPlan,
  duplicateSavedScenario,
  listDeckBriefs,
  listRoiPlans,
  listSavedAnalyses,
  listSavedScenarios,
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

function MoveScenarioIntoComparison({
  scenarioId,
  comparisons,
  onMove,
}: {
  scenarioId: string;
  comparisons: SavedRecord[];
  onMove: (scenarioId: string, comparisonId: string) => void | Promise<void>;
}) {
  const [targetId, setTargetId] = useState("");

  if (!comparisons.length) return null;

  return (
    <div className="workspace-move-control">
      <label>
        <span>Move to comparison</span>
        <select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
          <option value="">Choose comparison</option>
          {comparisons.map((comparison) => (
            <option key={String(comparison.id)} value={String(comparison.id)}>
              {getSavedItemTitle(comparison, "Comparison")}
            </option>
          ))}
        </select>
      </label>
      <button className="text-button" disabled={!targetId} onClick={() => onMove(scenarioId, targetId)} type="button">
        Move
      </button>
    </div>
  );
}

function MoveScenarioBetweenComparisons({
  comparisonId,
  scenarioId,
  comparisons,
  onMove,
}: {
  comparisonId: string;
  scenarioId: string;
  comparisons: SavedRecord[];
  onMove: (fromComparisonId: string, scenarioId: string, targetComparisonId: string) => void | Promise<void>;
}) {
  const [targetId, setTargetId] = useState("");
  const targets = comparisons.filter((comparison) => comparison.id !== comparisonId);

  if (!targets.length) return null;

  return (
    <div className="workspace-move-control">
      <label>
        <span>Move to</span>
        <select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
          <option value="">Choose group</option>
          {targets.map((comparison) => (
            <option key={String(comparison.id)} value={String(comparison.id)}>
              {getSavedItemTitle(comparison, "Comparison")}
            </option>
          ))}
        </select>
      </label>
      <button className="text-button" disabled={!targetId} onClick={() => onMove(comparisonId, scenarioId, targetId)} type="button">
        Move
      </button>
    </div>
  );
}

function SavedWorkRow({
  item,
  comparisons,
  onDuplicate,
  onDelete,
  onMoveScenarioIntoComparison,
  onMoveScenarioOut,
  onMoveScenarioBetweenComparisons,
}: {
  item: SavedWorkItem;
  comparisons: SavedRecord[];
  onDuplicate: (id: string, type: SavedItemType) => void | Promise<void>;
  onDelete: (id: string, type: SavedItemType) => void | Promise<void>;
  onMoveScenarioIntoComparison: (scenarioId: string, comparisonId: string) => void | Promise<void>;
  onMoveScenarioOut: (comparisonId: string, scenarioId: string) => void | Promise<void>;
  onMoveScenarioBetweenComparisons: (fromComparisonId: string, scenarioId: string, targetComparisonId: string) => void | Promise<void>;
}) {
  const title = getSavedItemTitle(item.record, item.type);
  const href = getItemHref(item.record, item.type);
  const isComparison = item.type === "Comparison";
  const isStandaloneScenario = item.type === "Scenario";
  const scenarios = isComparison ? getComparisonScenarios(item.record) : [];

  return (
    <article className={isComparison ? "workspace-list-row workspace-list-row-comparison" : "workspace-list-row"}>
      <div className="workspace-list-main">
        <div>
          <span className="saved-item-meta">{isComparison ? "Comparison group" : isStandaloneScenario ? "Standalone scenario" : item.type === "Analysis" ? "Calculator result" : "Deck brief"}</span>
          <h3>{title}</h3>
          <p>{getItemDescription(item.record, item.type)}</p>
        </div>
        <div className="workspace-list-actions">
          <Link className="button button-secondary button-small" href={href}>
            Open
          </Link>
          {item.type !== "Deck" ? (
            <button className="text-button" onClick={() => onDuplicate(item.id, item.type)} type="button">
              Duplicate
            </button>
          ) : null}
          <button className="text-button text-button-danger" onClick={() => onDelete(item.id, item.type)} type="button">
            Delete
          </button>
        </div>
      </div>

      {isStandaloneScenario ? (
        <MoveScenarioIntoComparison scenarioId={item.id} comparisons={comparisons} onMove={onMoveScenarioIntoComparison} />
      ) : null}

      <SavedItemDetails item={item.record} type={item.type} />

      {isComparison ? (
        <details className="comparison-scenario-list" open>
          <summary>Scenarios in this comparison</summary>
          {scenarios.length ? (
            <div className="comparison-scenario-rows">
              {scenarios.map((scenario, index) => {
                const scenarioId = getText(scenario.id, `${item.id}-scenario-${index}`);
                const scenarioHref = `${href}&scenario=${scenarioId}`;
                return (
                  <div className="comparison-scenario-row" key={scenarioId}>
                    <div>
                      <strong>{getText(scenario.name, `Scenario ${index + 1}`)}</strong>
                      <span>{getScenarioSummary(scenario)}</span>
                    </div>
                    <div className="comparison-scenario-actions">
                      <Link className="text-link" href={scenarioHref}>
                        Open scenario
                      </Link>
                      <button className="text-button" onClick={() => onMoveScenarioOut(item.id, scenarioId)} type="button">
                        Move out
                      </button>
                      <MoveScenarioBetweenComparisons
                        comparisonId={item.id}
                        scenarioId={scenarioId}
                        comparisons={comparisons}
                        onMove={onMoveScenarioBetweenComparisons}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty-state">No scenarios saved inside this comparison.</p>
          )}
        </details>
      ) : null}
    </article>
  );
}

function SavedWorkList({
  items,
  comparisons,
  onDuplicate,
  onDelete,
  onMoveScenarioIntoComparison,
  onMoveScenarioOut,
  onMoveScenarioBetweenComparisons,
}: {
  items: SavedWorkItem[];
  comparisons: SavedRecord[];
  onDuplicate: (id: string, type: SavedItemType) => void | Promise<void>;
  onDelete: (id: string, type: SavedItemType) => void | Promise<void>;
  onMoveScenarioIntoComparison: (scenarioId: string, comparisonId: string) => void | Promise<void>;
  onMoveScenarioOut: (comparisonId: string, scenarioId: string) => void | Promise<void>;
  onMoveScenarioBetweenComparisons: (fromComparisonId: string, scenarioId: string, targetComparisonId: string) => void | Promise<void>;
}) {
  return (
    <article className="card workspace-card workspace-saved-work-card" id="saved-work">
      <div className="workspace-card-header">
        <div>
          <h2>Saved work</h2>
          <p>All saved items in one list. Comparisons are groups; expand them to manage the scenarios inside.</p>
        </div>
        <Link className="button button-secondary button-small" href="/roi-tool">
          New ROI comparison
        </Link>
      </div>
      {items.length ? (
        <div className="workspace-list">
          {items.map((item) => (
            <SavedWorkRow
              item={item}
              key={`${item.type}-${item.id}`}
              comparisons={comparisons}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onMoveScenarioBetweenComparisons={onMoveScenarioBetweenComparisons}
              onMoveScenarioIntoComparison={onMoveScenarioIntoComparison}
              onMoveScenarioOut={onMoveScenarioOut}
            />
          ))}
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
  const isPro = plan === "pro" || plan === "team";
  const allItems = useMemo(
    () => [
      ...savedComparisons.map((record) => ({ id: String(record.id), type: "Comparison" as const, record })),
      ...savedScenarios.map((record) => ({ id: String(record.id), type: "Scenario" as const, record })),
      ...savedAnalyses.map((record) => ({ id: String(record.id), type: "Analysis" as const, record })),
      ...deckBriefs.map((record) => ({ id: String(record.id), type: "Deck" as const, record })),
    ].filter((item) => item.id && item.id !== "undefined"),
    [deckBriefs, savedAnalyses, savedComparisons, savedScenarios],
  );
  const visibleItems = useMemo(() => filterAndSortItems(allItems, search, sort), [allItems, search, sort]);

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
    if (scenarios.length <= 1) {
      setLoadMessage("A comparison needs at least one scenario. Add another scenario before moving this one out.");
      return;
    }
    const scenario = scenarios.find((item) => item.id === scenarioId);
    if (!scenario) return;
    const title = getText(scenario.name, "ROI scenario");
    const saved = await saveScenario(buildStandaloneScenarioSave(scenario, title));
    if (!saved.data) {
      setLoadMessage(saved.message ?? "Could not save standalone scenario.");
      return;
    }
    const nextComparison = buildUpdatedComparison(comparison, scenarios.filter((item) => item.id !== scenarioId));
    const updated = await saveRoiPlan(nextComparison);
    setLoadMessage(updated.data ? "Scenario moved out as standalone." : updated.message ?? "Standalone scenario saved, but comparison could not be updated.");
    await refreshSavedWork();
  }

  async function moveScenarioBetweenComparisons(fromComparisonId: string, scenarioId: string, targetComparisonId: string) {
    const source = savedComparisons.find((group) => group.id === fromComparisonId);
    const target = savedComparisons.find((group) => group.id === targetComparisonId);
    if (!source || !target) return;
    const sourceScenarios = getComparisonScenarios(source);
    if (sourceScenarios.length <= 1) {
      setLoadMessage("A comparison needs at least one scenario. Add another scenario before moving this one.");
      return;
    }
    const scenario = sourceScenarios.find((item) => item.id === scenarioId);
    if (!scenario) return;
    const updatedSource = buildUpdatedComparison(source, sourceScenarios.filter((item) => item.id !== scenarioId));
    const updatedTarget = buildUpdatedComparison(target, [...getComparisonScenarios(target), scenario]);
    const [sourceResult, targetResult] = await Promise.all([saveRoiPlan(updatedSource), saveRoiPlan(updatedTarget)]);
    setLoadMessage(sourceResult.data && targetResult.data ? "Scenario moved between comparisons." : sourceResult.message ?? targetResult.message ?? "Could not move scenario.");
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
                <span>{allItems.length} saved item(s) across comparisons, scenarios, calculator results and deck briefs.</span>
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

          <SavedWorkList
            items={visibleItems}
            comparisons={savedComparisons}
            onDelete={deleteSavedItem}
            onDuplicate={duplicateSavedItem}
            onMoveScenarioBetweenComparisons={moveScenarioBetweenComparisons}
            onMoveScenarioIntoComparison={moveStandaloneScenarioIntoComparison}
            onMoveScenarioOut={moveScenarioOutOfComparison}
          />
        </div>
        <AccountMenu active="workspace" actualPlan={plan} />
      </div>
    </section>
  );
}
