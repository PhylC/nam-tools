import { at, money, normalizedRows, readNumber, signed, signedMoney, unitCurrency, units } from "./deckBenchmarkFormat.mjs";
import { planningConfig } from "./planningBenchmarks.mjs";
import { planningPages } from "./planningPages.mjs";

export const jbpGroups = [
  { key: "targets", title: "Additional performance targets", item: "Target", labels: ["Measure", "Baseline", "Target", "Source or basis"], widths: [.29, .16, .16, .39] },
  { key: "commitments", title: "Joint growth commitments", item: "Commitment", labels: ["Growth priority", "Supplier commitment", "Retailer commitment", "Success measure"], widths: [.20, .25, .25, .30] },
  { key: "investment", title: "Investment and release conditions", item: "Funding line", labels: ["Investment", "Budget (£)", "Release condition", "Owner"], widths: [.25, .15, .40, .20] },
  { key: "milestones", title: "Quarterly milestones and governance", item: "Milestone", labels: ["When", "Milestone", "Owner", "Decision or success measure"], widths: [.13, .34, .22, .31] },
  { key: "risks", title: "Risks and escalation triggers", item: "Risk", labels: ["Risk", "Trigger", "Response", "Owner"], widths: [.24, .28, .30, .18] },
];
export const promoGroups = [
  { key: "execution", title: "Execution and support requested", item: "Commitment", labels: ["Commitment", "Scope", "Owner", "Due"], widths: [.28, .34, .20, .18] },
  { key: "measurement", title: "Post-event measurement", item: "Measure", labels: ["Measure", "Baseline or source", "Success threshold", "Owner and review date"], widths: [.23, .27, .26, .24] },
];

export const jbpBenchmark = {
  customer: "Northstar Retail",
  title: "Joint growth plan for Northstar Retail",
  period: "FY27 joint planning",
  scope: "FY27 annual plan for Northstar Retail’s grocery range.",
  benefit: "Improve availability and range productivity so shoppers can find the right packs in the stores they use.",
  decision: "Approve the £30,000 funding envelope and agree the Q1 baselines and pilot stores.",
  evidence: "Retailer basket data shows smaller packs growing faster in the top-up stores. Trial the range in 20 comparable stores before a wider rollout.",
  governance: "The joint steering group reviews results quarterly. The account leads can pause release when a milestone misses its agreed hurdle.",
  baselineSales: "2000000", targetSales: "2200000", funding: "30000",
  targets: [
    ["On-shelf availability", "94%", "97%", "Retailer stock report, FY26 baseline"],
    ["Supplier gross margin rate", "27%", "28%", "Finance plan on the same net sales basis"],
  ],
  commitments: [
    ["Availability", "Send a weekly stock exception report", "Escalate recurring gaps", "97% on-shelf availability"],
    ["Range productivity", "Fund test stock and measure the trial", "Provide 20 pilot stores", "Pilot rate of sale up 8%"],
    ["Promotion value", "Supply the post-event analysis", "Share EPOS and availability data", "Positive incremental contribution after funding"],
  ],
  investment: [
    ["Availability improvements", "10000", "Weekly stock reporting agreed", "Operations"],
    ["Range pilot", "8000", "Pilot stores and shelf dates confirmed", "Category"],
    ["Promotion tests", "12000", "Baseline and measurement plan signed off", "Account lead"],
  ],
  milestones: [
    ["Q1", "Agree baselines and 20 trial stores", "Both account leads", "Sign off £30,000 funding"],
    ["Q2", "Launch the range and promotion pilots", "Category lead", "Confirm pilot rate of sale and contribution"],
    ["Q3", "Extend initiatives that meet the hurdle", "Retail operations", "Availability at or above 97%"],
    ["Q4", "Close the year and agree the next priorities", "Joint steering group", "Review the £2.2m supplier net sales goal"],
  ],
  risks: [
    ["Supply interruption", "Availability below 94% for two weeks", "Escalate replenishment exceptions", "Supply lead"],
    ["Low pilot uptake", "Rate of sale below baseline at week four", "Review visibility before expanding", "Category lead"],
  ],
};

export const promoBenchmark = {
  customer: "Westfield Stores",
  title: "Westfield spring promotion proposal",
  period: "Spring promotional window",
  scope: "Two weeks across 100 stores. Reduce shelf price from £3.00 to £2.50 with agreed display and shelf-edge labels.",
  benefit: "Give shoppers a £0.50 saving and target 10,000 incremental units across the participating stores.",
  decision: "Approve £5,000 fixed funding and confirm dates, stock and reporting before booking.",
  evidence: "20,000 baseline units from comparable non-promoted weeks across the same 100 stores. Contribution per incremental unit includes the selling and variable cost assumptions before fixed funding.",
  governance: "Proceed only when stock, the baseline and EPOS access are confirmed. Reopen the offer if the expected uplift falls below break-even.",
  baselineUnits: "20000", downsideUnits: "25000", expectedUnits: "30000", upsideUnits: "34000", funding: "5000", contribution: "0.80",
  execution: [
    ["Confirm funding", "£5,000 fixed", "Commercial finance", "Before booking"],
    ["Deliver shelf execution", "Display and shelf-edge labels in 100 stores", "Retail operations", "First day of event"],
    ["Provide EPOS and availability", "Event and matched baseline weeks", "Retail analyst", "Two weeks after event"],
  ],
  measurement: [
    ["Incremental units", "20,000 units across matched non-promoted weeks", "At least 6,250 incremental units to break even", "Retail analyst · two weeks after event"],
    ["Contribution after funding", "£0 break-even", "Positive contribution after £5,000 fixed funding", "Commercial finance · two weeks after event"],
    ["Availability and related products", "EPOS and availability for agreed stores and weeks", "Confirm stock and check for displaced sales", "Retail operations · post-event review"],
  ],
};

export const commercialConfig = {
  ...planningConfig,
  jbp: {
    label: "Joint Business Plan", short: "JBP", benchmark: jbpBenchmark, groups: jbpGroups,
    questions: [
      "Which account and planning period does this cover?",
      "What customer outcome will the joint plan improve?",
      "What decision or commitment do you need from the retailer?",
      "How will both teams review progress and decide what to scale?",
    ],
    numeric: [
      { key: "baselineSales", label: "Baseline supplier net sales (£)", note: "Use the same sales basis and period length as the target." },
      { key: "targetSales", label: "Target supplier net sales (£)" },
      { key: "funding", label: "Total investment envelope (£)", note: "Add funding lines and release conditions below to reconcile the total." },
    ],
  },
  "promo-proposal": {
    label: "Promotional Proposal", short: "proposal", benchmark: promoBenchmark, groups: promoGroups,
    questions: [
      "What offer, dates and store scope are you proposing?",
      "What will the shopper and retailer gain?",
      "What approval or funding do you need, and by when?",
      "What conditions must be met before booking?",
    ],
    numeric: [
      { key: "baselineUnits", label: "Baseline units", note: "Use comparable non-promoted weeks and the same stores and duration." },
      { key: "downsideUnits", label: "Downside total units" },
      { key: "expectedUnits", label: "Expected total units" },
      { key: "upsideUnits", label: "Upside total units" },
      { key: "funding", label: "Fixed funding (£)" },
      { key: "contribution", label: "Contribution per incremental unit before fixed funding (£)" },
    ],
  },
};

export function commercialCalculations(kind, data, { financial = true, next = true } = {}) {
  const errors = [];
  const notes = [];
  const config = commercialConfig[kind];
  const fields = financial ? config.numeric : [];
  const values = Object.fromEntries(fields.map(({ key, label }) => {
    const value = readNumber(at(data, key), key.endsWith("Units"));
    if (Number.isNaN(value) || (key !== "contribution" && value !== null && value < 0)) errors.push(`Enter a valid value for ${label}.`);
    return [key, value];
  }));
  const rows = Object.fromEntries(config.groups.map((group) => {
    const usable = (financial || group.key !== "investment") && (next || !["milestones", "execution", "measurement"].includes(group.key));
    const result = usable ? normalizedRows(data, group.key, group.labels.length) : [];
    if (result.some((row) => row.some((cell) => !cell))) errors.push(`Complete each row in ${group.title.toLowerCase()} or remove it.`);
    return [group.key, result];
  }));
  if (kind === "jbp") {
    const { baselineSales, targetSales, funding } = values;
    if (financial && (baselineSales === null) !== (targetSales === null)) errors.push("Enter both baseline and target sales to calculate the growth ambition.");
    const investments = rows.investment.map((row) => ({ row, amount: readNumber(row[1]) }));
    if (investments.some(({ amount }) => amount === null || Number.isNaN(amount) || amount < 0)) errors.push("Enter a non-negative budget on each funding line.");
    const total = investments.reduce((sum, { amount }) => sum + Math.round((amount ?? 0) * 100), 0) / 100;
    if (investments.length && funding !== null && Math.round((funding - total) * 100) !== 0) {
      errors.push(`Funding lines total ${money(total)} against a ${money(funding)} envelope. Reconcile the difference before exporting.`);
    }
    if (investments.length && !errors.length) notes.push(`Funding lines reconcile to ${money(total)}.`);
    const hasSales = Number.isFinite(baselineSales) && Number.isFinite(targetSales);
    const growth = hasSales && baselineSales > 0 ? (targetSales - baselineSales) / baselineSales * 100 : null;
    const sales = hasSales ? { baseline: baselineSales, target: targetSales, growth, change: targetSales - baselineSales } : null;
    if (sales && !errors.length) notes.push(`Supplier net sales move by ${signedMoney(sales.change)}${growth === null ? "" : ` (${signed.format(growth)}%)`}.`);
    return { errors, notes, sales, funding: funding ?? (investments.length ? total : null), investments, rows };
  }

  const { baselineUnits, downsideUnits, expectedUnits, upsideUnits, funding, contribution } = values;
  const volumes = [downsideUnits, expectedUnits, upsideUnits];
  const hasAssumptions = financial && fields.some(({ key }) => at(data, key));
  if (hasAssumptions && (!Number.isFinite(baselineUnits) || !Number.isFinite(expectedUnits))) errors.push("Enter baseline and expected total units to calculate incremental volume.");
  if (financial && (funding === null) !== (contribution === null)) errors.push("Enter both fixed funding and contribution per incremental unit to calculate the economics.");
  if (hasAssumptions && ((downsideUnits !== null && downsideUnits > expectedUnits) || (upsideUnits !== null && upsideUnits < expectedUnits))) errors.push("Put downside, expected and upside totals in ascending order.");
  const economics = financial && Number.isFinite(funding) && Number.isFinite(contribution);
  const breakEven = economics && funding === 0 && contribution >= 0 ? 0
    : economics && contribution > 0 ? Math.ceil(Math.round(funding * 100) / Math.round(contribution * 100)) : null;
  const scenarios = volumes.map((total, index) => {
    if (!Number.isFinite(total) || !Number.isFinite(baselineUnits)) return null;
    const incremental = total - baselineUnits;
    const profit = economics ? (incremental * Math.round(contribution * 100) - Math.round(funding * 100)) / 100 : null;
    return {
      label: ["Downside", "Expected", "Upside"][index], total, incremental, profit,
      uplift: baselineUnits > 0 ? incremental / baselineUnits * 100 : null,
      headroom: breakEven === null ? null : incremental - breakEven,
    };
  });
  if (!errors.length && scenarios[1]) {
    notes.push(`Expected incremental volume is ${units.format(scenarios[1].incremental)} units.`);
    if (economics) notes.push(breakEven === null
      ? "A positive contribution per incremental unit is needed for a finite break-even volume."
      : `Break-even is ${units.format(breakEven)} incremental units. Expected contribution after funding is ${money(scenarios[1].profit)}.`);
    if (economics && scenarios[1].profit < 0) notes.push("The expected case loses money. Rework the terms or record why approval is still justified.");
  }
  return { errors, notes, baselineUnits, funding, contribution, breakEven, scenarios, economics, rows };
}

/**
 * @param {keyof typeof commercialConfig} kind
 * @param {Record<string, any>} data
 * @param {{financial?: boolean, next?: boolean}} options
 */
export function commercialPages(kind, data, options = {}) {
  if (kind !== "jbp" && kind !== "promo-proposal") return planningPages(kind, data, options);
  const model = commercialCalculations(kind, data, options);
  const decision = at(data, "decision");
  const benefit = at(data, "benefit");
  const scope = at(data, "scope");
  const evidence = at(data, "evidence");
  const governance = at(data, "governance");
  const pages = [];
  const note = (title, guidance, records) => {
    const rows = records.filter(([, value]) => value);
    if (rows.length) pages.push({ title, guidance, rows });
  };
  const table = (title, guidance, headers, rows, widths, keepLabels = false) => {
    for (let offset = 0; offset < rows.length; offset += 4) {
      const count = Math.ceil(rows.length / 4);
      pages.push({ title: count > 1 ? `${title} (${offset / 4 + 1} of ${count})` : title, guidance, headers, rows: rows.slice(offset, offset + 4), widths, keepLabels });
    }
  };
  const chart = (title, guidance, points) => { if (points.length > 1 && points.some(({ value }) => value)) pages.push({ title, guidance, chart: points }); };
  const groupTable = (group, guidance) => table(group.title, guidance, group.labels, model.rows[group.key], group.widths);
  if (kind === "jbp") {
    const salesLine = model.sales ? `Grow supplier net sales from ${money(model.sales.baseline)} to ${money(model.sales.target)}${model.sales.growth === null ? "" : ` (${signed.format(model.sales.growth)}%)`}.` : "";
    note("Joint ambition and decision", "Lead with the annual target, retailer benefit and approval needed.", [
      ["Decision today", decision], ["Joint ambition", salesLine || scope], ["Retailer benefit", benefit],
    ]);
    const targetRows = [
      ...(model.sales ? [["Supplier net sales", money(model.sales.baseline), money(model.sales.target), "Comparable annual supplier net sales"]] : []),
      ...model.rows.targets,
    ];
    table("Performance baselines and targets", "Use the same reporting basis and record where each baseline comes from.", jbpGroups[0].labels, targetRows, jbpGroups[0].widths);
    note("Customer and category evidence", "Connect the account opportunity to the proposed activity.", [["Scope", salesLine ? scope : ""], ["Evidence", evidence]]);
    groupTable(jbpGroups[1], "Set out what the supplier and retailer will each do, and how to assess the outcome.");
    const investmentRows = model.investments.map(({ row, amount }) => [row[0], money(amount), row[2], row[3]]);
    if (investmentRows.length) {
      table(jbpGroups[2].title, `Proposed envelope ${money(model.funding)} · Check release conditions before committing funds.`, jbpGroups[2].labels, investmentRows, jbpGroups[2].widths);
      if (model.investments.length <= 6) chart("Investment by priority", "Each allocation is part of the funding envelope.", model.investments.map(({ row, amount }) => ({ label: row[0], value: amount, display: money(amount) })));
    } else {
      note(jbpGroups[2].title, "State the envelope and agree how funds will be released.", [["Investment envelope", model.funding === null ? "" : money(model.funding)]]);
    }
    groupTable(jbpGroups[4], "Agree the trigger, response and owner for each risk.");
    groupTable(jbpGroups[3], "Give each quarter an owner and a measurable decision or outcome.");
    note("Review cadence and approval", "Capture the approval and the forum that will track delivery.", [["Decision requested", decision], ["Governance", governance]]);
  } else {
    const expected = model.scenarios[1];
    const result = expected ? `${units.format(expected.incremental)} incremental units expected${model.economics ? `; ${signedMoney(expected.profit)} contribution after funding.` : "."}` : "";
    note("Offer and approval requested", "Lead with the offer, the commercial case and the buying decision.", [["Decision today", decision], ["Offer", scope], ["Expected result", result || benefit]]);
    note("Retailer benefit and baseline", "Use comparable stores and periods, and make the shopper benefit explicit.", [["Retailer benefit", benefit], ["Baseline and assumptions", evidence]]);
    const columns = ["Measure", "Downside", "Expected", "Upside"];
    const scenarioRow = (label, formatter) => [label, ...model.scenarios.map((scenario) => scenario ? formatter(scenario) : "—")];
    if (expected) {
      table("Unit forecast and uplift", `Comparable baseline: ${units.format(model.baselineUnits)} units.`, columns, [
        scenarioRow("Total units", ({ total }) => units.format(total)),
        scenarioRow("Incremental units", ({ incremental }) => units.format(incremental)),
        scenarioRow("Uplift vs baseline", ({ uplift }) => uplift === null ? "—" : `${signed.format(uplift)}%`),
      ], [.34, .22, .22, .22], true);
    }
    if (expected && model.economics) {
      table("Funding and break-even", `Fixed funding ${money(model.funding)} · ${unitCurrency.format(model.contribution)} contribution per incremental unit before funding.`, columns, [
        scenarioRow("Contribution after funding", ({ profit }) => signedMoney(profit)),
        scenarioRow("Contribution before funding", ({ profit }) => money(profit + model.funding)),
        scenarioRow("Break-even incremental units", () => model.breakEven === null ? "No finite break-even" : units.format(model.breakEven)),
        scenarioRow("Incremental units vs break-even", ({ headroom }) => headroom === null ? "—" : signed.format(headroom)),
      ], [.40, .20, .20, .20], true);
      chart("Contribution after funding by scenario", "Compare profit or loss against the zero contribution line.", model.scenarios.filter(Boolean).map(({ label, profit }) => ({ label, value: profit, display: signedMoney(profit) })));
    }
    groupTable(promoGroups[0], "Separate funding approval, in-store execution and data delivery.");
    groupTable(promoGroups[1], "Record the baseline or source, success threshold and who will run the review.");
    const guardrail = model.breakEven === null ? "" : `Review the offer below ${units.format(model.breakEven)} incremental units.`;
    note("Recommendation and approval conditions", "State the decision and the conditions that must hold before booking.", [
      ["Decision requested", decision], ["Approval conditions", governance], ["Volume guardrail", guardrail],
    ]);
  }
  return { pages, ...model };
}
