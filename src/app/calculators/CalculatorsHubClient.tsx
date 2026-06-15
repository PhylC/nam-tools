"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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
    title: "Build a promotion",
    text: "Model volume, support, revenue, profit and ROI.",
    cta: "Open ROI planner",
    href: "/roi-tool",
  },
  {
    title: "Check retailer margin",
    text: "Understand retailer margin from invoice, support and retail price.",
    cta: "Check margin",
    href: "/calculators/actual-retailer-margin-calculator",
  },
  {
    title: "Work out support / SOA",
    text: "Turn fixed support, SOA or trade spend into a clearer deal view.",
    cta: "Calculate support",
    href: "/calculators/soa-support-percent-calculator",
  },
  {
    title: "Back-solve a price",
    text: "Work backwards from retail price, target margin or invoice price.",
    cta: "Open price tools",
    href: "#pricing-tools",
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
        description: "Estimate retail price from invoice price and target retailer margin.",
        href: "/calculators/retail-selling-price-calculator",
        cta: "Calculate retail price",
        preview: "Invoice + margin -> retail price",
        keywords: ["retail price", "rsp", "selling price", "price", "margin", "invoice"],
      },
      {
        title: "Invoice Price Calculator",
        description: "Back-solve the invoice price implied by a retail price and margin target.",
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
    intro: "Use these for promo support, SOA, return, investment and deal mechanics.",
    tools: [
      {
        title: "ROI Tool / Full ROI Planner",
        description: "Build the fuller promotion view with volume, support, revenue, profit and ROI.",
        href: "/roi-tool",
        cta: "Build ROI view",
        preview: "Spend £10k -> Return £14k -> ROI 1.4x",
        keywords: ["roi", "promotion", "promo", "support", "scenario", "volume", "profit"],
      },
      {
        title: "SOA / Support % Calculator",
        description: "Turn SOA, fixed funding or trade spend into a clearer support view.",
        href: "/calculators/soa-support-percent-calculator",
        cta: "Calculate support",
        preview: "SOA £0.50 / invoice £5.00 = 10%",
        keywords: ["support", "soa", "trade spend", "funding", "allowance"],
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
        description: "Create a practical joint business planning structure for customer conversations.",
        href: "/tools/joint-business-plan-builder",
        cta: "Build JBP",
        preview: "Goals -> Initiatives -> Measures",
        keywords: ["jbp", "joint business plan", "goals", "initiatives", "measures", "planning"],
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
          <h2 id="calculator-task-heading">Choose the job in front of you</h2>
          <p>Start from the commercial question, then open the tool that gets you there fastest.</p>
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
