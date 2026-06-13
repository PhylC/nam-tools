"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAptMode } from "../components/AptMode";

type FreeTemplate = {
  title: string;
  slug: string;
  pptx: string;
  deckType: string;
  previewAlt?: string;
  previewSrc?: string;
  for: string;
  audience: string;
  slides: string;
};

// Templates intentionally use editable example content so users can adapt them for real customer meetings.
const freeTemplates: FreeTemplate[] = [
  {
    title: "Joint Business Plan Template",
    slug: "joint-business-plan",
    pptx: "joint-business-plan-template.pptx",
    deckType: "Joint Business Plan",
    previewAlt: "Preview of the APT Joint Business Plan PowerPoint template",
    previewSrc: "/images/apt/apt-template-jbp-preview.webp",
    for: "Align annual customer objectives, growth pillars, investment and measures of success.",
    audience: "Account managers, KAMs, Sales Directors and customer-facing category teams",
    slides: "11 slides",
  },
  {
    title: "Quarterly Business Review Template",
    slug: "qbr-template",
    pptx: "quarterly-business-review-template.pptx",
    deckType: "Quarterly Business Review",
    previewAlt: "Preview of the APT Quarterly Business Review PowerPoint template",
    previewSrc: "/images/apt/apt-template-qbr-preview.webp",
    for: "Review performance, wins, misses, risks and next-quarter actions.",
    audience: "Customer teams, commercial leadership and buyer review meetings",
    slides: "10 slides",
  },
  {
    title: "Promotional Proposal Template",
    slug: "promo-proposal",
    pptx: "promotional-proposal-template.pptx",
    deckType: "Promotional Proposal",
    previewAlt: "Preview of the APT Promotional Proposal PowerPoint template",
    previewSrc: "/images/apt/apt-template-promo-proposal-preview.webp",
    for: "Frame a promotion mechanic, support ask, retailer benefit and ROI logic.",
    audience: "Retail buyers, trade marketing and internal promo approval",
    slides: "8 slides",
  },
  {
    title: "Range Review Template",
    slug: "range-review",
    pptx: "range-review-template.pptx",
    deckType: "Range Review",
    for: "Structure distribution, rate of sale, opportunity gaps and recommended range changes.",
    audience: "Account managers, category teams and range review stakeholders",
    slides: "9 slides",
  },
  {
    title: "New Product Launch Template",
    slug: "product-launch",
    pptx: "new-product-launch-template.pptx",
    deckType: "New Product Launch",
    for: "Build the first launch sell-in story with customer fit, forecast, support and launch plan.",
    audience: "Buyers, commercial managers and innovation launch teams",
    slides: "9 slides",
  },
  {
    title: "Annual Planning Template",
    slug: "annual-planning",
    pptx: "annual-planning-template.pptx",
    deckType: "Annual Planning",
    for: "Turn the full-year review, targets, investment priorities and quarterly roadmap into one planning deck.",
    audience: "Account managers, sales leads, commercial finance and customer leadership",
    slides: "7 slides",
  },
  {
    title: "Buyer Meeting Prep Template",
    slug: "buyer-meeting",
    pptx: "buyer-meeting-prep-template.pptx",
    deckType: "Buyer Meeting Prep",
    for: "Prepare the meeting objective, buyer priorities, talking points, objections and follow-up actions.",
    audience: "Account managers, KAMs and customer-facing commercial teams",
    slides: "8 slides",
  },
  {
    title: "Category Opportunity Deck",
    slug: "category-opportunity",
    pptx: "category-opportunity-deck-template.pptx",
    deckType: "Category Opportunity",
    for: "Size a category opportunity with shopper trends, competitor benchmarking and practical recommendations.",
    audience: "Account managers, category managers, buyers and commercial leaders",
    slides: "7 slides",
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

function TemplateThumbnail({ template }: { template: FreeTemplate }) {
  const [hasImageError, setHasImageError] = useState(false);
  const previewSrc = template.previewSrc ?? `/templates/${template.slug}/preview.svg`;

  return (
    <div className="template-preview">
      {hasImageError ? (
        <div className="template-preview-fallback" role="img" aria-label={`${template.title} thumbnail fallback`}>
          <span>APT</span>
          <strong>{template.title}</strong>
          <small>{template.deckType} · editable PowerPoint</small>
        </div>
      ) : (
        <Image
          alt={template.previewAlt ?? `${template.title} thumbnail`}
          height={270}
          onError={() => setHasImageError(true)}
          src={previewSrc}
          width={480}
        />
      )}
      <strong>{template.title}</strong>
      <small>Editable example deck included</small>
    </div>
  );
}

export function PresentationTemplatesFree() {
  const { aptMode, setAptMode } = useAptMode();
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

  function switchToPro() {
    setAptMode("pro");
    window.setTimeout(() => {
      document.getElementById("template-card-grid")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  return (
    <section className="shell section">
      <div className="section-header">
        <p className="eyebrow">Presentations</p>
        <h2>Choose the output you need.</h2>
        <p className="section-lead">
          Create buyer-ready and internal sign-off outputs from your planning work.
          Buyer meeting decks, account reviews, JBP plans, promo proposals and range
          reviews all live here.
        </p>
      </div>
      {aptMode === "pro" ? (
        <aside className="card saved-panel saved-panel-compact">
          <div>
            <h3>Saved custom decks</h3>
            <p>Find saved deck briefs and meeting-ready outputs in My workspace.</p>
          </div>
          <Link className="button button-secondary button-small" href="/workspace#decks">
            Open saved decks
          </Link>
        </aside>
      ) : null}
      <div className="card-grid" id="template-card-grid">
        {freeTemplates.map((template) => (
          <div className="template-card-wrap" id={`template-${template.slug}`} key={template.title}>
            <article className="card template-card">
              <TemplateThumbnail template={template} />
              <h3>{template.title}</h3>
              <p>{template.for}</p>
              <ul className="compact-list">
                <li>Suggested audience: {template.audience}</li>
                <li>Approx slide count: {template.slides}</li>
                <li>Includes editable text, charts, tables and commercial example data.</li>
              </ul>
              <div className="template-actions">
                <a className="button" download href={`/templates/${template.pptx}`}>
                  Download PowerPoint template
                </a>
                <Link className="button button-secondary" href={customDeckHref(template)}>
                  Build custom deck
                </Link>
              </div>
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
            </article>
          </div>
        ))}
      </div>
      {aptMode === "pro" ? null : (
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
          <button className="button" onClick={() => switchToPro()} type="button">
            Switch to Pro
          </button>
        </article>
      )}
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
