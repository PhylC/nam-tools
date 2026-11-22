"use client";

import Link from "next/link";
import { freeTemplates, featuredTemplates } from "../data/presentationTemplates";
import { useEffect, useMemo, useState } from "react";
import { trackUpgradeClicked } from "../../lib/analytics";
import { deleteDeckBrief, listDeckBriefs, saveDeckBrief } from "../../lib/saveStore";
import { downloadGeneratedDeck } from "../../lib/storageUploads";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";

type SavedRecord = Record<string, unknown>;
type SavedDeckSort = "updated-desc" | "updated-asc" | "name-asc" | "name-desc";

function customDeckHref(slug: string) {
  if (slug === "joint-business-plan") return "/tools/joint-business-plan-builder";
  return `/custom-deck?template=${slug === "qbr-template" ? "qbr" : slug}`;
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
      <Link className="workspace-menu-action" href={`/custom-deck?deck=${encodeURIComponent(id)}`}>
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
  const href = `/custom-deck?deck=${encodeURIComponent(id)}`;
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
      <div className="section-header presentation-list-header" id="free-templates">
        <h2>All nine PowerPoint templates</h2>
        <p className="section-lead">Choose an editable starter for your planning or customer meeting.</p>
      </div>
      <div className="presentation-template-list" id="template-card-grid">
        <div className="presentation-template-list-head" aria-hidden="true">
          <span>Deck type</span>
          <span>Use for</span>
          <span>Slides</span>
          <span>Actions</span>
        </div>
        {freeTemplates.map((template) => {
          const guide = featuredTemplates.find((item) => item.templateSlug === template.slug);
          return (
            <article className="presentation-template-row" id={`template-${template.slug}`} key={template.title}>
              <div className="presentation-template-primary">
                <h3>{template.title}</h3>
                {guide ? (
                  <Link className="template-guide-link" href={`/presentation-templates/${guide.slug}`}>
                    Preview and worked example
                  </Link>
                ) : null}
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
                <a aria-label={`Download ${template.title} PowerPoint`} className="button button-small" download href={`/templates/${template.pptx}`}>
                  Download .pptx
                </a>
                <Link className="button button-secondary button-small" href={customDeckHref(template.slug)}>
                  {template.slug === "joint-business-plan" ? "Open JBP builder" : "Build with Pro"}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      <p className="helper-note">Free for your own internal planning and customer presentations. <Link href="/terms">Template usage terms</Link></p>
      <article className="card pro-explainer-panel presentation-pro-panel">
        <div>
          <h2>Build a custom deck with Pro</h2>
          <p>Turn your brief into an editable PowerPoint draft and save it to Workspace.</p>
        </div>
        {isPro ? (
          <Link className="button button-secondary" href="/custom-deck">Create custom deck</Link>
        ) : (
          <Link className="button button-secondary" href="/pricing" onClick={() => trackUpgradeClicked("presentation_templates_prompt")}>
            See APT Pro
          </Link>
        )}
      </article>
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
