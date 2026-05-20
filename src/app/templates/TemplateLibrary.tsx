"use client";

import { useState } from "react";

const powerpointTemplates = [
  {
    name: "Joint Business Plan PowerPoint Template",
    file: "joint-business-plan-template.pptx",
    useCase: "Structure a customer JBP conversation without starting from a blank deck.",
    includes: ["Executive summary", "Category context", "Shared objectives", "Growth pillars", "Activation plan", "Investment ask", "Success measures", "Next steps"],
    outline: `Joint Business Plan PowerPoint Outline

Slide 1: Executive summary
- Customer:
- Period:
- Headline opportunity:
- Recommended plan:

Slide 2: Category context
- Category trend:
- Shopper/customer insight:
- Customer opportunity:

Slide 3: Shared objectives
- Supplier objective:
- Customer objective:
- Joint success measure:

Slide 4: Growth pillars
- Pillar 1:
- Pillar 2:
- Pillar 3:

Slide 5: Activation plan
- Initiative:
- Timing:
- Support required:
- Owner:

Slide 6: Investment ask
- Investment required:
- Expected return:
- Conditions:

Slide 7: Risks and dependencies
- Risks:
- Dependencies:
- Mitigation:

Slide 8: Next steps
- Decision needed:
- Owner:
- Date:`,
  },
  {
    name: "Account Plan PowerPoint Template",
    file: "annual-planning-template.pptx",
    useCase: "Turn account performance, risks and priorities into a simple internal plan deck.",
    includes: ["Account overview", "Current performance", "Growth opportunity", "Risks", "Customer priorities", "Commercial strategy", "30/60/90 plan"],
    outline: `Account Plan PowerPoint Outline

Slide 1: Account overview
- Account:
- Period:
- Owner:
- Customer role:

Slide 2: Current performance
- Sales:
- Margin:
- Distribution:
- Service/execution:

Slide 3: Biggest opportunity
- Opportunity:
- Size:
- Why now:

Slide 4: Biggest risk
- Risk:
- Impact:
- Mitigation:

Slide 5: Customer priorities
- Priority 1:
- Priority 2:
- Priority 3:

Slide 6: Commercial strategy
- Grow:
- Protect:
- Reduce/stop:

Slide 7: 30/60/90 plan
- 30 days:
- 60 days:
- 90 days:

Slide 8: Internal asks
- Finance:
- Category:
- Supply chain:
- Marketing:`,
  },
  {
    name: "Buyer Meeting Prep PowerPoint Template",
    file: "buyer-meeting-prep-template.pptx",
    useCase: "Prepare a buyer conversation with a sharper ask, story and objection plan.",
    includes: ["Meeting objective", "Opening", "Commercial story", "Evidence", "Objections", "Questions", "Closing ask", "Follow-up"],
    outline: `Buyer Meeting Prep PowerPoint Outline

Slide 1: Meeting objective
- Customer:
- Buyer:
- Decision needed:

Slide 2: Five-minute opening
- Current context:
- Why this matters:
- Recommended way forward:

Slide 3: Commercial story
- Issue/opportunity:
- Proposed ask:
- Customer benefit:

Slide 4: Evidence
- Sales data:
- Margin/ROI:
- Shopper/category proof:

Slide 5: Likely objections
- Objection 1:
- Objection 2:
- Objection 3:

Slide 6: Suggested responses
- Response:
- Evidence:
- Trade-off:

Slide 7: Questions to ask
- Question 1:
- Question 2:
- Question 3:

Slide 8: Closing ask and follow-up
- Specific ask:
- Next step:
- Follow-up note:`,
  },
  {
    name: "QBR / Customer Review PowerPoint Template",
    file: "quarterly-business-review-template.pptx",
    useCase: "Create a customer review narrative covering performance, wins, misses and actions.",
    includes: ["Executive summary", "Performance overview", "Wins", "Misses", "Recommendations", "Next priorities", "Proposed asks", "Actions"],
    outline: `QBR / Customer Review PowerPoint Outline

Slide 1: Executive summary
- Customer:
- Review period:
- Main message:

Slide 2: Performance overview
- Sales:
- Margin/profit:
- Range/distribution:
- Service/execution:

Slide 3: What worked
- Win 1:
- Win 2:
- Win 3:

Slide 4: What missed
- Miss 1:
- Miss 2:
- Miss 3:

Slide 5: Recommendations
- Recommendation:
- Customer benefit:
- Evidence:

Slide 6: Next-quarter priorities
- Priority 1:
- Priority 2:
- Priority 3:

Slide 7: Proposed asks
- Ask 1:
- Ask 2:
- Ask 3:

Slide 8: Follow-up actions
- Action:
- Owner:
- Due date:`,
  },
  {
    name: "Promo Review PowerPoint Template",
    file: "promotional-proposal-template.pptx",
    useCase: "Review a promotion with baseline, investment, return and next recommendation.",
    includes: ["Promo objective", "Baseline", "Performance", "Investment", "ROI", "Retailer view", "Learnings", "Recommendation"],
    outline: `Promo Review PowerPoint Outline

Slide 1: Promo objective
- Customer:
- Event:
- Objective:

Slide 2: Baseline assumptions
- Baseline units:
- Baseline sales:
- Baseline gross profit:

Slide 3: Promo performance
- Promo units:
- Incremental units:
- Availability/execution:

Slide 4: Investment
- Supplier support per unit:
- Fixed support:
- Total support:

Slide 5: ROI and payback
- Incremental gross profit:
- Net profit impact:
- ROI:
- Break-even units:

Slide 6: Retailer/customer view
- Gross sales:
- Supplier support:
- Indicative margin/profit:

Slide 7: Learnings
- What worked:
- What missed:
- What to change:

Slide 8: Recommendation
- Repeat / reshape / stop:
- Conditions for next event:`,
  },
  {
    name: "Investment Ask PowerPoint Template",
    file: "promotional-proposal-template.pptx",
    useCase: "Frame a customer investment ask for internal approval or negotiation.",
    includes: ["Ask summary", "Commercial rationale", "Expected uplift", "Payback", "Conditions", "Risks", "Counter-offer", "Decision"],
    outline: `Investment Ask PowerPoint Outline

Slide 1: Ask summary
- Customer:
- Ask:
- Value:
- Timing:

Slide 2: Commercial rationale
- Customer objective:
- Supplier objective:
- Why now:

Slide 3: Expected uplift
- Revenue uplift:
- Gross profit:
- Probability:

Slide 4: Payback view
- Investment value:
- Net impact:
- Payback period:

Slide 5: Conditions
- Volume commitment:
- Distribution commitment:
- Visibility/execution:

Slide 6: Risks and dependencies
- Risks:
- Dependencies:
- Mitigation:

Slide 7: Counter-offer
- Alternative support:
- Alternative mechanic:
- Required commitment:

Slide 8: Decision
- Support / negotiate / reject:
- Rationale:
- Next step:`,
  },
];

const sheetsTemplates = [
  {
    name: "Promo ROI Google Sheets Template",
    useCase: "Set up a simple promo ROI model with baseline, support and payback fields.",
    includes: ["Inputs tab", "Promo result tab", "Retailer view tab", "Assumptions notes"],
    structure: `Promo ROI Google Sheets Structure

Tab: Inputs
Columns: Customer | Event | Baseline units | Promo units | Normal price | Promo price | Cost price | Supplier support/unit | Fixed support

Tab: Promo result
Columns: Incremental units | Net incremental units | Gross profit before support | Total support | Net profit impact | ROI | Break-even units

Tab: Retailer view
Columns: Retailer buy price | Retailer sell-out price | Retailer gross sales | Supplier support received | Indicative margin after support

Tab: Assumptions notes
Columns: Assumption | Source | Owner | Confidence | Notes`,
  },
  {
    name: "Gross Margin Google Sheets Template",
    useCase: "Compare base margin, promo margin and supplier support across products.",
    includes: ["SKU input tab", "Margin bridge tab", "Retailer support tab", "Notes tab"],
    structure: `Gross Margin Google Sheets Structure

Tab: SKU inputs
Columns: SKU | Normal selling price | Promo selling price | Cost price | Units | Supplier support/unit | Fixed support

Tab: Margin bridge
Columns: Base GP/unit | Base GM % | Promo GP before support | Promo GP after support | Total GP change

Tab: Retailer support
Columns: Retailer buy price | Retailer sell-out price | Support received | Indicative margin | Margin gap

Tab: Notes
Columns: Risk | Dependency | Owner | Action`,
  },
  {
    name: "Trade Spend Google Sheets Template",
    useCase: "Map discounts, rebates, fixed funding and marketing support in one view.",
    includes: ["Spend input tab", "Spend bridge tab", "Customer summary tab", "Terms notes"],
    structure: `Trade Spend Google Sheets Structure

Tab: Spend inputs
Columns: Customer | Gross sales | Average discount % | Rebate % | Fixed funding | Marketing contribution | Other deductions %

Tab: Spend bridge
Columns: Variable discount | Rebate value | Fixed support | Marketing support | Total trade spend | Net sales

Tab: Customer summary
Columns: Customer | Spend % gross sales | Spend % invoice sales | Warning | Decision

Tab: Terms notes
Columns: Term | Mechanic | Timing | Accounting note | Owner`,
  },
  {
    name: "Investment Ask Google Sheets Template",
    useCase: "Sense-check investment asks against uplift, probability and payback.",
    includes: ["Ask input tab", "Payback tab", "Scenario tab", "Decision notes"],
    structure: `Investment Ask Google Sheets Structure

Tab: Ask inputs
Columns: Customer | Annual/deal value | Requested investment % | Expected uplift % | Gross margin % | Probability % | Contract months

Tab: Payback
Columns: Investment value | Expected uplift value | Expected gross profit | Probability-adjusted net impact | Monthly payback | Recommendation

Tab: Scenarios
Columns: Scenario | Investment % | Uplift % | Probability % | Net impact | Recommendation

Tab: Decision notes
Columns: Challenge | Customer commitment | Owner | Decision | Date`,
  },
  {
    name: "Account Plan Tracker Google Sheets Template",
    useCase: "Track account priorities, risks, opportunities and actions through the year.",
    includes: ["Account summary tab", "Opportunity tracker", "Risk tracker", "Action tracker"],
    structure: `Account Plan Tracker Google Sheets Structure

Tab: Account summary
Columns: Account | Owner | Period | Current performance | Priority | Review date

Tab: Opportunity tracker
Columns: Opportunity | Value | Confidence | Customer priority | Internal owner | Next step

Tab: Risk tracker
Columns: Risk | Impact | Likelihood | Mitigation | Owner | Status

Tab: Action tracker
Columns: Action | Owner | Due date | Status | Dependency | Notes`,
  },
  {
    name: "QBR Action Tracker Google Sheets Template",
    useCase: "Turn a customer review into clear next actions, owners and follow-up dates.",
    includes: ["Review summary tab", "Actions tab", "Customer asks tab", "Follow-up tracker"],
    structure: `QBR Action Tracker Google Sheets Structure

Tab: Review summary
Columns: Customer | Review period | Main win | Main miss | Priority | Decision needed

Tab: Actions
Columns: Action | Owner | Customer owner | Due date | Status | Notes

Tab: Customer asks
Columns: Ask | Commercial benefit | Evidence | Approval needed | Decision

Tab: Follow-up tracker
Columns: Follow-up item | Owner | Date | Outcome | Next step`,
  },
];

const proBuilders = [
  {
    name: "Guided JBP Deck Builder",
    text: "Asks about the customer opportunity, joint objectives and investment plan, then drafts a JBP deck with linked spreadsheet assumptions.",
  },
  {
    name: "Guided Account Plan Deck Builder",
    text: "Turns account performance, risks and priorities into a first-draft plan deck with reusable customer assumptions.",
  },
  {
    name: "Guided Buyer Meeting Deck Builder",
    text: "Builds a meeting pack from your objective, commercial ask, evidence and likely buyer objections.",
  },
  {
    name: "Guided QBR Deck Builder",
    text: "Creates a first-draft customer review deck with performance story, actions and linked tracker support.",
  },
  {
    name: "Guided Promo Review Deck Builder",
    text: "Generates a promo review deck structure with ROI, retailer view and spreadsheet-backed assumptions.",
  },
  {
    name: "Guided Investment Ask Deck Builder",
    text: "Creates an investment rationale deck with payback, scenario assumptions and negotiation conditions.",
  },
];

function CopyTemplateButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button className="button button-secondary button-small" onClick={copy} type="button">
      {copied ? "Copied" : label}
    </button>
  );
}

function DisabledDownloadButton({ children }: { children: React.ReactNode }) {
  return (
    <button aria-disabled="true" className="button button-secondary button-small disabled-button" disabled type="button">
      {children}
    </button>
  );
}

export function TemplateLibrary() {
  return (
    <>
      <section className="shell section">
        <div className="grid grid-two">
          <article className="card judgement-card">
            <span className="pill">Free</span>
            <h2>PowerPoint and spreadsheet templates</h2>
            <p>
              Free templates give you practical PowerPoint decks and sheet
              structures you can adapt for customer meetings and internal plans.
            </p>
          </article>
          <article className="card judgement-card">
            <span className="pill pro-pill">Pro</span>
            <h2>Guided deck builders</h2>
            <p>
              Pro will ask smart commercial questions, generate the first-draft
              deck structure and create linked Google Sheets/Excel-style
              calculation support.
            </p>
          </article>
        </div>
      </section>

      <section className="shell section">
        <div className="section-header">
          <p className="eyebrow">Free PowerPoint templates</p>
          <h2>Blank deck structures for common commercial moments.</h2>
          <div className="section-lead">
            <p>
              These are editable PowerPoint files with APT branding and fictional
              example data you can adapt for customer meetings.
            </p>
          </div>
        </div>
        <div className="grid">
          {powerpointTemplates.map((template) => (
            <article className="card template-card" key={template.name}>
              <span className="pill">Free</span>
              <h3>{template.name}</h3>
              <p>{template.useCase}</p>
              <div>
                <strong>Slides included</strong>
                <ul className="compact-list">
                  {template.includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <details className="advanced-box template-reveal">
                <summary>Preview outline</summary>
                <pre>{template.outline}</pre>
              </details>
              <div className="template-actions">
                <a className="button button-secondary" download href={`/templates/${template.file}`}>
                  Download PowerPoint template
                </a>
                <CopyTemplateButton label="Copy outline" text={template.outline} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="shell section">
        <div className="section-header">
          <p className="eyebrow">Free Google Sheets templates</p>
          <h2>Blank spreadsheet structures for planning and review.</h2>
          <div className="section-lead">
            <p>
              These are Google Sheets/Excel-style structures you can copy into
              your own planning file.
            </p>
          </div>
        </div>
        <div className="grid">
          {sheetsTemplates.map((template) => (
            <article className="card template-card" key={template.name}>
              <span className="pill">Free</span>
              <h3>{template.name}</h3>
              <p>{template.useCase}</p>
              <div>
                <strong>Tabs / columns included</strong>
                <ul className="compact-list">
                  {template.includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <details className="advanced-box template-reveal">
                <summary>Preview sheet structure</summary>
                <pre>{template.structure}</pre>
              </details>
              <div className="template-actions">
                <DisabledDownloadButton>Copy sheet structure</DisabledDownloadButton>
                <CopyTemplateButton label="Copy sheet structure" text={template.structure} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="shell section">
        <article className="card split-band">
          <div>
            <p className="eyebrow">Pro guided builders</p>
            <h2>Pro creates the first draft and linked calculation support.</h2>
          </div>
          <div className="copy-stack">
            <p>
              Instead of starting from a blank deck or sheet, Pro asks the
              right commercial questions and generate a first-draft PowerPoint
              deck structure with linked Google Sheets/Excel-style assumptions.
            </p>
            <p>
              PowerPoint, Google Slides, Excel and Google Sheets export options
              sit alongside PDF exports, saved drafts and saved scenarios.
            </p>
          </div>
        </article>
      </section>

      <section className="shell section">
        <div className="section-header">
          <p className="eyebrow">Pro</p>
          <h2>Guided deck builders.</h2>
        </div>
        <div className="grid">
          {proBuilders.map((builder) => (
            <article className="card template-card" key={builder.name}>
              <span className="pill pro-pill">Pro</span>
              <h3>{builder.name}</h3>
              <p>{builder.text}</p>
              <button aria-disabled="true" className="button button-secondary button-small disabled-button" disabled type="button">
                Open guided builder
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="shell section">
        <article className="card judgement-card">
          <h2>Planning aid caveat</h2>
          <p>
            These templates are planning aids only. Validate all numbers,
            claims and recommendations before using them with customers or
            employers.
          </p>
        </article>
      </section>
    </>
  );
}
