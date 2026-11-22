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
      guidance: starterGuidance[page.title] ?? page.guidance,
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
  {
    file: "account-plan-template.pptx", title: "Account Plan",
    summary: "Prioritise growth opportunities, focus resources and agree the next 90 days.",
    slides: [
      notes("Customer context", "Give the team the context needed to make decisions.", [["Customer strategy"], ["Decision-makers"], ["Relationship and timing"]]),
      table("Current business performance", "Compare current results with a relevant benchmark.", ["Measure", "Current", "Benchmark", "Implication"], [["Net sales"], ["Gross margin"], ["Availability"], ["Trade investment"]]),
      notes("Customer priorities", "Translate known customer needs into clear planning implications.", [["Business priority"], ["Commercial constraint"], ["Decision calendar"]]),
      table("Opportunity map", "Rank opportunities by value, feasibility and confidence.", ["Opportunity", "Potential value", "Confidence", "Next step"], [["Range"], ["Distribution"], ["Promotion"], ["Terms"]]),
      notes("Growth levers", "Choose the initiatives with a clear route to execution.", [["Where to focus"], ["What to pause"], ["How to measure"]]),
      table("Commercial priorities and investment", "Record the funding decision and the conditions for release.", ["Priority", "Resource or investment", "Expected outcome", "Approver"], [["Priority 1"], ["Priority 2"], ["Priority 3"]]),
      table("Risks and dependencies", "Agree when each risk should be escalated.", ["Risk", "Trigger", "Response", "Owner"], [["Commercial"], ["Operational"], ["Customer"]]),
      table("90-day action plan", "Assign an owner and a measurable milestone to each period.", ["Timing", "Action", "Owner", "Measure"], [["First 30 days"], ["Days 31–60"], ["Days 61–90"]]),
    ],
  },
  {
    file: "range-review-template.pptx", title: "Range Review",
    summary: "Evaluate SKU productivity and propose the range changes with the strongest evidence.",
    slides: [
      notes("Current range overview", "Define the category, time period and store scope.", [["Range decision"], ["Store scope"], ["Baseline and data source"]]),
      table("SKU productivity", "Compare rate of sale across similar stores and availability.", ["SKU", "Units per store per week", "Margin", "Decision"], [["SKU 1"], ["SKU 2"], ["SKU 3"]]),
      table("Distribution gaps", "Measure where additional listings could be productive.", ["SKU or range", "Current distribution", "Target opportunity", "Evidence"], [["Core"], ["New"], ["Regional"]]),
      table("Rate of sale analysis", "Compare stores with similar traffic and enough on-shelf availability.", ["Store group", "Rate of sale", "Availability", "Implication"], [["High productivity"], ["Typical stores"], ["Low productivity"]]),
      notes("Category trends", "Show what has changed and how the range should respond.", [["Shopper shift"], ["Category evidence"], ["Range implication"]]),
      table("Rationalisation opportunities", "Use an explicit threshold for retain, review or delist decisions.", ["SKU", "Issue", "Replacement", "Customer impact"], [["Candidate 1"], ["Candidate 2"], ["Candidate 3"]]),
      table("Innovation recommendations", "Test proposed listings against a clear hurdle.", ["Proposed listing", "Customer benefit", "Pilot size", "Success threshold"], [["Innovation 1"], ["Innovation 2"]]),
      table("Recommended actions", "Agree the range decision, timing and practical responsibilities.", ["Action", "Owner", "Timing", "Success measure"], [["Agree decision"], ["Update listings"], ["Review performance"]]),
    ],
  },
  {
    file: "new-product-launch-template.pptx", title: "New Product Launch",
    summary: "Build the sell-in case and agree the forecast, distribution and launch milestones.",
    slides: [
      notes("Launch overview", "State what is launching and the decision needed from the retailer.", [["Product"], ["Customer ask"], ["Target launch window"]]),
      notes("Consumer insight", "Connect the shopper problem with evidence and a reason to buy.", [["Shopper need"], ["Evidence"], ["Reason to buy"]]),
      table("Market opportunity", "Show where the proposition fits and what makes the gap credible.", ["Segment", "Evidence", "Unmet need", "Opportunity"], [["Core shopper"], ["Adjacent shopper"], ["Channel"]]),
      notes("Product proposition", "Describe the benefit, proof and place on shelf.", [["Main benefit"], ["Supporting evidence"], ["Shelf fit"]]),
      table("Launch forecast", "Show the assumptions behind expected sales.", ["Scenario", "Store count", "Units per store per week", "Period units"], [["Downside"], ["Expected"], ["Upside"]]),
      table("Activation plan", "Match each tactic to a shopper objective and measurement plan.", ["Tactic", "Objective", "Investment", "Measure"], [["In-store"], ["Retail media"], ["Sampling"]]),
      table("Launch timeline", "Agree dates before sales, stock and asset commitments are made.", ["Milestone", "Date", "Dependency", "Owner"], [["Listing approval"], ["First shipment"], ["On shelf"], ["Post-launch review"]]),
      notes("Commercial ask", "Summarise what is needed from the buyer.", [["Listing and range"], ["Support and investment"], ["Decision and owner"]]),
    ],
  },
  {
    file: "annual-planning-template.pptx", title: "Annual Planning",
    summary: "Review the year, agree annual targets and turn priorities into a quarterly roadmap.",
    slides: [
      table("Full-year review", "Compare actual results against the original plan.", ["Measure", "Plan", "Actual", "Lesson"], [["Net sales"], ["Margin"], ["Availability"]]),
      notes("Strategic objectives", "Choose a small set of objectives with clear business outcomes.", [["Primary objective"], ["Secondary objective"], ["Constraint to manage"]]),
      table("Annual targets", "Confirm the baseline and source for each target.", ["Measure", "Baseline", "Next year", "Owner"], [["Revenue"], ["Gross margin"], ["Trade investment"], ["Distribution"]]),
      table("Investment priorities", "Link funding to an outcome and approval gate.", ["Priority", "Budget", "Expected outcome", "Approval gate"], [["Core business"], ["Growth test"], ["Contingency"]]),
      table("Quarterly roadmap", "Use one milestone per quarter to track the plan.", ["Quarter", "Deliverable", "Decision", "Owner"], [["Q1"], ["Q2"], ["Q3"], ["Q4"]]),
      table("Risks and review cadence", "Agree when to revisit a target or redirect investment.", ["Risk", "Early signal", "Contingency", "Review date"], [["Demand"], ["Supply"], ["Funding"]]),
    ],
  },
  {
    file: "buyer-meeting-prep-template.pptx", title: "Buyer Meeting Planner",
    summary: "Prepare the decision, supporting evidence, objection responses and follow-up.",
    slides: [
      notes("Meeting objective", "Write the one decision you want to leave the meeting with.", [["Primary decision"], ["Minimum acceptable outcome"], ["Decision-maker"]]),
      notes("Buyer priorities", "Record the buyer's priorities and where you need more information.", [["Known priority"], ["Commercial constraint"], ["Question to ask"]]),
      notes("Key talking points", "Lead with the buyer benefit and use evidence to support your proposal.", [["Opening"], ["Evidence"], ["Commercial ask"]]),
      table("Objections and responses", "Prepare evidence and agree any fallback position internally.", ["Likely objection", "Response", "Evidence", "Fallback"], [["Price"], ["Margin"], ["Availability"]]),
      table("Supporting evidence", "Check that the source and time period match the claim.", ["Claim", "Evidence", "Source or period", "Confidence"], [["Buyer benefit"], ["Commercial case"], ["Operational readiness"]]),
      notes("Desired outcome", "Plan how you will ask for a decision and confirm the next step.", [["Close"], ["Fallback"], ["What to confirm"]]),
      table("Follow-up actions", "Capture who will do what and by when.", ["Action", "Owner", "Due date", "Status"], [["Send recap"], ["Resolve open issue"], ["Confirm next meeting"]]),
    ],
  },
  {
    file: "category-opportunity-deck-template.pptx", title: "Category Opportunity",
    summary: "Use shopper and market evidence to size an opportunity and agree how to test it.",
    slides: [
      table("Category performance", "Use a comparable period and category definition.", ["Measure", "Current period", "Benchmark", "Gap"], [["Category sales"], ["Volume"], ["Distribution"]]),
      notes("Shopper trends", "Connect observed changes in behaviour with the retailer's opportunity.", [["Shopper shift"], ["Evidence"], ["Commercial relevance"]]),
      table("White space opportunities", "Identify the shoppers or stores underserved by the current range.", ["Opportunity", "Signal", "Target shopper or store", "Test"], [["Pack format"], ["Price point"], ["Distribution"]]),
      table("Competitor benchmarking", "Compare like-for-like stores, products and periods.", ["Dimension", "Customer position", "Benchmark", "Implication"], [["Range productivity"], ["Price and pack"], ["Availability"]]),
      table("Opportunity sizing", "Document the assumptions behind the estimate.", ["Scenario", "Eligible stores", "Incremental units", "Value"], [["Downside"], ["Expected"], ["Upside"]]),
      notes("Recommended actions", "Agree which opportunity deserves a test and how you will judge it.", [["Pilot recommendation"], ["Success measure"], ["Decision and owner"]]),
    ],
  },
];
