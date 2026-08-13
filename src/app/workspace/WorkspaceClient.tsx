"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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

type WorkspaceSectionProps = {
  id: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  items?: SavedRecord[];
  itemType?: "Analysis" | "Comparison" | "Scenario" | "Deck";
  onDuplicate?: (id: string, type: "Analysis" | "Comparison" | "Scenario" | "Deck") => void | Promise<void>;
  onDelete?: (id: string, type: "Analysis" | "Comparison" | "Scenario" | "Deck") => void | Promise<void>;
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

function getRecordEntries(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as SavedRecord).filter(([, entryValue]) => entryValue !== "" && entryValue !== null && entryValue !== undefined);
}

function SavedItemDetails({ item, type }: { item: SavedRecord; type: "Analysis" | "Comparison" | "Scenario" | "Deck" }) {
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
  type: "Analysis" | "Comparison" | "Scenario" | "Deck";
  onDuplicate?: (id: string, type: "Analysis" | "Comparison" | "Scenario" | "Deck") => void | Promise<void>;
  onDelete?: (id: string, type: "Analysis" | "Comparison" | "Scenario" | "Deck") => void | Promise<void>;
}) {
  const title = getText(item.title ?? item.name ?? item.group_name ?? item.deck_name, type === "Deck" ? "Saved deck" : type === "Comparison" ? "Saved comparison" : type === "Scenario" ? "Saved scenario" : "Saved analysis");
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
  const saveMode = item.saveMode === "account" ? "Saved to account" : item.saveMode === "local" ? "Saved on this device" : "";
  const saveModeClass = item.saveMode === "account" ? "save-mode-badge save-mode-account" : item.saveMode === "local" ? "save-mode-badge save-mode-local" : "";

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

export function WorkspaceClient() {
  const { isAuthenticated, isLoading, plan } = useSupabaseAuth();
  const [savedAnalyses, setSavedAnalyses] = useState<SavedRecord[]>([]);
  const [savedComparisons, setSavedComparisons] = useState<SavedRecord[]>([]);
  const [savedScenarios, setSavedScenarios] = useState<SavedRecord[]>([]);
  const [deckBriefs, setDeckBriefs] = useState<SavedRecord[]>([]);
  const [loadMessage, setLoadMessage] = useState("");
  const isPro = plan === "pro" || plan === "team";

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

  async function duplicateSavedItem(id: string, type: "Analysis" | "Comparison" | "Scenario" | "Deck") {
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

  async function deleteSavedItem(id: string, type: "Analysis" | "Comparison" | "Scenario" | "Deck") {
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
                Saved work from ROI plans and custom deck briefs appears here when you create it. Exports appear here
                when you export your work.
              </p>
              <div className="workspace-sync-note">
                <span className="save-mode-badge save-mode-account">Account saves</span>
                <span>Saved comparisons and deck briefs follow you across signed-in devices.</span>
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

          <div className="workspace-grid">
            <WorkspaceSection
              cta="View saved analyses"
              description="Commercial calculations and deal checks you have saved."
              emptyBody="Run a calculator, save the result, and it will appear here for quick follow-up."
              emptyCta="Open calculators"
              emptyHref="/calculators"
              emptyTitle="No saved analyses yet."
              href="/workspace#analyses"
              id="analyses"
              items={savedAnalyses}
              itemType="Analysis"
              onDelete={deleteSavedItem}
              onDuplicate={duplicateSavedItem}
              title="Saved analyses"
            />
            <WorkspaceSection
              cta="View comparisons"
              description="Full ROI comparison groups saved from the planner."
              emptyBody="Create a named comparison in the ROI planner to return to the full scenario group later."
              emptyCta="Create ROI comparison"
              emptyHref="/roi-tool"
              emptyTitle="No saved comparisons yet."
              href="/workspace#comparisons"
              id="comparisons"
              items={savedComparisons}
              itemType="Comparison"
              onDelete={deleteSavedItem}
              onDuplicate={duplicateSavedItem}
              title="Saved ROI comparisons"
            />
            <WorkspaceSection
              cta="View scenarios"
              description="Single deal versions saved from ROI tools."
              emptyBody="Save individual deal versions when you want a lightweight record of one scenario."
              emptyCta="Save a scenario"
              emptyHref="/roi-tool"
              emptyTitle="No saved scenarios yet."
              href="/workspace#scenarios"
              id="scenarios"
              items={savedScenarios}
              itemType="Scenario"
              onDelete={deleteSavedItem}
              onDuplicate={duplicateSavedItem}
              title="Saved scenarios"
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
              items={deckBriefs}
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
