"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAptMode } from "../components/AptMode";
import {
  duplicateSavedAnalysis,
  duplicateSavedScenario,
  listDeckBriefs,
  listSavedAnalyses,
  listSavedScenarios,
} from "../../lib/saveStore";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";
import { getUserPlan } from "../../lib/userPlan";

type SavedRecord = Record<string, unknown>;

type WorkspaceSectionProps = {
  id: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  items?: SavedRecord[];
  itemType?: "Analysis" | "Scenario" | "Deck";
  onDuplicate?: (id: string, type: "Analysis" | "Scenario" | "Deck") => void | Promise<void>;
  icon?: string;
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

function SavedItemDetails({ item, type }: { item: SavedRecord; type: "Analysis" | "Scenario" | "Deck" }) {
  if (type === "Deck") return null;
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
}: {
  item: SavedRecord;
  type: "Analysis" | "Scenario" | "Deck";
  onDuplicate?: (id: string, type: "Analysis" | "Scenario" | "Deck") => void | Promise<void>;
}) {
  const title = getText(item.title ?? item.name ?? item.group_name ?? item.deck_name, type === "Deck" ? "Saved deck" : type === "Scenario" ? "Saved scenario" : "Saved analysis");
  const description = type === "Deck" ? getDeckDescription(item) : type === "Scenario" ? getScenarioDescription(item) : getAnalysisDescription(item);
  const sourcePath = getText(item.sourcePath, type === "Deck" ? "/presentation-templates" : type === "Scenario" ? "/roi-tool" : "/calculators");
  const href = type === "Scenario" && item.id ? `${sourcePath}?saved=${String(item.id)}` : sourcePath;
  const itemId = typeof item.id === "string" ? item.id : "";

  return (
    <article className="saved-item-card">
      <div>
        <span className="saved-item-meta">{type}</span>
        <h4>{title}</h4>
      </div>
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
      {image ? <img alt={image.alt} className="workspace-empty-image" loading="lazy" src={image.src} /> : null}
      <strong>{title}</strong>
      <p>{body}</p>
      <Link className="text-link" href={href}>
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
  icon,
  emptyImage,
  emptyTitle,
  emptyBody,
  emptyCta,
  emptyHref,
  onDuplicate,
}: WorkspaceSectionProps) {
  return (
    <article className="card workspace-card" id={id}>
      <div className="workspace-card-header">
        <div>
          {icon ? <img alt="" aria-hidden="true" className="tool-card-icon" loading="lazy" src={icon} /> : null}
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <Link className="button button-secondary button-small" href={href}>
          {cta}
        </Link>
      </div>
      {items.length > 0 && itemType ? (
        <div className="saved-item-list">
          {items.slice(0, 3).map((item, index) => (
            <SavedItemCard item={item} key={String(item.id ?? `${id}-${index}`)} onDuplicate={onDuplicate} type={itemType} />
          ))}
        </div>
      ) : (
        <EmptyState title={emptyTitle} body={emptyBody} cta={emptyCta} href={emptyHref} image={emptyImage} />
      )}
    </article>
  );
}

export function WorkspaceClient() {
  const { aptMode } = useAptMode();
  const { isAuthenticated, isLoading } = useSupabaseAuth();
  const [savedAnalyses, setSavedAnalyses] = useState<SavedRecord[]>([]);
  const [savedScenarios, setSavedScenarios] = useState<SavedRecord[]>([]);
  const [deckBriefs, setDeckBriefs] = useState<SavedRecord[]>([]);
  const [isLoadingSavedWork, setIsLoadingSavedWork] = useState(false);
  const [loadMessage, setLoadMessage] = useState("");
  const isPro = getUserPlan(aptMode) === "pro";

  useEffect(() => {
    if (!isAuthenticated || !isPro) {
      setSavedAnalyses([]);
      setSavedScenarios([]);
      setDeckBriefs([]);
      setLoadMessage("");
      return;
    }

    let isMounted = true;
    setIsLoadingSavedWork(true);
    // TODO: Replace local saved analyses/scenarios with user profile storage when backend tables are ready.
    Promise.all([listSavedAnalyses(), listSavedScenarios(), listDeckBriefs()])
      .then(([analyses, scenarios, decks]) => {
        if (!isMounted) return;
        setSavedAnalyses(analyses.data);
        setSavedScenarios(scenarios.data);
        setDeckBriefs(decks.data);
        setLoadMessage(analyses.message ?? scenarios.message ?? decks.message ?? "");
      })
      .catch(() => {
        if (!isMounted) return;
        setSavedAnalyses([]);
        setSavedScenarios([]);
        setDeckBriefs([]);
        setLoadMessage("Could not load saved work right now.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingSavedWork(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isPro]);

  async function refreshSavedWork() {
    const [analyses, scenarios, decks] = await Promise.all([listSavedAnalyses(), listSavedScenarios(), listDeckBriefs()]);
    setSavedAnalyses(analyses.data);
    setSavedScenarios(scenarios.data);
    setDeckBriefs(decks.data);
    setLoadMessage(analyses.message ?? scenarios.message ?? decks.message ?? "");
  }

  async function duplicateSavedItem(id: string, type: "Analysis" | "Scenario" | "Deck") {
    if (type === "Analysis") {
      const result = await duplicateSavedAnalysis(id);
      setLoadMessage(result.data ? "Analysis duplicated." : result.message ?? "Could not duplicate analysis.");
    }
    if (type === "Scenario") {
      const result = await duplicateSavedScenario(id);
      setLoadMessage(result.data ? "Scenario duplicated." : result.message ?? "Could not duplicate scenario.");
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
      </section>
    );
  }

  return (
    <section className="shell section">
      <div className="settings-layout">
        <article className="card workspace-message">
          <div className="workspace-message-copy">
            <h2>Your Pro workspace</h2>
            <p>
              Saved work from ROI plans and custom deck briefs appears here when it is available. Exports and richer
              saved analyses will connect here as Pro features are added.
            </p>
            {isLoadingSavedWork ? <small className="workspace-kicker">Loading saved work...</small> : null}
            {loadMessage ? <small className="workspace-kicker">{loadMessage}</small> : null}
          </div>
          <img
            alt="APT workspace showing saved analyses, scenarios, decks and exports"
            className="workspace-preview-image"
            loading="lazy"
            src="/images/apt/apt-workspace-dashboard-preview.webp"
          />
        </article>

        <div className="workspace-grid">
          <WorkspaceSection
            cta="View saved analyses"
            description="Commercial calculations and deal checks you have saved."
            emptyBody="Run a calculator and save the result to return to it later."
            emptyCta="Open calculators"
            emptyHref="/calculators"
            emptyTitle="No saved analyses yet."
            href="/workspace#analyses"
            icon="/images/apt/apt-icon-promo-roi.svg"
            id="analyses"
            items={savedAnalyses}
            itemType="Analysis"
            onDuplicate={duplicateSavedItem}
            title="Saved analyses"
          />
          <WorkspaceSection
            cta="View scenarios"
            description="Deal versions and options saved for comparison."
            emptyBody="Save different versions of a deal so you can compare options later."
            emptyCta="Open ROI planner"
            emptyHref="/roi-tool"
            emptyTitle="No saved scenarios yet."
            emptyImage={{
              alt: "APT saved scenarios empty state",
              src: "/images/apt/apt-workspace-empty-state-preview.webp",
            }}
            href="/workspace#scenarios"
            icon="/images/apt/apt-icon-scenario-compare.svg"
            id="scenarios"
            items={savedScenarios}
            itemType="Scenario"
            onDuplicate={duplicateSavedItem}
            title="Saved scenarios"
          />
          <WorkspaceSection
            cta="View saved decks"
            description="Presentation outputs and meeting-ready summaries."
            emptyBody="Saved decks will appear here once deck exports are available."
            emptyCta="View presentation templates"
            emptyHref="/presentation-templates"
            emptyTitle="No saved decks yet."
            href="/workspace#decks"
            icon="/images/apt/apt-icon-export.svg"
            id="decks"
            items={deckBriefs}
            itemType="Deck"
            title="Saved decks"
          />
          <WorkspaceSection
            cta="View exports"
            description="PowerPoint, Excel and CSV exports created from your work."
            emptyBody="Exports will appear here once PowerPoint and Excel exports are available."
            emptyCta="Open calculators"
            emptyHref="/calculators"
            emptyTitle="No exports yet."
            href="/workspace#exports"
            icon="/images/apt/apt-icon-export.svg"
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
            icon="/images/apt/apt-icon-export.svg"
            id="templates"
            title="Templates"
          />
        </div>
      </div>
    </section>
  );
}
