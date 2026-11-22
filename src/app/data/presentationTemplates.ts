export const freeTemplates = [
  {
    title: "Joint Business Plan",
    slug: "joint-business-plan",
    pptx: "joint-business-plan-template.pptx",
    description: "Use this for annual customer planning, growth pillars, investment alignment and measures of success.",
    bestFor: "JBP meetings, account reviews and customer planning",
    slides: "10",
    includes: "objectives, growth plan, investment plan and success measures",
  },
  {
    title: "Account Plan",
    slug: "account-plan",
    pptx: "account-plan-template.pptx",
    description: "Create an internal account plan deck covering customer context, priorities, risks, growth levers and actions.",
    bestFor: "Internal account planning, account reviews and sales leadership updates",
    slides: "7",
    includes: "customer context, priorities, risks, opportunity map and action plan",
  },
  {
    title: "Quarterly Business Review",
    slug: "qbr-template",
    pptx: "quarterly-business-review-template.pptx",
    description: "Use this to review performance, risks, actions and next-quarter priorities.",
    bestFor: "Customer reviews and internal commercial reviews",
    slides: "10",
    includes: "performance scorecard, sales drivers and next-quarter actions",
  },
  {
    title: "Promotional Proposal",
    slug: "promo-proposal",
    pptx: "promotional-proposal-template.pptx",
    description: "Use this to frame a promotion mechanic, support ask, ROI logic and retailer benefit.",
    bestFor: "Promo proposals, trade marketing and buyer sign-off",
    slides: "9",
    includes: "mechanic, unit forecast, funding and break-even",
  },
  {
    title: "Range Review Template",
    slug: "range-review",
    pptx: "range-review-template.pptx",
    description: "Structure distribution, rate of sale, opportunity gaps and recommended range changes.",
    bestFor: "Account managers, category teams and range review stakeholders",
    slides: "7",
    includes: "SKU productivity, displacement and pilot thresholds",
  },
  {
    title: "New Product Launch Template",
    slug: "product-launch",
    pptx: "new-product-launch-template.pptx",
    description: "Build the first launch sell-in story with customer fit, forecast, support and launch plan.",
    bestFor: "Buyers, commercial managers and innovation launch teams",
    slides: "9",
    includes: "listing case, scenario forecast, stock readiness and post-launch review",
  },
  {
    title: "Annual Planning Template",
    slug: "annual-planning",
    pptx: "annual-planning-template.pptx",
    description: "Turn the full-year review, targets, investment priorities and quarterly roadmap into one planning deck.",
    bestFor: "Account managers, sales leads, commercial finance and customer leadership",
    slides: "8",
    includes: "review slides, targets, investment priorities and quarterly roadmap",
  },
  {
    title: "Buyer Meeting Planner Template",
    slug: "buyer-meeting",
    pptx: "buyer-meeting-prep-template.pptx",
    description: "Prepare the meeting objective, buyer priorities, talking points, objections and follow-up actions.",
    bestFor: "Account managers, KAMs and customer-facing commercial teams",
    slides: "7",
    includes: "meeting objective, talking points, objections and follow-up actions",
  },
  {
    title: "Category Opportunity Deck",
    slug: "category-opportunity",
    pptx: "category-opportunity-deck-template.pptx",
    description: "Size a category opportunity with shopper trends, competitor benchmarking and practical recommendations.",
    bestFor: "Account managers, category managers, buyers and commercial leaders",
    slides: "9",
    includes: "market sizing, retailer forecast, comparable benchmarks and pilot thresholds",
  },
];

export const buyerMeetingProposal = {
  starter: "buyer-meeting-proposal-template.pptx",
  example: "buyer-meeting-proposal-example.pptx",
  builder: "/custom-deck?template=buyer-meeting-external",
};

const workedExampleSlides = {
  "joint-business-plan": [[5, "Joint growth commitments"], [6, "Investment and release conditions"], [9, "Quarterly milestones and governance"]],
  "quarterly-business-review": [[4, "Commercial scorecard"], [5, "What moved net sales"], [9, "Proposed actions and owners"]],
  "promotional-proposal": [[2, "Offer and approval requested"], [5, "Funding and break-even"], [8, "Post-event measurement"]],
  "range-review": [[4, "Range change and displacement"], [5, "Comparable SKU performance and decisions"], [6, "Pilot and rollout decision"]],
  "new-product-launch": [[2, "Listing decision and shopper proposition"], [4, "Launch forecast by scenario"], [7, "Stock readiness and launch milestones"]],
  "category-opportunity": [[5, "Retailer opportunity scenarios"], [7, "Benchmark evidence"], [8, "Pilot and scale threshold"]],
  "account-plan": [[4, "Ranked opportunities"], [5, "Resources and decisions"], [6, "30-, 60- and 90-day action plan"]],
  "annual-planning": [[4, "Prior-year performance and new target"], [5, "Growth drivers behind the new target"], [6, "Funding decisions and release gates"]],
  "buyer-meeting": [[2, "Meeting objective and desired outcome"], [4, "Buyer objections and evidence-led responses"], [5, "Internal negotiation limits"]],
  "buyer-meeting-proposal": [[2, "Proposal and decision requested"], [4, "Evidence supporting the proposal"], [5, "Joint next steps"]],
} as const;

export function getWorkedExampleSlides(slug: keyof typeof workedExampleSlides) {
  return workedExampleSlides[slug].map(([number, title]) => ({
    number,
    title,
    src: `/templates/previews/${slug}-${number}.webp`,
  }));
}

export const featuredTemplates = [
  {
    slug: "joint-business-plan",
    templateSlug: "joint-business-plan",
    label: "Joint Business Plan",
    previewAlt: "Joint Business Plan slide with growth pillars, quarterly milestones and owners",
    purpose: "Agree a shared growth plan with a retailer, including the investment, milestones and measures each side will own.",
    sections: [
      ["Agree what the buyer is approving", "Open with the annual sales ambition, the retailer benefit and the decision you need. Keep the sales baseline and target on the same basis."],
      ["Reconcile the investment", "Assign each funding line to a shared priority. Check the total against the envelope and name the owner and release condition."],
      ["Set quarterly decision gates", "Give each milestone an owner and a success measure. Agree when to expand, change or pause each initiative."],
    ],
  },
  {
    slug: "quarterly-business-review",
    templateSlug: "qbr-template",
    label: "Quarterly Business Review",
    previewAlt: "Quarterly Business Review slide showing actual results, plan and variances",
    purpose: "Review performance against plan, explain what drove the gap and agree what to change next quarter.",
    sections: [
      ["Lead with the decision", "Open with the result, why it matters to the buyer and the decision needed. Show what happened to commitments from the previous review."],
      ["Reconcile the sales waterfall", "Compare actuals with plan and the prior period. Show how range, promotion and availability explain the sales gap, using values that add up to the scorecard variance."],
      ["Make the next review measurable", "Record an owner, deadline, baseline and success measure for every action you propose."],
    ],
  },
  {
    slug: "promotional-proposal",
    templateSlug: "promo-proposal",
    label: "Promotional Proposal",
    previewAlt: "Promotional Proposal slide comparing downside, expected and upside funding scenarios",
    purpose: "Present a promotion mechanic, forecast the incremental volume and show the funding and break-even assumptions behind the ask.",
    sections: [
      ["Start with the offer and approval", "State the price mechanic, stores, duration and funding ask. Compare against non-promoted weeks for the same store scope."],
      ["Show the downside and break-even", "Compare downside, expected and upside contribution after fixed funding. State the incremental units needed to break even."],
      ["Set release and measurement conditions", "Confirm stock, in-store execution, owners and reporting dates. Use the same baseline and success thresholds after the event."],
    ],
  },
  {
    slug: "range-review",
    templateSlug: "range-review",
    label: "Range Review",
    previewAlt: "Range Review slide comparing SKU productivity, availability, margin and decisions",
    purpose: "Show which SKUs to retain, expand or replace and agree the evidence needed for rollout.",
    sections: [
      ["Compare like-for-like SKU results", "Use the same stores and period. Check availability before judging rate of sale, and compare margin on a consistent basis."],
      ["Account for displaced volume", "Show units gained and lost over the same test window. Check category contribution before approving wider distribution."],
      ["Set a pilot threshold", "Agree comparable control stores, the measurement period and the contribution and availability hurdles."],
    ],
  },
  {
    slug: "new-product-launch",
    templateSlug: "product-launch",
    label: "New Product Launch",
    previewAlt: "New Product Launch slide with downside, expected and upside listing forecasts",
    purpose: "Make a retailer listing case, show the launch forecast and agree the stock, activation and review milestones.",
    sections: [
      ["State the listing decision", "Give the buyer the product, shelf fit, target stores and launch window. Support the shopper need with evidence."],
      ["Build a forecast from stores and rate of sale", "Multiply ranged stores by weeks on shelf and expected units per store per week. Use comparable trials for the downside and upside rates."],
      ["Agree readiness and review", "Name the owner for item setup, stock and assets. Agree when to review rate of sale and availability."],
    ],
  },
  {
    slug: "category-opportunity",
    templateSlug: "category-opportunity",
    label: "Category Opportunity",
    previewAlt: "Category Opportunity slide showing retailer revenue scenarios",
    purpose: "Use comparable shopper and store evidence to size what one retailer could capture and agree a pilot.",
    sections: [
      ["Define the category and the source", "Record the market and retailer scopes, periods and benchmark. Compare like-for-like formats and pack sizes."],
      ["Size the retailer opportunity", "Use eligible stores, weeks, incremental units per store per week and retail sales value per unit. Compare the downside, expected and upside cases."],
      ["Set the scale decision", "Agree a pilot with matched control stores and success thresholds for incremental sales and category contribution."],
    ],
  },
  {
    slug: "account-plan",
    templateSlug: "account-plan",
    label: "Account Plan",
    previewAlt: "Account Plan slide listing the first 30, 60 and 90 days with owners and measures",
    purpose: "Prioritise internal account work, secure resources and agree what the team will deliver over the next 90 days.",
    sections: [
      ["Lead with the internal decision", "Explain the account position and what leadership needs to approve. Use the scorecard or store evidence to support the ask."],
      ["Rank the opportunities", "Record the value and confidence for each opportunity. Give each item a next step and name the people and funding needed."],
      ["Assign the first 90 days", "Set a measurable deliverable for days 30, 60 and 90. Name the owner and when the team will review the result."],
    ],
  },
  {
    slug: "annual-planning",
    templateSlug: "annual-planning",
    label: "Annual Planning",
    previewAlt: "Annual Planning slide showing funding lines, release conditions and approvers",
    purpose: "Turn last year's results into a reconciled sales target, investment plan and quarterly decisions for leadership.",
    sections: [
      ["Compare the plan and the actual", "Use the same sales basis and period. Explain the material variances and what they imply for the new plan."],
      ["Reconcile the new target and budget", "Use signed growth drivers to bridge actual sales to the target. Check funding lines against the proposed envelope."],
      ["Decide when to release or redirect funds", "Give each quarter an owner, a review point and a decision on what to fund or pause."],
    ],
  },
  {
    slug: "buyer-meeting",
    templateSlug: "buyer-meeting",
    label: "Buyer Meeting Planner",
    previewAlt: "Buyer Meeting Planner slide outlining likely objections and responses",
    purpose: "Prepare the meeting objective, likely objections, internal negotiation limits and follow-up.",
    sections: [
      ["Decide what you need from the meeting", "Record the buyer's priorities, the decision you want and the evidence that supports your ask."],
      ["Prepare internal guardrails", "Agree tradeable concessions, walk-away positions and approval limits with the team. Use the buyer-facing proposal below for the material you share."],
      ["Close with a dated next step", "Confirm what was agreed, who owns each action and when you will follow up."],
    ],
  },
] satisfies Array<{
  slug: Exclude<keyof typeof workedExampleSlides, "buyer-meeting-proposal">;
  templateSlug: string;
  label: string;
  previewAlt: string;
  purpose: string;
  sections: Array<[string, string]>;
}>;

export function getTemplateGuide(slug: string) {
  const guide = featuredTemplates.find((item) => item.slug === slug);
  if (!guide) return undefined;
  const template = freeTemplates.find((item) => item.slug === guide.templateSlug);
  if (!template) return undefined;
  return {
    ...guide,
    template,
    preview: `/templates/previews/${guide.slug}.png`,
    example: template.pptx.replace("-template.pptx", "-example.pptx"),
  };
}
