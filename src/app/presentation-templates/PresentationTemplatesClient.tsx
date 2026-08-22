"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { trackUpgradeClicked } from "../../lib/analytics";
import { listDeckBriefs } from "../../lib/saveStore";
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
  const queryBySlug: Record<string, string> = {
    "joint-business-plan": "jbp",
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
          <div className="saved-bottom-table-scroll">
            <div className="saved-bottom-table-head" aria-hidden="true">
              <span>Saved deck</span>
              <span>Last updated</span>
              <span>Actions</span>
            </div>
            <div className="saved-bottom-grouped-list">
              {visibleDecks.length ? (
                visibleDecks.map((deck) => {
                  const id = String(deck.id ?? "");
                  const name = getDeckTitle(deck);
                  return (
                    <article className="saved-bottom-group" key={id}>
                      <div className="saved-bottom-group-row">
                        <div>
                          <strong>{name}</strong>
                          <span>{getDeckDescription(deck)}</span>
                        </div>
                        <small>{getUpdatedDate(deck)}</small>
                        <div className="saved-bottom-actions">
                          <Link className="button button-secondary button-small" href={`/custom-deck?deck=${id}`}>
                            Create new from this
                          </Link>
                          <Link className="workspace-icon-button" href="/workspace#decks" aria-label={`View details for ${name}`} title="Details">
                            <span aria-hidden="true">i</span>
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })
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
  const [outlineStatus, setOutlineStatus] = useState<{ slug: string; message: string } | null>(null);
  const [manualOutline, setManualOutline] = useState<{ slug: string; text: string } | null>(null);

  async function copySlideOutline(template: FreeTemplate) {
    const response = await fetch(`/templates/${template.slug}/outline.txt`);
    const outline = await response.text();
    setManualOutline(null);

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(outline);
      setOutlineStatus({ slug: template.slug, message: "Slide outline copied." });
      window.setTimeout(() => setOutlineStatus(null), 1800);
    } catch {
      setManualOutline({ slug: template.slug, text: outline });
      setOutlineStatus({ slug: template.slug, message: "Copy this outline manually." });
    }
  }

  return (
    <section className="shell section">
      <div className="section-header">
        <h2>Choose the output you need.</h2>
        <p className="section-lead">
          Create buyer-ready and internal sign-off outputs from your planning work.
          Buyer meeting decks, account reviews, JBP plans, promo proposals and range
          reviews all live here.
        </p>
      </div>
      <div className="card-grid presentation-template-grid" id="template-card-grid">
        {freeTemplates.map((template) => (
          <div className="template-card-wrap" id={`template-${template.slug}`} key={template.title}>
            <article className="template-card">
              <div className="template-card-content">
                {template.previewSrc ? (
                  <Image
                    alt={template.previewAlt ?? `Preview of the APT ${template.title} PowerPoint template`}
                    className="template-card-image"
                    height={template.previewHeight ?? 287}
                    loading="lazy"
                    src={template.previewSrc}
                    width={template.previewWidth ?? 466}
                  />
                ) : null}
                <h2>{template.title}</h2>
                <p className="template-support">Editable PowerPoint template</p>
                <p className="template-description">{template.description}</p>
                <dl className="template-details">
                  <div>
                    <dt>Best for</dt>
                    <dd>{template.bestFor}</dd>
                  </div>
                  <div>
                    <dt>Slides</dt>
                    <dd>{template.slides}</dd>
                  </div>
                  <div>
                    <dt>Includes</dt>
                    <dd>{template.includes}</dd>
                  </div>
                </dl>
              </div>
              <div className="template-card-actions">
                <a className="button" download href={`/templates/${template.pptx}`}>
                  Download PowerPoint template
                </a>
                <Link className="button button-secondary" href={customDeckHref(template)}>
                  Build custom deck
                </Link>
                <div className="template-outline-utility">
                  <span>Need the structure only?</span>
                  <button
                    aria-label={`Copy the slide outline for ${template.title}`}
                    className="template-outline-link"
                    onClick={() => copySlideOutline(template)}
                    title="Copy the slide outline for this template"
                    type="button"
                  >
                    Copy slide outline
                  </button>
                </div>
                {outlineStatus?.slug === template.slug ? (
                  <p className="template-outline-status">{outlineStatus.message}</p>
                ) : null}
                {manualOutline?.slug === template.slug ? (
                  <label className="template-outline-manual">
                    <span>Copy this outline manually.</span>
                    <textarea readOnly value={manualOutline.text} onFocus={(event) => event.currentTarget.select()} />
                  </label>
                ) : null}
                <p className="template-pro-note">
                  APT Pro can use your data and brief to build a custom version.
                </p>
              </div>
            </article>
          </div>
        ))}
      </div>
      {isPro ? null : (
        <article className="card pro-explainer-panel">
          <div>
            <h3>Build custom decks with Pro</h3>
            <p>
              Start from any PowerPoint template, then tailor it with your customer,
              agenda, data, risks, opportunities and commercial ask.
            </p>
            <ul className="compact-list">
              <li>Build a custom deck from any template</li>
              <li>Upload customer or sales data</li>
              <li>Add meeting notes, agenda and commercial context</li>
              <li>Generate a first-draft slide outline</li>
              <li>Save deck briefs and return to them later</li>
            </ul>
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
