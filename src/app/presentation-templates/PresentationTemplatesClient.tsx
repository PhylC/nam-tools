"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ProductSectionTabs, useAptMode } from "../components/AptMode";

type DeckBrief = {
  id: string;
  name: string;
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
};

const freeTemplates = [
  {
    title: "Joint Business Plan Template",
    for: "Align annual customer objectives, growth pillars, investment and measures of success.",
    audience: "NAMs, KAMs, Sales Directors and customer-facing category teams",
    slides: "10-12 slides",
  },
  {
    title: "QBR / Quarterly Review Template",
    for: "Review performance, wins, misses, risks and next-quarter actions.",
    audience: "Customer teams, commercial leadership and buyer review meetings",
    slides: "8-10 slides",
  },
  {
    title: "Promotional Proposal Template",
    for: "Frame a promotion mechanic, support ask, retailer benefit and ROI logic.",
    audience: "Retail buyers, trade marketing and internal promo approval",
    slides: "7-9 slides",
  },
  {
    title: "Range Review Template",
    for: "Structure distribution, rate of sale, opportunity gaps and recommended range changes.",
    audience: "NAMs, category teams and range review stakeholders",
    slides: "9-11 slides",
  },
  {
    title: "New Product Launch Template",
    for: "Build the first launch sell-in story with customer fit, forecast, support and launch plan.",
    audience: "Buyers, commercial managers and innovation launch teams",
    slides: "8-10 slides",
  },
];

const chartOptions = ["Line chart", "Bar chart", "Waterfall chart", "Pie/donut chart", "Table", "Scorecard/KPI tiles"];

const agendaQuestionRules = [
  {
    match: "performance",
    questions: [
      "What period are we reviewing?",
      "What were the biggest wins?",
      "What underperformed?",
      "What should the buyer care about?",
    ],
  },
  {
    match: "promo",
    questions: [
      "What is the proposed mechanic?",
      "What support is being requested?",
      "What is the expected uplift?",
      "What is the retailer benefit?",
    ],
  },
  {
    match: "range",
    questions: [
      "Which SKUs deserve more space?",
      "Which range gaps are hurting the customer?",
      "What evidence supports the change?",
      "What is the risk if nothing changes?",
    ],
  },
];

const blankBrief = (): DeckBrief => ({
  id: crypto.randomUUID(),
  name: "Customer deck brief",
  templateName: "",
  dataName: "",
  deckType: "QBR / Customer Review",
  audience: "",
  customer: "",
  meetingDate: "",
  agenda: ["Performance Review", "Promo Proposal", "Next Steps"],
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
});

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

export function PresentationTemplatesFree() {
  return (
    <section className="shell section">
      <div className="section-header">
        <p className="eyebrow">Free editable templates</p>
        <h2>Free editable deck templates.</h2>
        <p className="section-lead">
          Download placeholders are prepared for editable PowerPoint files. The final static files will live in public downloads and use APT branding.
        </p>
      </div>
      <div className="card-grid">
        {freeTemplates.map((template) => (
          <article className="card template-card" key={template.title}>
            <span className="pill">Free</span>
            <div className="template-preview">
              <Image
                alt="APT Account Planning Tools logo"
                height={48}
                src="/images/branding/logo-full.png"
                width={118}
              />
              <strong>{template.title}</strong>
              <small>Editable deck placeholder</small>
            </div>
            <h3>{template.title}</h3>
            <p>{template.for}</p>
            <ul className="compact-list">
              <li>Suggested audience: {template.audience}</li>
              <li>Approx slide count: {template.slides}</li>
              <li>Includes editable text boxes, chart placeholders and summary tables.</li>
            </ul>
            <div className="cta-row">
              <button className="button button-secondary" type="button">Download placeholder</button>
              <button className="button button-secondary" type="button">Copy outline</button>
            </div>
          </article>
        ))}
      </div>
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

function FollowUpQuestionPanel({ brief }: { brief: DeckBrief }) {
  const questions = useMemo(() => {
    const agendaQuestions = brief.agenda.flatMap((item) => {
      const rule = agendaQuestionRules.find((entry) => item.toLowerCase().includes(entry.match));
      return rule?.questions ?? [];
    });
    return [
      "What is the one decision you need from this meeting?",
      "Which 3 numbers best prove the opportunity?",
      "What objection is the buyer most likely to raise?",
      "What is the fallback proposal?",
      ...agendaQuestions,
    ].slice(0, 10);
  }, [brief.agenda]);

  return (
    <aside className="card">
      <span className="pill pro-pill">Suggested follow-up questions</span>
      <ul className="compact-list">
        {questions.map((question) => <li key={question}>{question}</li>)}
      </ul>
    </aside>
  );
}

function draftSlides(brief: DeckBrief) {
  return [
    {
      title: "Executive summary",
      purpose: "Frame the meeting and the decision required.",
      narrative: brief.headlines || "Summarise the commercial story in three numbers.",
      chart: "Scorecard/KPI tiles",
      data: "Sales, margin, distribution and execution headlines.",
    },
    ...brief.agenda.map((item) => ({
      title: item,
      purpose: `Cover ${item.toLowerCase()} with a buyer-ready recommendation.`,
      narrative: brief.context || "Explain what changed, why it matters and what you recommend.",
      chart: brief.charts || "Table or bar chart",
      data: "Relevant sales, SKU, promotion or category data.",
    })),
    {
      title: "Commercial ask and next steps",
      purpose: "Make the decision and owner clear.",
      narrative: brief.ask || "State the ask, timing, conditions and fallback.",
      chart: "Action tracker",
      data: "Owners, dates, decision needed and dependencies.",
    },
  ];
}

export function ProDeckBuilderPreview() {
  const [brief, setBrief] = useState<DeckBrief>(blankBrief);
  const [savedBriefs, setSavedBriefs] = useState<DeckBrief[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = window.localStorage.getItem("apt-deck-briefs");
    if (!saved) return [];
    try {
      return JSON.parse(saved) as DeckBrief[];
    } catch {
      return [];
    }
  });
  const [showDraft, setShowDraft] = useState(false);

  function persist(nextBriefs: DeckBrief[]) {
    setSavedBriefs(nextBriefs);
    window.localStorage.setItem("apt-deck-briefs", JSON.stringify(nextBriefs));
  }

  function saveBrief() {
    const next = [...savedBriefs.filter((item) => item.id !== brief.id), brief];
    persist(next);
  }

  return (
    <section className="shell section">
      <div className="section-header">
        <p className="eyebrow">Pro Deck Builder Preview</p>
        <h2>Build a stronger first draft of your customer deck.</h2>
        <p className="section-lead">
          Build a stronger first draft of your customer deck using your agenda, data, previous meeting notes and commercial objective.
        </p>
      </div>
      <div className="grid-two">
        <article className="card">
          <span className="pill pro-pill">Template/design upload</span>
          <h3>Upload company deck/template</h3>
          <input type="file" />
          <Field label="Template name saved locally" placeholder="e.g. 2026 customer deck master" value={brief.templateName} onChange={(value) => setBrief({ ...brief, templateName: value })} />
          <p>Future version will use the uploaded file to match colours, fonts and style. For now, the template name can be saved locally.</p>
        </article>
        <article className="card">
          <span className="pill pro-pill">Data upload</span>
          <h3>Upload sales/performance data</h3>
          <input type="file" />
          <Field label="Data file name" placeholder="e.g. Retailer A Q4 performance" value={brief.dataName} onChange={(value) => setBrief({ ...brief, dataName: value })} />
          <label className="field">
            <span>Chart option</span>
            <select value={brief.charts} onChange={(event) => setBrief({ ...brief, charts: event.target.value })}>
              <option value="">Choose a chart type</option>
              {chartOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <p>Suggested data types: sales by period, sales by SKU, customer performance, promo performance, forecast and category data.</p>
        </article>
      </div>

      <article className="card tool-form">
        <span className="pill pro-pill">Deck brief inputs</span>
        <div className="form-grid">
          <Field label="Brief name" value={brief.name} onChange={(value) => setBrief({ ...brief, name: value })} />
          <Field label="Deck type" value={brief.deckType} onChange={(value) => setBrief({ ...brief, deckType: value })} />
          <Field label="Audience" placeholder="e.g. buyer and category manager" value={brief.audience} onChange={(value) => setBrief({ ...brief, audience: value })} />
          <Field label="Retailer/customer" placeholder="e.g. Retailer A" value={brief.customer} onChange={(value) => setBrief({ ...brief, customer: value })} />
          <Field label="Meeting date" placeholder="e.g. 2026-09-15" value={brief.meetingDate} onChange={(value) => setBrief({ ...brief, meetingDate: value })} />
          <Field label="Tone/style preference" value={brief.tone} onChange={(value) => setBrief({ ...brief, tone: value })} />
          <Field label="Business context" multiline value={brief.context} onChange={(value) => setBrief({ ...brief, context: value })} />
          <Field label="Key numbers / performance headlines" multiline value={brief.headlines} onChange={(value) => setBrief({ ...brief, headlines: value })} />
          <Field label="Key risks" multiline value={brief.risks} onChange={(value) => setBrief({ ...brief, risks: value })} />
          <Field label="Key opportunities" multiline value={brief.opportunities} onChange={(value) => setBrief({ ...brief, opportunities: value })} />
          <Field label="Notes from previous QBR/meeting" multiline value={brief.previousNotes} onChange={(value) => setBrief({ ...brief, previousNotes: value })} />
          <Field label="Planned outcome" multiline value={brief.outcome} onChange={(value) => setBrief({ ...brief, outcome: value })} />
          <Field label="Commercial ask" multiline value={brief.ask} onChange={(value) => setBrief({ ...brief, ask: value })} />
          <Field label="Must-include products/SKUs" multiline value={brief.products} onChange={(value) => setBrief({ ...brief, products: value })} />
          <Field label="Must-include charts" multiline value={brief.charts} onChange={(value) => setBrief({ ...brief, charts: value })} />
          <Field label="Extra notes" multiline value={brief.notes} onChange={(value) => setBrief({ ...brief, notes: value })} />
        </div>
        <AgendaBuilder agenda={brief.agenda} onChange={(agenda) => setBrief({ ...brief, agenda })} />
        <div className="cta-row">
          <button className="button" onClick={() => setShowDraft(true)} type="button">Generate draft deck</button>
          <button className="button button-secondary" onClick={saveBrief} type="button">Save deck brief locally</button>
          <button className="button button-secondary" onClick={() => setBrief({ ...brief, id: crypto.randomUUID(), name: `${brief.name} copy` })} type="button">Duplicate saved deck</button>
          <button className="button button-secondary" onClick={() => persist(savedBriefs.filter((item) => item.id !== brief.id))} type="button">Delete saved deck</button>
        </div>
        <p className="planning-disclaimer">Saved locally on this device for now. Account saving will be added with Pro login later.</p>
        {savedBriefs.length ? (
          <label className="field">
            <span>Edit saved deck</span>
            <select value={brief.id} onChange={(event) => {
              const selected = savedBriefs.find((item) => item.id === event.target.value);
              if (selected) setBrief(selected);
            }}>
              <option value="">Choose saved deck</option>
              {savedBriefs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        ) : null}
      </article>

      <FollowUpQuestionPanel brief={brief} />

      {showDraft ? (
        <section className="card">
          <span className="pill pro-pill">Draft deck output</span>
          <h2>Generated draft outline</h2>
          <div className="card-grid">
            {draftSlides(brief).map((slide, index) => (
              <article className="mini-card" key={`${slide.title}-${index}`}>
                <span className="pill">Slide {index + 1}</span>
                <h3>{slide.title}</h3>
                <p><strong>Purpose:</strong> {slide.purpose}</p>
                <p><strong>Narrative:</strong> {slide.narrative}</p>
                <p><strong>Chart/table:</strong> {slide.chart}</p>
                <p><strong>Data needed:</strong> {slide.data}</p>
                <p><strong>Speaker note prompt:</strong> What decision or action should this slide move forward?</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

export function PresentationTemplatesProduct() {
  const { aptMode } = useAptMode();

  return (
    <>
      <section className="shell section">
        <ProductSectionTabs />
      </section>
      <PresentationTemplatesFree />
      {aptMode === "pro" ? (
        <ProDeckBuilderPreview />
      ) : (
        <section className="shell section">
          <article className="card split-band">
            <div>
              <p className="eyebrow">Pro Preview</p>
              <h2>Pro will build the first draft for you.</h2>
              <p>
                Switch the header toggle to Pro Preview to try the deck brief
                workflow, agenda builder, follow-up prompts and local saving.
              </p>
            </div>
            <span className="pill pro-pill">Future account feature</span>
          </article>
        </section>
      )}
    </>
  );
}
