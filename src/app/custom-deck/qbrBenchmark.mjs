export const qbrHeadings = {
  decisions: "Result, implication and decision",
  commitments: "Previous review commitments",
  scorecard: "Commercial scorecard",
  bridge: "What moved net sales",
  actions: "Proposed actions and owners",
};

export const qbrColumns = {
  commitments: ["Commitment", "Owner", "Status", "Outcome"],
  scorecard: ["Measure", "Actual", "Plan", "Prior period", "Vs plan"],
  actions: ["Action", "Owner", "Due", "Baseline", "Success measure"],
};

export const qbrBenchmark = {
  account: "Bridgeway Grocers",
  period: "Q3 FY26",
  headline: "Sales beat plan by £10k. Fix availability before repeating the promotion",
  result: "Supplier net sales reached £410k, £10k ahead of plan and £18k up on the prior quarter.",
  implication: "Range and promotion gains outweighed an estimated £6k lost to availability. The top 15 stores reached 92% on-shelf availability.",
  decision: "Agree daily stock exception reporting for the top 15 stores and hold the next promotion until they reach 97% on-shelf availability.",
  commitments: [
    ["List the core range in 25 stores", "Category lead", "Complete", "25 stores listed. Weighted distribution reached 80%."],
    ["Review summer promotion against matched weeks", "Account lead", "Complete", "11,000 incremental units and £1.9k incremental contribution after funding."],
    ["Improve on-shelf availability in the top 15 stores", "Retail operations", "Open", "92% on-shelf availability against the 97% target."],
  ],
  scorecard: [
    ["Supplier net sales", 410000, 400000, 392000, "GBP", "£410k", "£400k", "£392k", "+£10k (+2.5%)"],
    ["Units sold", 104000, 100000, 102000, "units", "104k", "100k", "102k", "+4k (+4.0%)"],
    ["Gross margin rate", 27.5, 28, 27.2, "%", "27.5%", "28.0%", "27.2%", "−0.5 pp"],
    ["Weighted distribution", 80, 78, 76, "%", "80%", "78%", "76%", "+2 pp"],
    ["On-shelf availability (top 15 stores)", 92, 97, 93, "%", "92%", "97%", "93%", "−5 pp"],
  ],
  drivers: [
    { label: "Range expansion", value: 9000, display: "+£9k", evidence: "Sales from newly listed stores" },
    { label: "Summer promotion", value: 7000, display: "+£7k", evidence: "Incremental sales versus matched baseline weeks" },
    { label: "Availability gaps", value: -6000, display: "−£6k", evidence: "Estimated missed sales from stock exceptions in the top 15 stores" },
  ],
  actions: [
    ["Run daily stock exception reporting", "Retail operations", "Start week 1", "92% on-shelf availability", "97% in the top 15 stores by week 4, tracked daily"],
    ["Review sales rate in 25 new listings", "Category lead", "Week 8", "10 units per store per week", "12 units per store per week, matching established stores"],
    ["Confirm whether to repeat the promotion", "Account lead", "Next booking window", "£1.9k contribution after funding", "Positive net contribution and ≥97% on-shelf availability in the top 15 stores"],
  ],
};

export const qbrBenchmarkCsv = [
  "Metric,Actual,Plan,Prior period,Unit",
  ...qbrBenchmark.scorecard.map((row) => row.slice(0, 5).join(",")),
].join("\r\n") + "\r\n";

/**
 * @param {{label:string, value:number, display:string}[]} changes
 * @param {{label:string, value:number, display:string}} total
 */
export function waterfallPlot(changes, total) {
  let running = 0;
  const steps = changes.map((change) => {
    const start = running;
    running += change.value;
    return { ...change, start, end: running, total: false };
  });
  steps.push({ ...total, start: 0, end: total.value, total: true });
  const high = Math.max(0, ...steps.map(({ end }) => end));
  const low = Math.min(0, ...steps.map(({ end }) => end));
  const span = high - low || 1;
  const coordinate = (/** @type {number} */ value) => .12 + .65 * (high - value) / span;
  const slot = 1 / steps.length;
  return {
    zero: coordinate(0),
    bars: steps.map((step, index) => {
      const start = coordinate(step.start);
      const end = coordinate(step.end);
      return {
        ...step, left: slot * (index + .22), width: slot * .56, top: Math.min(start, end),
        height: Math.max(Math.abs(end - start), .005), slot, endLine: end,
      };
    }),
  };
}
