"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useAptMode } from "../components/AptMode";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";
import {
  deleteDeckBrief,
  duplicateDeckBrief,
  listDeckBriefs,
  saveDeckBrief,
} from "../../lib/saveStore";

type DeckBrief = {
  id: string;
  name: string;
  templateSlug: string;
  templateName: string;
  dataName: string;
  deckType: string;
  audience: string;
  customer: string;
  meetingDate: string;
  agenda: string[];
  context: string;
  headlines: string;
  risks: string;
  opportunities: string;
  previousNotes: string;
  outcome: string;
  ask: string;
  products: string;
  charts: string;
  tone: string;
  notes: string;
  generatedOutline: DraftSlide[];
  createdAt: string;
  updatedAt: string;
};

type DraftSlide = {
  title: string;
  purpose: string;
  narrative: string;
  chart: string;
  data: string;
  speakerNote: string;
};

// Templates intentionally use editable example content so users can adapt them for real customer meetings.
const freeTemplates = [
  {
    title: "Joint Business Plan Template",
    slug: "joint-business-plan",
    pptx: "joint-business-plan-template.pptx",
    deckType: "Joint Business Plan",
    for: "Align annual customer objectives, growth pillars, investment and measures of success.",
    audience: "Account managers, KAMs, Sales Directors and customer-facing category teams",
    slides: "11 slides",
  },
  {
    title: "Quarterly Business Review Template",
    slug: "qbr-template",
    pptx: "quarterly-business-review-template.pptx",
    deckType: "Quarterly Business Review",
    for: "Review performance, wins, misses, risks and next-quarter actions.",
    audience: "Customer teams, commercial leadership and buyer review meetings",
    slides: "10 slides",
  },
  {
    title: "Promotional Proposal Template",
    slug: "promo-proposal",
    pptx: "promotional-proposal-template.pptx",
    deckType: "Promotional Proposal",
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

const chartOptions = [
  "KPI scorecard",
  "Line chart",
  "Bar chart",
  "Waterfall chart",
  "Table",
  "Range/product matrix",
  "Promo ROI summary",
];

const blankBrief = (template = freeTemplates[1]): DeckBrief => {
  const now = new Date().toISOString();
  return {
  id: crypto.randomUUID(),
  name: `${template.deckType} brief`,
  templateSlug: template.slug,
  templateName: "",
  dataName: "",
  deckType: template.deckType,
  audience: "",
  customer: "",
  meetingDate: "",
  agenda: defaultAgendaForTemplate(template.deckType),
  context: "",
  headlines: "",
  risks: "",
  opportunities: "",
  previousNotes: "",
  outcome: "",
  ask: "",
  products: "",
  charts: "",
  tone: "Commercial, clear and buyer-friendly",
  notes: "",
  generatedOutline: [],
  createdAt: now,
  updatedAt: now,
  };
};

function defaultAgendaForTemplate(deckType: string) {
  const agendaByType: Record<string, string[]> = {
    "Joint Business Plan": ["Executive Summary", "Customer Objectives", "Growth Pillars", "Investment Plan", "Next Steps"],
    "Quarterly Business Review": ["Performance Review", "Promo Performance", "Range Updates", "Next Quarter Priorities"],
    "Promotional Proposal": ["Proposal Summary", "Commercial Rationale", "ROI Assumptions", "Recommendation"],
    "Range Review": ["Current Range", "SKU Productivity", "Distribution Gaps", "Recommended Actions"],
    "New Product Launch": ["Launch Overview", "Market Opportunity", "Forecast", "Commercial Ask"],
    "Annual Planning": ["FY Review", "Strategic Objectives", "Annual Targets", "Quarterly Roadmap"],
    "Buyer Meeting Prep": ["Meeting Objective", "Buyer Priorities", "Objection Handling", "Follow-up Actions"],
    "Category Opportunity": ["Category Performance", "Shopper Trends", "Opportunity Sizing", "Recommendations"],
  };
  return agendaByType[deckType] ?? ["Executive Summary", "Commercial Context", "Recommendation", "Next Steps"];
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function TemplateThumbnail({ template }: { template: (typeof freeTemplates)[number] }) {
  const [hasImageError, setHasImageError] = useState(false);

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
          alt={`${template.title} thumbnail`}
          height={270}
          onError={() => setHasImageError(true)}
          src={`/templates/${template.slug}/preview.svg`}
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
  const { isAuthenticated, isLoading } = useSupabaseAuth();
  const [activeTemplateSlug, setActiveTemplateSlug] = useState("");
  const [brief, setBrief] = useState<DeckBrief>(() => blankBrief(freeTemplates[0]));
  const [savedBriefs, setSavedBriefs] = useState<DeckBrief[]>([]);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    listDeckBriefs().then((result) => {
      setSavedBriefs(result.data as DeckBrief[]);
      setSaveMessage(result.message ?? "");
    });
  }, [isAuthenticated]);

  useEffect(() => {
    if (aptMode !== "pro" || !activeTemplateSlug) return;
    window.setTimeout(() => {
      document.getElementById(`template-${activeTemplateSlug}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, [activeTemplateSlug, aptMode]);

  async function copyOutline(slug: string) {
    const response = await fetch(`/templates/${slug}/outline.txt`);
    const outline = await response.text();
    await navigator.clipboard.writeText(outline);
  }

  async function refreshBriefs() {
    const result = await listDeckBriefs();
    setSavedBriefs(result.data as DeckBrief[]);
    setSaveMessage(result.message ?? "");
  }

  function openBuilder(template: (typeof freeTemplates)[number]) {
    setActiveTemplateSlug(template.slug);
    setBrief((current) =>
      current.templateSlug === template.slug
        ? current
        : { ...blankBrief(template), customer: current.customer, audience: current.audience },
    );
  }

  function switchToPro(templateSlug?: string) {
    setAptMode("pro");
    window.setTimeout(() => {
      document.getElementById(templateSlug ? `template-${templateSlug}` : "template-card-grid")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  async function saveBrief(nextBrief = brief) {
    const now = new Date().toISOString();
    const item = {
      ...nextBrief,
      updatedAt: now,
      createdAt: nextBrief.createdAt || now,
    };
    const result = await saveDeckBrief(item);
    setBrief(result.data as DeckBrief);
    setSaveMessage(result.message ?? "");
    await refreshBriefs();
  }

  function loadBrief(id: string) {
    const saved = savedBriefs.find((item) => item.id === id);
    if (!saved) return;
    setBrief(saved);
    setActiveTemplateSlug(saved.templateSlug);
  }

  async function duplicateBrief(id: string) {
    const result = await duplicateDeckBrief(id);
    setSaveMessage(result.message ?? "");
    if (result.data) {
      setBrief(result.data as DeckBrief);
      setActiveTemplateSlug((result.data as DeckBrief).templateSlug);
    }
    await refreshBriefs();
  }

  async function deleteBrief(id: string) {
    const result = await deleteDeckBrief(id);
    setSaveMessage(result.message ?? "");
    await refreshBriefs();
    if (brief.id === id) {
      const template = freeTemplates.find((item) => item.slug === activeTemplateSlug) ?? freeTemplates[0];
      setBrief(blankBrief(template));
    }
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
        <SavedDeckBriefsPanel
          briefs={savedBriefs}
          isLoading={isLoading}
          saveMessage={saveMessage}
          onDelete={deleteBrief}
          onDuplicate={duplicateBrief}
          onLoad={loadBrief}
        />
      ) : null}
      <div className="card-grid" id="template-card-grid">
        {freeTemplates.map((template) => (
          <div className="template-card-wrap" id={`template-${template.slug}`} key={template.title}>
            <article className="card template-card">
              <div className="badge-row">
                <span className="pill">Free</span>
                <span className="pill">Editable</span>
                <span className="pill">PowerPoint</span>
                <span className="pill">Example data included</span>
              </div>
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
                {aptMode === "pro" ? (
                  <button className="button button-secondary" onClick={() => openBuilder(template)} type="button">
                    Build custom deck
                  </button>
                ) : (
                  <button className="button button-secondary" onClick={() => switchToPro(template.slug)} type="button">
                    Switch to Pro
                  </button>
                )}
                <button className="button button-secondary" onClick={() => copyOutline(template.slug)} type="button">
                  Copy outline
                </button>
              </div>
              {aptMode === "pro" ? null : (
                <p className="template-pro-note">
                  Pro: build a custom version from your data and meeting brief.
                </p>
              )}
            </article>
            {aptMode === "pro" && activeTemplateSlug === template.slug ? (
              <CustomDeckBuilder
                brief={brief}
                onBriefChange={setBrief}
                onClose={() => setActiveTemplateSlug("")}
                onDelete={() => deleteBrief(brief.id)}
                onDuplicate={async () => {
                  const now = new Date().toISOString();
                  const copy = { ...brief, id: crypto.randomUUID(), name: `${brief.name} copy`, createdAt: now, updatedAt: now };
                  setBrief(copy);
                  await saveBrief(copy);
                }}
                onSave={saveBrief}
                template={template}
              />
            ) : null}
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

function SavedDeckBriefsPanel({
  briefs,
  isLoading,
  saveMessage,
  onDelete,
  onDuplicate,
  onLoad,
}: {
  briefs: DeckBrief[];
  isLoading: boolean;
  saveMessage: string;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onLoad: (id: string) => void;
}) {
  return (
    <aside className="card saved-panel">
      <div>
        <h3>Saved custom decks</h3>
        <p>Save your work and return to it later.</p>
        {isLoading ? <p className="empty-state">Checking account save status...</p> : null}
        {saveMessage ? <p className="empty-state">{saveMessage}</p> : null}
      </div>
      {briefs.length ? (
        <div className="saved-list">
          {briefs.map((brief) => (
            <div className="saved-row" key={brief.id}>
              <div>
                <strong>{brief.name}</strong>
                <span>{brief.deckType} · Last edited {new Date(brief.updatedAt).toLocaleDateString("en-GB")}</span>
              </div>
              <div className="summary-actions">
                <button className="button button-secondary button-small" onClick={() => onLoad(brief.id)} type="button">Load</button>
                <button className="button button-secondary button-small" onClick={() => onDuplicate(brief.id)} type="button">Duplicate</button>
                <button className="button button-secondary button-small" onClick={() => onDelete(brief.id)} type="button">Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-state">No saved custom deck briefs yet.</p>
      )}
    </aside>
  );
}

function CustomDeckBuilder({
  brief,
  onBriefChange,
  onClose,
  onDelete,
  onDuplicate,
  onSave,
  template,
}: {
  brief: DeckBrief;
  onBriefChange: (brief: DeckBrief) => void;
  onClose: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onSave: (brief?: DeckBrief) => void;
  template: (typeof freeTemplates)[number];
}) {
  function update(patch: Partial<DeckBrief>) {
    onBriefChange({ ...brief, ...patch, updatedAt: new Date().toISOString() });
  }

  function generateOutline() {
    const generatedOutline = draftSlides(brief);
    const next = { ...brief, generatedOutline, updatedAt: new Date().toISOString() };
    onBriefChange(next);
  }

  return (
    <section className="card custom-deck-builder">
      <div className="output-header">
        <div>
          <h2>Build custom {template.title}</h2>
          <p>Use your agenda, customer context and data to create a stronger first draft.</p>
        </div>
        <button className="button button-secondary button-small" onClick={onClose} type="button">Close</button>
      </div>

      <div className="grid-two">
        <article className="mini-card">
          <h3>Uploads</h3>
          <label className="field">
            <span>Upload company/template deck</span>
            <input type="file" />
          </label>
          <label className="field">
            <span>Upload supporting data</span>
            <input type="file" />
          </label>
          <p className="empty-state">Add your files to shape the deck brief, charts and style direction.</p>
        </article>
        <article className="mini-card">
          <h3>Chart options</h3>
          <label className="field">
            <span>Must-include charts</span>
            <select value={brief.charts} onChange={(event) => update({ charts: event.target.value })}>
              <option value="">Choose a chart/table type</option>
              {chartOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <Field label="Tone/style preference" value={brief.tone} onChange={(value) => update({ tone: value })} />
        </article>
      </div>

      <div className="form-grid">
        <Field label="Deck name" value={brief.name} onChange={(value) => update({ name: value })} />
        <Field label="Customer / retailer" value={brief.customer} onChange={(value) => update({ customer: value })} />
        <Field label="Audience" value={brief.audience} onChange={(value) => update({ audience: value })} />
        <Field label="Meeting date" value={brief.meetingDate} onChange={(value) => update({ meetingDate: value })} />
        <Field label="Business context" multiline value={brief.context} onChange={(value) => update({ context: value })} />
        <Field label="Key numbers / performance headlines" multiline value={brief.headlines} onChange={(value) => update({ headlines: value })} />
        <Field label="Key risks" multiline value={brief.risks} onChange={(value) => update({ risks: value })} />
        <Field label="Key opportunities" multiline value={brief.opportunities} onChange={(value) => update({ opportunities: value })} />
        <Field label="Previous meeting / QBR notes" multiline value={brief.previousNotes} onChange={(value) => update({ previousNotes: value })} />
        <Field label="Planned outcome" multiline value={brief.outcome} onChange={(value) => update({ outcome: value })} />
        <Field label="Commercial ask" multiline value={brief.ask} onChange={(value) => update({ ask: value })} />
        <Field label="Must-include products/SKUs" multiline value={brief.products} onChange={(value) => update({ products: value })} />
        <Field label="Extra notes" multiline value={brief.notes} onChange={(value) => update({ notes: value })} />
      </div>

      <AgendaBuilder agenda={brief.agenda} onChange={(agenda) => update({ agenda })} />

      <div className="cta-row">
        <button className="button" onClick={generateOutline} type="button">Generate draft outline</button>
        <button className="button button-secondary" onClick={() => onSave()} type="button">Save deck brief</button>
        <button className="button button-secondary" onClick={onDuplicate} type="button">Duplicate deck brief</button>
        <button className="button button-secondary" onClick={onDelete} type="button">Delete saved brief</button>
      </div>

      {brief.generatedOutline.length ? (
        <section className="draft-outline">
          <div className="output-header">
            <div>
              <span className="pill">Generated draft outline</span>
              <h3>{brief.deckType} outline</h3>
            </div>
          </div>
          <div className="card-grid">
            {brief.generatedOutline.map((slide, index) => (
              <article className="mini-card" key={`${slide.title}-${index}`}>
                <span className="pill">Slide {index + 1}</span>
                <h3>{slide.title}</h3>
                <p><strong>Purpose:</strong> {slide.purpose}</p>
                <p><strong>Narrative:</strong> {slide.narrative}</p>
                <p><strong>Chart/table:</strong> {slide.chart}</p>
                <p><strong>Inputs/data needed:</strong> {slide.data}</p>
                <p><strong>Speaker note prompt:</strong> {slide.speakerNote}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

function AgendaBuilder({
  agenda,
  onChange,
}: {
  agenda: string[];
  onChange: (agenda: string[]) => void;
}) {
  const [nextItem, setNextItem] = useState("");

  return (
    <div className="mini-card">
      <div className="output-header">
        <h3>Flexible agenda builder</h3>
      </div>
      <div className="agenda-list">
        {agenda.map((item, index) => (
          <div className="agenda-row" key={`${item}-${index}`}>
            <input value={item} onChange={(event) => onChange(agenda.map((agendaItem, agendaIndex) => agendaIndex === index ? event.target.value : agendaItem))} />
            <button className="button button-secondary button-small" onClick={() => index > 0 && onChange(agenda.map((agendaItem, agendaIndex) => agendaIndex === index ? agenda[index - 1] : agendaIndex === index - 1 ? item : agendaItem))} type="button">Up</button>
            <button className="button button-secondary button-small" onClick={() => index < agenda.length - 1 && onChange(agenda.map((agendaItem, agendaIndex) => agendaIndex === index ? agenda[index + 1] : agendaIndex === index + 1 ? item : agendaItem))} type="button">Down</button>
            <button className="button button-secondary button-small" onClick={() => onChange(agenda.filter((_, agendaIndex) => agendaIndex !== index))} type="button">Remove</button>
          </div>
        ))}
      </div>
      <div className="cta-row">
        <input placeholder="Add agenda item" value={nextItem} onChange={(event) => setNextItem(event.target.value)} />
        <button className="button" onClick={() => {
          if (!nextItem.trim()) return;
          onChange([...agenda, nextItem]);
          setNextItem("");
        }} type="button">Add item</button>
      </div>
    </div>
  );
}

function draftSlides(brief: DeckBrief): DraftSlide[] {
  // Future Pro version can replace this rule-based outline with AI-assisted deck generation.
  const chart = brief.charts || "KPI scorecard";
  const context = brief.context || "Explain the customer context, what has changed and why it matters now.";
  const headline = brief.headlines || "Use the strongest three numbers to prove the commercial story.";
  const ask = brief.ask || "State the decision needed, commercial ask, timing and fallback position.";
  const rules: Record<string, string[]> = {
    "Joint Business Plan": ["Executive summary", "Customer objectives", "Business performance overview", "Category trends", "Growth pillars", "Innovation pipeline", "Promotional strategy", "Financial targets", "Risks and opportunities", "Next steps"],
    "Quarterly Business Review": ["Quarter summary", "KPI scorecard", "Sales performance", "Promo performance", "Distribution and range updates", "Wins and challenges", "Competitor activity", "Next quarter priorities", "Commercial asks"],
    "Promotional Proposal": ["Proposal summary", "Promotional mechanic", "Commercial rationale", "Forecast uplift", "ROI assumptions", "Retailer benefit", "Support requested", "Recommendation"],
    "Range Review": ["Current range overview", "SKU productivity", "Distribution gaps", "ROS analysis", "Category trends", "Rationalisation opportunities", "Innovation recommendations", "Recommended actions"],
    "New Product Launch": ["Launch overview", "Consumer insight", "Market opportunity", "Product proposition", "Forecast", "Activation plan", "Launch timeline", "Commercial ask"],
    "Annual Planning": ["FY review", "Strategic objectives", "Annual targets", "Investment priorities", "Quarterly roadmap", "Risk areas"],
    "Buyer Meeting Prep": ["Meeting objective", "Buyer priorities", "Key talking points", "Objection handling", "Supporting data", "Desired outcome", "Follow-up actions"],
    "Category Opportunity": ["Category performance", "Shopper trends", "White space opportunities", "Competitor benchmarking", "Opportunity sizing", "Recommendations"],
  };
  const slideTitles = rules[brief.deckType] ?? ["Executive summary", ...brief.agenda, "Commercial ask and next steps"];

  return slideTitles.map((title, index) => ({
    title,
    purpose: index === 0 ? "Frame the meeting and the decision required." : `Make ${title.toLowerCase()} clear, commercial and buyer-ready.`,
    narrative: title.toLowerCase().includes("ask") || title.toLowerCase().includes("recommendation") ? ask : title.toLowerCase().includes("performance") || title.toLowerCase().includes("summary") ? headline : context,
    chart: title.toLowerCase().includes("roi") ? "Promo ROI summary" : title.toLowerCase().includes("range") || title.toLowerCase().includes("sku") ? "Range/product matrix" : chart,
    data: brief.products || "Sales, units, margin, distribution, promo performance and customer-specific context.",
    speakerNote: "What decision, objection or next action should this slide move forward?",
  }));
}

export function PresentationTemplatesProduct() {
  return (
    <>
      <PresentationTemplatesFree />
    </>
  );
}
