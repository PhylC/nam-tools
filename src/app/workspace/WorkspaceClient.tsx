"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAptMode } from "../components/AptMode";
import { listDeckBriefs, listRoiPlans } from "../../lib/saveStore";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";

type SavedRecord = Record<string, unknown>;

type WorkspaceSectionProps = {
  id: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  items?: SavedRecord[];
  itemType?: "Analysis" | "Scenario" | "Deck";
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

function getRoiDescription(item: SavedRecord) {
  const scenarios = Array.isArray(item.scenarios) ? item.scenarios.length : 0;
  if (scenarios > 1) return `${scenarios} saved scenarios`;
  if (scenarios === 1) return "1 saved scenario";
  return "Commercial calculation";
}

function getDeckDescription(item: SavedRecord) {
  const template = getText(item.template_type, "Presentation deck");
  const customer = getText(item.customer, "");
  return customer ? `${template} for ${customer}` : template;
}

function SavedItemCard({
  item,
  type,
}: {
  item: SavedRecord;
  type: "Analysis" | "Scenario" | "Deck";
}) {
  const title = getText(item.name ?? item.group_name ?? item.deck_name, type === "Deck" ? "Saved deck" : "Saved analysis");
  const description = type === "Deck" ? getDeckDescription(item) : getRoiDescription(item);
  const href = type === "Deck" ? "/presentation-templates" : "/roi-tool";

  return (
    <article className="saved-item-card">
      <div>
        <span className="saved-item-meta">{type}</span>
        <h4>{title}</h4>
      </div>
      <p>{description}</p>
      <div className="saved-item-footer">
        <small>{getUpdatedDate(item)}</small>
        <Link className="text-link" href={href}>
          Open
        </Link>
      </div>
    </article>
  );
}

function EmptyState({
  title,
  body,
  cta,
  href,
}: {
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="workspace-empty">
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
  emptyTitle,
  emptyBody,
  emptyCta,
  emptyHref,
}: WorkspaceSectionProps) {
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
        <div className="saved-item-list">
          {items.slice(0, 3).map((item, index) => (
            <SavedItemCard item={item} key={String(item.id ?? `${id}-${index}`)} type={itemType} />
          ))}
        </div>
      ) : (
        <EmptyState title={emptyTitle} body={emptyBody} cta={emptyCta} href={emptyHref} />
      )}
    </article>
  );
}

export function WorkspaceClient() {
  const { aptMode } = useAptMode();
  const { isAuthenticated, isLoading } = useSupabaseAuth();
  const [roiPlans, setRoiPlans] = useState<SavedRecord[]>([]);
  const [deckBriefs, setDeckBriefs] = useState<SavedRecord[]>([]);
  const [isLoadingSavedWork, setIsLoadingSavedWork] = useState(false);
  const [loadMessage, setLoadMessage] = useState("");
  const isPro = aptMode === "pro";

  useEffect(() => {
    if (!isAuthenticated || !isPro) {
      setRoiPlans([]);
      setDeckBriefs([]);
      setLoadMessage("");
      return;
    }

    let isMounted = true;
    setIsLoadingSavedWork(true);
    // TODO: Replace placeholder workspace state with saved analyses/decks from user profile storage.
    Promise.all([listRoiPlans(), listDeckBriefs()])
      .then(([plans, decks]) => {
        if (!isMounted) return;
        setRoiPlans(plans.data);
        setDeckBriefs(decks.data);
        setLoadMessage(plans.message ?? decks.message ?? "");
      })
      .catch(() => {
        if (!isMounted) return;
        setRoiPlans([]);
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
          <h2>Create a free account or sign in.</h2>
          <p>
            Use free calculators without an account, or create a free account to save calculator defaults. APT Pro adds
            saved work and exports.
          </p>
          <div className="workspace-actions">
            {/* TODO: Connect these actions to the final authentication routes when the account UI is added. */}
            <Link className="button" href="/settings">
              Create free account
            </Link>
            <Link className="button button-secondary" href="/settings">
              Sign in
            </Link>
            <Link className="text-link" href="/calculators">
              Try free calculators
            </Link>
          </div>
        </article>
      </section>
    );
  }

  if (!isPro) {
    return (
      <section className="shell section">
        <article className="card workspace-message">
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
        </article>
      </section>
    );
  }

  return (
    <section className="shell section">
      <div className="settings-layout">
        <article className="card workspace-message">
          <h2>Your Pro workspace</h2>
          <p>
            Saved work from ROI plans and custom deck briefs appears here when it is available. Exports and richer
            saved analyses will connect here as Pro features are added.
          </p>
          {isLoadingSavedWork ? <small className="workspace-kicker">Loading saved work...</small> : null}
          {loadMessage ? <small className="workspace-kicker">{loadMessage}</small> : null}
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
            id="analyses"
            items={roiPlans}
            itemType="Analysis"
            title="Saved analyses"
          />
          <WorkspaceSection
            cta="View scenarios"
            description="Deal versions and options saved for comparison."
            emptyBody="Save different versions of a deal so you can compare options later."
            emptyCta="Open ROI planner"
            emptyHref="/roi-tool"
            emptyTitle="No saved scenarios yet."
            href="/workspace#scenarios"
            id="scenarios"
            items={roiPlans}
            itemType="Scenario"
            title="Saved scenarios"
          />
          <WorkspaceSection
            cta="View saved decks"
            description="Presentation outputs and meeting-ready summaries."
            emptyBody="Create a presentation summary or use a template to start building meeting-ready outputs."
            emptyCta="View presentation templates"
            emptyHref="/presentation-templates"
            emptyTitle="No saved decks yet."
            href="/workspace#decks"
            id="decks"
            items={deckBriefs}
            itemType="Deck"
            title="Saved decks"
          />
          <WorkspaceSection
            cta="View exports"
            description="PowerPoint, Excel and CSV exports created from your work."
            emptyBody="Export a calculator result or scenario once you are ready to share it."
            emptyCta="Open calculators"
            emptyHref="/calculators"
            emptyTitle="No exports yet."
            href="/workspace#exports"
            id="exports"
            title="Exports"
          />
          <WorkspaceSection
            cta="Manage templates"
            description="Your uploaded presentation template and export preferences."
            emptyBody="Add your company template and export defaults when you are ready to shape outputs."
            emptyCta="Open settings"
            emptyHref="/settings"
            emptyTitle="No template preferences saved yet."
            href="/settings"
            id="templates"
            title="Templates"
          />
        </div>
      </div>
    </section>
  );
}
