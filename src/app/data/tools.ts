export type ToolCategory = "Calculator" | "Planning" | "Template";

export type Tool = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  category: ToolCategory;
  href: string;
  related: string[];
  useCases: string[];
};

export const tools: Tool[] = [
  {
    slug: "quick-commercial-calculators",
    title: "Quick Commercial Calculators",
    shortTitle: "Quick Calculators",
    description:
      "Fast SOA, invoice price, retail margin, sales tax / VAT / IVA and markup calculators for quick commercial checks.",
    category: "Calculator",
    href: "/calculators/quick-calculators",
    related: ["commercial-deal-calculator", "promotion-roi-calculator", "gross-margin-calculator"],
    useCases: [
      "Work out required SOA from target retailer margin",
      "Convert including-tax and excluding-tax retail prices quickly",
      "Sense-check invoice price, support percentage, margin and markup",
    ],
  },
  {
    slug: "commercial-deal-calculator",
    title: "Commercial Deal Calculator",
    shortTitle: "Deal Calculator",
    description:
      "Model supplier view, retailer/customer view, promo ROI, gross margin, trade spend and investment asks from one set of assumptions.",
    category: "Calculator",
    href: "/tools/commercial-deal-calculator",
    related: [
      "quick-commercial-calculators",
      "promotion-roi-calculator",
      "gross-margin-calculator",
      "trade-spend-calculator",
      "terms-investment-calculator",
    ],
    useCases: [
      "Build one commercial view before a customer negotiation",
      "Compare supplier economics with the retailer/customer view",
      "Sense-check promo ROI, margin, trade spend and investment asks together",
    ],
  },
  {
    slug: "promotion-roi-calculator",
    title: "Promotion ROI Calculator",
    shortTitle: "Promotion ROI",
    description:
      "Check whether a promotion pays back after funding, cannibalisation and post-promo dip.",
    category: "Calculator",
    href: "/tools/promotion-roi-calculator",
    related: ["commercial-deal-calculator", "trade-spend-calculator", "gross-margin-calculator"],
    useCases: [
      "Post-event promo review with a buyer",
      "Pre-approval check before funding a mechanic",
      "Challenge whether volume growth covers cannibalisation and funding",
    ],
  },
  {
    slug: "trade-spend-calculator",
    title: "Trade Spend Calculator",
    shortTitle: "Trade Spend",
    description:
      "Build a clearer view of discounts, rebates, fixed funding, marketing support and net revenue.",
    category: "Calculator",
    href: "/tools/trade-spend-calculator",
    related: ["commercial-deal-calculator", "promotion-roi-calculator", "terms-investment-calculator"],
    useCases: [
      "Compare customer investment asks on a like-for-like basis",
      "Estimate the full cost of discounts, rebates and fixed funding",
      "Sense-check whether spend intensity is drifting too high",
    ],
  },
  {
    slug: "gross-margin-calculator",
    title: "Gross Margin Calculator",
    shortTitle: "Gross Margin",
    description:
      "Compare supplier margin, retailer margin and promo price impact before agreeing support.",
    category: "Calculator",
    href: "/tools/gross-margin-calculator",
    related: ["commercial-deal-calculator", "promotion-roi-calculator", "trade-spend-calculator"],
    useCases: [
      "Check margin before agreeing a price or promo mechanic",
      "Understand supplier and retailer margin pressure",
      "Compare regular price and promotional price profitability",
    ],
  },
  {
    slug: "buyer-meeting-prep",
    title: "Buyer Meeting Prep Tool",
    shortTitle: "Buyer Meeting Prep",
    description:
      "Turn a buyer challenge, commercial ask and benefit story into meeting notes you can use.",
    category: "Planning",
    href: "/tools/buyer-meeting-prep",
    related: ["account-plan-generator", "joint-business-plan-builder", "customer-review-template"],
    useCases: [
      "Prepare a buyer meeting with a clear commercial ask",
      "Anticipate objections before a negotiation",
      "Draft a follow-up note immediately after the meeting",
    ],
  },
  {
    slug: "joint-business-plan-builder",
    title: "Joint Business Plan Builder",
    shortTitle: "JBP Builder",
    description:
      "Draft a practical JBP structure with growth pillars, activation, investment and success measures.",
    category: "Planning",
    href: "/tools/joint-business-plan-builder",
    related: ["account-plan-generator", "buyer-meeting-prep", "terms-investment-calculator"],
    useCases: [
      "Create the first draft of a customer JBP",
      "Align category opportunity, activation and investment",
      "Prepare a senior internal review before customer presentation",
    ],
  },
  {
    slug: "account-plan-generator",
    title: "Account Plan Generator",
    shortTitle: "Account Plan",
    description:
      "Turn account notes into a clearer plan with opportunities, risks, strategy and 30/60/90 actions.",
    category: "Planning",
    href: "/tools/account-plan-generator",
    related: ["buyer-meeting-prep", "joint-business-plan-builder", "customer-review-template"],
    useCases: [
      "Turn account notes into a structured plan",
      "Prepare internal account reviews",
      "Set 30/60/90 day commercial actions",
    ],
  },
  {
    slug: "terms-investment-calculator",
    title: "Terms / Investment Ask Calculator",
    shortTitle: "Investment Ask",
    description:
      "Sense-check customer investment asks using uplift, probability, margin and payback logic.",
    category: "Calculator",
    href: "/tools/terms-investment-calculator",
    related: ["commercial-deal-calculator", "trade-spend-calculator", "gross-margin-calculator"],
    useCases: [
      "Evaluate a terms increase or annual investment ask",
      "Add probability and contract length to a customer proposal",
      "Challenge asks that exceed expected profit creation",
    ],
  },
  {
    slug: "customer-review-template",
    title: "Customer Review Template",
    shortTitle: "Customer Review",
    description:
      "Create a customer review narrative covering performance, wins, misses, asks and next actions.",
    category: "Template",
    href: "/tools/customer-review-template",
    related: ["promotion-roi-calculator", "buyer-meeting-prep", "account-plan-generator"],
    useCases: [
      "Draft a quarterly business review narrative",
      "Summarise what worked and what needs changing",
      "Prepare customer-specific asks and follow-up actions",
    ],
  },
];

export function getTool(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}

export function relatedTools(slugs: string[]) {
  return slugs.map((slug) => getTool(slug)).filter((tool): tool is Tool => Boolean(tool));
}
