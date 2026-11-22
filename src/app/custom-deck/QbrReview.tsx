import { useEffect, useRef, useState } from "react";
import { readMetricNumber } from "./qbrScorecard";
import type { QbrScorecard } from "./qbrScorecard";
import { bridgeMeasures, buildQbrSlides, metricValue, qbrActionRows, qbrBridge, suggestedHeadline, variance } from "./qbrStory";
import type { QbrApproval, QbrContext, QbrStory } from "./qbrStory";
import { qbrColumns } from "./qbrBenchmark.mjs";
import { DeckReviewRows } from "./DeckReviewRows";

type MetricEdit = { actual?: string; plan?: string; prior?: string };

export function QbrReview({ scorecard, context, initialStory, busy, onConfirm, onBack }: {
  scorecard: QbrScorecard;
  context: QbrContext;
  initialStory: QbrStory;
  busy: boolean;
  onConfirm: (approval: QbrApproval) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [edits, setEdits] = useState<Record<string, MetricEdit>>({});
  const [story, setStory] = useState(initialStory);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);

  const confirmed = scorecard.groups.map((group, index) => {
    const source = group.length === 1 ? group[0] : group.find(({ id }) => id === selected[index]);
    if (!source) return null;
    const changes = edits[source.id] ?? {};
    const updated = { ...source };
    for (const key of ["actual", "plan", "prior"] as const) {
      const raw = changes[key];
      if (raw === undefined) continue;
      const parsed = readMetricNumber(raw);
      if (raw.trim() && (!parsed || (parsed.unit && parsed.unit !== source.unit))) return null;
      if (key === "actual") {
        if (!parsed) return null;
        updated.actual = parsed.value;
      } else {
        updated[key] = parsed?.value ?? null;
      }
    }
    if ((["actual", "plan", "prior"] as const).some((key) => source[key] !== updated[key])) {
      updated.source = `${source.source} (updated in review)`;
    }
    return updated;
  });
  const metrics = confirmed.filter((metric) => metric !== null);
  const unresolved = confirmed.length - metrics.length;
  const headline = suggestedHeadline(metrics);
  const bridgeChoices = bridgeMeasures(metrics);
  const bridge = context.includeFinancialSummary ? qbrBridge(metrics, story) : {};
  const actions = qbrActionRows(story);
  const partial = (rows: string[][], columns: number) => rows.some((row) => row.some((cell) => cell.trim()) &&
    Array.from({ length: columns }, (_, index) => row[index]?.trim()).some((cell) => !cell));
  const partialAction = context.includeNextStepsSlide && partial(actions, qbrColumns.actions.length);
  const partialCommitment = partial(story.commitments ?? [], qbrColumns.commitments.length);
  const approval = { metrics, story: { ...story, headline: story.headline.trim() || headline } };
  const outline = buildQbrSlides(context, approval, false).outline;
  const hasContent = metrics.length > 0 || [context.brief, context.performance, story.headline, story.decision, story.drivers, story.implication].some((text) => text?.trim())
    || actions.some(([action]) => action) || (story.commitments ?? []).some(([commitment]) => commitment?.trim());

  return (
    <section className="qbr-review" aria-labelledby="qbr-review-heading">
      <h2 ref={heading} tabIndex={-1} id="qbr-review-heading">Review QBR figures and story</h2>
      <p>Check the scorecard, then sharpen the headline and the decision before creating the PowerPoint.</p>
      {scorecard.warnings.length ? (
        <details className="qbr-notes" open>
          <summary>{scorecard.warnings.length} scorecard {scorecard.warnings.length === 1 ? "note" : "notes"}</summary>
          <ul>{scorecard.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
        </details>
      ) : null}
      {scorecard.groups.length ? (
        <div className="qbr-scorecard-review">
          {scorecard.groups.map((group, index) => {
            const metric = group.length === 1 ? group[0] : group.find(({ id }) => id === selected[index]);
            const checked = confirmed[index];
            return (
              <div className="qbr-scorecard-row" key={group[0].id}>
                <div>
                  <strong>{group[0].name}</strong>
                  {group.length > 1 ? (
                    <label className="field">
                      <span>Choose source for {group[0].name}</span>
                      <select disabled={busy} value={selected[index] ?? ""} onChange={(event) => setSelected({ ...selected, [index]: event.target.value })}>
                        <option value="">Conflicting figures · choose a source</option>
                        {group.map((item) => <option key={item.id} value={item.id}>
                          {item.source} · {metricValue(item.actual, item.unit)} actual · {metricValue(item.plan, item.unit)} plan
                        </option>)}
                      </select>
                    </label>
                  ) : <small>{metric?.source}</small>}
                </div>
                {metric ? (
                  <div className="qbr-scorecard-values">
                    {(["actual", "plan", "prior"] as const).map((key) => (
                      <label className="field" key={key}>
                        <span>{key === "prior" ? "Prior period" : key === "actual" ? "Actual" : "Plan"}{metric.unit && ` (${metric.unit})`}</span>
                        <input
                          aria-label={`${metric.name} ${key}`}
                          disabled={busy}
                          inputMode="decimal"
                          value={edits[metric.id]?.[key] ?? (metric[key] === null ? "" : String(metric[key]))}
                          onChange={(event) => setEdits({ ...edits, [metric.id]: { ...edits[metric.id], [key]: event.target.value } })}
                        />
                      </label>
                    ))}
                    <span className="qbr-variance">{checked ? variance(checked) : "Check values"}<small>Vs plan</small></span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : <p>No numeric scorecard is in this draft. It will use the account context and decisions you provide.</p>}
      <div className="qbr-story-fields">
        <label className="field">
          <span>What is the main takeaway?</span>
          <input disabled={busy} maxLength={150} value={story.headline} placeholder={headline} onChange={(event) => setStory({ ...story, headline: event.target.value })} />
          <small>Leave blank to use the suggested headline.</small>
        </label>
        <label className="field">
          <span>What decision do you want from this review?</span>
          <textarea disabled={busy} rows={2} value={story.decision} onChange={(event) => setStory({ ...story, decision: event.target.value })} placeholder="For example, agree which stores to prioritise next quarter." />
        </label>
        <label className="field">
          <span>Why does this result matter to the buyer?</span>
          <textarea disabled={busy} rows={2} value={story.implication ?? ""} onChange={(event) => setStory({ ...story, implication: event.target.value })}
            placeholder="Explain the consequence for the customer or next quarter." />
        </label>
        <fieldset className="qbr-editor" disabled={busy}>
          <legend>Previous review commitments</legend>
          <p>Optional. Record each commitment, who owned it, and the outcome you can verify.</p>
          <DeckReviewRows kind="Commitment" labels={qbrColumns.commitments} rows={story.commitments ?? []} onChange={(commitments) => setStory({ ...story, commitments })} />
          {partialCommitment ? <p className="field-error">Complete the owner, status and outcome for each commitment.</p> : null}
        </fieldset>
        {context.includeFinancialSummary && (bridgeChoices.length || story.salesDrivers?.some((row) => row.some(Boolean))) ? (
          <fieldset className="qbr-editor" disabled={busy}>
            <legend>Sales waterfall</legend>
            <p>Optional. Add up to five signed movements that explain the gap between actual sales and plan.</p>
            <label className="field">
              <span>Sales measure for the waterfall</span>
              <select value={bridgeChoices.some(({ name }) => name === story.bridgeMeasure) ? story.bridgeMeasure : bridgeChoices.length === 1 ? bridgeChoices[0].name : ""}
                onChange={(event) => setStory({ ...story, bridgeMeasure: event.target.value })}>
                <option value="">Choose a measure</option>
                {bridgeChoices.map(({ id, name }) => <option key={id} value={name}>{name}</option>)}
              </select>
            </label>
            <DeckReviewRows kind="Driver" labels={["Driver", "Signed impact", "Evidence"]} rows={story.salesDrivers ?? []} maxRows={5}
              onChange={(salesDrivers) => setStory({ ...story, salesDrivers })} />
            {bridge.error ? <p className="field-error" role="status">{bridge.error}</p> : null}
            {bridge.chart ? <p role="status">Sales drivers reconcile to {bridge.chart.total.display} against plan.</p> : null}
          </fieldset>
        ) : null}
        <label className="field">
          <span>What explains the result?</span>
          <textarea disabled={busy} rows={3} value={story.drivers} onChange={(event) => setStory({ ...story, drivers: event.target.value })} placeholder="Add confirmed drivers or observations, one per line." />
        </label>
        {context.includeNextStepsSlide ? (
          <fieldset className="qbr-editor" disabled={busy}>
            <legend>Proposed actions and owners</legend>
            <p>Record the starting point and how you’ll measure success at the next review.</p>
            <DeckReviewRows kind="Action" labels={qbrColumns.actions} rows={actions} onChange={(actionRows) => setStory({ ...story, actionRows })} />
            {partialAction ? <p className="field-error" role="status">Complete the owner, due date, baseline and success measure for each action.</p> : null}
          </fieldset>
        ) : null}
      </div>
      <details className="qbr-notes" open>
        <summary>Planned slides</summary>
        <ol>{outline.map((title, index) => <li key={index}>{title}</li>)}</ol>
      </details>
      {unresolved ? <p role="status" className="field-error">Resolve {unresolved} {unresolved === 1 ? "metric" : "metrics"} to continue.</p> : null}
      {!hasContent ? <p role="status" className="field-error">Add a takeaway, observation or decision to continue.</p> : null}
      <div className="template-layout-review-actions">
        <button className="button" type="button" disabled={busy || Boolean(unresolved) || !hasContent || partialAction || partialCommitment || Boolean(bridge.error)} onClick={() => onConfirm(approval)}>
          {busy ? "Preparing PowerPoint…" : "Confirm QBR and continue"}
        </button>
        <button className="button button-secondary" type="button" disabled={busy} onClick={onBack}>Back to deck setup</button>
      </div>
    </section>
  );
}
