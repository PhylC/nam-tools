"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { retailMediaRoasName, retailMediaRoasPath } from "../../lib/retailMediaRoas";

type TaskCard = {
  title: string;
  text: string;
  cta: string;
  href: string;
};

type HubTool = {
  title: string;
  description: string;
  href: string;
  cta: string;
  preview: string;
  keywords: string[];
};

type ToolGroup = {
  id: string;
  title: string;
  intro: string;
  tools: HubTool[];
};

const taskCards: TaskCard[] = [
  {
    title: "Shelf price",
    text: "Use the retailer’s buy price and target margin to calculate a shelf price, with the tax basis shown.",
    cta: "Retail Selling Price Calculator",
    href: "/calculators/retail-selling-price-calculator",
  },
  {
    title: "Retailer margin",
    text: "Use the shelf price, invoice price and any supplier support to check the retailer’s actual margin.",
    cta: "Actual Retailer Margin Calculator",
    href: "/calculators/actual-retailer-margin-calculator",
  },
  {
    title: "Invoice price",
    text: "Start with a shelf price and target margin to work back to what the retailer would pay the supplier.",
    cta: "Invoice Price Calculator",
    href: "/calculators/invoice-price-calculator",
  },
  {
    title: "Promotional support",
    text: "Work out the supplier support per unit needed for a proposed promo price and target retailer margin.",
    cta: "Required SOA Calculator",
    href: "/calculators/required-soa-calculator",
  },
];

const toolGroups: ToolGroup[] = [
  {
    id: "pricing-tools",
    title: "Pricing tools",
    intro: "Use these when the question is price, invoice, margin or retail value.",
    tools: [
      {
        title: "Retail Selling Price Calculator",
        description: "Calculate retail selling price from invoice price and target retailer margin, with VAT, sales tax or IVA shown clearly.",
        href: "/calculators/retail-selling-price-calculator",
        cta: "Calculate retail selling price",
        preview: "Invoice price + target margin -> retail selling price",
        keywords: ["retail price", "retail calculators", "how to work out retail price", "using target margin to calculate sale price", "rsp", "selling price", "price", "margin", "invoice"],
      },
      {
        title: "Invoice Price Calculator",
        description: "Back-solve the invoice (buying) price implied by a retail price and margin target.",
        href: "/calculators/invoice-price-calculator",
        cta: "Back-solve invoice price",
        preview: "Retail price - margin -> invoice",
        keywords: ["invoice", "cost price", "retail price", "margin", "back solve"],
      },
      {
        title: "Actual Retailer Margin Calculator",
        description: "Check retailer margin from invoice price, support and retail price.",
        href: "/calculators/actual-retailer-margin-calculator",
        cta: "Check retailer margin",
        preview: "Invoice £5.00 -> Retail £8.00 -> Margin 37.5%",
        keywords: ["retailer margin", "actual margin", "invoice", "support", "soa", "retail price"],
      },
    ],
  },
  {
    id: "promotion-tools",
    title: "Promotion tools",
    intro: "Use these for promotion support, retail media and trade investment.",
    tools: [
      {
        title: "Sales and Promotion ROI Planner",
        description: "Calculate sales and compare volume, supplier support, profit and ROI before and during a promotion.",
        href: "/roi-tool",
        cta: "Model promotion sales",
        preview: "Spend £10k -> Return £14k -> ROI 1.4x",
        keywords: ["sales calculators", "sales calculator", "calculate sales", "roi", "promotion", "promo", "support", "scenario", "volume", "profit"],
      },
      {
        title: retailMediaRoasName,
        description: "Compare a retailer’s reported ROAS with supplier profit, fees and the incremental sales needed to break even.",
        href: retailMediaRoasPath,
        cta: "Calculate retail media ROAS",
        preview: "Attributed retail sales, media spend and supplier margin",
        keywords: ["retail media", "roas", "return on ad spend", "roi", "break even", "incrementality", "advertising"],
      },
      {
        title: "Promotion Support (Required SOA) Calculator",
        description: "Calculate supplier support per unit for a proposed promo price and target retailer margin.",
        href: "/calculators/required-soa-calculator",
        cta: "Calculate required support",
        preview: "£199 -> £169 needs £21 SOA/unit",
        keywords: ["promotion support", "soa calculator", "sell-out allowance", "required support", "retailer margin", "selling price", "promo price", "funding"],
      },
      {
        title: "SOA / Support % Calculator",
        description: "Convert known SOA/support into percentage views for invoice and retail price checks.",
        href: "/calculators/soa-support-percent-calculator",
        cta: "Calculate support %",
        preview: "SOA £0.50 / invoice £5.00 = 10%",
        keywords: ["support percent", "soa percent", "trade spend", "funding", "allowance"],
      },
      {
        title: "Promo Invoice Calculator",
        description: "Calculate effective promo invoice price and total supplier support.",
        href: "/calculators/promo-invoice-calculator",
        cta: "Calculate promo invoice",
        preview: "Invoice £5.00 - SOA £0.50 = Net £4.50",
        keywords: ["promo invoice", "support", "soa", "net invoice", "trade spend"],
      },
      {
        title: "Promo ROI Calculator",
        description: "Check whether extra promotion volume offsets price investment and support.",
        href: "/tools/promotion-roi-calculator",
        cta: "Check promo ROI",
        preview: "Volume uplift -> support spend -> payback",
        keywords: ["promo roi", "promotion", "roi", "support", "payback", "investment"],
      },
    ],
  },
  {
    id: "planning-tools",
    title: "Planning tools",
    intro: "Use these when you need to turn numbers into a clearer meeting plan, account plan or customer story.",
    tools: [
      {
        title: "Buyer Meeting Planner",
        description: "Structure the objective, ask, risks, negotiation points and next steps.",
        href: "/tools/buyer-meeting-prep",
        cta: "Plan a meeting",
        preview: "Objective -> Ask -> Risks -> Next steps",
        keywords: ["buyer", "meeting", "planner", "prep", "agenda", "objective", "ask", "risks", "next steps"],
      },
      {
        title: "Account Plan",
        description: "Turn customer priorities, opportunities and risks into a clearer account plan.",
        href: "/tools/account-plan-generator",
        cta: "Build account plan",
        preview: "Priorities -> Opportunities -> Actions",
        keywords: ["account plan", "account", "priorities", "opportunities", "risks", "actions", "planning"],
      },
      {
        title: "JBP Builder",
        description: "Create a JBP deck workflow and tracker for customer conversations.",
        href: "/tools/joint-business-plan-builder",
        cta: "Build JBP",
        preview: "Goals -> Deck -> Tracker",
        keywords: ["jbp", "joint business plan", "goals", "initiatives", "measures", "planning", "deck", "tracker"],
      },
      {
        title: "Presentation templates",
        description: "Download editable PowerPoint templates for buyer meetings and internal reviews.",
        href: "/presentation-templates",
        cta: "View templates",
        preview: "JBP -> QBR -> Promo proposal",
        keywords: ["presentation", "templates", "powerpoint", "buyer", "meeting", "deck"],
      },
    ],
  },
];

function matchesTool(tool: HubTool, query: string) {
  const haystack = [tool.title, tool.description, tool.preview, tool.cta, ...tool.keywords].join(" ").toLowerCase();
  return haystack.includes(query);
}

export function CalculatorsHubClient() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredGroups = useMemo(
    () =>
      normalizedQuery
        ? toolGroups
            .map((group) => ({
              ...group,
              tools: group.tools.filter((tool) => matchesTool(tool, normalizedQuery)),
            }))
            .filter((group) => group.tools.length > 0)
        : toolGroups,
    [normalizedQuery],
  );
  const hasMatches = filteredGroups.some((group) => group.tools.length > 0);

  return (
    <>
      <section className="shell section calculator-task-section" aria-labelledby="calculator-task-heading">
        <div className="section-header">
          <h2 id="calculator-task-heading">Choose a retail calculator</h2>
        </div>
        <div className="calculator-task-grid">
          {taskCards.map((task) => (
            <Link className="calculator-task-card" href={task.href} key={task.title}>
              <strong>{task.title}</strong>
              <span>{task.text}</span>
              <em>{task.cta}</em>
            </Link>
          ))}
        </div>
      </section>

      <section className="shell section calculator-recommended-section" aria-labelledby="recommended-roi-heading">
        <article className="calculator-roi-hero">
          <div className="calculator-roi-copy">
            <span className="pill pro-pill">Recommended for most users</span>
            <h2 id="recommended-roi-heading">Full ROI planner</h2>
            <p>
              Build the full deal view in one place: product line, volume, price, support, revenue, profit and ROI.
            </p>
            <Link className="button" href="/roi-tool">
              Start with ROI planner
            </Link>
            <small>Free: one product line. Pro: multi-line scenarios, saved work and exports.</small>
          </div>
          <div className="calculator-mini-panel" aria-label="Example ROI planner outputs">
            <div>
              <span>Volume uplift</span>
              <strong>+8,000 units</strong>
            </div>
            <div>
              <span>Support spend</span>
              <strong>£10k</strong>
            </div>
            <div>
              <span>Gross profit</span>
              <strong>£14k</strong>
            </div>
            <div>
              <span>ROI</span>
              <strong>1.4x</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="shell section calculator-search-section" aria-labelledby="calculator-search-heading">
        <div className="calculator-search-panel">
          <div>
            <h2 id="calculator-search-heading">Find a tool</h2>
            <p>Search by the number, mechanic or planning job you need.</p>
          </div>
          <label className="calculator-search-field">
            <span>Search calculators and tools</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by margin, support, invoice, retail price, ROI..."
              type="search"
              value={query}
            />
          </label>
        </div>
      </section>

      <section className="shell calculator-tool-sections" aria-live="polite">
        {hasMatches ? (
          filteredGroups.map((group) => (
            <section className="calculator-tool-group" id={group.id} key={group.id}>
              <div className="calculator-group-heading">
                <h2>{group.title}</h2>
                <p>{group.intro}</p>
              </div>
              <div className="calculator-tool-grid">
                {group.tools.map((tool) => (
                  <article className="card calculator-hub-card" key={tool.href}>
                    <div className="calculator-preview">{tool.preview}</div>
                    <h3>{tool.title}</h3>
                    <p>{tool.description}</p>
                    <Link className="text-link" href={tool.href}>
                      {tool.cta}
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ))
        ) : (
          <article className="card calculator-no-results">
            <h2>No matching tools yet.</h2>
            <p>Try margin, support, invoice, retail price or ROI.</p>
          </article>
        )}
      </section>
    </>
  );
}
