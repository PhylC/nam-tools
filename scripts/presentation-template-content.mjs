import { qbrBenchmark as qbr, qbrColumns, qbrHeadings } from "../src/app/custom-deck/qbrBenchmark.mjs";
import { commercialConfig, commercialPages } from "../src/app/custom-deck/commercialBenchmarks.mjs";

const table = (title, guidance, headers, rows, keepLabels = true) => ({ title, guidance, headers, rows, keepLabels });
const notes = (title, guidance, rows) => ({ title, guidance, rows });

function commercialTemplate(kind, file, summary) {
  const { label, benchmark } = commercialConfig[kind];
  const { pages, errors } = commercialPages(kind, benchmark);
  if (errors.length) throw new Error(errors.join(" "));
  const starterGuidance = {
    "Investment and release conditions": "Set the envelope, reconcile funding lines and agree the release conditions.",
    "Unit forecast and uplift": "Use a comparable baseline with the same stores and duration in all three scenarios.",
    "Funding and break-even": "Compare contribution after fixed funding and show the break-even incremental volume.",
  };
  return {
    file, title: label, customer: benchmark.customer, period: benchmark.period, exampleTitle: benchmark.title, summary,
    slides: pages.map((page) => ({
      ...page,
      guidance: starterGuidance[page.title] ?? (page.guidance.includes("×") ? "Enter the store count, weeks on shelf and scenario assumptions." : page.guidance.replace(/^Reconciled total: [^.]+\. /, "")),
      exampleGuidance: page.guidance,
      colW: page.widths?.map((width) => width * 11.9),
      rowH: page.headers ? .87 : undefined,
    })),
  };
}

export const decks = [
  commercialTemplate("jbp", "joint-business-plan-template.pptx", "Agree the annual growth target, joint commitments and the conditions for releasing investment."),
  {
    file: "quarterly-business-review-template.pptx", title: "Quarterly Business Review",
    customer: qbr.account, period: qbr.period, exampleTitle: "Bridgeway Grocers quarterly review",
    summary: "Review the quarter against plan, explain the variance and agree actions for the next quarter.",
    slides: [
      {
        ...notes(qbrHeadings.decisions, "State the headline and what you need the buyer to agree today.", [
          ["Result", qbr.result], ["Why it matters", qbr.implication], ["Decision today", qbr.decision],
        ]),
        exampleTitle: qbr.headline,
        exampleGuidance: "Q3 FY26 · Decision for the buyer",
      },
      {
        ...table(qbrHeadings.commitments, "Bring forward the last review’s commitments and show what happened.", qbrColumns.commitments, qbr.commitments, false),
        colW: [3.35, 1.65, 1.55, 5.35], rowH: .78,
      },
      {
        ...table(qbrHeadings.scorecard, "Compare the same commercial measures against plan and a comparable prior period.", qbrColumns.scorecard, qbr.scorecard.map(([name, , , , , ...display]) => [name, ...display])),
        colW: [3.35, 1.85, 1.85, 1.85, 3], rowH: .69,
        exampleGuidance: "Q3 FY26 vs Q2 FY26 · Supplier net sales after discounts · Rate variances in percentage points",
      },
      {
        title: qbrHeadings.bridge,
        guidance: "Replace the sample bars and labels. Signed impacts must add up to actual less plan.",
        exampleGuidance: "£400k plan to £410k actual · Contributions shown as movements against plan",
        waterfall: qbr.drivers,
        total: { label: "Actual vs plan", value: 10000, display: "+£10k" },
      },
      table("Promotion performance", "Record the baseline, incremental result and funding consistently.", ["Measure", "Plan", "Actual", "Implication"], [
        ["Incremental units", "10,000", "11,000", "Exceeded assumption"],
        ["Funding", "£8.0k", "£8.0k", "On budget"],
        ["Contribution after funding", "£1.0k", "£1.9k", "Repeat with availability guardrail"],
      ]),
      table("Distribution and range", "Explain where listings changed and what the store data says.", ["Change", "Where", "Result", "Action"], [
        ["Core listing expansion", "25 additional stores", "Weighted distribution reached 80%", "Check rate of sale after eight weeks"],
        ["Availability gaps", "Top 15 stores", "Missed sales concentrated in two SKUs", "Agree daily stock exception reporting"],
      ]),
      table("Competitor activity", "Record the evidence rather than relying on informal reports.", ["Observation", "Source", "Potential implication"], [
        ["Competitor added a value pack", "Shelf checks in eight stores", "Test sensitivity to pack size before changing price"],
        ["Competitor feature activity rose", "Retailer period calendar", "Watch feature overlap before booking dates"],
      ], false),
      {
        ...table(qbrHeadings.actions, "Agree who will act, by when, and how the next QBR will judge progress.", qbrColumns.actions, qbr.actions, false),
        colW: [2.85, 1.65, 1.45, 2.2, 3.75], rowH: .9,
      },
      notes("Commercial asks", "Close with the decisions you need and when they must be made.", [
        ["Ask", "Approve a daily stock exception report for the top 15 stores."],
        ["Owner", "Retail operations and the supplier account team."],
        ["Next review", "Check availability and margin performance in four weeks."],
      ]),
    ],
  },
  commercialTemplate("promo-proposal", "promotional-proposal-template.pptx", "Present the offer, show the downside and break-even, and agree approval and post-event measurement."),
  commercialTemplate("account-plan", "account-plan-template.pptx", "Prioritise growth opportunities, focus resources and agree the next 90 days."),
  commercialTemplate("range-review", "range-review-template.pptx", "Compare SKU productivity, account for displaced volume and agree which range changes to test."),
  commercialTemplate("product-launch", "new-product-launch-template.pptx", "Make the listing case, forecast launch volume and agree readiness and post-launch measures."),
  commercialTemplate("annual-planning", "annual-planning-template.pptx", "Review results against plan, reconcile the growth target and set funding decisions for each quarter."),
  commercialTemplate("buyer-meeting", "buyer-meeting-prep-template.pptx", "Prepare the buyer decision, objection responses, internal negotiation limits and follow-up."),
  commercialTemplate("buyer-meeting-external", "buyer-meeting-proposal-template.pptx", "Present the proposal, retailer benefit, supporting evidence and joint next steps."),
  commercialTemplate("category-opportunity", "category-opportunity-deck-template.pptx", "Size the opportunity for the retailer separately from the category and agree a measurable pilot."),
];
