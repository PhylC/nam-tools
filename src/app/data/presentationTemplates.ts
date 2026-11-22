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
    slides: "9",
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
    slides: "9",
    includes: "distribution review, opportunity gaps, recommendations and example data",
  },
  {
    title: "New Product Launch Template",
    slug: "product-launch",
    pptx: "new-product-launch-template.pptx",
    description: "Build the first launch sell-in story with customer fit, forecast, support and launch plan.",
    bestFor: "Buyers, commercial managers and innovation launch teams",
    slides: "9",
    includes: "launch story, forecast, support plan and commercial example data",
  },
  {
    title: "Annual Planning Template",
    slug: "annual-planning",
    pptx: "annual-planning-template.pptx",
    description: "Turn the full-year review, targets, investment priorities and quarterly roadmap into one planning deck.",
    bestFor: "Account managers, sales leads, commercial finance and customer leadership",
    slides: "7",
    includes: "review slides, targets, investment priorities and quarterly roadmap",
  },
  {
    title: "Buyer Meeting Planner Template",
    slug: "buyer-meeting",
    pptx: "buyer-meeting-prep-template.pptx",
    description: "Prepare the meeting objective, buyer priorities, talking points, objections and follow-up actions.",
    bestFor: "Account managers, KAMs and customer-facing commercial teams",
    slides: "8",
    includes: "meeting objective, talking points, objections and follow-up actions",
  },
  {
    title: "Category Opportunity Deck",
    slug: "category-opportunity",
    pptx: "category-opportunity-deck-template.pptx",
    description: "Size a category opportunity with shopper trends, competitor benchmarking and practical recommendations.",
    bestFor: "Account managers, category managers, buyers and commercial leaders",
    slides: "7",
    includes: "opportunity sizing, benchmark view, recommendations and example data",
  },
];

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
];

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
