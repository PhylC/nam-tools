import type { SlideContent } from "./powerPointTemplate";
import type { QbrMetric } from "./qbrScorecard";
import { readMetricNumber } from "./qbrScorecard";
import { qbrColumns, qbrHeadings } from "./qbrBenchmark.mjs";

export type QbrStory = {
  headline: string;
  drivers: string;
  decision: string;
  actions: string;
  implication?: string;
  commitments?: string[][];
  salesDrivers?: string[][];
  bridgeMeasure?: string;
  actionRows?: string[][];
};
export type QbrApproval = { metrics: QbrMetric[]; story: QbrStory };
export type QbrContext = {
  deckLabel: string;
  period: string;
  performance: string;
  brief: string;
  audience: string;
  tone: string;
  includeFinancialSummary: boolean;
  includeNextStepsSlide: boolean;
};

const number = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 });
const signedNumber = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2, signDisplay: "exceptZero" });

export function metricValue(value: number | null, unit: string, signed = false) {
  if (value === null) return "—";
  if (["GBP", "EUR", "USD"].includes(unit)) {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: unit, maximumFractionDigits: 2, minimumFractionDigits: 0, signDisplay: signed ? "exceptZero" : "auto" }).format(value);
  }
  const formatted = (signed ? signedNumber : number).format(value);
  return unit === "%" ? `${formatted}%` : unit ? `${formatted} ${unit}` : formatted;
}

export function comparison(metric: QbrMetric, reference = metric.plan) {
  if (reference === null) return null;
  const delta = metric.actual - reference;
  if (metric.unit === "%") return { value: delta, unit: "pp", label: `${signedNumber.format(delta)} pp` };
  if (reference === 0) return null;
  const value = delta / Math.abs(reference) * 100;
  return { value, unit: "%", label: `${signedNumber.format(value)}%` };
}

export function variance(metric: QbrMetric, reference = metric.plan) {
  if (reference === null) return "—";
  const relative = comparison(metric, reference);
  if (relative?.unit === "pp") return relative.label;
  const absolute = metricValue(metric.actual - reference, metric.unit, true);
  return relative ? `${absolute} (${relative.label})` : absolute;
}

export function suggestedHeadline(metrics: QbrMetric[]) {
  const usePrior = !metrics.some((metric) => metric.plan !== null);
  const ranked = metrics.filter((metric) => (usePrior ? metric.prior : metric.plan) !== null);
  const lead = ranked.find((metric) => /\b(net sales|sales|revenue|turnover)\b/i.test(metric.name)) ?? ranked[0];
  if (!lead) return "Quarterly results and priorities for the next period";
  const reference = (usePrior ? lead.prior : lead.plan) ?? lead.actual;
  const baseline = usePrior ? "the prior period" : "plan";
  const delta = lead.actual - reference;
  if (!delta) return `${lead.name} finished ${usePrior ? "level with the prior period" : "on plan"}`;
  const relative = comparison(lead, reference);
  const move = relative ? relative.label.replace(/^[+\-−]/, "") : metricValue(Math.abs(delta), lead.unit);
  return `${lead.name} finished ${move} ${delta > 0 ? "above" : "below"} ${baseline}`;
}

export function bridgeMeasures(metrics: QbrMetric[]) {
  return metrics.filter((metric) => metric.plan !== null && metric.unit !== "%" && /\b(?:sales|revenue|turnover)\b/i.test(metric.name));
}

export function qbrBridge(metrics: QbrMetric[], story: QbrStory): { chart?: NonNullable<SlideContent["waterfall"]>; error?: string } {
  const rows = (story.salesDrivers ?? []).filter((row) => row.some((cell) => cell.trim()));
  if (!rows.length) return {};
  const available = bridgeMeasures(metrics);
  const metric = available.find(({ name }) => name === story.bridgeMeasure) ?? (available.length === 1 ? available[0] : undefined);
  if (!metric || metric.plan === null) return { error: "Choose a sales measure with both Actual and Plan before adding a sales waterfall." };
  const total = metric.actual - metric.plan;
  const changes = [];
  for (const [label, amount, source] of rows) {
    const number = readMetricNumber(amount ?? "");
    if (!label?.trim() || !number || (number.unit && number.unit !== metric.unit) || !source?.trim()) {
      return { error: "Enter a driver, a signed impact in the sales measure’s unit, and an evidence note for each row." };
    }
    changes.push({ label: label.trim(), value: number.value, display: metricValue(number.value, metric.unit, true), evidence: source.trim() });
  }
  const explained = changes.reduce((sum, { value }) => sum + value, 0);
  if (Math.abs(total - explained) > .005) {
    return { error: `Drivers total ${metricValue(explained, metric.unit, true)}. Add ${metricValue(total - explained, metric.unit, true)} to reconcile to the scorecard’s ${metricValue(total, metric.unit, true)} variance.` };
  }
  return {
    chart: {
      changes, total: { label: "Actual vs plan", value: total, display: metricValue(total, metric.unit, true) },
      caption: `${metricValue(metric.plan, metric.unit)} plan to ${metricValue(metric.actual, metric.unit)} actual`,
    },
  };
}

export function qbrActionRows(story: QbrStory) {
  return (story.actionRows ?? lines(story.actions).map((line) => line.split("|")))
    .map((row) => Array.from({ length: qbrColumns.actions.length }, (_, index) => row[index]?.trim() ?? ""));
}

function lines(text: string) {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function chunks<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));
}

export function buildQbrSlides(context: QbrContext, approval: QbrApproval, includeDividers: boolean) {
  const { metrics, story } = approval;
  const showScorecard = metrics.length > 0 && context.includeFinancialSummary;
  const chart = showScorecard ? qbrBridge(metrics, story).chart : undefined;
  const priorOnly = !metrics.some((metric) => metric.plan !== null) && metrics.some((metric) => metric.prior !== null);
  const baseline = priorOnly ? "prior period" : "plan";
  const evidence = metrics.map((metric, index) => {
    const reference = priorOnly ? metric.prior : metric.plan;
    return { metric, sourceNumber: index + 1, reference, delta: comparison(metric, reference) };
  });
  const audienceBriefs: Record<string, string> = {
    "Internal review": "Internal performance review",
    "Leadership review": "Leadership performance review",
    "Retailer/customer meeting": "Customer performance review",
  };
  const audience = audienceBriefs[context.audience] ?? "Performance review";
  const actionsHeading = qbrHeadings.actions;
  const briefLines = lines(context.brief);
  const detailLimit = context.tone === "detailed_analytical" ? 4 : 2;
  const highlights = evidence.filter(({ reference }) => reference !== null).slice(0, detailLimit).map(({ metric, sourceNumber, reference }) =>
    `${metric.name} · ${metricValue(metric.actual, metric.unit)} actual · ${variance(metric, reference)} vs ${baseline} [${sourceNumber}]`);
  const summary = [
    story.decision.trim() ? `Decision today · ${story.decision.trim()}` : "",
    story.implication?.trim() ? `Why it matters · ${story.implication.trim()}` : "",
    ...highlights,
    ...(!highlights.length ? lines(context.performance).slice(0, detailLimit) : []),
  ].filter(Boolean);
  const contents: SlideContent[] = [
    { purpose: "title", title: context.deckLabel, lines: [context.period.trim(), audience].filter(Boolean) },
    { purpose: "content", title: story.headline.trim() || suggestedHeadline(metrics), lines: summary.length ? summary : briefLines.slice(0, detailLimit) },
  ];
  const commitments = (story.commitments ?? []).filter((row) => row[0]?.trim());
  chunks(commitments, 4).forEach((rows, index) => contents.push({
    purpose: "content", title: index ? `${qbrHeadings.commitments} (${index + 1})` : qbrHeadings.commitments,
    lines: [], table: { headers: qbrColumns.commitments, widths: [.30, .17, .12, .41], rows },
  }));
  if (showScorecard) {
    if (includeDividers) contents.push({ purpose: "divider", title: "Performance and evidence", lines: [] });
    const partitions = chunks(evidence, 5);
    partitions.forEach((page, index) => {
      contents.push({
        purpose: "content", title: partitions.length > 1 ? `${qbrHeadings.scorecard} ${index + 1} of ${partitions.length}` : qbrHeadings.scorecard,
        lines: [],
        table: {
          headers: priorOnly ? [...qbrColumns.scorecard.slice(0, -1), "Vs prior period"] : qbrColumns.scorecard,
          widths: [.32, .16, .16, .16, .20],
          rows: page.map(({ metric, sourceNumber, reference }) => [
            `${metric.name} [${sourceNumber}]`, metricValue(metric.actual, metric.unit), metricValue(metric.plan, metric.unit),
            metricValue(metric.prior, metric.unit), variance(metric, reference),
          ]),
        },
      });
    });
    if (chart) contents.push({ purpose: "content", title: qbrHeadings.bridge, lines: [], waterfall: chart });
    for (const unit of chart && context.tone !== "detailed_analytical" ? [] : ["%", "pp"]) {
      const ranked = evidence.filter(({ delta }) => delta?.unit === unit)
        .sort((a, b) => Math.abs(b.delta!.value) - Math.abs(a.delta!.value)).slice(0, 5);
      if (ranked.length < 2 || ranked.every(({ delta }) => !delta?.value)) continue;
      contents.push({
        purpose: "content", title: unit === "pp" ? `Rate variance vs ${baseline} (percentage points)` : `Largest variances vs ${baseline} (%)`, lines: [],
        chart: ranked.map(({ metric, delta, sourceNumber }) => ({
          label: `${metric.name} [${sourceNumber}]`, value: delta!.value, display: delta!.label,
        })),
      });
    }
  }
  const contextLines = lines(story.drivers || context.performance || context.brief)
    .filter((line) => !(summary.length ? summary : briefLines.slice(0, detailLimit)).includes(line));
  if (chart) {
    contextLines.push(...chart.changes.map(({ label, evidence }) => `${label} · ${evidence}`));
  }
  chunks(contextLines, 4).forEach((page, index) => contents.push({
    purpose: "content", title: index ? `What changed (${index + 1})` : "What changed", lines: page,
  }));
  const actions = qbrActionRows(story).filter(([action]) => action).map((row) => row.map((value) => value || "To agree"));
  if (context.includeNextStepsSlide && actions.length) {
    if (includeDividers) contents.push({ purpose: "divider", title: "Decisions and follow-up", lines: [] });
    const partitions = chunks(actions, 4);
    partitions.forEach((rows, index) => contents.push({
      purpose: "content", title: partitions.length > 1 ? `${actionsHeading} ${index + 1} of ${partitions.length}` : actionsHeading,
      lines: [], table: { headers: qbrColumns.actions, widths: [.26, .14, .12, .19, .29], rows },
    }));
  }
  if (showScorecard || highlights.length) {
    chunks(evidence.map(({ metric, sourceNumber }) => `[${sourceNumber}] ${metric.name} · ${metric.source}`), 6)
      .forEach((page, index) => contents.push({ purpose: "content", title: index ? `Scorecard sources (${index + 1})` : "Scorecard sources", lines: page }));
  }
  return { contents, outline: contents.map((slide) => slide.title) };
}
