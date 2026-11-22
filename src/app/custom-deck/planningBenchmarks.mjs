const group = (key, title, item, labels, widths, guidance, rows, { next = false, financial = false, rank = false, keepLabels = false } = {}) =>
  ({ key, title, item, labels, widths, guidance, rows, next, financial, rank, keepLabels });
const number = (key, label, note = "") => ({ key, label, note });
const periods = ["Day 30", "Day 60", "Day 90"];
const cases = ["Downside", "Expected", "Upside"];

const range = {
  label: "Range Review", short: "range review", audience: "Retailer/customer meeting",
  questions: ["Which category, stores and review period are in scope?", "What shopper or shelf outcome would improve?", "Which range changes should the buyer approve?", "What must the pilot prove before rollout?"],
  evidenceQuestion: "Which EPOS, availability and margin sources support the comparisons?",
  benchmark: {
    title: "Northstar chilled snack range review", customer: "Northstar Retail", period: "13 weeks to 30 September",
    scope: "Chilled snacks across 60 comparable stores. Use the same 13-week period and shelf space for all comparisons.",
    benefit: "Fill the top-up mission with a smaller, lower-priced pack while protecting category contribution.",
    decision: "Retain the core pack and test replacing the family pack in 20 stores for eight weeks.",
    evidence: "Retailer EPOS and on-shelf reports for 60 stores. Rate of sale is units per ranged store per week. Family pack availability was above 95%.",
    governance: "Roll out only if category contribution per store per week is up at least 5% against matched controls and availability reaches 95%.",
    gainedUnits: "1280", displacedUnits: "800",
  },
  numeric: [number("gainedUnits", "Forecast units gained in the test"), number("displacedUnits", "Forecast units displaced in the same stores and weeks")],
  groups: [
    group("sku", "Comparable SKU performance and decisions", "SKU", ["SKU", "Units / store / week", "Availability", "Margin", "Decision"], [.21,.19,.17,.15,.28], "Compare the same store cohort, period and margin basis before changing the range.", [
      ["Core snack 90g", "9.2", "97%", "30%", "Keep"],
      ["Family pack 180g", "5.0", "96%", "31%", "Replace"],
      ["Top-up snack 65g", "8.0 (trial)", "97% (trial)", "29%", "Test expansion"],
    ]),
    group("pilot", "Pilot and rollout decision", "Pilot measure", ["Measure", "Comparator", "Success threshold", "Owner / review"], [.22,.25,.28,.25], "Agree the comparator and success thresholds before changing the shelf.", [
      ["Category contribution", "20 matched control stores", "+5% per store per week", "Category lead · week 8"],
      ["Availability", "Pilot EPOS and stock", "At least 95%", "Retail operations · weekly"],
    ], { next: true }),
  ],
  execution: "Pilot and rollout",
};

const launch = {
  label: "New Product Launch", short: "launch", audience: "Retailer/customer meeting",
  questions: ["What are you launching, where and when?", "Which shopper need does it meet and why will the retailer list it?", "What listing or support decision do you need from the buyer?", "What needs to be ready before launch and when will you review it?"],
  evidenceQuestion: "What is the evidence for shopper demand, shelf fit and forecast rates?",
  benchmark: {
    title: "Westfield oat bites launch", customer: "Westfield Stores", period: "September launch · first 12 weeks",
    scope: "Launch a £2.25 oat snack in the lunch-to-go fixture for a 12-week trial.",
    benefit: "Add a portable mid-price snack between the entry bar and premium multipacks.",
    decision: "Approve the conditional listing in 80 stores and agree the first shipment and week-12 review.",
    evidence: "A six-week test in 12 comparable stores averaged six units per store per week with 96% availability. Base forecast assumes flat distribution.",
    governance: "Confirm item setup, stock and assets before shipment. Review if rate of sale is below five units at week four.",
    stores: "80", weeks: "12", downsideRate: "4", expectedRate: "6", upsideRate: "8",
  },
  numeric: [
    number("stores", "Ranged stores"), number("weeks", "Weeks on shelf"),
    ...cases.map((label) => number(label.toLowerCase() + "Rate", label + " units per store per week")),
  ],
  groups: [
    group("activation", "Shelf and activation plan", "Activation", ["Tactic", "Shopper objective", "Owner", "Measure"], [.23,.31,.20,.26], "Set out what the buyer is approving alongside the listing.", [
      ["Shelf placement", "Make the product easy to find", "Buyer", "80 stores ranged"],
      ["Shelf-edge label", "Show £2.25 shelf price", "Retail operations", "90% compliant stores"],
    ]),
    group("readiness", "Stock readiness and launch milestones", "Milestone", ["Milestone", "Due", "Dependency", "Owner"], [.30,.15,.33,.22], "Make each launch gate conditional on a named prerequisite.", [
      ["Item setup complete", "Four weeks prior", "Listing approved", "Buyer"],
      ["First shipment", "One week prior", "Opening stock at depot", "Supply lead"],
      ["Post-launch review", "Week 12", "EPOS, margin and availability", "Category lead"],
    ], { next: true }),
    group("review", "Post-launch success measures", "Measure", ["Measure", "Target", "Evidence", "Review"], [.24,.21,.28,.27], "Use the same range and period as the sales forecast.", [
      ["Rate of sale", "6 per store per week", "EPOS from 80 stores", "Category lead · week 12"],
      ["On-shelf availability", "At least 95%", "Weekly availability report", "Retail operations · weekly"],
    ], { next: true }),
  ],
  execution: "Readiness and measurement",
};

const category = {
  label: "Category Opportunity", short: "category opportunity", audience: "Retailer/customer meeting",
  questions: ["Which category, retailer and store segment are you sizing?", "Which shopper need would the opportunity address?", "What test or investment should the retailer approve?", "What result would justify scaling the test?"],
  evidenceQuestion: "Which market and retailer sources support the benchmark? Include the period and scope.",
  benchmark: {
    title: "Northstar chilled snack opportunity", customer: "Northstar Retail", period: "26-week opportunity",
    scope: "Chilled snack packs in 120 large Northstar stores over 26 weeks.",
    benefit: "Give top-up shoppers a smaller pack at a price point missing from the current shelf.",
    decision: "Approve a 20-store matched pilot before committing to the 120 eligible stores.",
    evidence: "Retailer EPOS, 13 weeks to September. Benchmark reflects the same pack size and comparable large stores. Incremental rates allow for displaced sales.",
    governance: "Scale only if the pilot adds at least two units per store per week and improves category contribution against matched controls.",
    marketValue: "1800000", stores: "120", weeks: "26", unitValue: "2.50", downsideRate: "1", expectedRate: "2", upsideRate: "3",
  },
  numeric: [
    number("marketValue", "Total category opportunity (£)", "Use the market scope and period described above."),
    number("stores", "Eligible retailer stores"), number("weeks", "Weeks in the retailer opportunity"),
    number("unitValue", "Retail sales value per incremental unit (£)"),
    ...cases.map((label) => number(label.toLowerCase() + "Rate", label + " incremental units per store per week")),
  ],
  groups: [
    group("benchmarks", "Benchmark evidence", "Benchmark", ["Measure", "Retailer", "Comparable benchmark", "Source / period"], [.24,.19,.28,.29], "Record the like-for-like basis and separate gaps from measured results.", [
      ["Small-pack share", "8%", "13% in comparable estates", "Retail EPOS · 13 weeks"],
      ["Shelf fixture", "One small-pack line", "Two in comparable stores", "Store audit · September"],
    ]),
    group("pilot", "Pilot and scale threshold", "Pilot measure", ["Measure", "Test scope", "Success threshold", "Owner / review"], [.22,.24,.30,.24], "Agree how to measure the retailer result before making an estate-wide claim.", [
      ["Incremental units", "20 test and 20 controls", "2 per store per week", "Retail analyst · week 8"],
      ["Category contribution", "Same stores and weeks", "Positive vs controls", "Category lead · week 8"],
    ], { next: true }),
  ],
  execution: "Pilot and measurement",
};

const account = {
  label: "Account Plan", short: "account plan", audience: "Internal review",
  questions: ["Which account and planning window does this cover?", "Where is the strongest evidence of growth or a service gap?", "What internal resource or decision do you need?", "What should the team achieve in the next 90 days?"],
  evidenceQuestion: "What does the current scorecard or stakeholder evidence show?",
  benchmark: {
    title: "Northstar Retail 90-day account plan", customer: "Northstar Retail", period: "Q1 internal plan",
    scope: "Core grocery portfolio. Supplier net sales of £2.0m and 94% availability in FY26.",
    benefit: "Focus on availability and the top-up range pilot before funding wider work.",
    decision: "Allocate a category analyst and release £18,000 for availability and the pilot.",
    evidence: "FY26 finance report and Northstar stock report. Most missed sales came from 15 stores with repeat stock gaps.",
    governance: "Review funding and delivery at days 30, 60 and 90. Pause any workstream without data or an accountable owner.",
  },
  numeric: [],
  groups: [
    group("opportunities", "Ranked opportunities", "Opportunity", ["Opportunity", "Potential value (£)", "Confidence", "Reason / next step"], [.26,.19,.16,.39], "Rank by value, then confidence. Use high, medium or low confidence to decide what to commit to or test.", [
      ["Range pilot", "90000", "Medium", "Confirm comparable-store rate of sale"],
      ["Availability recovery", "120000", "High", "Validate losses in the top 15 stores"],
      ["Promotion test", "40000", "Low", "Wait for a matched baseline"],
    ], { rank: true }),
    group("resources", "Resources and decisions", "Resource", ["Priority", "Capacity or funding", "Outcome", "Approver"], [.24,.28,.28,.20], "Bring the trade-offs and named approvers to the account review.", [
      ["Availability", "£10,000 supply support", "97% availability", "Sales director"],
      ["Range pilot", "£8,000 and one analyst", "Pilot rate of sale up 8%", "Category director"],
      ["Promotion test", "Defer funding", "Revisit after baseline", "Commercial finance"],
    ], { financial: true }),
    group("actions", "30-, 60- and 90-day action plan", "Milestone", ["When", "Milestone", "Owner", "Measure"], [.13,.34,.21,.32], "Assign a named owner and measurable outcome at each checkpoint.", [
      [periods[0], "Start stock exception reporting", "Supply lead", "15 stores reporting weekly"],
      [periods[1], "Open the range pilot", "Category analyst", "20 matched stores live"],
      [periods[2], "Review investment and scale", "Account lead", "97% availability and +8% pilot rate"],
    ], { next: true, keepLabels: true }),
  ],
  execution: "90-day delivery",
};

const annual = {
  label: "Annual Planning", short: "annual plan", audience: "Leadership review",
  questions: ["Which business and financial year are you planning for?", "What did last year teach you about growth and constraints?", "What target and resource allocation must leadership approve?", "When should leadership release, redirect or stop funding?"],
  evidenceQuestion: "Which plan and actuals are comparable? Explain material variances and assumptions.",
  benchmark: {
    title: "Northstar FY27 annual operating plan", customer: "Northstar Retail", period: "FY27 operating plan",
    scope: "Commercial team budget for the Northstar grocery portfolio.",
    benefit: "Recover lost availability and build on the proven core listings.",
    decision: "Approve the £2.2m net sales target and £30,000 investment envelope.",
    evidence: "FY26 finance close, supplier net sales after discounts. Stock gaps slowed the first half and new listings helped the second half.",
    governance: "Release pilot funding after matched stores are agreed. Redirect unspent pilot funding if results miss the Q2 hurdle.",
    priorPlan: "2050000", priorActual: "2000000", nextTarget: "2200000", envelope: "30000",
  },
  numeric: [number("priorPlan", "Prior-year net sales plan (£)"), number("priorActual", "Prior-year net sales actual (£)"), number("nextTarget", "Next-year net sales target (£)"), number("envelope", "Investment envelope (£)")],
  groups: [
    group("drivers", "Growth drivers behind the new target", "Driver", ["Driver", "Net sales change (£)", "Evidence or assumption", "Owner"], [.23,.20,.38,.19], "Signed growth drivers should add up to the target less prior-year actual.", [
      ["Availability recovery", "100000", "Close repeat gaps in 15 stores", "Supply"],
      ["New listings", "120000", "Roll out existing proven lines", "Category"],
      ["Discontinued lines", "-20000", "Remove two low-rate lines", "Account lead"],
    ], { financial: true }),
    group("investment", "Funding decisions and release gates", "Funding line", ["Priority", "Budget (£)", "Release or redirect condition", "Approver"], [.23,.15,.42,.20], "Check the funding lines against the overall envelope before approving the plan.", [
      ["Availability", "10000", "Stock reports agreed", "Sales director"],
      ["Range expansion", "12000", "Matched pilot meets rate hurdle", "Category director"],
      ["Contingency", "8000", "Q3 reforecast confirms need", "Finance"],
    ], { financial: true }),
    group("roadmap", "Quarterly resource decisions", "Milestone", ["Quarter", "Milestone", "Decision", "Owner"], [.12,.30,.37,.21], "Agree when to review the plan and free up or redirect resources.", [
      ["Q1", "Confirm baselines and owners", "Release availability funding", "Sales director"],
      ["Q2", "Review pilot results", "Release or redirect listing funding", "Category director"],
      ["Q3", "Reforecast net sales and spend", "Release or retain contingency", "Finance"],
      ["Q4", "Close plan and record lessons", "Reset next-year targets", "Leadership"],
    ], { next: true, keepLabels: true }),
  ],
  execution: "Quarterly decisions",
};

const meeting = {
  label: "Buyer Meeting Planner", short: "meeting prep", audience: "Internal review",
  questions: ["Who is attending and what is the purpose of the meeting?", "What matters to the buyer and what evidence do you have?", "What decision do you want the buyer to make?", "How will you close the meeting and confirm follow-up?"],
  evidenceQuestion: "What questions and evidence will you bring into the meeting?",
  benchmark: {
    title: "Westfield listing meeting · internal prep", customer: "Westfield Stores", period: "September range meeting",
    scope: "Grocery buyer and supplier category lead reviewing a small-pack listing.",
    benefit: "A £2.25 snack fills the mid-price shelf gap in the lunch-to-go fixture.",
    decision: "Agree an 80-store launch trial and a joint review at week 12.",
    evidence: "The 12-store trial averaged six units per store per week at 96% availability. Ask which stores and shelf dates the buyer can commit.",
    governance: "Confirm the store list and review date in writing within two working days.",
  },
  numeric: [],
  groups: [
    group("objections", "Buyer objections and evidence-led responses", "Objection", ["Likely objection", "Response", "Evidence", "Question to ask"], [.23,.29,.25,.23], "Prepare a response and a question that tests what is driving each objection.", [
      ["Limited shelf space", "Trial within the existing fixture", "Comparable shelf audit", "Which stores have space?"],
      ["Sales risk", "Review at week 12", "Trial rate of sale was six", "Which hurdle do you use?"],
    ]),
    group("negotiation", "Internal negotiation limits", "Guardrail", ["Target ask", "Walk-away position", "Concession and trade", "Approval limit / approver"], [.24,.24,.27,.25], "Use these limits during internal preparation. Share the separate buyer-facing deck externally.", [
      ["80-store trial", "No rollout below 40 stores", "Up to £1,200 for agreed display", "£1,200 · sales director"],
      ["12-week review", "Require weekly EPOS", "Delay launch by up to 2 weeks", "Supply lead approves change"],
    ]),
    group("followup", "Internal follow-up", "Action", ["Action", "Owner", "Due", "Evidence of completion"], [.33,.21,.15,.31], "Close the meeting with a decision or a dated next step.", [
      ["Send decision recap", "Account lead", "Two days", "Written buyer confirmation"],
      ["Confirm item setup", "Supply lead", "One week", "Approved setup sheet"],
    ], { next: true }),
  ],
  execution: "Meeting close",
};

const buyer = {
  label: "Buyer Meeting Proposal", short: "buyer-facing proposal", audience: "Retailer/customer meeting",
  questions: ["Who is the proposal for and what are you meeting to discuss?", "What benefit can you substantiate for the retailer and shopper?", "What decision are you asking the buyer to make?", "What next steps can you agree together?"],
  evidenceQuestion: "Which supporting facts and sources are approved to share with the buyer?",
  benchmark: {
    ...meeting.benchmark,
    title: "Westfield small-pack trial proposal",
    scope: "A 12-week small-pack trial for Westfield’s lunch-to-go fixture.",
    evidence: "The earlier 12-store trial averaged six units per store per week at 96% availability.",
  },
  numeric: [],
  groups: [
    group("proof", "Evidence supporting the proposal", "Proof point", ["Claim", "Evidence", "Source / period", "Buyer relevance"], [.23,.27,.25,.25], "Include only evidence that can be shared with the retailer.", [
      ["Demonstrated sales", "6 units per store per week", "12-store EPOS trial · six weeks", "Practical initial forecast"],
      ["Reliable availability", "96% on-shelf availability", "Trial stock report", "Confidence in shelf supply"],
    ]),
    group("followup", "Joint next steps", "Action", ["Action", "Owner", "Due", "Success measure"], [.30,.23,.18,.29], "Confirm the joint follow-up and when the decision will be reviewed.", [
      ["Confirm test stores and dates", "Buyer and account lead", "Two working days", "80 stores agreed"],
      ["Review the trial", "Category leads", "Week 12", "Sales and shelf availability"],
    ], { next: true }),
  ],
  execution: "Joint next steps",
};

export const planningConfig = {
  "range-review": range,
  "product-launch": launch,
  "category-opportunity": category,
  "account-plan": account,
  "annual-planning": annual,
  "buyer-meeting": meeting,
  "buyer-meeting-external": buyer,
};

for (const config of Object.values(planningConfig)) {
  for (const { key, rows } of config.groups) config.benchmark[key] = rows;
}
