"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { trackUpgradeClicked } from "../../lib/analytics";
import { deleteDeckBrief, listDeckBriefs, saveDeckBrief } from "../../lib/saveStore";
import { downloadGeneratedDeck } from "../../lib/storageUploads";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";

type FreeTemplate = {
  title: string;
  slug: string;
  pptx: string;
  deckType: string;
  description: string;
  bestFor: string;
  slides: string;
  includes: string;
  previewSrc?: string;
  previewAlt?: string;
  previewWidth?: number;
  previewHeight?: number;
};

type SavedRecord = Record<string, unknown>;
type SavedDeckSort = "updated-desc" | "updated-asc" | "name-asc" | "name-desc";

// Templates intentionally use editable example content so users can adapt them for real customer meetings.
const freeTemplates: FreeTemplate[] = [
  {
    title: "Joint Business Plan",
    slug: "joint-business-plan",
    pptx: "joint-business-plan-template.pptx",
    deckType: "Joint Business Plan",
    description: "Use this for annual customer planning, growth pillars, investment alignment and measures of success.",
    bestFor: "JBP meetings, account reviews and customer planning",
    slides: "11",
    includes: "objectives, growth plan, investment plan and success measures",
    previewSrc: "/images/apt/apt-template-jbp-preview.webp",
    previewAlt: "Preview of the APT Joint Business Plan PowerPoint template",
    previewWidth: 466,
    previewHeight: 287,
  },
  {
    title: "Account Plan",
    slug: "account-plan",
    pptx: "annual-planning-template.pptx",
    deckType: "Account Plan",
    description: "Create an internal account plan deck covering customer context, priorities, risks, growth levers and actions.",
    bestFor: "Internal account planning, account reviews and sales leadership updates",
    slides: "9",
    includes: "customer context, priorities, risks, opportunity map and action plan",
  },
  {
    title: "Quarterly Business Review",
    slug: "qbr-template",
    pptx: "quarterly-business-review-template.pptx",
    deckType: "Quarterly Business Review",
    description: "Use this to review performance, risks, actions and next-quarter priorities.",
    bestFor: "Customer reviews and internal commercial reviews",
    slides: "10",
    includes: "performance summary, insights, risks and next steps",
    previewSrc: "/images/apt/apt-template-qbr-preview.webp",
    previewAlt: "Preview of the APT Quarterly Business Review PowerPoint template",
    previewWidth: 444,
    previewHeight: 287,
  },
  {
    title: "Promotional Proposal",
    slug: "promo-proposal",
    pptx: "promotional-proposal-template.pptx",
    deckType: "Promotional Proposal",
    description: "Use this to frame a promotion mechanic, support ask, ROI logic and retailer benefit.",
    bestFor: "Promo proposals, trade marketing and buyer sign-off",
    slides: "8",
    includes: "mechanic, support, financial impact and recommendation",
    previewSrc: "/images/apt/apt-template-promo-proposal-preview.webp",
    previewAlt: "Preview of the APT Promotional Proposal PowerPoint template",
    previewWidth: 494,
    previewHeight: 286,
  },
  {
    title: "Range Review Template",
    slug: "range-review",
    pptx: "range-review-template.pptx",
    deckType: "Range Review",
    description: "Structure distribution, rate of sale, opportunity gaps and recommended range changes.",
    bestFor: "Account managers, category teams and range review stakeholders",
    slides: "9",
    includes: "distribution review, opportunity gaps, recommendations and example data",
  },
  {
    title: "New Product Launch Template",
    slug: "product-launch",
    pptx: "new-product-launch-template.pptx",
    deckType: "New Product Launch",
    description: "Build the first launch sell-in story with customer fit, forecast, support and launch plan.",
    bestFor: "Buyers, commercial managers and innovation launch teams",
    slides: "9",
    includes: "launch story, forecast, support plan and commercial example data",
  },
  {
    title: "Annual Planning Template",
    slug: "annual-planning",
    pptx: "annual-planning-template.pptx",
    deckType: "Annual Planning",
    description: "Turn the full-year review, targets, investment priorities and quarterly roadmap into one planning deck.",
    bestFor: "Account managers, sales leads, commercial finance and customer leadership",
    slides: "7",
    includes: "review slides, targets, investment priorities and quarterly roadmap",
  },
  {
    title: "Buyer Meeting Planner Template",
    slug: "buyer-meeting",
    pptx: "buyer-meeting-prep-template.pptx",
    deckType: "Buyer Meeting Planner",
    description: "Prepare the meeting objective, buyer priorities, talking points, objections and follow-up actions.",
    bestFor: "Account managers, KAMs and customer-facing commercial teams",
    slides: "8",
    includes: "meeting objective, talking points, objections and follow-up actions",
  },
  {
    title: "Category Opportunity Deck",
    slug: "category-opportunity",
    pptx: "category-opportunity-deck-template.pptx",
    deckType: "Category Opportunity",
    description: "Size a category opportunity with shopper trends, competitor benchmarking and practical recommendations.",
    bestFor: "Account managers, category managers, buyers and commercial leaders",
    slides: "7",
    includes: "opportunity sizing, benchmark view, recommendations and example data",
  },
];

function customDeckHref(template: FreeTemplate) {
  if (template.slug === "joint-business-plan") return "/tools/joint-business-plan-builder";
  const queryBySlug: Record<string, string> = {
    "joint-business-plan": "jbp",
    "account-plan": "account-plan",
    "qbr-template": "qbr",
    "promo-proposal": "promo-proposal",
    "range-review": "range-review",
    "product-launch": "product-launch",
    "annual-planning": "annual-planning",
    "buyer-meeting": "buyer-meeting",
    "category-opportunity": "category-opportunity",
  };
  return `/custom-deck?template=${queryBySlug[template.slug] ?? template.slug}`;
}

function getText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
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

function getDeckTitle(deck: SavedRecord) {
  return getText(deck.name ?? deck.deck_name ?? deck.title, "Saved deck");
}

function getDeckDescription(deck: SavedRecord) {
  const template = getText(deck.template_type, "Custom deck");
  const customer = getText(deck.customer, "");
  const audience = getText(deck.audience, "");
  if (customer) return `${template} for ${customer}`;
  return audience ? `${template} · ${audience}` : template;
}

function getDeckSearchText(deck: SavedRecord) {
  return [
    getDeckTitle(deck),
    getDeckDescription(deck),
    getUpdatedDate(deck),
    getText(deck.tone, ""),
    getText(deck.deckType, ""),
    getText(deck.brief, ""),
  ]
    .join(" ")
    .toLowerCase();
}

function isRecord(value: unknown): value is SavedRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nowIso() {
  return new Date().toISOString();
}

function safeDeckFilename(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 120);
  return cleaned || "saved-presentation.pptx";
}

function getGeneratedDeckFile(deck: SavedRecord) {
  const generatedDeck = isRecord(deck.generatedDeck) ? deck.generatedDeck : {};
  const storagePath = getText(generatedDeck.storagePath, "");
  if (!storagePath) return null;
  return {
    storagePath,
    filename: safeDeckFilename(getText(generatedDeck.filename, `${getDeckTitle(deck)}.pptx`)),
  };
}

function downloadBrowserFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function WorkspaceIconLink({ href, label }: { href: string; label: string }) {
  return (
    <Link aria-label={label} className="workspace-icon-button" href={href} title={label}>
      <span aria-hidden="true">↗</span>
    </Link>
  );
}

function WorkspaceMenuShell({ children }: { children: React.ReactNode }) {
  return (
    <details className="workspace-row-menu">
      <summary aria-label="More actions" title="More actions">
        <span aria-hidden="true">⋯</span>
      </summary>
      <div className="workspace-row-menu-panel">{children}</div>
    </details>
  );
}

function DeckRowMenu({
  id,
  downloadDisabled,
  onDownload,
  onRename,
  onDelete,
}: {
  id: string;
  downloadDisabled: boolean;
  onDownload: (id: string) => void | Promise<void>;
  onRename: (id: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}) {
  return (
    <WorkspaceMenuShell>
      <Link className="workspace-menu-action" href={`/custom-deck?deck=${id}`}>
        Create new from this
      </Link>
      <button className="workspace-menu-action" disabled={downloadDisabled} onClick={() => onDownload(id)} type="button">
        Download presentation
      </button>
      <button className="workspace-menu-action" onClick={() => onRename(id)} type="button">
        Rename
      </button>
      <button className="workspace-menu-action workspace-menu-danger" onClick={() => onDelete(id)} type="button">
        Delete
      </button>
    </WorkspaceMenuShell>
  );
}

function SavedDeckWorkspaceRow({
  deck,
  onDownload,
  onRename,
  onDelete,
}: {
  deck: SavedRecord;
  onDownload: (id: string) => void | Promise<void>;
  onRename: (id: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}) {
  const id = String(deck.id ?? "");
  const title = getDeckTitle(deck);
  const href = getText(deck.sourcePath, "/presentation-templates");
  const generatedDeckFile = getGeneratedDeckFile(deck);

  return (
    <article className="workspace-list-row">
      <div className="workspace-list-main">
        <span className="workspace-table-type">Deck brief</span>
        <div className="workspace-list-copy">
          <h3>{title}</h3>
          <p>{getDeckDescription(deck)}</p>
        </div>
        <small className="workspace-table-date">{getUpdatedDate(deck)}</small>
        <div className="workspace-list-actions">
          <WorkspaceIconLink href={href} label={`Open ${title}`} />
          <DeckRowMenu
            id={id}
            downloadDisabled={!generatedDeckFile}
            onDelete={onDelete}
            onDownload={onDownload}
            onRename={onRename}
          />
        </div>
      </div>
    </article>
  );
}

function SavedDecksBottomPanel({ isPro }: { isPro: boolean }) {
  const [decks, setDecks] = useState<SavedRecord[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SavedDeckSort>("updated-desc");
  const [message, setMessage] = useState("");
  const query = search.trim().toLowerCase();
  const visibleDecks = useMemo(() => {
    return decks
      .filter((deck) => !query || getDeckSearchText(deck).includes(query))
      .toSorted((left, right) => {
        if (sort === "name-asc" || sort === "name-desc") {
          const direction = sort === "name-asc" ? 1 : -1;
          return direction * getDeckTitle(left).localeCompare(getDeckTitle(right), "en-GB", { sensitivity: "base" });
        }
        const direction = sort === "updated-desc" ? -1 : 1;
        return direction * (getTimestamp(left) - getTimestamp(right));
      });
  }, [decks, query, sort]);

  useEffect(() => {
    if (!isPro) return;
    let isMounted = true;
    listDeckBriefs().then((result) => {
      if (!isMounted) return;
      setDecks(result.data);
      setMessage(result.message ?? "");
    });
    return () => {
      isMounted = false;
    };
  }, [isPro]);

  async function refreshDecks() {
    const result = await listDeckBriefs();
    setDecks(result.data);
    setMessage(result.message ?? "");
  }

  async function downloadSavedDeck(id: string) {
    const deck = decks.find((item) => item.id === id);
    if (!deck) return;
    const generatedDeckFile = getGeneratedDeckFile(deck);
    if (!generatedDeckFile) {
      setMessage("This saved deck does not have a stored presentation file. Open it and create a new copy to download.");
      return;
    }

    setMessage("Preparing saved presentation download...");
    const result = await downloadGeneratedDeck(generatedDeckFile.storagePath, generatedDeckFile.filename);
    if (!result.file) {
      setMessage(result.error ?? "Could not download the saved presentation.");
      return;
    }
    downloadBrowserFile(result.file);
    setMessage(`Downloaded ${generatedDeckFile.filename}.`);
  }

  async function renameSavedDeck(id: string) {
    const source = decks.find((item) => item.id === id);
    if (!source) return;
    const currentName = getDeckTitle(source);
    const nextName = window.prompt("Rename deck", currentName)?.trim();
    if (!nextName || nextName === currentName) return;
    const now = nowIso();
    const result = await saveDeckBrief({ ...source, id, name: nextName, deck_name: nextName, savedAt: now, updatedAt: now, updated_at: now });
    setMessage(result.data ? "Deck renamed." : result.message ?? "Could not rename deck.");
    await refreshDecks();
  }

  async function deleteSavedDeck(id: string) {
    const confirmed = window.confirm("Delete this saved deck?");
    if (!confirmed) return;
    const result = await deleteDeckBrief(id);
    setMessage(result.data ? "Deck deleted." : result.message ?? "Could not delete deck.");
    await refreshDecks();
  }

  if (!isPro) return null;

  return (
    <aside className="card saved-bottom-panel" aria-label="Previously saved decks">
      <div className="saved-bottom-header">
        <div>
          <h2>Previously saved decks</h2>
          <p>Pick up an existing deck request, or create a new deck using one as the starting point.</p>
        </div>
        <Link className="button button-secondary button-small" href="/workspace#decks">
          View all
        </Link>
      </div>
      {message ? <p className="saved-panel-note">{message}</p> : null}
      {decks.length ? (
        <>
          <div className="saved-bottom-controls">
            <label className="field">
              <span>Search saved decks</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search deck, customer, template or brief" />
            </label>
            <label className="field">
              <span>Sort by</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SavedDeckSort)}>
                <option value="updated-desc">Newest first</option>
                <option value="updated-asc">Oldest first</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>
            </label>
          </div>
          <div className="presentation-saved-decks-scroll">
            <div className="workspace-table-list">
              <div className="workspace-table-header" aria-hidden="true">
                <span>Type</span>
                <span>Name</span>
                <span>Last updated</span>
                <span>Actions</span>
              </div>
              {visibleDecks.length ? (
                visibleDecks.map((deck) => (
                  <SavedDeckWorkspaceRow
                    deck={deck}
                    key={String(deck.id ?? getDeckTitle(deck))}
                    onDelete={deleteSavedDeck}
                    onDownload={downloadSavedDeck}
                    onRename={renameSavedDeck}
                  />
                ))
              ) : (
                <div className="saved-bottom-subrow saved-bottom-subrow-empty">No saved decks match this search.</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="saved-panel-empty">
          <strong>No saved decks yet.</strong>
          <p>Create and save a custom deck, then it will appear here.</p>
        </div>
      )}
    </aside>
  );
}

export function PresentationTemplatesFree() {
  const { plan } = useSupabaseAuth();
  const isPro = plan === "pro" || plan === "team";

  return (
    <section className="shell section">
      <div className="presentation-workbench">
        <article className="card presentation-command-panel">
          <div>
            <p className="eyebrow">Start</p>
            <h2>Create a deck</h2>
            <p>
              Pick a deck type, use your own PowerPoint template if needed, add
              supporting files, and save the finished deck into Workspace.
            </p>
          </div>
          <div className="presentation-command-actions">
            <Link className="button" href="/custom-deck">
              New custom deck
            </Link>
            <Link className="button button-secondary" href="/tools/joint-business-plan-builder">
              Joint Business Plan
            </Link>
            <Link className="button button-secondary" href="/custom-deck?template=account-plan">
              Account Plan deck
            </Link>
          </div>
        </article>
      </div>

      <div className="section-header presentation-list-header">
        <h2>Deck builders and templates</h2>
        <p className="section-lead">
          Choose the closest working format. Each option can start a guided deck
          build or download an editable PowerPoint template.
        </p>
      </div>
      <div className="presentation-template-list" id="template-card-grid">
        <div className="presentation-template-list-head" aria-hidden="true">
          <span>Deck type</span>
          <span>Use for</span>
          <span>Slides</span>
          <span>Actions</span>
        </div>
        {freeTemplates.map((template) => (
          <article className="presentation-template-row" id={`template-${template.slug}`} key={template.title}>
            <div className="presentation-template-primary">
              <h2>{template.title}</h2>
              <p className="template-description">{template.description}</p>
              <span>{template.includes}</span>
            </div>
            <div className="presentation-template-use">
              <span>{template.bestFor}</span>
            </div>
            <div className="presentation-template-slides">
              <strong>{template.slides}</strong>
              <span>slides</span>
            </div>
            <div className="presentation-template-actions">
              <Link className="button button-small" href={customDeckHref(template)}>
                {template.slug === "joint-business-plan" ? "Open builder" : "Build deck"}
              </Link>
              <a className="button button-secondary button-small" download href={`/templates/${template.pptx}`}>
                Download
              </a>
            </div>
          </article>
        ))}
      </div>
      {isPro ? null : (
        <article className="card pro-explainer-panel presentation-pro-panel">
          <div>
            <h3>Need generated decks?</h3>
            <p>
              Pro turns a brief, template and supporting files into a first-draft
              PowerPoint and keeps saved deck work in Workspace.
            </p>
          </div>
          <Link className="button" href="/pricing" onClick={() => trackUpgradeClicked("presentation_templates_prompt")}>
            Switch to Pro
          </Link>
        </article>
      )}
      <SavedDecksBottomPanel isPro={isPro} />
    </section>
  );
}

export function PresentationTemplatesProduct() {
  return (
    <>
      <PresentationTemplatesFree />
    </>
  );
}
