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
  listRoiPlans,
  listDeckBriefs,
  listSavedAnalyses,
  listSavedScenarios,
} from "../../lib/saveStore";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";
import { AccountMenu } from "../components/AccountMenu";

type SavedRecord = Record<string, unknown>;
type SavedItemType = "Analysis" | "Comparison" | "Scenario" | "Deck";
type WorkspaceSort = "updated-desc" | "updated-asc" | "name-asc" | "name-desc";

type WorkspaceSectionProps = {
  id: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  items?: SavedRecord[];
  itemType?: SavedItemType;
  onDuplicate?: (id: string, type: SavedItemType) => void | Promise<void>;
  onDelete?: (id: string, type: SavedItemType) => void | Promise<void>;
  emptyImage?: {
    src: string;
    alt: string;
  };
  emptyTitle: string;
  emptyBody: string;
  emptyCta: string;
  emptyHref: string;
};

function getText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
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
  const raw = item.updated_at ?? item.updatedAt ?? item.savedAt ?? item.created_at ?? item.createdAt;
  if (typeof raw !== "string") return "Date not available";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Date not available";
  return `Last updated ${date.toLocaleDateString("en-GB")}`;
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

function getComparisonDescription(item: SavedRecord) {
  const scenarios = Array.isArray(item.scenarios) ? item.scenarios : [];
  const lineCount = scenarios.reduce((total, scenario) => {
    const record = scenario && typeof scenario === "object" && !Array.isArray(scenario) ? (scenario as SavedRecord) : {};
    return total + (Array.isArray(record.lines) ? record.lines.length : 0);
  }, 0);
  return `${scenarios.length || 0} scenario(s) · ${lineCount} product line(s)`;
}

function getScenarioDescription(item: SavedRecord) {
  const outputs = item.outputs && typeof item.outputs === "object" && !Array.isArray(item.outputs) ? (item.outputs as SavedRecord) : {};
  const lines = outputs.lines ? `${outputs.lines} line(s)` : "Saved deal version";
  const incrementalRevenue = getText(outputs.incrementalRevenue, "");
  return incrementalRevenue ? `${lines} · ${incrementalRevenue} incremental revenue` : lines;
}

function getScenarioLineCount(scenario: SavedRecord) {
  return Array.isArray(scenario.lines) ? scenario.lines.length : 0;
}

function getScenarioSummary(scenario: SavedRecord) {
  const lines = getScenarioLineCount(scenario);
  const products = Array.isArray(scenario.lines)
    ? scenario.lines
        .map((line) => (line && typeof line === "object" && !Array.isArray(line) ? getText((line as SavedRecord).product ?? (line as SavedRecord).sku, "") : ""))
        .filter(Boolean)
        .slice(0, 3)
    : [];
  return products.length ? `${lines} line(s) · ${products.join(", ")}` : `${lines} line(s)`;
}

function recordSearchText(item: SavedRecord, type: SavedItemType) {
  const chunks = [getSavedItemTitle(item, type), getUpdatedDate(item)];
  if (type === "Comparison" && Array.isArray(item.scenarios)) {
    item.scenarios.forEach((scenario) => {
      if (!scenario || typeof scenario !== "object" || Array.isArray(scenario)) return;
      const record = scenario as SavedRecord;
      chunks.push(getText(record.name, ""));
      if (Array.isArray(record.lines)) {
        record.lines.forEach((line) => {
          if (!line || typeof line !== "object" || Array.isArray(line)) return;
          const lineRecord = line as SavedRecord;
          chunks.push(getText(lineRecord.sku, ""));
          chunks.push(getText(lineRecord.product, ""));
          chunks.push(getText(lineRecord.notes, ""));
        });
      }
    });
  }
  if (type === "Scenario") chunks.push(getScenarioDescription(item));
  if (type === "Analysis") chunks.push(getAnalysisDescription(item));
  if (type === "Deck") chunks.push(getDeckDescription(item));
  return chunks.join(" ").toLowerCase();
}

function filterAndSortItems(items: SavedRecord[], type: SavedItemType, search: string, sort: WorkspaceSort) {
  const query = search.trim().toLowerCase();
  return items
    .filter((item) => !query || recordSearchText(item, type).includes(query))
    .toSorted((left, right) => {
      if (sort === "name-asc" || sort === "name-desc") {
        const direction = sort === "name-asc" ? 1 : -1;
        return direction * getSavedItemTitle(left, type).localeCompare(getSavedItemTitle(right, type), "en-GB", { sensitivity: "base" });
      }
      const direction = sort === "updated-desc" ? -1 : 1;
      return direction * (getTimestamp(left) - getTimestamp(right));
    });
}

function getRecordEntries(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as SavedRecord).filter(([, entryValue]) => entryValue !== "" && entryValue !== null && entryValue !== undefined);
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

function SavedItemCard({
  item,
  type,
  onDuplicate,
  onDelete,
}: {
  item: SavedRecord;
  type: SavedItemType;
  onDuplicate?: (id: string, type: SavedItemType) => void | Promise<void>;
  onDelete?: (id: string, type: SavedItemType) => void | Promise<void>;
}) {
  const title = getSavedItemTitle(item, type);
  const description = type === "Deck" ? getDeckDescription(item) : type === "Comparison" ? getComparisonDescription(item) : type === "Scenario" ? getScenarioDescription(item) : getAnalysisDescription(item);
  const defaultPath = type === "Deck" ? "/presentation-templates" : type === "Analysis" ? "/calculators" : "/roi-tool";
  const sourcePath = getText(item.sourcePath, defaultPath);
  const href =
    type === "Comparison" && item.id
      ? `${sourcePath}?comparison=${String(item.id)}`
      : type === "Scenario" && item.id
        ? `${sourcePath}?saved=${String(item.id)}`
        : sourcePath;
  const itemId = typeof item.id === "string" ? item.id : "";
  const saveMode = item.saveMode === "account" ? "Saved to account" : "";
  const saveModeClass = item.saveMode === "account" ? "save-mode-badge save-mode-account" : "";

  return (
    <article className="saved-item-card">
      <div>
        <span className="saved-item-meta">{type}</span>
        <h4>{title}</h4>
      </div>
      {saveMode ? <span className={saveModeClass}>{saveMode}</span> : null}
      <p>{description}</p>
      <SavedItemDetails item={item} type={type} />
      <div className="saved-item-footer">
        <small>{getUpdatedDate(item)}</small>
        <div className="summary-actions">
          <Link className="text-link" href={href}>
            Open
          </Link>
          {onDuplicate && itemId && type !== "Deck" ? (
            <button className="text-button" onClick={() => onDuplicate(itemId, type)} type="button">
              Duplicate
            </button>
          ) : null}
          {onDelete && itemId ? (
            <button className="text-button text-button-danger" onClick={() => onDelete(itemId, type)} type="button">
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ComparisonGroupCard({
  item,
  onDuplicate,
  onDelete,
}: {
  item: SavedRecord;
  onDuplicate?: (id: string, type: SavedItemType) => void | Promise<void>;
  onDelete?: (id: string, type: SavedItemType) => void | Promise<void>;
}) {
  const title = getSavedItemTitle(item, "Comparison");
  const scenarios = Array.isArray(item.scenarios)
    ? item.scenarios.filter((scenario): scenario is SavedRecord => Boolean(scenario) && typeof scenario === "object" && !Array.isArray(scenario))
    : [];
  const sourcePath = getText(item.sourcePath, "/roi-tool");
  const itemId = typeof item.id === "string" ? item.id : "";
  const href = itemId ? `${sourcePath}?comparison=${itemId}` : sourcePath;

  return (
    <article className="comparison-group-card">
      <div className="comparison-group-main">
        <div>
          <span className="saved-item-meta">Comparison group</span>
          <h3>{title}</h3>
          <p>{getComparisonDescription(item)}</p>
        </div>
        <div className="comparison-group-actions">
          <Link className="button button-secondary button-small" href={href}>
            Open comparison
          </Link>
          {onDuplicate && itemId ? (
            <button className="text-button" onClick={() => onDuplicate(itemId, "Comparison")} type="button">
              Duplicate
            </button>
          ) : null}
          {onDelete && itemId ? (
            <button className="text-button text-button-danger" onClick={() => onDelete(itemId, "Comparison")} type="button">
              Delete
            </button>
          ) : null}
        </div>
      </div>

      <details className="comparison-scenario-list" open>
        <summary>Scenarios in this comparison</summary>
        {scenarios.length ? (
          <div className="comparison-scenario-rows">
            {scenarios.map((scenario, index) => (
              <div className="comparison-scenario-row" key={String(scenario.id ?? `${itemId}-scenario-${index}`)}>
                <div>
                  <strong>{getText(scenario.name, `Scenario ${index + 1}`)}</strong>
                  <span>{getScenarioSummary(scenario)}</span>
                </div>
                <Link className="text-link" href={itemId && scenario.id ? `${href}&scenario=${String(scenario.id)}` : href}>
                  Open scenario
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No scenarios saved inside this comparison.</p>
        )}
      </details>
    </article>
  );
}

function EmptyState({
  title,
  body,
  cta,
  href,
  image,
}: {
  title: string;
  body: string;
  cta: string;
  href: string;
  image?: {
    src: string;
    alt: string;
  };
}) {
  return (
    <div className="workspace-empty">
      {image ? <Image alt={image.alt} className="workspace-empty-image" height={360} loading="lazy" src={image.src} width={640} /> : null}
      <strong>{title}</strong>
      <p>{body}</p>
      <Link className="button button-secondary button-small" href={href}>
        {cta}
      </Link>
    </div>
  );
}

function WorkspaceSection({
  id,
  title,
  description,
  cta,
  href,
  items = [],
  itemType,
  emptyImage,
  emptyTitle,
  emptyBody,
  emptyCta,
  emptyHref,
  onDuplicate,
  onDelete,
}: WorkspaceSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleItems = isExpanded ? items : items.slice(0, 3);
  const hiddenCount = Math.max(items.length - visibleItems.length, 0);

  return (
    <article className="card workspace-card" id={id}>
      <div className="workspace-card-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <Link className="button button-secondary button-small" href={href}>
          {cta}
        </Link>
      </div>
      {items.length > 0 && itemType ? (
        <>
          <div className="saved-item-list">
            {visibleItems.map((item, index) => (
              <SavedItemCard item={item} key={String(item.id ?? `${id}-${index}`)} onDelete={onDelete} onDuplicate={onDuplicate} type={itemType} />
            ))}
          </div>
          {items.length > 3 ? (
            <div className="workspace-section-more">
              <span>{isExpanded ? `${items.length} shown` : `${hiddenCount} more saved`}</span>
              <button className="text-button" onClick={() => setIsExpanded((current) => !current)} type="button">
                {isExpanded ? "Show less" : "Show all"}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState title={emptyTitle} body={emptyBody} cta={emptyCta} href={emptyHref} image={emptyImage} />
      )}
    </article>
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
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search comparisons, scenarios, SKUs or decks" />
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

function ComparisonGroupsSection({
  items,
  onDuplicate,
  onDelete,
}: {
  items: SavedRecord[];
  onDuplicate: (id: string, type: SavedItemType) => void | Promise<void>;
  onDelete: (id: string, type: SavedItemType) => void | Promise<void>;
}) {
  return (
    <article className="card workspace-card workspace-card-wide" id="comparisons">
      <div className="workspace-card-header">
        <div>
          <h2>ROI comparison groups</h2>
          <p>Each comparison is a saved group. Open it to keep editing, or expand the scenarios underneath to see what is inside.</p>
        </div>
        <Link className="button button-secondary button-small" href="/roi-tool">
          Create comparison
        </Link>
      </div>
      {items.length ? (
        <div className="comparison-group-list">
          {items.map((item, index) => (
            <ComparisonGroupCard item={item} key={String(item.id ?? `comparison-${index}`)} onDelete={onDelete} onDuplicate={onDuplicate} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No matching comparison groups."
          body="Create an ROI comparison, or adjust the search and sort controls above."
          cta="Create ROI comparison"
          href="/roi-tool"
        />
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
  const filteredComparisons = useMemo(() => filterAndSortItems(savedComparisons, "Comparison", search, sort), [savedComparisons, search, sort]);
  const filteredScenarios = useMemo(() => filterAndSortItems(savedScenarios, "Scenario", search, sort), [savedScenarios, search, sort]);
  const filteredAnalyses = useMemo(() => filterAndSortItems(savedAnalyses, "Analysis", search, sort), [savedAnalyses, search, sort]);
  const filteredDecks = useMemo(() => filterAndSortItems(deckBriefs, "Deck", search, sort), [deckBriefs, search, sort]);

  useEffect(() => {
    if (!isAuthenticated || !isPro) {
      return;
    }

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
      })

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
      setLoadMessage(result.data ? "Analysis duplicated." : result.message ?? "Could not duplicate analysis.");
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
    const confirmed = window.confirm(`Delete this saved ${type.toLowerCase()}?`);
    if (!confirmed) return;

    if (type === "Analysis") {
      const result = await deleteSavedAnalysis(id);
      setLoadMessage(result.data ? "Analysis deleted." : result.message ?? "Could not delete analysis.");
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
                Free accounts can save calculator defaults. APT Pro adds saved scenarios, analyses, decks and exports.
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
                ROI comparisons are saved groups of scenarios. Saved calculator results are one-off outputs from the
                smaller calculators and quick deal checks.
              </p>
              <div className="workspace-sync-note">
                <span className="save-mode-badge save-mode-account">Account saves</span>
                <span>Comparison groups, standalone scenarios, calculator results and deck briefs follow you across signed-in devices.</span>
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

          <div className="workspace-grid">
            <ComparisonGroupsSection items={filteredComparisons} onDelete={deleteSavedItem} onDuplicate={duplicateSavedItem} />
            <WorkspaceSection
              cta="Open calculators"
              description="One-off calculator outputs saved from quick calculators or commercial deal checks."
              emptyBody="Run a calculator, save the result, and it will appear here for quick follow-up."
              emptyCta="Open calculators"
              emptyHref="/calculators"
              emptyTitle="No saved calculator results yet."
              href="/calculators"
              id="analyses"
              items={filteredAnalyses}
              itemType="Analysis"
              onDelete={deleteSavedItem}
              onDuplicate={duplicateSavedItem}
              title="Saved calculator results"
            />
            <WorkspaceSection
              cta="View scenarios"
              description="Standalone ROI scenarios saved outside a comparison group."
              emptyBody="Save an individual ROI scenario when you need a lightweight single version. For most ROI work, use comparison groups above."
              emptyCta="Save a scenario"
              emptyHref="/roi-tool"
              emptyTitle="No standalone scenarios yet."
              href="/workspace#scenarios"
              id="scenarios"
              items={filteredScenarios}
              itemType="Scenario"
              onDelete={deleteSavedItem}
              onDuplicate={duplicateSavedItem}
              title="Standalone saved scenarios"
            />
            <WorkspaceSection
              cta="View saved decks"
              description="Presentation outputs and meeting-ready summaries."
              emptyBody="Create a deck brief from a template and keep the meeting-ready summary here."
              emptyCta="Create deck brief"
              emptyHref="/presentation-templates"
              emptyTitle="No saved decks yet."
              href="/workspace#decks"
              id="decks"
              items={filteredDecks}
              itemType="Deck"
              onDelete={deleteSavedItem}
              title="Saved decks"
            />
            <WorkspaceSection
              cta="View exports"
              description="PowerPoint, Excel and CSV exports created from your work."
              emptyBody="Exports will appear here when you export your work."
              emptyCta="Open calculators"
              emptyHref="/calculators"
              emptyTitle="No exports yet."
              href="/workspace#exports"
              id="exports"
              title="Exports"
            />
            <WorkspaceSection
              cta="Manage templates"
              description="Manage your saved presentation templates and export defaults."
              emptyBody="Add saved PowerPoint templates and export defaults when you are ready to shape outputs."
              emptyCta="Open settings"
              emptyHref="/settings#presentation-templates"
              emptyTitle="No template preferences saved yet."
              href="/settings#presentation-templates"
              id="templates"
              title="Templates"
            />
          </div>
        </div>
        <AccountMenu active="workspace" actualPlan={plan} />
      </div>
    </section>
  );
}
