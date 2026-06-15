"use client";

import Link from "next/link";
import { useState } from "react";
import { useAptMode } from "../components/AptMode";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";
import { getUserPlan } from "../../lib/userPlan";

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
};

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

export function PresentationTemplatesFree() {
  const { aptMode } = useAptMode();
  const { isAuthenticated } = useSupabaseAuth();
  const isPro = getUserPlan(aptMode, null, isAuthenticated) === "pro";
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
      {isPro ? (
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
      <div className="card-grid presentation-template-grid" id="template-card-grid">
        {freeTemplates.map((template) => (
          <div className="template-card-wrap" id={`template-${template.slug}`} key={template.title}>
            <article className="template-card">
              <div className="template-card-content">
                {template.previewSrc ? (
                  <img
                    alt={template.previewAlt ?? `Preview of the APT ${template.title} PowerPoint template`}
                    className="template-card-image"
                    loading="lazy"
                    src={template.previewSrc}
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
          <Link className="button" href="/pricing">
            Switch to Pro
          </Link>
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
