export type QuickCalculatorId =
  | "required-soa-calculator"
  | "retail-selling-price-calculator"
  | "actual-retailer-margin-calculator"
  | "invoice-price-calculator"
  | "soa-support-percent-calculator"
  | "promo-invoice-calculator"
  | "sales-tax-vat-iva-retail-price-converter"
  | "markup-vs-margin-helper";

export type QuickCalculator = {
  id: QuickCalculatorId;
  slug: string;
  title: string;
  h1: string;
  description: string;
  group: "Retail price and margin" | "SOA and supplier support" | "Tax and price conversion";
  choice: string;
  whenToUse: string[];
  formula: string[];
  related: QuickCalculatorId[];
};

export const quickCalculators: QuickCalculator[] = [
  {
    id: "retail-selling-price-calculator",
    slug: "retail-selling-price-calculator",
    title: "Retail Selling Price Calculator",
    h1: "Retail Selling Price Calculator",
    description:
      "Use this to check how invoice price, retail price and VAT/tax affect retailer margin before you commit to a deal.",
    group: "Retail price and margin",
    choice: "Estimate retail price from invoice and target margin",
    whenToUse: [
      "You know the retailer invoice/buy price and want to estimate the retail/sale price implied by a target margin.",
      "You need a quick sense-check before discussing a price ladder, promotion or range proposal.",
    ],
    formula: [
      "Retail/sale price excluding tax = invoice price / (1 - target retailer margin %).",
      "Retail/sale price including tax = excluding-tax price x (1 + sales tax / VAT / IVA rate %).",
    ],
    related: ["actual-retailer-margin-calculator", "invoice-price-calculator", "required-soa-calculator"],
  },
  {
    id: "actual-retailer-margin-calculator",
    slug: "actual-retailer-margin-calculator",
    title: "Actual Retailer Margin Calculator",
    h1: "Actual Retailer Margin Calculator",
    description:
      "Use this to check how invoice price, promo support, retail price and VAT/tax affect retailer margin before you commit to a deal.",
    group: "Retail price and margin",
    choice: "What margin is the retailer actually making?",
    whenToUse: [
      "You have an invoice price, support level and retail selling price and want to estimate customer margin.",
      "You need to compare SOA versus promo invoice mechanics.",
    ],
    formula: [
      "Retail selling price excluding tax is calculated from the entered tax basis.",
      "Retailer margin % = retailer cash margin per unit / retail price excluding tax.",
    ],
    related: ["retail-selling-price-calculator", "required-soa-calculator", "promo-invoice-calculator"],
  },
  {
    id: "invoice-price-calculator",
    slug: "invoice-price-calculator",
    title: "Invoice Price Calculator",
    h1: "Invoice Price Calculator from Retail Price and Margin",
    description:
      "Use this to back-solve the invoice price implied by a retail price and target margin.",
    group: "Retail price and margin",
    choice: "Calculate invoice price from retail price and target margin",
    whenToUse: [
      "You know a retail selling price and margin target and want to estimate the invoice/buy price implied.",
      "You need a quick back-solve for range or promotional planning.",
    ],
    formula: [
      "Retail price excluding tax is calculated from the entered tax basis.",
      "Implied invoice price = retail price excluding tax x (1 - target retailer margin %).",
    ],
    related: ["retail-selling-price-calculator", "actual-retailer-margin-calculator", "required-soa-calculator"],
  },
  {
    id: "markup-vs-margin-helper",
    slug: "markup-vs-margin-calculator",
    title: "Markup vs Margin Calculator",
    h1: "Markup vs Margin Calculator",
    description:
      "Use this to check whether a deal conversation is using margin or markup before the numbers get confused.",
    group: "Retail price and margin",
    choice: "What is the difference between markup and margin?",
    whenToUse: [
      "You want to check whether someone is talking about margin or markup.",
      "You need a quick profit, margin and markup comparison from two numbers.",
    ],
    formula: [
      "Retail selling price excluding tax is calculated from the entered tax basis.",
      "Cash profit = retail selling price excluding tax - cost.",
      "Margin % = cash profit / retail selling price excluding tax. Markup % = cash profit / cost.",
    ],
    related: ["actual-retailer-margin-calculator", "retail-selling-price-calculator"],
  },
  {
    id: "required-soa-calculator",
    slug: "required-soa-calculator",
    title: "Required SOA Calculator",
    h1: "Required SOA Calculator",
    description:
      "Use this when a retailer asks for support and you need to estimate the SOA needed to reach a target margin.",
    group: "SOA and supplier support",
    choice: "What SOA do I need to hit a margin?",
    whenToUse: [
      "A buyer has a margin requirement and you need to estimate the per-unit SOA/support needed.",
      "You want to compare a current invoice price with an effective promo invoice price.",
    ],
    formula: [
      "Promo retail price excluding tax is calculated from the entered tax basis.",
      "Required cost price = promo retail price excluding tax x (1 - target retailer margin %).",
      "Required SOA = current invoice price - required cost price.",
    ],
    related: ["promo-invoice-calculator", "soa-support-percent-calculator", "actual-retailer-margin-calculator"],
  },
  {
    id: "promo-invoice-calculator",
    slug: "promo-invoice-calculator",
    title: "Promo Invoice Calculator",
    h1: "Promo Invoice Calculator",
    description:
      "Use this to turn SOA or support per unit into a clearer promotional invoice price and total support view.",
    group: "SOA and supplier support",
    choice: "What is my promo invoice after SOA?",
    whenToUse: [
      "You know the current invoice price and planned SOA/support per unit.",
      "You need the effective promo invoice and total supplier support across units.",
    ],
    formula: [
      "Effective promo invoice price = current retailer invoice/buy price - SOA per unit.",
      "Total supplier support = SOA per unit x units entered.",
    ],
    related: ["required-soa-calculator", "soa-support-percent-calculator", "actual-retailer-margin-calculator"],
  },
  {
    id: "soa-support-percent-calculator",
    slug: "soa-support-percent-calculator",
    title: "SOA / Support % Calculator",
    h1: "SOA / Support % Calculator",
    description:
      "Use this to turn SOA, fixed funding or trade spend into a clearer view of total deal support.",
    group: "SOA and supplier support",
    choice: "What percentage support am I giving?",
    whenToUse: [
      "You need to express SOA or supplier support as a percentage of invoice price.",
      "You want to compare support as a percentage of retail selling price including or excluding tax.",
    ],
    formula: [
      "SOA % of invoice = SOA per unit / retailer invoice/buy price.",
      "SOA % of retail = SOA per unit / retail selling price excluding tax, with an including-tax comparison shown where relevant.",
    ],
    related: ["required-soa-calculator", "promo-invoice-calculator", "actual-retailer-margin-calculator"],
  },
  {
    id: "sales-tax-vat-iva-retail-price-converter",
    slug: "sales-tax-vat-iva-calculator",
    title: "Sales Tax / VAT / IVA Retail Price Calculator",
    h1: "Sales Tax, VAT and IVA Retail Price Calculator",
    description:
      "Use this when retail prices include VAT, sales tax or IVA but margin needs to be checked excluding tax.",
    group: "Tax and price conversion",
    choice: "Convert inc/ex sales tax, VAT or IVA",
    whenToUse: [
      "You need to convert a shopper retail price into an excluding-tax value for margin checks.",
      "You need to show both including-tax and excluding-tax retail selling prices.",
    ],
    formula: [
      "If price includes tax: excluding-tax price = entered price / (1 + tax rate %).",
      "If price excludes tax: including-tax price = entered price x (1 + tax rate %).",
    ],
    related: ["retail-selling-price-calculator", "actual-retailer-margin-calculator", "invoice-price-calculator"],
  },
];

export const quickCalculatorGroups = [
  "Retail price and margin",
  "SOA and supplier support",
  "Tax and price conversion",
] as const;

export function getQuickCalculatorBySlug(slug: string) {
  return quickCalculators.find((calculator) => calculator.slug === slug);
}

export function getQuickCalculatorById(id: QuickCalculatorId) {
  return quickCalculators.find((calculator) => calculator.id === id);
}
