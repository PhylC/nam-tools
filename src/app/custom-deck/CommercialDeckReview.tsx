import { useEffect, useRef, useState } from "react";
import { DeckReviewRows } from "./DeckReviewRows";
import { buildCommercialSlides, commercialRows, commercialText } from "./commercialDeck";
import type { CommercialApproval, CommercialContext } from "./commercialDeck";
import { planningConfig } from "./planningBenchmarks.mjs";
import { commercialConfig } from "./commercialBenchmarks.mjs";

export function CommercialDeckReview({ initial, context, busy, onConfirm, onBack }: {
  initial: CommercialApproval;
  context: CommercialContext;
  busy: boolean;
  onConfirm: (approval: CommercialApproval) => void;
  onBack: (draft: CommercialApproval) => void;
}) {
  const { kind } = initial;
  const [data, setData] = useState(initial.data);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const config = commercialConfig[kind];
  const planning = kind !== "jbp" && kind !== "promo-proposal" ? planningConfig[kind] : null;
  const { outline, errors, notes } = buildCommercialSlides(context, { kind, data }, false);
  const decision = commercialText(data, "decision").trim();
  const setText = (key: string, value: string) => setData((current) => ({ ...current, [key]: value }));
  const fields = planning ? [
    ...["scope", "benefit", "decision", "governance"].map((key, index) => [key, planning.questions[index]]),
    ["evidence", planning.evidenceQuestion],
  ] : [
    ["scope", kind === "jbp" ? "Which account and annual planning scope does this cover?" : "What offer, dates and store scope should the buyer see?"],
    ["benefit", kind === "jbp" ? "What customer outcome will improve?" : "What will the shopper and retailer gain?"],
    ["decision", "What approval or commitment do you need?"],
    ["evidence", kind === "jbp" ? "What evidence supports the growth priorities?" : "What is the baseline and which assumptions support the forecast?"],
    ["governance", kind === "jbp" ? "When will both teams review progress and release investment?" : "What conditions must be met before booking?"],
  ];
  const groups = planning
    ? planning.groups.filter((group) => (context.financial || !group.financial) && (context.next || !group.next))
    : config.groups.filter(({ key }) => (context.financial || key !== "investment") && (context.next || !["milestones", "execution", "measurement"].includes(key)));
  const decisionLabel = kind === "account-plan" || kind === "annual-planning" ? "internal decision" : "buyer decision";

  return (
    <section className="qbr-review" aria-labelledby="commercial-review-heading">
      <h2 ref={heading} tabIndex={-1} id="commercial-review-heading">Review your {config.label}</h2>
      <p>Confirm the {decisionLabel}, figures and commitments. Add the sections you have evidence for.</p>
      <div className="qbr-story-fields">
        <label className="field">
          <span>Planning period or event window</span>
          <input disabled={busy} value={commercialText(data, "period")} onChange={(event) => setText("period", event.target.value)} />
        </label>
        {fields.map(([key, label]) => (
          <label className="field" key={key}>
            <span>{label}</span>
            <textarea disabled={busy} rows={2} value={commercialText(data, key)} onChange={(event) => setText(key, event.target.value)} />
          </label>
        ))}
        {context.financial && config.numeric.length ? (
          <fieldset className="qbr-editor" disabled={busy}>
            <legend>{planning ? "Figures and assumptions" : kind === "jbp" ? "Sales ambition and funding" : "Volume, funding and contribution"}</legend>
            <div className="qbr-editable-fields">
              {config.numeric.map(({ key, label, note }) => (
                <label className="field" key={key}>
                  <span>{label}</span>
                  <input inputMode={key.endsWith("Units") || key === "stores" || key === "weeks" ? "numeric" : "decimal"} value={commercialText(data, key)}
                    onChange={(event) => setText(key, event.target.value)} />
                  {note ? <small>{note}</small> : null}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        {notes.length ? <ul className="qbr-notes" role="status">{notes.map((note) => <li key={note}>{note}</li>)}</ul> : null}
        {groups.map((group) => {
          const rows = commercialRows(data, group.key);
          const count = rows.filter((row) => row.some((cell) => cell.trim())).length;
          return (
            <details className="qbr-notes" key={group.key}>
              <summary>{group.title}{count ? ` · ${count}` : ""}</summary>
              <fieldset className="commercial-review-group" disabled={busy}>
                <DeckReviewRows kind={group.item} labels={group.labels} rows={rows}
                  onChange={(nextRows) => setData((current) => ({ ...current, [group.key]: nextRows }))} />
              </fieldset>
            </details>
          );
        })}
      </div>
      <details className="qbr-notes" open>
        <summary>Planned slides</summary>
        <ol>{outline.map((title, index) => <li key={index}>{title}</li>)}</ol>
      </details>
      {errors.length ? <ul className="field-error" role="status">{errors.map((error) => <li key={error}>{error}</li>)}</ul> : null}
      {!decision ? <p className="field-error">Enter the {decisionLabel} before creating the deck.</p> : null}
      <div className="template-layout-review-actions">
        <button className="button" type="button" disabled={busy || !decision || errors.length > 0}
          onClick={() => onConfirm({ kind, data })}>
          {busy ? "Preparing PowerPoint…" : `Confirm ${config.short} and continue`}
        </button>
        <button className="button button-secondary" type="button" disabled={busy} onClick={() => onBack({ kind, data })}>Back to deck setup</button>
      </div>
    </section>
  );
}
