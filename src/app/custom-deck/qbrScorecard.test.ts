import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { addDeckVisuals } from "./powerPointTemplate";
import { readQbrScorecards } from "./qbrScorecard";
import { buildQbrSlides, comparison, qbrBridge, suggestedHeadline, variance } from "./qbrStory";
import { qbrBenchmark, qbrBenchmarkCsv, qbrHeadings } from "./qbrBenchmark.mjs";
import type { QbrContext, QbrStory } from "./qbrStory";

const scorecard = (filename: string, text: string) => new File([text], filename, { type: "text/csv" });
const context: QbrContext = {
  deckLabel: "Example Q3 review", period: "Q3", brief: "", performance: "",
  audience: "Retailer/customer meeting", tone: "detailed_analytical",
  includeFinancialSummary: true, includeNextStepsSlide: true,
};
const story: QbrStory = {
  headline: "", drivers: "Distribution increased during Q3.", decision: "Agree the stores to prioritise.",
  actions: "Confirm the store list | Alex | 10 January",
};

describe("QBR scorecards and slide plan", () => {
  it("reconciles sales and rate variance and retains quoted values and source rows", async () => {
    const input = scorecard("Q3.csv", '\uFEFFMetric,Actual,Plan,Prior period,Unit\r\nNet sales,"£410,000","£400,000","£390,000",GBP\r\nGross margin,27.5%,28%,27%,%\r\nUnits sold,104000,100000,101000,units\r\n');
    const result = await readQbrScorecards([input]);
    const metrics = result.groups.map(([row]) => row);
    expect(result.warnings).toEqual([]);
    expect(metrics.map((row) => variance(row))).toEqual(["+£10,000 (+2.5%)", "-0.5 pp", "+4,000 units (+4%)"]);
    expect(metrics[0].source).toBe("Q3.csv · row 2");
    expect(suggestedHeadline(metrics)).toBe("Net sales finished 2.5% above plan");
    const { contents, outline } = buildQbrSlides(context, { metrics, story }, true);
    expect(outline).toEqual(contents.map(({ title }) => title));
    expect(contents.find(({ title }) => title === "Commercial scorecard")?.table?.rows[0]).toEqual(["Net sales [1]", "£410,000", "£400,000", "£390,000", "+£10,000 (+2.5%)"]);
    expect(contents.find(({ chart }) => chart)?.chart?.map(({ value }) => value)).toEqual([4, 2.5]);
    expect(contents.find(({ title }) => title === qbrHeadings.actions)?.table?.rows).toEqual([["Confirm the store list", "Alex", "10 January", "To agree", "To agree"]]);
  });

  it("keeps conflicting observations for explicit selection", async () => {
    const first = scorecard("First.csv", "Measure,Actual,Target\nNet sales,410000,400000\n");
    const second = scorecard("Second.csv", "Metric,Actual,Plan\nNet Sales,420000,400000\n");
    const result = await readQbrScorecards([first, second]);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].map(({ actual, source }) => [actual, source])).toEqual([
      [410000, "First.csv · row 2"], [420000, "Second.csv · row 2"],
    ]);
  });

  it("supports prior-only and zero-plan figures without dividing by zero", async () => {
    const result = await readQbrScorecards([scorecard("Quarter.csv", "Metric,Actual,Plan,Prior\nSales,110,,100\n")]);
    const metrics = result.groups.map(([row]) => row);
    expect(suggestedHeadline(metrics)).toBe("Sales finished 10% above the prior period");
    expect(comparison({ ...metrics[0], plan: 0 })).toBeNull();
    expect(variance({ ...metrics[0], plan: 0 })).toBe("+110");
    expect(buildQbrSlides(context, { metrics, story }, false).contents.find(({ table }) => table)?.table?.headers.at(-1)).toBe("Vs prior period");
  });

  it("produces a lean brief without invented figures, drivers or owners", () => {
    const brief = "Ask the buyer to confirm the distribution baseline.";
    const sparseStory = { headline: "", drivers: "", decision: "", actions: "" };
    const { contents } = buildQbrSlides({ ...context, brief }, { metrics: [], story: sparseStory }, false);
    expect(contents).toHaveLength(2);
    expect(contents[1].lines).toEqual([brief]);
    expect(contents.every(({ table, chart }) => !table && !chart)).toBe(true);
  });

  it("writes editable tables using PowerPoint's table graphic URI", async () => {
    const zip = new JSZip();
    const path = "ppt/slides/slide1.xml";
    zip.file(path, "<p:sld><p:spTree></p:spTree></p:sld>");
    const file = await addDeckVisuals(await zip.generateAsync({ type: "blob" }), [{
      purpose: "content", title: "Commercial scorecard", lines: [],
      table: { headers: ["Measure", "Actual"], widths: [.5, .5], rows: [["Net sales", "£410,000"]] },
    }], { backgroundColor: "FFFFFF", textColor: "000000", bodyFontFace: "Arial", headFontFace: "Arial" });
    const exported = await JSZip.loadAsync(await file.arrayBuffer());
    const slide = await exported.file(path)?.async("text");
    expect(slide).toContain('uri="http://schemas.openxmlformats.org/drawingml/2006/table"');
    expect(slide).toContain("£410,000");
  });

  it("uses the shared worked example to tell the decision, show follow-through and reconcile the bridge", async () => {
    const result = await readQbrScorecards([scorecard("Bridgeway.csv", qbrBenchmarkCsv)]);
    const metrics = result.groups.map(([row]) => row);
    const benchmarkStory = {
      ...story,
      headline: qbrBenchmark.headline,
      implication: qbrBenchmark.implication,
      decision: qbrBenchmark.decision,
      commitments: qbrBenchmark.commitments,
      actionRows: qbrBenchmark.actions,
      salesDrivers: qbrBenchmark.drivers.map(({ label, value, evidence }) => [label, String(value), evidence]),
    };
    const { contents } = buildQbrSlides(context, { metrics, story: benchmarkStory }, false);
    expect(contents[1].lines.slice(0, 2)).toEqual([
      `Decision today · ${qbrBenchmark.decision}`, `Why it matters · ${qbrBenchmark.implication}`,
    ]);
    expect(contents[2].table?.rows).toEqual(qbrBenchmark.commitments);
    expect(contents[3].table?.headers).toContain("Prior period");
    expect(contents[4].waterfall?.changes.map(({ value }) => value)).toEqual([9000, 7000, -6000]);
    expect(contents[4].waterfall?.total.value).toBe(10000);
    expect(contents.find(({ title }) => title === qbrHeadings.actions)?.table?.rows).toEqual(qbrBenchmark.actions);
    expect(qbrBridge(metrics, { ...benchmarkStory, salesDrivers: benchmarkStory.salesDrivers.slice(0, 2) }).error).toContain("reconcile");
  });
});
