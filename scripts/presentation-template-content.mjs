const table = (title, guidance, headers, rows, keepLabels = true) => ({ title, guidance, headers, rows, keepLabels });
const notes = (title, guidance, rows) => ({ title, guidance, rows });

export const decks = [
  {
    file: "joint-business-plan-template.pptx", title: "Joint Business Plan",
    customer: "Northstar Retail", exampleTitle: "Joint growth plan for Northstar Retail",
    summary: "Agree the growth ambition, investment and commitments for the year ahead.",
    slides: [
      notes("Executive summary", "Put the proposed decision and its commercial implications up front.", [
        ["Ambition", "Grow annual supplier net sales from £2.0m to £2.2m."],
        ["Joint commitment", "Prioritise availability, range productivity and measured promotions."],
        ["Decision today", "Agree the Q1 baselines, pilot scope and £30k funding envelope."],
      ]),
      table("Customer objectives", "Translate the retailer's priorities into measurable commitments.", ["Priority", "Customer benefit", "Measure"], [
        ["Availability", "Fewer missed purchases", "On-shelf availability at least 97%"],
        ["Range productivity", "More sales per facing", "Pilot rate of sale up 8%"],
        ["Promotion value", "Evidence for funding decisions", "Review incremental contribution after each event"],
      ]),
      table("Business performance", "Use the same reporting period and sales basis for both columns.", ["Measure", "Current year", "Next-year target", "Change"], [
        ["Supplier net sales", "£2.0m", "£2.2m", "+10%"],
        ["On-shelf availability", "94%", "97%", "+3 percentage points"],
        ["Gross margin rate", "27%", "28%", "+1 percentage point"],
      ]),
      notes("Category and shopper trends", "Record the evidence and explain its implication for the retailer.", [
        ["Shopper need", "Shoppers are trading into smaller packs in the weekly top-up channel."],
        ["Evidence", "Retailer basket data shows small packs growing faster in the pilot cluster."],
        ["Implication", "Trial a smaller pack in the 20 stores with the highest top-up mission share."],
      ]),
      table("Growth pillars", "Pair each initiative with an owner and an outcome.", ["Pillar", "Supplier commitment", "Retailer commitment", "Outcome"], [
        ["Availability", "Weekly stock exception report", "Escalate recurring gaps", "97% availability"],
        ["Range productivity", "Fund test stock", "Provide 20 pilot stores", "+8% pilot rate of sale"],
        ["Promotion value", "Supply post-event analysis", "Share EPOS for the test", "Pass contribution hurdle"],
      ]),
      table("Innovation pipeline", "Agree which opportunities have enough evidence to proceed.", ["Opportunity", "Evidence needed", "Decision gate", "Owner"], [
        ["Pack-size trial", "Basket data and margin check", "Approve Q2 test after Q1 review", "Category lead"],
        ["Seasonal multipack", "Forecast and supply readiness", "Commit after pilot results", "Supply lead"],
      ]),
      table("Promotional strategy", "Record the offer, test design and criteria for repeating it.", ["Event", "Mechanic", "Measurement", "Repeat if"], [
        ["Q2 value event", "Two-week price reduction", "Matched stores and baseline weeks", "Positive net contribution"],
        ["Q4 seasonal event", "Feature display", "Incremental units by store cluster", "Meets agreed volume hurdle"],
      ]),
      table("Investment and financial targets", "Reconcile funding lines to the total with finance before committing.", ["Funding line", "Budget", "Release condition", "Owner"], [
        ["Availability improvements", "£10k", "Weekly stock reporting agreed", "Operations"],
        ["Range pilot", "£8k", "Pilot stores and shelf dates confirmed", "Category"],
        ["Promotion tests", "£12k", "Baseline and measurement plan signed off", "Account lead"],
        ["Total", "£30k", "Quarterly review against milestones", "Finance"],
      ]),
      table("Risks and dependencies", "Specify the trigger that requires a decision or escalation.", ["Risk", "Trigger", "Response", "Owner"], [
        ["Supply interruption", "Availability below 94% for two weeks", "Escalate replenishment exceptions", "Supply lead"],
        ["Low pilot uptake", "Rate of sale below baseline at week four", "Review visibility and reconsider rollout", "Category lead"],
      ]),
      table("Joint roadmap and next steps", "Use the quarterly gates to track commitments from both teams.", ["Quarter", "Priority milestone", "Decision or measure", "Owner"], [
        ["Q1", "Agree baseline and trial stores", "Sign off £30k funding envelope", "Both account leads"],
        ["Q2", "Launch range and promotion pilots", "Review pilot rate of sale and funding", "Category lead"],
        ["Q3", "Extend initiatives that meet the hurdle", "Confirm availability above 97%", "Retail operations"],
        ["Q4", "Close the year and agree next priorities", "Review £2.2m supplier net sales goal", "Joint steering group"],
      ]),
    ],
  },
  {
    file: "quarterly-business-review-template.pptx", title: "Quarterly Business Review",
    customer: "Bridgeway Grocers", exampleTitle: "Bridgeway Grocers quarterly review",
    summary: "Review the quarter against plan, explain the variance and agree actions for the next quarter.",
    slides: [
      notes("Quarter summary", "Share the result, the main driver and the decision needed.", [
        ["Result", "Supplier net sales were £410k, £10k ahead of plan."],
        ["Driver", "Range gains and the summer event outweighed missed sales from availability."],
        ["Decision", "Fix availability in the top 15 stores before repeating the event."],
      ]),
      table("Quarterly performance against plan", "Use comparable periods and label margin and distribution changes in percentage points.", ["Measure", "Plan", "Actual", "Variance"], [
        ["Supplier net sales", "£400k", "£410k", "+£10k / +2.5%"],
        ["Units sold", "100k", "104k", "+4k / +4.0%"],
        ["Gross margin rate", "28.0%", "27.5%", "−0.5 percentage points"],
        ["Weighted distribution", "78%", "80%", "+2 percentage points"],
      ]),
      table("Net sales variance by driver", "Check that the contributions add up to the scorecard gap.", ["Driver", "Impact vs plan", "Evidence"], [
        ["Range expansion", "+£9k", "Sales from newly listed stores"],
        ["Summer event", "+£7k", "Incremental sales versus comparable baseline weeks"],
        ["Availability gaps", "−£6k", "Estimated missed sales in top stores"],
        ["Total variance", "+£10k", "Reconciles to supplier net sales"],
      ]),
      table("Promotion performance", "Record the baseline, incremental result and funding consistently.", ["Measure", "Plan", "Actual", "Implication"], [
        ["Incremental units", "10,000", "11,000", "Exceeded assumption"],
        ["Funding", "£8.0k", "£8.0k", "On budget"],
        ["Contribution after funding", "£1.0k", "£1.9k", "Repeat with availability guardrail"],
      ]),
      table("Distribution and range", "Explain where listings changed and what the store data says.", ["Change", "Where", "Result", "Action"], [
        ["Core listing expansion", "25 additional stores", "Weighted distribution reached 80%", "Check rate of sale after eight weeks"],
        ["Availability gaps", "Top 15 stores", "Missed sales concentrated in two SKUs", "Agree daily stock exception reporting"],
      ]),
      notes("Wins and challenges", "Record what should be repeated and what needs action.", [
        ["Repeat", "Use matched baseline weeks for the summer event evaluation."],
        ["Resolve", "Identify whether lost sales came from forecasting or shelf replenishment."],
        ["Escalate", "Review the 0.5 percentage point margin shortfall with finance."],
      ]),
      table("Competitor activity", "Record the evidence rather than relying on informal reports.", ["Observation", "Source", "Potential implication"], [
        ["Competitor added a value pack", "Shelf checks in eight stores", "Test sensitivity to pack size before changing price"],
        ["Competitor feature activity rose", "Retailer period calendar", "Watch feature overlap before booking dates"],
      ], false),
      table("Next-quarter priorities", "Assign an owner and set a measure for each action.", ["Priority", "Owner", "Timing", "Measure"], [
        ["Improve availability", "Retail operations", "First four weeks", "Top 15 stores reach 97%"],
        ["Review range extension", "Category lead", "Week eight", "Rate of sale vs existing stores"],
        ["Repeat promotion selectively", "Account lead", "Next booking window", "Positive net contribution"],
      ], false),
      notes("Commercial asks", "Close with the decisions you need and when they must be made.", [
        ["Ask", "Approve a daily stock exception report for the top 15 stores."],
        ["Owner", "Retail operations and the supplier account team."],
        ["Next review", "Check availability and margin performance in four weeks."],
      ]),
    ],
  },
  {
    file: "promotional-proposal-template.pptx", title: "Promotional Proposal",
    customer: "Westfield Stores", exampleTitle: "Westfield spring promotion proposal",
    summary: "Present the offer, incremental volume, funding and break-even assumptions behind the ask.",
    slides: [
      notes("Proposal summary", "State the offer, the funding request and the decision deadline.", [
        ["Offer", "Two-week shelf-price reduction across 100 stores."],
        ["Funding ask", "£5,000 fixed funding at £0.80 contribution per incremental unit before funding."],
        ["Decision", "Confirm dates, store scope and reporting access before stock is committed."],
      ]),
      table("Promotional mechanic", "Record the deal precisely enough for stores to execute it.", ["Item", "Proposal", "Confirm with"], [
        ["Shelf price", "£3.00 to £2.50", "Buyer"],
        ["Period", "Two weeks", "Trade marketing"],
        ["Store scope", "100 stores with comparable baseline data", "Retail operations"],
        ["Execution", "Shelf-edge label and agreed display space", "Retail operations"],
      ]),
      notes("Commercial rationale", "Explain why this event deserves space and funding.", [
        ["Shopper benefit", "A lower entry price during the spring top-up shopping period."],
        ["Retailer benefit", "Incremental units on a product with established availability."],
        ["Evidence to check", "Use comparable non-promoted weeks for the baseline."],
      ]),
      table("Unit forecast", "Apply the same store count and time window in every scenario.", ["Measure", "Baseline", "Downside", "Expected", "Upside"], [
        ["Total units", "20,000", "25,000", "30,000", "34,000"],
        ["Incremental units", "—", "5,000", "10,000", "14,000"],
        ["Unit uplift vs baseline", "—", "+25%", "+50%", "+70%"],
      ]),
      table("Funding and break-even", "Divide fixed funding by contribution per incremental unit to find the break-even volume.", ["Measure", "Downside", "Expected", "Upside"], [
        ["Contribution before funding", "£4,000", "£8,000", "£11,200"],
        ["Fixed funding", "£5,000", "£5,000", "£5,000"],
        ["Contribution after funding", "−£1,000", "£3,000", "£6,200"],
        ["Break-even incremental units", "6,250", "6,250", "6,250"],
        ["Incremental units vs break-even", "−1,250", "+3,750", "+7,750"],
      ]),
      notes("Retailer benefit", "State the retailer's benefit and how it will be measured.", [
        ["Volume", "Expected to sell 10,000 units above the baseline across 100 stores."],
        ["Shopper value", "Shelf price falls by £0.50 for two weeks."],
        ["Measurement", "Compare sales and availability with the agreed baseline and monitor related products."],
      ]),
      table("Support requested", "Separate the funding commitment from the execution and reporting asks.", ["Support", "Amount or scope", "Owner", "Deadline"], [
        ["Fixed funding", "£5,000 total", "Commercial finance", "Before booking"],
        ["Shelf execution", "100 stores", "Retail operations", "First day of event"],
        ["EPOS and availability", "Event and baseline weeks", "Retail analyst", "Two weeks after event"],
      ]),
      notes("Recommendation and approval", "Close with a decision and the conditions attached to it.", [
        ["Recommendation", "Proceed if the baseline, stock and reporting scope are confirmed."],
        ["Guardrail", "Review the proposal if expected incremental volume falls below 6,250 units."],
        ["Next action", "Lock dates and agree who will deliver the post-event review."],
      ]),
    ],
  },
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
