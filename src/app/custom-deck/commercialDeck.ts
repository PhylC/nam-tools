import { commercialConfig, commercialPages } from "./commercialBenchmarks.mjs";
import type { SlideContent } from "./powerPointTemplate";

export type CommercialKind = keyof typeof commercialConfig;
export type CommercialData = Record<string, string | string[][]>;
export type CommercialApproval = { kind: CommercialKind; data: CommercialData };
export type CommercialContext = {
  deckLabel: string;
  audience: string;
  tone: string;
  financial: boolean;
  next: boolean;
};
type CommercialPage = {
  title: string;
  guidance: string;
  rows?: string[][];
  headers?: string[];
  widths?: number[];
  chart?: SlideContent["chart"];
};

export function getCommercialKind(value: unknown): CommercialKind | null {
  return value === "jbp" || value === "promo-proposal" ? value : null;
}

export function commercialText(data: CommercialData, key: string) {
  const value = data[key];
  return typeof value === "string" ? value : "";
}

export function commercialRows(data: CommercialData, key: string) {
  const value = data[key];
  return Array.isArray(value) ? value : [];
}

export function restoreCommercialApproval(value: unknown): CommercialApproval | null {
  if (!value || typeof value !== "object" || !("kind" in value) || !("data" in value)) return null;
  const kind = getCommercialKind(value.kind);
  if (!kind || !value.data || typeof value.data !== "object" || Array.isArray(value.data)) return null;
  const data: CommercialData = {};
  const fields = [...commercialConfig[kind].numeric.map(({ key }) => key), "period", "scope", "benefit", "decision", "evidence", "governance"];
  const saved = value.data as Record<string, unknown>;
  for (const key of fields) if (typeof saved[key] === "string") data[key] = saved[key];
  for (const { key } of commercialConfig[kind].groups) {
    const rows = saved[key];
    if (Array.isArray(rows)) data[key] = rows.filter(Array.isArray).map((row) => row.map((cell) => typeof cell === "string" ? cell : ""));
  }
  return { kind, data };
}

export function buildCommercialSlides(context: CommercialContext, { kind, data }: CommercialApproval, dividers: boolean) {
  const { pages, errors, notes } = commercialPages(kind, data, context) as { pages: CommercialPage[]; errors: string[]; notes: string[] };
  const mainTitle = commercialConfig[kind].label;
  const contents: SlideContent[] = [{
    title: context.deckLabel,
    purpose: "title",
    lines: [commercialText(data, "period"), `${mainTitle} · ${context.audience}`].filter(Boolean),
  }];
  const executionGate = kind === "jbp" ? "Risks and escalation triggers" : "Execution and support requested";
  const nextGate = kind === "jbp" ? "Quarterly milestones and governance" : "Post-event measurement";
  let executionDivider = false;
  for (const [index, page] of pages.entries()) {
    if (dividers && index === 1 && !page.title.startsWith(executionGate) && !page.title.startsWith(nextGate)) {
      contents.push({ title: kind === "jbp" ? "Growth and investment" : "Offer and economics", lines: [], purpose: "divider" });
    }
    if (dividers && !executionDivider && (page.title.startsWith(executionGate) || page.title.startsWith(nextGate))) {
      contents.push({ title: kind === "jbp" ? "Delivery and governance" : "Execution and measurement", lines: [], purpose: "divider" });
      executionDivider = true;
    }
    const slide: SlideContent = { title: page.title, purpose: "content", lines: [] };
    if (page.headers && page.widths && page.rows) {
      slide.table = { headers: page.headers, widths: page.widths, rows: page.rows };
      if (["Investment and release conditions", "Unit forecast and uplift", "Funding and break-even"].some((title) => page.title.startsWith(title))) {
        slide.subtitle = page.guidance;
      }
    } else if (page.chart) {
      slide.chart = page.chart;
    } else {
      slide.lines = (page.rows ?? []).map(([label, content]) => `${label} · ${content}`);
    }
    contents.push(slide);
  }
  return { contents, outline: contents.map(({ title }) => title), errors, notes };
}
