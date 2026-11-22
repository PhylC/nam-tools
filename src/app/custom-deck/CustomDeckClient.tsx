"use client";

import Link from "next/link";
import { readRoiProposalDraft, roiProposalEvidence, roiProposalPath, roiProposalStorageKey, type RoiProposalDraft } from "../../lib/roiProposalDraft";
import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type PptxGenJS from "pptxgenjs";
import { addDeckVisuals, powerPointMimeType, slidePurposes } from "./powerPointTemplate";
import type { LayoutChoices, LayoutReview, SlideContent, SlidePurpose } from "./powerPointTemplate";
import { QbrReview } from "./QbrReview";
import { buildQbrSlides } from "./qbrStory";
import type { QbrApproval, QbrContext, QbrStory } from "./qbrStory";
import { groupMetrics, readQbrScorecards } from "./qbrScorecard";
import type { QbrMetric, QbrScorecard } from "./qbrScorecard";
import { qbrBenchmark, qbrBenchmarkCsv } from "./qbrBenchmark.mjs";
import { CommercialDeckReview } from "./CommercialDeckReview";
import { planningConfig } from "./planningBenchmarks.mjs";
import { buildCommercialSlides, commercialText, getCommercialKind, restoreCommercialApproval } from "./commercialDeck";
import type { CommercialApproval, CommercialContext } from "./commercialDeck";
import { commercialConfig } from "./commercialBenchmarks.mjs";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";
import { buildUpgradeHref, useProAction } from "../components/ProActionGuard";
import { loadAccountSettings, SavedPresentationTemplate } from "../../lib/proSettings";
import { loadDeckBrief, saveDeckBrief } from "../../lib/saveStore";
import { downloadDeckTemplate, downloadGeneratedDeck, uploadGeneratedDeck } from "../../lib/storageUploads";

const DECK_TEMPLATE_MAX_FILE_BYTES = 20 * 1024 * 1024;
const SUPPORTING_FILE_MAX_BYTES = 10 * 1024 * 1024;
const MAX_SUPPORTING_FILES = 5;
const SAVED_TEMPLATE_DOWNLOAD_TIMEOUT_MS = 12000;
const GENERATED_DECK_UPLOAD_TIMEOUT_MS = 15000;
const WORKSPACE_SAVE_TIMEOUT_MS = 12000;
const CUSTOM_DECK_DRAFT_STORAGE_KEY = "aptCustomDeckDraft";
const qbrSampleFilename = "bridgeway-qbr-worked-scorecard.csv";
const deckTemplateExtensions = [".pptx", ".potx"];
const supportingFileExtensions = [".xlsx", ".csv", ".pdf", ".docx", ".txt", ".pptx", ".key", ".numbers", ".pages"];

const deckTypes = [
  { label: "Joint Business Plan", value: "jbp" },
  { label: "Account Plan", value: "account-plan" },
  { label: "Quarterly Business Review", value: "qbr" },
  { label: "Promotional Proposal", value: "promo-proposal" },
  { label: "Range Review", value: "range-review" },
  { label: "New Product Launch", value: "product-launch" },
  { label: "Annual Planning", value: "annual-planning" },
  { label: "Buyer Meeting Planner", value: "buyer-meeting" },
  { label: "Buyer Meeting Proposal (buyer-facing)", value: "buyer-meeting-external" },
  { label: "Category Opportunity", value: "category-opportunity" },
];

const toneOptions = [
  { label: "Concise and commercial", value: "concise_commercial" },
  { label: "Detailed and analytical", value: "detailed_analytical" },
  { label: "Executive and polished", value: "executive_polished" },
];
type TemplateSource = "saved" | "one_off" | "apt_default";
type PendingLayoutReview = LayoutReview & { file: File; savedTemplateId: string; qbr?: QbrApproval; commercial?: CommercialApproval };
type PendingQbrReview = { scorecard: QbrScorecard; context: QbrContext; initialStory: QbrStory };
type PendingCommercialReview = { initial: CommercialApproval; context: CommercialContext };
const commercialInputKeys = ["scope", "benefit", "decision", "governance"];
const qbrQuestions = [
  "Which account and quarter are you reviewing?",
  "What happened this quarter?",
  "What explains the performance?",
  "What should happen next quarter?",
];
type ReadabilityMode = "auto" | "preserve";
type FileMeta = {
  name: string;
  size: number;
  type: string;
  extension: string;
};
type GeneratedDeckResult = {
  file: File;
  filename: string;
  outline: string[];
  templateDesignApplied: boolean;
};

type TemplateDesign = {
  sourceName: string;
  backgroundColor: string;
  panelFillColor: string;
  accentColor: string;
  secondaryColor: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  headFontFace: string;
  bodyFontFace: string;
};
type DeckSlideContent = {
  title: string;
  lines: string[];
};
type DeckInputValues = Record<string, string>;
type DeckPlaybook = {
  proofPrompt: string;
  inputPrompts: string[];
  briefPlaceholder: string;
  fallbackBrief: string[];
  outline: string[];
  evidenceSlideTitle: string;
  recommendationSlide: DeckSlideContent;
  financialSlide?: DeckSlideContent;
  risksSlide: DeckSlideContent;
  nextStepsSlide: DeckSlideContent;
};
type ReusableSavedTemplate = SavedPresentationTemplate & {
  storagePathOrUrl: string;
};

function getText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function restoreQbrApproval(value: unknown): QbrApproval | null {
  if (!isRecord(value) || !Array.isArray(value.metrics) || !isRecord(value.story)) return null;
  const optionalNumber = (input: unknown) => typeof input === "number" && Number.isFinite(input) ? input : null;
  const metrics = value.metrics.flatMap((metric: unknown): QbrMetric[] => {
    if (!isRecord(metric)) return [];
    const actual = optionalNumber(metric.actual);
    const id = getText(metric.id);
    const name = getText(metric.name);
    const source = getText(metric.source);
    if (actual === null || !id || !name || !source) return [];
    return [{ id, name, source, actual, unit: getText(metric.unit), plan: optionalNumber(metric.plan), prior: optionalNumber(metric.prior) }];
  });
  const { headline, drivers, decision, actions, implication, commitments, salesDrivers, bridgeMeasure, actionRows } = value.story;
  const asRows = (input: unknown) => Array.isArray(input)
    ? input.filter(Array.isArray).map((row) => row.map((cell: unknown) => getText(cell)))
    : undefined;
  return {
    metrics, story: {
      headline: getText(headline), drivers: getText(drivers), decision: getText(decision), actions: getText(actions),
      implication: getText(implication), commitments: asRows(commitments), salesDrivers: asRows(salesDrivers),
      bridgeMeasure: getText(bridgeMeasure), actionRows: asRows(actionRows),
    },
  };
}

function normaliseTemplate(value: string) {
  const aliases: Record<string, string> = {
    "joint-business-plan": "jbp",
    "account-plan-generator": "account-plan",
    "account-plan": "account-plan",
    "qbr-template": "qbr",
    "promotional-proposal": "promo-proposal",
    "new-product-launch": "product-launch",
    "promo-proposal": "promo-proposal",
  };
  return aliases[value] ?? value;
}

function fileExtension(filename: string) {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : "";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function toFileMeta(file: File): FileMeta {
  return {
    name: file.name,
    size: file.size,
    type: file.type || "unknown",
    extension: fileExtension(file.name),
  };
}

function isReusableSavedTemplate(template: SavedPresentationTemplate): template is ReusableSavedTemplate {
  return Boolean(template.storagePathOrUrl && [".pptx", ".potx"].includes(fileExtension(template.filename)));
}

function isGoogleSlidesUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.hostname.includes("docs.google.com") && url.pathname.includes("/presentation/");
  } catch {
    return false;
  }
}

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "custom-deck";
}

function waitForBrowserPaint() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: number | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

function briefSentences(value: string) {
  return value
    .split(/[\n.]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function deckInputPlaceholder(prompt: string) {
  const cleaned = prompt.toLowerCase();
  if (cleaned.includes("sales") || cleaned.includes("margin") || cleaned.includes("forecast") || cleaned.includes("roi")) {
    return "Add the key numbers, assumptions or where the data is uploaded.";
  }
  if (cleaned.includes("risk") || cleaned.includes("objection") || cleaned.includes("guardrail")) {
    return "Add known risks, objections, approval limits or watchouts.";
  }
  if (cleaned.includes("action") || cleaned.includes("next") || cleaned.includes("milestone")) {
    return "Add owners, timings, decisions needed or follow-up actions.";
  }
  return "Add the specific details this deck should use.";
}

function normaliseDeckInputs(inputs: DeckInputValues, playbook: DeckPlaybook) {
  return playbook.inputPrompts
    .map((prompt) => ({ prompt, value: (inputs[prompt] ?? "").trim() }))
    .filter((item) => item.value);
}

function activeDeckInputValues(inputs: DeckInputValues, playbook: DeckPlaybook) {
  return Object.fromEntries(normaliseDeckInputs(inputs, playbook).map((item) => [item.prompt, item.value]));
}

function inputValuesForPlaybook(playbook: DeckPlaybook, values: string[]) {
  return Object.fromEntries(playbook.inputPrompts.map((prompt, index) => [prompt, values[index] ?? ""]));
}

function exampleDeckData(deckType: string, playbook: DeckPlaybook, deckLabel: string) {
  const examples: Record<string, { name: string; inputs: string[]; brief: string; audience?: string; tone?: string }> = {
    jbp: {
      name: "Tesco 2027 Joint Business Plan",
      inputs: [
        "Deliver +8% RSV growth across 2027, with a clear H1/H2 plan for core range, premiumisation and seasonal activations.",
        "Joint objectives: grow category value, improve availability on top 20 SKUs, increase premium mix by 2pts and support shopper trade-up missions.",
        "Request £420k trade investment split across Q2 launch support, Q3 feature space and Q4 seasonal activation. Expected incremental RSV: £2.1m; target ROI above 2.5x.",
        "Monthly scorecard, quarterly steering review, NAM owner for commercial delivery, supply owner for availability, category owner for shopper/category evidence.",
      ],
      brief: "Build this as a retailer-ready JBP story with a clear growth agenda, investment choices, measures of success and governance plan.",
      audience: "Retailer/customer meeting",
      tone: "executive_polished",
    },
    "account-plan": {
      name: "Tesco Internal Account Plan",
      inputs: [
        "Tesco chilled account: sales are growing behind promotions, but base rate of sale is flat. Validate the account scorecard before customer-facing use.",
        "Growth opportunity is to improve distribution on priority SKUs, sharpen promotional mix and build premium seasonal execution.",
        "Objective: grow profitable revenue while improving availability and execution quality. Investment needed: trade spend, category evidence and supply planning support.",
        "Risks: margin pressure and competitor space gains. Owners: NAM for customer alignment, category for evidence, finance for guardrails and supply for availability. Next action: book internal account review before buyer meeting.",
      ],
      brief: "Build this as an internal account plan deck for leadership and cross-functional alignment, not as an external customer presentation.",
      audience: "Internal review",
      tone: "detailed_analytical",
    },
    qbr: {
      name: "Sainsbury's Q3 Business Review",
      inputs: [
        "Q3 review for Sainsbury's grocery account covering total account, top 10 SKUs and promo performance vs agreed plan.",
        "Sales +4.2% vs LY but 3pts below plan. Margin held at 31%. Distribution gaps on two priority SKUs and promo ROI weakened on multibuy mechanics.",
        "Growth came from premium SKU mix and improved base rate of sale. Under-performance driven by missed secondary space, late promo stock and lower feature compliance.",
        "Agree Q4 recovery plan: fix distribution gaps, switch one promo to price cut, protect top SKU availability and confirm buyer support for January reset.",
      ],
      brief: "Create a QBR that explains what happened, why it happened and the actions needed to recover next-quarter performance.",
      audience: "Leadership review",
      tone: "detailed_analytical",
    },
    "promo-proposal": {
      name: "Asda Summer Promo Proposal",
      inputs: [
        "Run £1.50 feature-and-display promotion for four weeks in July on 500g core SKU across Asda main estate.",
        "Baseline 18k units/week; expected uplift 2.4x based on last summer event and improved media support.",
        "Invoice £1.12, SRP £1.50, COGS £0.64, proposed support £85k. Target contribution remains positive after support with ROI above 1.8x.",
        "Customer benefit: value-led summer event and incremental basket driver. Approval guardrail: do not exceed £95k support without feature compliance commitment.",
      ],
      brief: "Build a persuasive promo proposal with the mechanic, shopper rationale, ROI, support ask and negotiation guardrails.",
      audience: "Retailer/customer meeting",
      tone: "concise_commercial",
    },
    "range-review": {
      name: "Morrisons Chilled Range Review",
      inputs: [
        "Review chilled fixture to decide adds, deletes and space changes for autumn reset.",
        "SKU A ROS 18 units/store/week and 34% margin; SKU B ROS 4 and declining. New premium SKU forecast ROS 11 with strong incrementality. Distribution gaps on two core SKUs.",
        "Competitor benchmark shows premium sub-segment under-spaced by 1.5 bays and shopper need for higher-protein options is growing.",
        "Recommend add two premium SKUs, delist SKU B, expand core SKU facing in top stores and protect availability on top 5 lines.",
      ],
      brief: "Create a range-review deck that makes the assortment decision easy, with evidence by SKU and a clear commercial impact.",
      audience: "Retailer/customer meeting",
      tone: "detailed_analytical",
    },
    "product-launch": {
      name: "Premium Protein SKU Launch Deck",
      inputs: [
        "Launch a premium high-protein chilled SKU in September with Tesco and Sainsbury's as priority customers.",
        "Consumer insight: shoppers want convenient higher-protein options without moving into sports nutrition. Category gap exists at premium price points.",
        "Year-one forecast £1.4m RSV, 38% gross margin, distribution ask 650 stores, launch support £160k across media, sampling and introductory promotion.",
        "Main risks: forecast confidence, chilled supply lead times and activation compliance. Success measures: distribution, ROS, repeat rate and launch ROI.",
      ],
      brief: "Build a launch sell-in story that proves the shopper need, customer fit, forecast, support plan and launch risks.",
      audience: "Retailer/customer meeting",
      tone: "executive_polished",
    },
    "annual-planning": {
      name: "Waitrose 2027 Annual Account Plan",
      inputs: [
        "2027 plan for Waitrose with target +6% net sales growth and margin protection above 30%.",
        "2026 delivered +3.5% sales but missed premium mix target. Strong Christmas execution, weaker spring availability and underused digital activation.",
        "Priorities: premium mix growth, better seasonal planning, lower-waste promo mechanics and stronger digital support. Investment ask £240k with clear quarterly trade-offs.",
        "Q1 reset and availability fix, Q2 summer activation, Q3 premium launch, Q4 seasonal event. Owners across NAM, supply, category and shopper marketing.",
      ],
      brief: "Create an annual planning deck with last-year lessons, strategic priorities, investment choices and a quarterly roadmap.",
      audience: "Leadership review",
      tone: "executive_polished",
    },
    "buyer-meeting": {
      name: "Tesco Buyer Meeting Planner",
      inputs: [
        "Buyer: Tesco chilled category manager. Meeting next Thursday. Desired decision: approval for September launch distribution and Q4 feature support.",
        "Buyer priorities: value perception, availability and fixture simplicity. Likely objections: support cost, SKU duplication and launch forecast confidence.",
        "Commercial ask: 650-store distribution, one Q4 feature, £80k shared activation. Walk-away: phased 350-store launch with confirmed review trigger. Concession: shift media timing.",
        "Evidence: category gap, forecast, competitor benchmark and prior promo ROI. Questions: decision criteria, fixture constraints, activation requirements and sign-off timing.",
      ],
      brief: "Build this as a practical buyer meeting plan with opening objective, questions, likely objections, evidence, negotiation guardrails and close.",
      audience: "Internal review",
      tone: "concise_commercial",
    },
    "category-opportunity": {
      name: "Chilled Snacks Category Opportunity",
      inputs: [
        "Opportunity question: where can Tesco unlock chilled snacks growth over the next 12 months?",
        "Shopper trends: higher-protein snacking, weekday convenience and premium treat missions are growing. Younger shoppers are under-indexing in current fixture.",
        "Benchmark shows competitor has 18% more premium space and stronger high-protein range. Distribution gaps on two fast-growing sub-segments.",
        "Recommend premium range expansion, stronger meal-deal adjacency, two test stores for new fixture flow and value story linked to basket growth.",
      ],
      brief: "Create a category opportunity deck that sizes the prize, explains the shopper/customer gap and recommends practical growth actions.",
      audience: "Retailer/customer meeting",
      tone: "detailed_analytical",
    },
  };
  const fallback = {
    name: `${deckLabel} example deck`,
    inputs: [
      "Retailer/customer meeting to secure a clear commercial decision.",
      "Customer context, commercial risk and the core ask that needs approval.",
      "Enter the revenue, margin, support and ROI assumptions to include in the draft.",
      "Finish with owners, actions, timings and the decision needed.",
    ],
    brief: "Create a concise commercial deck with a clear story, evidence, recommendation, risks and next steps.",
    audience: "Retailer/customer meeting",
    tone: "concise_commercial",
  };
  const example = examples[deckType] ?? fallback;
  return {
    ...example,
    inputs: inputValuesForPlaybook(playbook, example.inputs),
  };
}

const defaultDeckPlaybook: DeckPlaybook = {
  proofPrompt: "Clarify the decision, the commercial ask and the evidence needed to support it.",
  inputPrompts: [
    "Audience, meeting objective and decision needed",
    "Customer context, risks, asks and next steps",
    "Key commercial numbers or where they are uploaded",
    "Any specific slides, story flow or format to follow",
  ],
  briefPlaceholder: "Example: Build a QBR for Tesco covering Q3 performance, promo results, risks, next-quarter asks and recommended actions.",
  fallbackBrief: ["Add the customer context, commercial objective and core ask.", "Enter sales figures or key points from prior decks."],
  outline: ["Objective and context", "Commercial priorities", "Evidence and assumptions", "Recommended story", "Risks and watchouts"],
  evidenceSlideTitle: "Brief and assumptions",
  recommendationSlide: {
    title: "Recommended story",
    lines: [
      "Lead with the customer opportunity and the decision needed.",
      "Connect the commercial ask to the retailer or customer benefit.",
      "Use the attached data to prove the size of prize, risk and payback.",
    ],
  },
  financialSlide: {
    title: "Financial summary",
    lines: [
      "Add revenue, margin, support and ROI outputs from the relevant APT calculator.",
      "Separate confirmed facts from assumptions.",
      "Show the decision threshold or negotiation guardrail clearly.",
    ],
  },
  risksSlide: {
    title: "Risks and watchouts",
    lines: [
      "Call out data gaps, approval dependencies and commercial assumptions.",
      "Highlight where retailer/customer policy may affect final pricing or support treatment.",
      "Use this draft as a working structure before customer-facing use.",
    ],
  },
  nextStepsSlide: {
    title: "Next steps",
    lines: ["Confirm data sources and final commercial assumptions.", "Agree the recommended ask, owner and timing.", "Turn the draft into the customer-ready version."],
  },
};

const deckPlaybooks: Record<string, DeckPlaybook> = {
  jbp: {
    proofPrompt: "Show the joint growth agenda, the investment choices and the measures of success.",
    inputPrompts: [
      "Customer growth ambition and planning period",
      "Joint objectives, category roles and shopper opportunity",
      "Investment plan, trade-offs, asks and expected return",
      "Success measures, owners, milestones and governance",
    ],
    briefPlaceholder: "Example: Build a 2027 JBP for Tesco with three growth pillars, trade investment asks, category objectives and quarterly milestones.",
    fallbackBrief: ["Add the planning period, customer growth ambition and core JBP ask.", "Enter past sales, targets and planned investment."],
    outline: ["Joint ambition", "Customer and category context", "Growth pillars", "Investment plan", "Measures of success", "Governance and next steps"],
    evidenceSlideTitle: "Customer and category context",
    recommendationSlide: {
      title: "Growth pillars and recommendation",
      lines: ["Anchor the plan around two or three growth pillars.", "Show what the customer gains and what support is needed.", "Make the preferred investment route explicit."],
    },
    financialSlide: {
      title: "Investment and value plan",
      lines: ["Show revenue, margin, trade investment and expected return by pillar.", "Separate base plan from stretch initiatives.", "Highlight decision thresholds and guardrails."],
    },
    risksSlide: {
      title: "Risks and dependencies",
      lines: ["Call out range, supply, funding, customer alignment and data risks.", "Show mitigations and decision owners.", "Identify assumptions that need sign-off."],
    },
    nextStepsSlide: {
      title: "Governance and next steps",
      lines: ["Confirm owners, dates and review cadence.", "Agree customer asks and internal approvals.", "Lock the measurement scorecard."],
    },
  },
  "account-plan": {
    proofPrompt: "Build an internal account plan: current position, priorities, risks, resources and action plan.",
    inputPrompts: [
      "Account context and current performance",
      "Growth opportunity and priority products/ranges",
      "Commercial objective, investment and support needed",
      "Risks, owners, governance and next commercial actions",
    ],
    briefPlaceholder: "Example: Build an internal account plan for Tesco covering current performance, growth opportunities, risks, owners, investment and 30/60/90 actions.",
    fallbackBrief: ["Add the account context, internal objective and current performance.", "Enter the key sales and customer scorecard figures."],
    outline: ["Account situation", "Performance and evidence", "Growth priorities", "Investment and resource plan", "Risks and governance", "30/60/90 action plan"],
    evidenceSlideTitle: "Account situation and evidence",
    recommendationSlide: {
      title: "Priority account plan",
      lines: ["Summarise the internal account priorities.", "Connect each priority to the commercial objective.", "Make trade-offs, resources and decision needs explicit."],
    },
    financialSlide: {
      title: "Value, investment and support",
      lines: ["Show sales, margin, investment and support assumptions.", "Separate confirmed facts from planning assumptions.", "Highlight finance guardrails and approval needs."],
    },
    risksSlide: {
      title: "Risks, owners and dependencies",
      lines: ["Call out margin, supply, customer, range and execution risks.", "Assign owners for evidence, finance, supply and customer alignment.", "Identify decisions needed before external customer use."],
    },
    nextStepsSlide: {
      title: "30/60/90 action plan",
      lines: ["30 days: validate data and align internal owners.", "60 days: prepare recommendation and customer engagement plan.", "90 days: review progress and scale what works."],
    },
  },
  qbr: {
    proofPrompt: "Explain performance, what changed, what it means and what should happen next quarter.",
    inputPrompts: ["Review period and customer/account scope", "Sales, margin, distribution and promo performance", "Drivers of over/under-performance", "Actions, risks and asks for the next period"],
    briefPlaceholder: "Example: Build a Q3 QBR for Sainsbury's showing performance vs target, promo ROI, distribution gaps, risks and Q4 actions.",
    fallbackBrief: ["Add the review period, performance headlines and actions required.", "Enter scorecard figures and the reasons for any variance."],
    outline: ["Executive summary", "Performance vs plan", "Drivers and insights", "Risks and opportunities", "Recommended actions"],
    evidenceSlideTitle: "Performance and drivers",
    recommendationSlide: {
      title: "Recommended actions",
      lines: ["Prioritise the actions that change next-period performance.", "Link each action to evidence from the review.", "Separate customer asks from internal actions."],
    },
    financialSlide: {
      title: "Commercial scorecard",
      lines: ["Show sales, margin, volume, support and ROI where available.", "Compare actuals against target or prior period.", "Flag the biggest movement drivers."],
    },
    risksSlide: {
      title: "Risks and watchouts",
      lines: ["Identify supply, range, promo, pricing and execution risks.", "Call out open data gaps.", "Clarify impact if no action is taken."],
    },
    nextStepsSlide: {
      title: "Next-quarter action plan",
      lines: ["Confirm actions, owners and timing.", "Agree buyer/customer follow-ups.", "Lock the next review checkpoint."],
    },
  },
  "promo-proposal": {
    proofPrompt: "Prove why the promotion should run, what support is needed and what payback is expected.",
    inputPrompts: ["Promotion mechanic, timing and customer", "Baseline and expected promo volume", "Invoice, SRP, support, COGS and ROI assumptions", "Customer benefit, negotiation ask and approval guardrails"],
    briefPlaceholder: "Example: Build a promo proposal for Asda with £1.50 mechanic, expected uplift, support ask, ROI and customer rationale.",
    fallbackBrief: ["Add the mechanic, support ask and expected uplift.", "Enter the ROI scenarios and results from comparable promotions."],
    outline: ["Promotion objective", "Mechanic and shopper rationale", "Commercial model", "Customer benefit", "Recommendation and guardrails"],
    evidenceSlideTitle: "Mechanic and assumptions",
    recommendationSlide: {
      title: "Promotion recommendation",
      lines: ["State the mechanic, timing and customer ask clearly.", "Connect the deal to shopper or retailer benefit.", "Show the preferred option and fallback position."],
    },
    financialSlide: {
      title: "ROI and support summary",
      lines: ["Show baseline, uplift, support cost, revenue and margin impact.", "Use APT ROI scenario outputs where available.", "Highlight payback threshold and approval guardrails."],
    },
    risksSlide: {
      title: "Risks and guardrails",
      lines: ["Call out cannibalisation, stock, execution and funding risks.", "Set conditions for approval.", "Define what would make the promotion unattractive."],
    },
    nextStepsSlide: {
      title: "Approval and buyer next steps",
      lines: ["Confirm internal sign-off.", "Prepare buyer negotiation asks.", "Lock timing, feature support and measurement plan."],
    },
  },
  "range-review": {
    proofPrompt: "Show which products should be kept, added, removed or expanded, and why.",
    inputPrompts: ["Retailer range objective and category role", "SKU performance, ROS, distribution, margin and incrementality", "Competitor/benchmark gaps and shopper need", "Recommended adds, deletes, swaps or space changes"],
    briefPlaceholder: "Example: Build a range review for Morrisons recommending two new SKUs, one delist and a fixture-space change using ROS and margin evidence.",
    fallbackBrief: ["Add the range decision needed and the SKU-level evidence.", "Enter the sales, distribution or assortment evidence behind the recommendation."],
    outline: ["Range objective", "Current assortment performance", "Opportunity gaps", "Recommended range changes", "Commercial impact"],
    evidenceSlideTitle: "Current range performance",
    recommendationSlide: {
      title: "Recommended range changes",
      lines: ["Show add, keep, improve and remove recommendations.", "Explain the shopper and commercial reason for each move.", "Make the final assortment decision easy to scan."],
    },
    financialSlide: {
      title: "Range value impact",
      lines: ["Estimate sales, margin, distribution and space impact.", "Show key winners and risks by SKU.", "Call out assumptions behind the value case."],
    },
    risksSlide: {
      title: "Range risks and dependencies",
      lines: ["Flag supply, delist risk, substitution and retailer execution dependencies.", "Identify data gaps by SKU.", "Clarify launch or transition requirements."],
    },
    nextStepsSlide: {
      title: "Range decision next steps",
      lines: ["Confirm SKU decisions and rationale.", "Agree implementation timing.", "Prepare customer files and sell-in evidence."],
    },
  },
  "product-launch": {
    proofPrompt: "Prove why the new product deserves support, distribution and launch investment.",
    inputPrompts: ["Launch objective, target customer and timing", "Consumer/shopper insight and category gap", "Forecast, distribution ask, margin and support plan", "Launch risks, activation plan and success measures"],
    briefPlaceholder: "Example: Build a launch sell-in deck for a new premium SKU with consumer insight, forecast, distribution ask, launch support and risks.",
    fallbackBrief: ["Add the launch objective, target customer and distribution ask.", "Enter the key forecasts, product details and launch milestones."],
    outline: ["Launch headline", "Consumer and category opportunity", "Product and customer fit", "Forecast and support plan", "Launch recommendation"],
    evidenceSlideTitle: "Consumer and category opportunity",
    recommendationSlide: {
      title: "Launch recommendation",
      lines: ["State the distribution and support ask.", "Show why the product fits the customer and category gap.", "Connect activation to forecast delivery."],
    },
    financialSlide: {
      title: "Forecast and support plan",
      lines: ["Show forecast volume, revenue, margin and support by phase.", "Separate launch investment from ongoing trade support.", "Highlight success thresholds."],
    },
    risksSlide: {
      title: "Launch risks and watchouts",
      lines: ["Call out supply, forecast confidence, pricing, activation and rate-of-sale risks.", "Define mitigations before sell-in.", "Identify assumptions to validate."],
    },
    nextStepsSlide: {
      title: "Launch action plan",
      lines: ["Confirm customer target list and timings.", "Lock assets, samples and activation.", "Set the post-launch measurement cadence."],
    },
  },
  "annual-planning": {
    proofPrompt: "Translate the annual ambition into priorities, investment choices and quarterly actions.",
    inputPrompts: ["Planning year, customer and target ambition", "Last-year performance and key lessons", "Priority initiatives, investment asks and trade-offs", "Quarterly roadmap, owners and measures"],
    briefPlaceholder: "Example: Build a 2027 annual plan for Waitrose with last-year learnings, target ambition, investment priorities and quarterly roadmap.",
    fallbackBrief: ["Add the planning year, target ambition and priority initiatives.", "Enter prior-year results and next-year targets."],
    outline: ["Annual ambition", "Last-year lessons", "Strategic priorities", "Investment choices", "Quarterly roadmap"],
    evidenceSlideTitle: "Performance context and lessons",
    recommendationSlide: {
      title: "Annual priorities",
      lines: ["Focus the plan on a small set of commercial priorities.", "Explain why each priority matters now.", "Show what will be deprioritised or traded off."],
    },
    financialSlide: {
      title: "Annual value and investment plan",
      lines: ["Show target revenue, margin, support and growth assumptions.", "Connect investment to priority outcomes.", "Highlight approval decisions required."],
    },
    risksSlide: {
      title: "Planning risks",
      lines: ["Call out delivery risks, dependencies and open assumptions.", "Show mitigations by priority.", "Clarify what needs leadership alignment."],
    },
    nextStepsSlide: {
      title: "Quarterly roadmap",
      lines: ["Set quarterly milestones and owners.", "Confirm governance cadence.", "Agree first-quarter activation steps."],
    },
  },
  "buyer-meeting": {
    proofPrompt: "Prepare the buyer conversation: objective, likely objections, commercial ask and meeting close.",
    inputPrompts: ["Buyer, meeting date and desired decision", "Buyer priorities, likely objections and negotiation context", "Your commercial ask, walk-away position and concessions", "Evidence, questions to ask and follow-up actions"],
    briefPlaceholder: "Example: Build a buyer meeting planner for a Tesco range meeting with the decision needed, buyer objections, key questions, negotiation asks and follow-up plan.",
    fallbackBrief: ["Add the buyer, meeting objective and decision needed.", "Add likely objections, negotiation guardrails and questions to ask."],
    outline: ["Meeting objective", "Buyer context", "Questions and evidence", "Negotiation plan", "Close and follow-up"],
    evidenceSlideTitle: "Buyer context and evidence",
    recommendationSlide: {
      title: "Meeting plan",
      lines: ["Open with the decision needed and buyer benefit.", "Use questions to surface priorities before presenting the ask.", "Prepare evidence for the most likely objections."],
    },
    financialSlide: {
      title: "Commercial ask and guardrails",
      lines: ["Show the target ask, fallback position and concessions.", "Include revenue, margin or support impact where relevant.", "Clarify what needs internal approval."],
    },
    risksSlide: {
      title: "Objections and responses",
      lines: ["List likely buyer objections.", "Prepare evidence-led responses.", "Define when to pause, escalate or trade concessions."],
    },
    nextStepsSlide: {
      title: "Meeting close and follow-up",
      lines: ["Confirm the desired close.", "Capture actions, owners and timing.", "Prepare the follow-up note or internal recap."],
    },
  },
  "category-opportunity": {
    proofPrompt: "Size the category opportunity and show the actions needed to unlock it.",
    inputPrompts: ["Category, customer and opportunity question", "Shopper/category trends and market context", "Benchmark gaps, distribution gaps or competitor evidence", "Recommended actions, value case and customer benefit"],
    briefPlaceholder: "Example: Build a category opportunity deck for chilled snacks showing shopper trend, distribution gaps, competitor benchmark and recommended growth actions.",
    fallbackBrief: ["Add the category question, customer and opportunity to prove.", "Enter the market, shopper or benchmark figures behind the opportunity."],
    outline: ["Opportunity headline", "Shopper and market context", "Customer gap", "Commercial opportunity", "Recommended actions"],
    evidenceSlideTitle: "Shopper and market context",
    recommendationSlide: {
      title: "Recommended growth actions",
      lines: ["Translate the opportunity into practical actions.", "Show how each action benefits the customer and shopper.", "Prioritise the actions by value and feasibility."],
    },
    financialSlide: {
      title: "Size of prize",
      lines: ["Estimate revenue, margin, distribution or penetration upside.", "Show assumptions clearly.", "Separate quick wins from longer-term bets."],
    },
    risksSlide: {
      title: "Risks and proof gaps",
      lines: ["Call out data confidence and benchmark limitations.", "Identify execution dependencies.", "Show what evidence is needed before scale-up."],
    },
    nextStepsSlide: {
      title: "Opportunity next steps",
      lines: ["Confirm the priority action list.", "Agree data validation or pilot needs.", "Prepare the customer decision path."],
    },
  },
};

function getDeckPlaybook(deckType: string) {
  if (deckType === "buyer-meeting-external") {
    return {
      ...defaultDeckPlaybook,
      proofPrompt: "Prepare the proposal and evidence you intend to share with the buyer.",
      inputPrompts: planningConfig["buyer-meeting-external"].questions,
      briefPlaceholder: "Add evidence approved for the buyer.",
    };
  }
  return deckPlaybooks[deckType] ?? defaultDeckPlaybook;
}

function deckOutline(deckLabel: string, deckType: string, includeFinancialSummary: boolean, includeNextStepsSlide: boolean) {
  const playbook = getDeckPlaybook(deckType);
  return [
    `${deckLabel} overview`,
    ...playbook.outline,
    ...(includeFinancialSummary && playbook.financialSlide ? [playbook.financialSlide.title] : []),
    playbook.risksSlide.title,
    ...(includeNextStepsSlide ? [playbook.nextStepsSlide.title] : []),
  ];
}

function buildDeckContent({
  deckLabel,
  deckType,
  deckInputs,
  brief,
  includeFinancialSummary,
  includeNextStepsSlide,
  supportingFiles,
  includeSectionDividers,
}: {
  deckLabel: string;
  deckType: string;
  deckInputs: DeckInputValues;
  brief: string;
  includeFinancialSummary: boolean;
  includeNextStepsSlide: boolean;
  supportingFiles: File[];
  includeSectionDividers: boolean;
}) {
  const playbook = getDeckPlaybook(deckType);
  const outline = deckOutline(deckLabel, deckType, includeFinancialSummary, includeNextStepsSlide);
  const suppliedInputs = normaliseDeckInputs(deckInputs, playbook);
  const suppliedInputLines = suppliedInputs.map((item) => `${item.prompt}: ${item.value}`);
  const briefPoints = briefSentences(brief);
  const evidenceLines = suppliedInputLines.length
    ? suppliedInputLines
    : briefPoints.length
      ? briefPoints
      : playbook.fallbackBrief;
  const coverSummary = brief || suppliedInputs.slice(0, 2).map((item) => item.value).join("\n") || "Generated from your custom deck inputs. Add more detail to sharpen the next version.";
  const sourceSummary = supportingFiles.length
    ? supportingFiles.map((file) => `${file.name} (${formatFileSize(file.size)})`)
    : [];
  const contentSection = (title: string, slides: DeckSlideContent[]): SlideContent[] => [
    ...(includeSectionDividers ? [{ title, lines: [], purpose: "divider" as const }] : []),
    ...slides.map((slide) => ({ ...slide, purpose: "content" as const })),
  ];
  const contents: SlideContent[] = [
    { title: deckLabel, lines: [coverSummary], purpose: "title" },
    { title: "Draft story flow", lines: outline.map((item, index) => `${index + 1}. ${item}`), purpose: "content" },
    ...contentSection("Context and evidence", [
      { title: playbook.evidenceSlideTitle, lines: evidenceLines },
      ...(sourceSummary.length ? [{ title: "Supporting files attached", lines: sourceSummary }] : []),
    ]),
    ...contentSection("Recommendations and actions", [
      {
        title: playbook.recommendationSlide.title,
        lines: [...playbook.recommendationSlide.lines, ...suppliedInputLines.slice(0, 2)].slice(0, 8),
      },
      ...(includeFinancialSummary && playbook.financialSlide
        ? [{ title: playbook.financialSlide.title, lines: [...playbook.financialSlide.lines, ...suppliedInputLines.filter((line) => /sales|margin|forecast|roi|investment|support|commercial/i.test(line)).slice(0, 2)].slice(0, 8) }]
        : []),
      {
        title: playbook.risksSlide.title,
        lines: [...playbook.risksSlide.lines, ...suppliedInputLines.filter((line) => /risk|objection|guardrail|dependency|watchout/i.test(line)).slice(0, 2)].slice(0, 8),
      },
      ...(includeNextStepsSlide ? [playbook.nextStepsSlide] : []),
    ]),
  ];
  return { outline, contents };
}

const defaultTemplateDesign: TemplateDesign = {
  sourceName: "APT default",
  backgroundColor: "F7FAF9",
  panelFillColor: "FFFFFF",
  accentColor: "0F766E",
  secondaryColor: "AAC6C2",
  textColor: "16202A",
  mutedTextColor: "4B5966",
  borderColor: "CFE1DE",
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
};

function normaliseHex(value: string | undefined, fallback: string) {
  const cleaned = value?.replace(/[^a-fA-F0-9]/g, "").slice(0, 6).toUpperCase();
  return cleaned && cleaned.length === 6 ? cleaned : fallback;
}

function colorLuminance(hex: string) {
  const value = normaliseHex(hex, "FFFFFF");
  const [red, green, blue] = [0, 2, 4].map((start) => parseInt(value.slice(start, start + 2), 16) / 255);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function readableTextColor(background: string) {
  return colorLuminance(background) > 0.62 ? "16202A" : "FFFFFF";
}

function mutedReadableTextColor(textColor: string) {
  return textColor === "FFFFFF" ? "EAF3F2" : "4B5966";
}

function extractSchemeColor(xml: string, name: string, fallback: string) {
  const block = new RegExp(`<a:${name}[^>]*>([\\s\\S]*?)<\\/a:${name}>`).exec(xml)?.[1] ?? "";
  return normaliseHex(/<a:srgbClr[^>]+val="([^"]+)"/.exec(block)?.[1] ?? /<a:sysClr[^>]+lastClr="([^"]+)"/.exec(block)?.[1], fallback);
}

function extractTypeface(xml: string, fontGroup: "majorFont" | "minorFont", fallback: string) {
  const block = new RegExp(`<a:${fontGroup}[^>]*>([\\s\\S]*?)<\\/a:${fontGroup}>`).exec(xml)?.[1] ?? "";
  return /<a:latin[^>]+typeface="([^"]+)"/.exec(block)?.[1] || fallback;
}

async function extractTemplateDesign(file: File | null): Promise<TemplateDesign> {
  if (!file || ![".pptx", ".potx"].includes(fileExtension(file.name))) return defaultTemplateDesign;

  try {
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const themeXml = (await zip.file("ppt/theme/theme1.xml")?.async("text")) ?? "";
    const slideXml = (await zip.file("ppt/slides/slide1.xml")?.async("text")) ?? "";
    const contentSlideXml = (await zip.file("ppt/slides/slide2.xml")?.async("text")) ?? slideXml;
    const backgroundFromSlide = /<p:bg[\s\S]*?<a:srgbClr[^>]+val="([^"]+)"/.exec(slideXml)?.[1];
    const accentColor = extractSchemeColor(themeXml, "accent1", defaultTemplateDesign.accentColor);
    const secondaryColor = extractSchemeColor(themeXml, "accent2", defaultTemplateDesign.secondaryColor);
    const backgroundColor = normaliseHex(backgroundFromSlide, extractSchemeColor(themeXml, "lt1", defaultTemplateDesign.backgroundColor));
    const hasImageBackground = /<p:bg[\s\S]*?<a:blipFill[\s\S]*?<\/p:bg>/.test(contentSlideXml);
    const textColor = hasImageBackground ? readableTextColor("123235") : extractSchemeColor(themeXml, "dk1", readableTextColor(backgroundColor));

    return {
      sourceName: file.name,
      backgroundColor,
      panelFillColor: colorLuminance(backgroundColor) > 0.84 ? "FFFFFF" : "F7FAF9",
      accentColor,
      secondaryColor,
      textColor,
      mutedTextColor: hasImageBackground ? mutedReadableTextColor(textColor) : colorLuminance(backgroundColor) > 0.62 ? "4B5966" : "E5EEF0",
      borderColor: secondaryColor,
      headFontFace: extractTypeface(themeXml, "majorFont", defaultTemplateDesign.headFontFace),
      bodyFontFace: extractTypeface(themeXml, "minorFont", defaultTemplateDesign.bodyFontFace),
    };
  } catch {
    return defaultTemplateDesign;
  }
}

function addTextBlock(slide: PptxGenJS.Slide, title: string, lines: string[], design: TemplateDesign, y = 1.55) {
  slide.background = { color: design.backgroundColor };
  slide.addText(title, { x: 0.7, y: 0.62, w: 11.9, h: 0.45, fontFace: design.headFontFace, fontSize: 23, bold: true, color: design.textColor, margin: 0 });
  slide.addShape("line", { x: 0.7, y: 1.23, w: 11.9, h: 0, line: { color: design.accentColor, width: 1.2 } });
  slide.addText(
    lines.map((line) => `- ${line}`).join("\n"),
    { x: 0.9, y, w: 11.35, h: 4.8, fontFace: design.bodyFontFace, fontSize: 16, color: design.textColor, breakLine: false, fit: "shrink", valign: "top" },
  );
}

async function createDeckFile({
  deckLabel,
  deckType,
  deckInputs,
  brief,
  audience,
  tone,
  includeFinancialSummary,
  includeNextStepsSlide,
  supportingFiles,
  templateDesign,
  templateFile,
  layoutChoices,
  readabilityMode,
  qbr,
  commercial,
}: {
  deckLabel: string;
  deckType: string;
  deckInputs: DeckInputValues;
  brief: string;
  audience: string;
  tone: string;
  includeFinancialSummary: boolean;
  includeNextStepsSlide: boolean;
  supportingFiles: File[];
  templateDesign: TemplateDesign;
  templateFile: File | null;
  layoutChoices?: LayoutChoices;
  readabilityMode: ReadabilityMode;
  qbr?: { context: QbrContext; approval: QbrApproval };
  commercial?: { context: CommercialContext; approval: CommercialApproval };
}): Promise<GeneratedDeckResult> {
  const autoTextColor = templateDesign.textColor === "FFFFFF" ? "FFFFFF" : readableTextColor(templateDesign.backgroundColor);
  const design = readabilityMode === "auto"
    ? {
        ...templateDesign,
        textColor: autoTextColor,
        mutedTextColor: mutedReadableTextColor(autoTextColor),
      }
    : templateDesign;
  const { outline, contents } = commercial
    ? buildCommercialSlides(commercial.context, commercial.approval, Boolean(layoutChoices?.divider))
    : qbr ? buildQbrSlides(qbr.context, qbr.approval, Boolean(layoutChoices?.divider)) : buildDeckContent({
    deckLabel, deckType, deckInputs, brief, includeFinancialSummary, includeNextStepsSlide, supportingFiles,
    includeSectionDividers: Boolean(layoutChoices?.divider),
  });
  const filename = `${safeFilename(deckLabel)}-${Date.now()}.pptx`;
  if (templateFile) {
    if (!layoutChoices) throw new Error("Choose the PowerPoint layouts before creating the deck.");
    try {
      const { applyPowerPointTemplate } = await import("./powerPointTemplate");
      const blob = await applyPowerPointTemplate(templateFile, contents, design, layoutChoices, readabilityMode === "auto");
      return {
        file: new File([blob], filename, { type: powerPointMimeType }),
        filename,
        outline,
        templateDesignApplied: true,
      };
    } catch {
      throw new Error("Could not apply this PowerPoint template. Try opening and resaving it in PowerPoint, or choose the simple blank template.");
    }
  }

  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "APT Account Planning Tools";
  pptx.company = "APT";
  pptx.subject = `${deckLabel} generated draft`;
  pptx.title = deckLabel;
  pptx.theme = {
    headFontFace: design.headFontFace,
    bodyFontFace: design.bodyFontFace,
  };

  const cover = pptx.addSlide();
  if (qbr || commercial) {
    cover.background = { color: "153B3A" };
    cover.addShape(pptx.ShapeType.rect, { x: 0.75, y: 1.18, w: 0.75, h: 0.08, fill: { color: "60C4AF" }, line: { color: "60C4AF" } });
    cover.addText(contents[0].lines.at(-1) ?? "Commercial presentation", {
      x: 0.75, y: 1.43, w: 11.4, h: 0.36, fontSize: 16, color: "A7E0D3", margin: 0, fontFace: design.bodyFontFace,
    });
    cover.addText(deckLabel, {
      x: 0.75, y: 2.06, w: 11.4, h: 2.15, fontSize: 42, bold: true, color: "FFFFFF", margin: 0,
      fontFace: design.headFontFace, valign: "middle", fit: "shrink",
    });
    const period = qbr?.context.period ?? (commercial ? commercialText(commercial.approval.data, "period") : "");
    if (period.trim()) {
      cover.addText(period.trim(), {
        x: 0.75, y: 4.6, w: 11.1, h: 0.65, fontSize: 19, color: "D7EFEB", margin: 0, fontFace: design.bodyFontFace, fit: "shrink",
      });
    }
  } else {
    cover.background = { color: design.backgroundColor };
    cover.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.18, fill: { color: design.accentColor }, line: { color: design.accentColor } });
    cover.addShape(pptx.ShapeType.rect, { x: 0, y: 7.22, w: 13.333, h: 0.28, fill: { color: design.secondaryColor }, line: { color: design.secondaryColor } });
    cover.addText(deckLabel, { x: 0.72, y: 1.35, w: 8.8, h: 0.7, fontFace: design.headFontFace, fontSize: 34, bold: true, color: design.textColor, margin: 0 });
    cover.addText(`Draft for ${audience}`, { x: 0.75, y: 2.18, w: 7.5, h: 0.35, fontFace: design.bodyFontFace, fontSize: 15, bold: true, color: design.accentColor, margin: 0 });
    cover.addText(contents[0]?.lines.join("\n") || "Generated from your custom deck brief. Add more detail to sharpen the next version.", {
      x: 0.75,
      y: 2.8,
      w: 6.5,
      h: 1.2,
      fontSize: 16,
      fontFace: design.bodyFontFace,
      color: design.mutedTextColor,
      fit: "shrink",
      margin: 0,
    });
    cover.addShape(pptx.ShapeType.rect, { x: 8.1, y: 1.35, w: 4.25, h: 3.85, fill: { color: design.panelFillColor }, line: { color: design.borderColor } });
    cover.addText(`Audience\n${audience}\n\nTone\n${toneOptions.find((item) => item.value === tone)?.label ?? tone}\n\nTemplate\n${design.sourceName}`, {
      x: 8.45,
      y: 1.75,
      w: 3.55,
      h: 2.9,
      fontFace: design.bodyFontFace,
      fontSize: 15,
      color: design.textColor,
      bold: true,
      breakLine: true,
      margin: 0.06,
    });
  }

  contents.slice(1).forEach((content) => addTextBlock(pptx.addSlide(), content.title, content.lines, design));

  const output = await pptx.write({ outputType: "blob" });
  const blob = await addDeckVisuals(output as Blob, contents, design);
  return {
    file: new File([blob], filename, { type: powerPointMimeType }),
    filename,
    outline,
    templateDesignApplied: false,
  };
}

function DeckFileDropzone({
  accept,
  disabled,
  error,
  files,
  helper,
  id,
  label,
  multiple = false,
  onFilesSelected,
  onRemoveFile,
}: {
  accept: string;
  disabled: boolean;
  error: string;
  files: File[];
  helper: string;
  id: string;
  label: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    onFilesSelected(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleDrag(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (!disabled) setIsDragging(event.type === "dragenter" || event.type === "dragover");
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    onFilesSelected(Array.from(event.dataTransfer.files ?? []));
  }

  return (
    <div className="deck-dropzone-control">
      <span>{label}</span>
      <label
        className={`deck-dropzone${isDragging ? " deck-dropzone-active" : ""}${disabled ? " deck-dropzone-disabled" : ""}`}
        htmlFor={id}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          accept={accept}
          className="visually-hidden"
          disabled={disabled}
          id={id}
          multiple={multiple}
          type="file"
          onChange={handleFiles}
        />
        <strong>{multiple ? "Drag and drop reference files here, or choose files" : "Drag and drop a deck template here, or choose a file"}</strong>
        <span>{helper}</span>
      </label>
      {files.length > 0 ? (
        <ul className="deck-file-list">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.size}-${index}`}>
              <span>
                {file.name} <small>{formatFileSize(file.size)}</small>
              </span>
              <button className="text-link" disabled={disabled} type="button" onClick={() => onRemoveFile(index)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <small className="selected-file">No file selected</small>
      )}
      {error ? <small className="field-error">{error}</small> : null}
    </div>
  );
}

const purposeLabels: Record<SlidePurpose, string> = {
  title: "Title slide",
  divider: "Section divider",
  content: "Content slide",
};

function TemplateLayoutReview({ review, deckName, busy, onChange, onConfirm, onCancel }: {
  review: PendingLayoutReview;
  deckName: string;
  busy: boolean;
  onChange: (purpose: SlidePurpose, value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  return (
    <section className="template-layout-review" aria-labelledby="template-layout-review-heading">
      <h2 id="template-layout-review-heading" tabIndex={-1} ref={heading}>Review template layouts</h2>
      <p>Confirm which layouts to use from {review.file.name}. The preview shows where the draft text will go.</p>
      <div className="template-layout-review-grid">
        {slidePurposes.map((purpose) => {
          const layout = review.options[purpose].find((option) => option.id === review.choices[purpose]);
          const sample = purpose === "title" ? deckName : purpose === "divider" ? "Context and evidence" : "Draft story flow";
          return (
            <div className="template-layout-review-item" key={purpose}>
              <label className="field">
                <span>{purposeLabels[purpose]}</span>
                <select disabled={busy} value={review.choices[purpose]} onChange={(event) => onChange(purpose, event.target.value)}>
                  {purpose === "divider" ? <option value="">Skip section dividers</option> : null}
                  {review.options[purpose].map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
                </select>
              </label>
              {review.uncertain.includes(purpose) ? <small>Check this match</small> : null}
              <div
                className="template-layout-schematic"
                style={{ aspectRatio: review.aspectRatio, backgroundColor: layout?.background ? `#${layout.background}` : undefined }}
                aria-hidden="true"
              >
                {layout ? (
                  [[layout.title, sample] as const, ...(layout.body ? [[layout.body, "Editable text"] as const] : [])].map(([box, text]) => (
                    <span key={text} style={{ left: `${box[0] * 100}%`, top: `${box[1] * 100}%`, width: `${box[2] * 100}%`, height: `${box[3] * 100}%` }}>{text}</span>
                  ))
                ) : <em>No divider slides</em>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="template-layout-review-actions">
        <button className="button" disabled={busy} type="button" onClick={onConfirm}>{busy ? "Creating deck..." : "Confirm layouts and create deck"}</button>
        <button className="button button-secondary" disabled={busy} type="button" onClick={onCancel}>
          {review.qbr ? "Back to QBR review" : review.commercial ? "Back to draft review" : "Back to deck setup"}
        </button>
      </div>
    </section>
  );
}

export function CustomDeckClient({ basedOnDeckId, selectedTemplate, fromRoi }: { basedOnDeckId: string; selectedTemplate: string; fromRoi: boolean }) {
  const { isLoading: isAuthLoading, plan, user } = useSupabaseAuth();
  const { requirePro } = useProAction({ from: "custom-deck", feature: "custom-deck" });
  const initialTemplate = normaliseTemplate(selectedTemplate);
  const initialDeckType = deckTypes.some((item) => item.value === initialTemplate) ? initialTemplate : "jbp";
  const initialKind = getCommercialKind(initialDeckType);
  const initialPlanning = initialKind && initialKind !== "jbp" && initialKind !== "promo-proposal" ? planningConfig[initialKind] : null;
  const initialDeckLabel = deckTypes.find((item) => item.value === initialDeckType)?.label ?? deckTypes[0].label;
  const [deckType, setDeckType] = useState(initialDeckType);
  const [deckName, setDeckName] = useState(`${initialDeckLabel} deck`);
  const [savedTemplates, setSavedTemplates] = useState<SavedPresentationTemplate[]>([]);
  const defaultSavedTemplate = savedTemplates.find((template) => template.isDefault) ?? savedTemplates[0] ?? null;
  const [templateSource, setTemplateSource] = useState<TemplateSource>(defaultSavedTemplate ? "saved" : "apt_default");
  const choseBlankTemplate = useRef(initialDeckType === "buyer-meeting-external");
  const buyerModeRevision = useRef(0);
  const [selectedSavedTemplateId, setSelectedSavedTemplateId] = useState(defaultSavedTemplate?.id ?? "");
  const [oneOffTemplateFiles, setOneOffTemplateFiles] = useState<File[]>([]);
  const [googleSlidesTemplateUrl, setGoogleSlidesTemplateUrl] = useState("");
  const [templateError, setTemplateError] = useState("");
  const [googleSlidesError, setGoogleSlidesError] = useState("");
  const [basedOnDeckTemplateFile, setBasedOnDeckTemplateFile] = useState<File | null>(null);
  const [basedOnDeckMessage, setBasedOnDeckMessage] = useState("");
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [supportingError, setSupportingError] = useState("");
  const [deckInputs, setDeckInputs] = useState<DeckInputValues>({});
  const [brief, setBrief] = useState("");
  const [audience, setAudience] = useState(initialPlanning?.audience ?? "Retailer/customer meeting");
  const [tone, setTone] = useState("concise_commercial");
  const [financialSummary, setFinancialSummary] = useState("Yes");
  const [nextStepsSlide, setNextStepsSlide] = useState("Yes");
  const [readabilityMode, setReadabilityMode] = useState<ReadabilityMode>("auto");
  const [requestMessage, setRequestMessage] = useState("");
  const [generatedDeckUrl, setGeneratedDeckUrl] = useState("");
  const [generatedDeckFilename, setGeneratedDeckFilename] = useState("");
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [layoutReview, setLayoutReview] = useState<PendingLayoutReview | null>(null);
  const [qbrReview, setQbrReview] = useState<PendingQbrReview | null>(null);
  const [commercialReview, setCommercialReview] = useState<PendingCommercialReview | null>(null);
  const [commercialDraft, setCommercialDraft] = useState<CommercialApproval | null>(null);
  const [importedRoi, setImportedRoi] = useState<RoiProposalDraft | null>(null);
  const [priorQbr, setPriorQbr] = useState<QbrApproval | null>(null);
  const [isQbrExample, setIsQbrExample] = useState(false);
  const isPro = plan === "pro" || plan === "team";
  const reusableSavedTemplates = useMemo(
    () => savedTemplates.filter(isReusableSavedTemplate),
    [savedTemplates],
  );
  const unavailableSavedTemplates = useMemo(
    () => savedTemplates.filter((template) => !isReusableSavedTemplate(template)),
    [savedTemplates],
  );
  const selectedDeck = useMemo(
    () => deckTypes.find((item) => item.value === deckType) ?? deckTypes[0],
    [deckType],
  );
  const selectedPlaybook = useMemo(() => getDeckPlaybook(deckType), [deckType]);
  const commercialKind = getCommercialKind(deckType);
  const planning = commercialKind && commercialKind !== "jbp" && commercialKind !== "promo-proposal" ? planningConfig[commercialKind] : null;
  const meetingMode = deckType === "buyer-meeting" || deckType === "buyer-meeting-external";
  const selectedSavedTemplate = useMemo(
    () => reusableSavedTemplates.find((template) => template.id === selectedSavedTemplateId) ?? null,
    [reusableSavedTemplates, selectedSavedTemplateId],
  );
  const activeUploadedTemplate = templateSource === "one_off" ? oneOffTemplateFiles[0] ?? basedOnDeckTemplateFile : null;
  const pendingLayoutReview = layoutReview && (
    (templateSource === "one_off" && layoutReview.file === activeUploadedTemplate)
    || (templateSource === "saved" && layoutReview.savedTemplateId === selectedSavedTemplate?.id)
  ) ? layoutReview : null;
  const activeTemplateName = activeUploadedTemplate?.name
    ?? (templateSource === "saved" && selectedSavedTemplate
      ? selectedSavedTemplate.displayName || selectedSavedTemplate.filename
      : templateSource === "apt_default"
        ? "Simple blank template"
        : "Upload a .pptx or .potx template");
  const activeTemplateKind = templateSource === "one_off" && oneOffTemplateFiles[0]
    ? "Uploaded deck design template"
    : templateSource === "one_off" && basedOnDeckTemplateFile
      ? "Design from saved deck"
    : templateSource === "saved" && selectedSavedTemplate
      ? "Saved template"
      : templateSource === "apt_default"
        ? "Simple blank template"
        : "No design template selected";
  const hasActiveDesignTemplate = Boolean(activeUploadedTemplate || (templateSource === "saved" && selectedSavedTemplate));
  const canCreateDeck = hasActiveDesignTemplate || templateSource === "apt_default";

  useEffect(() => {
    let isMounted = true;
    loadAccountSettings().then((result) => {
      if (!isMounted) return;
      const templates = result.data.presentationTemplates;
      setSavedTemplates(templates);
      const reusableTemplates = templates.filter(isReusableSavedTemplate);
      const defaultTemplate = reusableTemplates.find((template) => template.isDefault) ?? reusableTemplates[0] ?? null;
      if (!defaultTemplate) return;
      setSelectedSavedTemplateId((current) => current || defaultTemplate.id);
      if (!choseBlankTemplate.current) setTemplateSource((current) => (current === "apt_default" ? "saved" : current));
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (basedOnDeckId || fromRoi || !isPro) return;
    let timeoutId: number | null = null;
    try {
      const rawDraft = window.localStorage.getItem(CUSTOM_DECK_DRAFT_STORAGE_KEY);
      if (!rawDraft) return undefined;
      const draft = JSON.parse(rawDraft) as Record<string, unknown>;
      window.localStorage.removeItem(CUSTOM_DECK_DRAFT_STORAGE_KEY);
      const draftDeckType = normaliseTemplate(getText(draft.deckType, "jbp"));
      const matchedDeckType = deckTypes.some((item) => item.value === draftDeckType) ? draftDeckType : "jbp";
      timeoutId = window.setTimeout(() => {
        setDeckType(matchedDeckType);
        setDeckName(getText(draft.deckName, `${deckTypes.find((item) => item.value === matchedDeckType)?.label ?? "Custom"} deck`));
        setDeckInputs(isRecord(draft.deckInputs) ? Object.fromEntries(Object.entries(draft.deckInputs).map(([key, value]) => [key, getText(value)])) : {});
        setBrief(getText(draft.brief));
        setAudience(getText(draft.audience, "Internal review"));
        setTone(getText(draft.tone, "detailed_analytical"));
        setFinancialSummary("Yes");
        setNextStepsSlide("Yes");
        setBasedOnDeckMessage("Planning details copied into your brief. Choose a template, then create and save the deck.");
      }, 0);
    } catch {
      window.localStorage.removeItem(CUSTOM_DECK_DRAFT_STORAGE_KEY);
    }
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [basedOnDeckId, fromRoi, isPro]);

  useEffect(() => {
    if (!fromRoi || basedOnDeckId) return;
    const restore = window.setTimeout(() => {
      try {
        const draft = readRoiProposalDraft(window.sessionStorage);
        if (!draft) return;
        setImportedRoi(draft);
        setCommercialDraft({
          kind: "promo-proposal",
          data: {
            baselineUnits: String(draft.baselineUnits), expectedUnits: String(draft.expectedUnits),
            funding: String(draft.fixedFunding), baselinePriceImpact: String(draft.baselinePriceImpact),
            contribution: draft.unitContribution === null ? "" : String(draft.unitContribution),
            currency: draft.currency, roiSource: "true",
          },
        });
        setBrief(roiProposalEvidence(draft));
      } catch {
        // A blocked or expired local draft leaves the proposal builder available.
      }
    }, 0);
    return () => window.clearTimeout(restore);
  }, [fromRoi, basedOnDeckId]);

  useEffect(() => {
    if (!basedOnDeckId || !isPro) return;
    let isMounted = true;

    loadDeckBrief(basedOnDeckId).then(async (result) => {
      if (!isMounted) return;
      const saved = result.data;
      if (!saved) {
        setBasedOnDeckMessage(result.message ?? "Could not find that saved deck.");
        return;
      }

      const savedDeckType = getText(saved.deckType, normaliseTemplate(getText(saved.template_type, "jbp")));
      const matchedDeckType = deckTypes.some((item) => item.value === savedDeckType)
        ? savedDeckType
        : deckTypes.find((item) => item.label === getText(saved.template_type))?.value ?? "jbp";
      const savedGeneratedDeck = isRecord(saved.generatedDeck) ? saved.generatedDeck : {};
      const generatedDeckPath = getText(savedGeneratedDeck.storagePath);
      const generatedDeckFilename = getText(savedGeneratedDeck.filename, `${safeFilename(getText(saved.name, "saved-deck"))}.pptx`);

      setDeckName(`New ${getText(saved.name ?? saved.deck_name, "custom deck")}`);
      setDeckType(matchedDeckType);
      setDeckInputs(isRecord(saved.deckInputs) ? Object.fromEntries(Object.entries(saved.deckInputs).map(([key, value]) => [key, getText(value)])) : {});
      setBrief(getText(saved.brief));
      setAudience(getText(saved.audience, "Retailer/customer meeting"));
      setTone(getText(saved.tone, "concise_commercial"));
      setFinancialSummary(saved.includeFinancialSummary === false ? "No" : "Yes");
      setNextStepsSlide(saved.includeNextStepsSlide === false ? "No" : "Yes");
      setReadabilityMode(getText(saved.readabilityMode, "auto") === "preserve" ? "preserve" : "auto");
      setGoogleSlidesTemplateUrl(getText(saved.googleSlidesTemplateUrl));
      setPriorQbr(restoreQbrApproval(saved.qbrApproval));
      setCommercialDraft(restoreCommercialApproval(saved.commercialBrief));

      const savedTemplateId = getText(saved.savedTemplateId);
      if (savedTemplateId) {
        setSelectedSavedTemplateId(savedTemplateId);
        setTemplateSource("saved");
      } else if (getText(saved.templateSource) === "apt_default") {
        setTemplateSource("apt_default");
      }

      if (generatedDeckPath) {
        const startRevision = buyerModeRevision.current;
        const downloaded = await downloadGeneratedDeck(generatedDeckPath, generatedDeckFilename);
        if (!isMounted || buyerModeRevision.current !== startRevision) return;
        if (downloaded.file) {
          setBasedOnDeckTemplateFile(downloaded.file);
          setTemplateSource("one_off");
          setBasedOnDeckMessage(`Starting from saved deck "${getText(saved.name ?? saved.deck_name, "custom deck")}". Its generated file is being used as the design base.`);
          return;
        }
      }

      setBasedOnDeckMessage(`Starting from saved deck "${getText(saved.name ?? saved.deck_name, "custom deck")}". Brief and settings have been copied into a new deck request.`);
    });

    return () => {
      isMounted = false;
    };
  }, [basedOnDeckId, isPro]);

  useEffect(() => {
    return () => {
      if (generatedDeckUrl) URL.revokeObjectURL(generatedDeckUrl);
    };
  }, [generatedDeckUrl]);

  function validateOneOffTemplateFiles(files: File[]) {
    setTemplateError("");
    const file = files[0];
    if (!file) {
      setOneOffTemplateFiles([]);
      return;
    }
    if (!deckTemplateExtensions.includes(fileExtension(file.name)) || file.size > DECK_TEMPLATE_MAX_FILE_BYTES) {
      setOneOffTemplateFiles([]);
      setTemplateError("Please upload a .pptx or .potx PowerPoint template under 20MB.");
      return;
    }
    setOneOffTemplateFiles([file]);
    setTemplateSource("one_off");
  }

  function validateSupportingFiles(files: File[]) {
    if (!files.length) return;
    setSupportingError("");
    const previous = isQbrExample ? supportingFiles.filter((file) => file.name !== qbrSampleFilename) : supportingFiles;
    const next = [...previous, ...files];
    if (next.length > MAX_SUPPORTING_FILES) {
      setSupportingError("You can upload up to 5 supporting files.");
      return;
    }
    const invalidType = next.some((file) => !supportingFileExtensions.includes(fileExtension(file.name)));
    if (invalidType) {
      setSupportingError("Please upload supported files only: .xlsx, .csv, .pdf, .docx, .txt, .pptx, .key, .numbers or .pages.");
      return;
    }
    const tooLarge = next.some((file) => file.size > SUPPORTING_FILE_MAX_BYTES);
    if (tooLarge) {
      setSupportingError("Each file must be under 10MB.");
      return;
    }
    setSupportingFiles(next);
    if (isQbrExample) setIsQbrExample(false);
  }

  function changeDeckType(value: string) {
    const enteringBuyerVersion = value === "buyer-meeting-external";
    const leavingBuyerVersion = deckType === "buyer-meeting-external";
    if (enteringBuyerVersion || leavingBuyerVersion) {
      buyerModeRevision.current++;
      if (generatedDeckUrl) URL.revokeObjectURL(generatedDeckUrl);
      setGeneratedDeckUrl("");
      setGeneratedDeckFilename("");
      setCommercialDraft(null);
      setDeckInputs({});
      setBrief("");
      setSupportingFiles([]);
      setGoogleSlidesTemplateUrl("");
      setOneOffTemplateFiles([]);
      setBasedOnDeckTemplateFile(null);
      setBasedOnDeckMessage("");
      setLayoutReview(null);
      choseBlankTemplate.current = true;
      setTemplateSource("apt_default");
      const label = deckTypes.find((item) => item.value === value)?.label ?? deckTypes[0].label;
      setDeckName(label);
      setRequestMessage(enteringBuyerVersion ? "The buyer-facing proposal starts with fields for information you can share." : "");
    }
    const kind = getCommercialKind(value);
    setAudience(kind && kind !== "jbp" && kind !== "promo-proposal" ? planningConfig[kind].audience : "Retailer/customer meeting");
    setDeckType(value);
  }

  function applyCommercialDraft(draft: CommercialApproval) {
    setCommercialDraft(draft);
    setDeckInputs(Object.fromEntries(commercialInputKeys.map((key, index) => [
      selectedPlaybook.inputPrompts[index], commercialText(draft.data, key),
    ])));
    setBrief(commercialText(draft.data, "evidence"));
  }

  async function createAndSaveDeck(review?: PendingLayoutReview, qbrApproval?: QbrApproval, commercialApproval?: CommercialApproval) {
    if (isCreatingDeck || (pendingLayoutReview && pendingLayoutReview !== review) || (qbrReview && !qbrApproval && !review)
      || (commercialReview && !commercialApproval && !review)) return;
    if (isAuthLoading) {
      setRequestMessage("Checking your account before creating the deck...");
      return;
    }
    if (!isPro) {
      setRequestMessage("Custom deck building is included with APT Pro.");
      requirePro(() => undefined, { feature: "custom-deck", location: "custom_deck_save_request" });
      return;
    }
    if (!user?.id) {
      setRequestMessage("Sign in to create and save a deck.");
      return;
    }
    setTemplateError("");
    setGoogleSlidesError("");
    let pendingDownloadUrl = "";
    let pendingDownloadFilename = "";
    try {
      if (!deckName.trim()) {
        setRequestMessage("Name the deck before creating it so it is easy to find in Workspace.");
        return;
      }
      if (googleSlidesTemplateUrl.trim() && !isGoogleSlidesUrl(googleSlidesTemplateUrl)) {
        setGoogleSlidesError("Paste a shareable Google Slides presentation link, or leave this optional field blank.");
        setRequestMessage("Check the optional Google Slides reference link, or leave it blank.");
        return;
      }
      if (!canCreateDeck) {
        setTemplateError("Upload or choose a PowerPoint template, or select the simple blank template.");
        setRequestMessage("Choose a template option before creating the deck.");
        return;
      }
      const hasUploadedScorecard = deckType === "qbr" && supportingFiles.some((file) => /\.(csv|xlsx)$/i.test(file.name));
      const hasSavedEvidence = deckType === "qbr" && Boolean(priorQbr?.metrics.length);
      if (!commercialKind && !brief.trim() && normaliseDeckInputs(deckInputs, selectedPlaybook).length === 0 && !hasUploadedScorecard && !hasSavedEvidence) {
        setRequestMessage(`Add at least one ${selectedDeck.label.toLowerCase()} input before creating the deck.`);
        return;
      }
      const activeDeckInputs = activeDeckInputValues(deckInputs, selectedPlaybook);
      setIsCreatingDeck(true);
      setRequestMessage("Checking deck setup...");
      const resolvedDeckName = deckName.trim() || `${selectedDeck.label} generated deck`;
      const approved = qbrApproval ?? review?.qbr;
      const commercialApproved = commercialApproval ?? review?.commercial;
      const commercialContext: CommercialContext = {
        deckLabel: resolvedDeckName, audience: meetingMode ? planning?.audience ?? audience : audience, tone, financial: financialSummary === "Yes", next: nextStepsSlide === "Yes",
      };
      if (commercialKind && !commercialApproved) {
        const previous = commercialDraft?.kind === commercialKind ? commercialDraft.data : {};
        const setup = Object.fromEntries(commercialInputKeys.map((key, index) => [
          key, activeDeckInputs[selectedPlaybook.inputPrompts[index]] ?? "",
        ]));
        setCommercialReview({
          initial: { kind: commercialKind, data: { ...previous, ...setup, evidence: brief } },
          context: commercialContext,
        });
        setRequestMessage("");
        return;
      }
      const qbrContext: QbrContext = {
        deckLabel: resolvedDeckName,
        period: activeDeckInputs[deckPlaybooks.qbr.inputPrompts[0]] ?? "",
        performance: activeDeckInputs[deckPlaybooks.qbr.inputPrompts[1]] ?? "",
        brief, audience, tone,
        includeFinancialSummary: financialSummary === "Yes",
        includeNextStepsSlide: nextStepsSlide === "Yes",
      };
      if (deckType === "qbr" && !approved) {
        setRequestMessage("Reading scorecards...");
        const scorecard = await withTimeout(readQbrScorecards(supportingFiles), 15000, "Scorecard reading timed out.");
        if (!hasUploadedScorecard && priorQbr) scorecard.groups = groupMetrics(priorQbr.metrics);
        setQbrReview({
          context: qbrContext,
          scorecard,
          initialStory: isQbrExample ? {
            headline: qbrBenchmark.headline,
            decision: qbrBenchmark.decision,
            implication: qbrBenchmark.implication,
            drivers: activeDeckInputs[deckPlaybooks.qbr.inputPrompts[2]] ?? "",
            actions: activeDeckInputs[deckPlaybooks.qbr.inputPrompts[3]] ?? "",
            commitments: qbrBenchmark.commitments,
            salesDrivers: qbrBenchmark.drivers.map(({ label, value, evidence }) => [label, String(value), evidence]),
            bridgeMeasure: "Supplier net sales",
            actionRows: activeDeckInputs[deckPlaybooks.qbr.inputPrompts[3]] ? undefined : qbrBenchmark.actions,
          } : priorQbr?.story ?? {
            headline: "",
            decision: "",
            drivers: activeDeckInputs[deckPlaybooks.qbr.inputPrompts[2]] ?? "",
            actions: activeDeckInputs[deckPlaybooks.qbr.inputPrompts[3]] ?? "",
          },
        });
        setRequestMessage("");
        return;
      }
      if (generatedDeckUrl) URL.revokeObjectURL(generatedDeckUrl);
      setGeneratedDeckUrl("");
      setGeneratedDeckFilename("");
      let templateFileForDesign = review?.file ?? activeUploadedTemplate ?? null;
      if (!templateFileForDesign && templateSource === "saved" && selectedSavedTemplate) {
        setRequestMessage("Downloading saved template...");
        await waitForBrowserPaint();
        const downloaded = await withTimeout(
          downloadDeckTemplate(selectedSavedTemplate.storagePathOrUrl, selectedSavedTemplate.filename),
          SAVED_TEMPLATE_DOWNLOAD_TIMEOUT_MS,
          "Saved template download timed out. Re-upload the template as a one-off file or choose the simple blank template.",
        );
        if (downloaded.file) {
          templateFileForDesign = downloaded.file;
        } else {
          setTemplateError(downloaded.error ?? "Could not download the selected saved template.");
          setRequestMessage(downloaded.error ?? "Could not download the selected saved template.");
          return;
        }
      }
      if (!templateFileForDesign && templateSource !== "apt_default") {
        setTemplateError(
          savedTemplates.length
            ? "Choose a reusable saved PowerPoint template, or replace your older saved template with a .pptx/.potx upload."
            : "Upload a .pptx or .potx template before creating the deck.",
        );
        setRequestMessage("A reusable PowerPoint template is required so the generated deck uses your design instead of the APT default.");
        return;
      }
      let layoutChoices = review?.choices;
      if (templateFileForDesign && !layoutChoices) {
        setRequestMessage("Reading PowerPoint layouts...");
        await waitForBrowserPaint();
        const { inspectPowerPointTemplate } = await import("./powerPointTemplate");
        const analysis = await withTimeout(
          inspectPowerPointTemplate(templateFileForDesign).catch(() => {
            throw new Error("Could not read the layouts in this PowerPoint template. Try resaving it in PowerPoint or choosing a different template.");
          }),
          10000,
          "PowerPoint layout reading timed out.",
        );
        if (analysis.uncertain.length) {
          setLayoutReview({
            ...analysis,
            file: templateFileForDesign,
            savedTemplateId: templateSource === "saved" ? selectedSavedTemplate?.id ?? "" : "",
            qbr: approved,
            commercial: commercialApproved,
          });
          setRequestMessage("");
          return;
        }
        layoutChoices = analysis.choices;
      }
      setRequestMessage("Reading template design...");
      await waitForBrowserPaint();
      const templateDesign = await withTimeout(extractTemplateDesign(templateFileForDesign), 10000, "Template design reading timed out.");
      setRequestMessage("Creating deck file...");
      await waitForBrowserPaint();
      const generated = await withTimeout(
        createDeckFile({
          deckLabel: resolvedDeckName,
          deckType,
          deckInputs: activeDeckInputs,
          brief,
          audience,
          tone,
          includeFinancialSummary: financialSummary === "Yes",
          includeNextStepsSlide: nextStepsSlide === "Yes",
          supportingFiles,
          templateDesign,
          templateFile: templateFileForDesign,
          layoutChoices,
          readabilityMode,
          qbr: deckType === "qbr" && approved ? { context: qbrContext, approval: approved } : undefined,
          commercial: commercialApproved ? { context: commercialContext, approval: commercialApproved } : undefined,
        }),
        25000,
        "Deck file creation timed out.",
      );
      setRequestMessage("Saving generated deck...");
      await waitForBrowserPaint();
      const downloadUrl = URL.createObjectURL(generated.file);
      setLayoutReview(null);
      setQbrReview(null);
      setCommercialReview(null);
      if (commercialApproved) applyCommercialDraft(commercialApproved);
      pendingDownloadUrl = downloadUrl;
      pendingDownloadFilename = generated.filename;
      const uploaded = await withTimeout(
        uploadGeneratedDeck(generated.file, user.id),
        GENERATED_DECK_UPLOAD_TIMEOUT_MS,
        "Generated deck upload timed out. The deck was created, but storage did not respond. Use the download link below.",
      ).catch((error) => ({ path: null, error: error instanceof Error ? error.message : "Generated deck upload timed out." }));
      const requestPayload = {
        id: crypto.randomUUID ? crypto.randomUUID() : `deck-request-${Date.now()}`,
        name: resolvedDeckName,
        deck_name: resolvedDeckName,
        template_type: selectedDeck.label,
        deckType,
        templateSource: activeUploadedTemplate ? "one_off" : templateSource,
        savedTemplateId: !activeUploadedTemplate && templateSource === "saved" ? selectedSavedTemplateId : "",
        oneOffTemplateFileMeta: activeUploadedTemplate ? toFileMeta(activeUploadedTemplate) : null,
        googleSlidesTemplateUrl: googleSlidesTemplateUrl.trim(),
        supportingFilesMeta: supportingFiles.map(toFileMeta),
        deckInputs: commercialApproved ? Object.fromEntries(commercialInputKeys.map((key, index) => [
          selectedPlaybook.inputPrompts[index], commercialText(commercialApproved.data, key),
        ])) : activeDeckInputs,
        brief: commercialApproved ? commercialText(commercialApproved.data, "evidence") : brief,
        audience: commercialContext.audience,
        tone,
        includeFinancialSummary: financialSummary === "Yes",
        includeNextStepsSlide: nextStepsSlide === "Yes",
        exportFormat: "pptx",
        readabilityMode,
        generatedOutline: generated.outline,
        generated_outline: generated.outline,
        ...(deckType === "qbr" && approved ? { qbrApproval: approved } : {}),
        ...(commercialApproved ? { commercialBrief: commercialApproved } : {}),
        templateDesign: {
          applied: generated.templateDesignApplied,
          sourceName: templateDesign.sourceName,
          accentColor: templateDesign.accentColor,
          secondaryColor: templateDesign.secondaryColor,
          backgroundColor: templateDesign.backgroundColor,
          headFontFace: templateDesign.headFontFace,
          bodyFontFace: templateDesign.bodyFontFace,
        },
        generatedDeck: {
          filename: generated.filename,
          fileSize: generated.file.size,
          fileType: generated.file.type,
          storagePath: uploaded.path,
          generatedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
      };
      setRequestMessage("Saving deck to Workspace...");
      await waitForBrowserPaint();
      const result = await withTimeout(
        saveDeckBrief(requestPayload),
        WORKSPACE_SAVE_TIMEOUT_MS,
        "Workspace save timed out. The deck file was created, but the saved record did not complete.",
      );
      if (!result.data) {
        setGeneratedDeckUrl(downloadUrl);
        setGeneratedDeckFilename(generated.filename);
        setRequestMessage(`${result.message ?? "Could not save deck brief."} Use the download link to keep your PowerPoint file.`);
        return;
      }
      setGeneratedDeckUrl(downloadUrl);
      setGeneratedDeckFilename(generated.filename);
      setRequestMessage(
        uploaded.path
          ? generated.templateDesignApplied
            ? `Deck created and saved to your account using ${templateDesign.sourceName} as the design base.`
            : "Deck created and saved to your account."
          : `Deck created, but file storage did not save it: ${uploaded.error ?? "storage unavailable"}. Use the download link below.`,
      );
      if (importedRoi && commercialApproved?.kind === "promo-proposal" && uploaded.path) {
        try { window.sessionStorage.removeItem(roiProposalStorageKey); } catch { /* The deck is already saved. */ }
      }
    } catch (error) {
      if (pendingDownloadUrl) {
        setGeneratedDeckUrl(pendingDownloadUrl);
        setGeneratedDeckFilename(pendingDownloadFilename);
      }
      setRequestMessage(error instanceof Error ? error.message : "Could not create the deck. Please try again.");
    } finally {
      setIsCreatingDeck(false);
    }
  }

  function preventSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void createAndSaveDeck();
  }

  function populateExampleData() {
    if (deckType === "qbr" && supportingFiles.length && !isQbrExample) {
      setRequestMessage("Remove your current reference files before loading the fictional worked example.");
      return;
    }
    if (commercialKind && supportingFiles.length) {
      setRequestMessage("Remove your current reference files before loading the fictional worked example.");
      return;
    }
    setIsQbrExample(deckType === "qbr");
    if (deckType === "qbr") {
      setDeckName(`${qbrBenchmark.account} quarterly review`);
      setDeckInputs({ [deckPlaybooks.qbr.inputPrompts[0]]: `${qbrBenchmark.account} · ${qbrBenchmark.period}` });
      setBrief("");
      setAudience(planning?.audience ?? "Retailer/customer meeting");
      setTone("executive_polished");
      setFinancialSummary("Yes");
      setNextStepsSlide("Yes");
      setSupportingFiles((current) => current.length ? current : [
        new File([qbrBenchmarkCsv], qbrSampleFilename, { type: "text/csv" }),
      ]);
      setRequestMessage("The Bridgeway Grocers worked example is ready to review.");
      return;
    }
    if (commercialKind) {
      const { benchmark, label } = commercialConfig[commercialKind];
      setDeckName(benchmark.title);
      applyCommercialDraft({ kind: commercialKind, data: { ...benchmark } });
      setAudience(planning?.audience ?? "Retailer/customer meeting");
      setTone("executive_polished");
      setFinancialSummary("Yes");
      setNextStepsSlide("Yes");
      setRequestMessage(`The fictional ${label} worked example is ready to review.`);
      return;
    }
    const example = exampleDeckData(deckType, selectedPlaybook, selectedDeck.label);
    setDeckName(example.name);
    setDeckInputs(example.inputs);
    setBrief(example.brief);
    setAudience(example.audience ?? "Retailer/customer meeting");
    setTone(example.tone ?? "concise_commercial");
    setFinancialSummary("Yes");
    setNextStepsSlide("Yes");
    setRequestMessage(`${selectedDeck.label} example data added. You can edit any field before creating the deck.`);
  }

  return (
    <section className="shell section">
      <div className="custom-deck-layout">
        <form className="card custom-deck-page-form" onSubmit={preventSubmit}>
          {importedRoi ? (
            <section className="roi-import-note" aria-labelledby="roi-import-heading">
              <h2 id="roi-import-heading">Figures from your ROI calculation</h2>
              <p>{importedRoi.baselineUnits.toLocaleString("en-GB")} baseline units · {importedRoi.expectedUnits.toLocaleString("en-GB")} expected units · {new Intl.NumberFormat("en-GB", { style: "currency", currency: importedRoi.currency }).format(importedRoi.fixedFunding)} fixed funding</p>
              <p>These figures are held in this tab. Confirm or edit them during the proposal review.</p>
              {!isAuthLoading && !user ? <Link className="button button-small" href={`/login?returnTo=${encodeURIComponent(roiProposalPath)}`}>Sign in to continue</Link> : null}
              <Link className="text-link" href="/roi-tool?resume=proposal#roi-planner-start">Back to the ROI calculation</Link>
            </section>
          ) : null}
          {!isPro ? (
            <div className="locked-card custom-deck-lock">
              <div>
                <strong>Custom deck building is included with APT Pro.</strong>
                <span>
                  Download editable templates for free. APT Pro builds a draft from your brief and uses your chosen template for the design.
                </span>
              </div>
              <div className="summary-actions">
                <Link className="button button-secondary button-small" href={buildUpgradeHref(importedRoi ? { from: "roi-tool", feature: "roi-proposal" } : { from: "custom-deck", feature: "custom-deck" })}>
                  Switch to Pro
                </Link>
                <Link className="button button-secondary button-small" href="/presentation-templates">
                  Download free templates
                </Link>
              </div>
            </div>
          ) : null}

          <fieldset className="settings-fieldset" disabled={!isPro || isCreatingDeck || Boolean(qbrReview || commercialReview)}>
            <section className="custom-deck-form-section custom-deck-name-section">
              <h2>Deck setup</h2>
              {basedOnDeckMessage ? <p className="settings-message settings-message-success">{basedOnDeckMessage}</p> : null}
              <div className="custom-deck-setup-actions">
                <button className="button button-secondary button-small" disabled={!isPro} type="button" onClick={populateExampleData}>
                  Populate example data
                </button>
              </div>
              <div className="custom-deck-setup-grid">
                <label className="field">
                  <span>Deck name</span>
                  <input
                    required
                    placeholder={`${selectedDeck.label} for Tesco Q3`}
                    value={deckName}
                    onChange={(event) => setDeckName(event.target.value)}
                  />
                  <small>Shown in Workspace and used for the generated file.</small>
                </label>
                <label className="field">
                  <span>Deck type</span>
                  <select value={deckType} onChange={(event) => changeDeckType(event.target.value)}>
                    {deckTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <small>{meetingMode && deckType === "buyer-meeting" ? "Internal preparation, including negotiation limits. Select Buyer Meeting Proposal for the version to share." : selectedPlaybook.proofPrompt}</small>
                </label>
              </div>
            </section>

            <section className="custom-deck-form-section">
              <h2>Deck template</h2>
              <p className="helper-note">
                Choose a saved PowerPoint template or upload a one-off .pptx/.potx file for this deck.
              </p>
              <div className="template-source-group" role="radiogroup" aria-label="Template source">
                <label className="template-source-option">
                  <input
                    checked={templateSource === "saved"}
                    disabled={reusableSavedTemplates.length === 0}
                    name="template-source"
                    type="radio"
                    value="saved"
                    onChange={() => setTemplateSource("saved")}
                  />
                  <span>
                    <strong>Use saved template</strong>
                    <small>Choose a saved .pptx/.potx template that has a stored file.</small>
                  </span>
                </label>
                <label className="template-source-option">
                  <input
                    checked={templateSource === "one_off"}
                    name="template-source"
                    type="radio"
                    value="one_off"
                    onChange={() => setTemplateSource("one_off")}
                  />
                  <span>
                    <strong>Upload one-off template</strong>
                    <small>Upload a PowerPoint file just for this deck.</small>
                  </span>
                </label>
                <label className="template-source-option">
                  <input
                    checked={templateSource === "apt_default"}
                    name="template-source"
                    type="radio"
                    value="apt_default"
                    onClick={() => { choseBlankTemplate.current = true; }}
                    onChange={() => {
                      choseBlankTemplate.current = true;
                      setTemplateSource("apt_default");
                    }}
                  />
                  <span>
                    <strong>Use simple blank template</strong>
                    <small>Create an editable deck without uploading or choosing a design file.</small>
                  </span>
                </label>
              </div>
              {templateSource === "one_off" ? (
                <div className="template-one-off-fields">
                  <DeckFileDropzone
                    accept=".pptx,.potx"
                    disabled={!isPro}
                    error={templateError}
                    files={oneOffTemplateFiles}
                    helper="Upload a .pptx or .potx under 20 MB. The builder matches layouts to slide purposes and asks you to review unclear matches."
                    id="one-off-template-deck"
                    label="Upload one-off deck template"
                    onFilesSelected={validateOneOffTemplateFiles}
                    onRemoveFile={() => {
                      setOneOffTemplateFiles([]);
                      setTemplateError("");
                    }}
                  />
                </div>
              ) : null}
              <div className="active-template-banner">
                <span>{activeTemplateKind}</span>
                <strong>{activeTemplateName}</strong>
              </div>
              {templateSource === "saved" && reusableSavedTemplates.length === 0 ? (
                <p className="helper-note">
                  No reusable saved PowerPoint templates yet. Add or replace one in{" "}
                  <Link className="text-link" href="/settings#presentation-templates">
                    Manage templates
                  </Link>
                  .
                </p>
              ) : null}
              {unavailableSavedTemplates.length > 0 ? (
                <p className="helper-note">
                  Some older saved templates need replacing before they can be used here:{" "}
                  {unavailableSavedTemplates.map((template) => template.displayName || template.filename).join(", ")}.
                </p>
              ) : null}
              {templateSource === "saved" && reusableSavedTemplates.length > 0 ? (
                <label className="field">
                  <span>Saved template</span>
                  <select value={selectedSavedTemplateId} onChange={(event) => setSelectedSavedTemplateId(event.target.value)}>
                    {reusableSavedTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.displayName}{template.isDefault ? " (Default)" : ""}
                      </option>
                    ))}
                  </select>
                  {selectedSavedTemplate ? (
                    <small>
                      {selectedSavedTemplate.filename} · uploaded {new Date(selectedSavedTemplate.uploadedAt).toLocaleDateString("en-GB")}
                    </small>
                  ) : null}
                </label>
              ) : null}
              <p className="helper-note">
                Reusable templates are managed in{" "}
                <Link className="text-link" href="/settings#presentation-templates">
                  Settings
                </Link>
                . One-off uploads are used for this deck only.
              </p>
              <label className="field">
                <span>Google Slides reference link</span>
                <input
                  placeholder="Optional: https://docs.google.com/presentation/..."
                  type="url"
                  value={googleSlidesTemplateUrl}
                  onChange={(event) => {
                    setGoogleSlidesTemplateUrl(event.target.value);
                    setGoogleSlidesError("");
                  }}
                />
                <small>APT saves this link with the brief. Choose a PowerPoint file above to supply the design.</small>
                {googleSlidesError ? <small className="field-error">{googleSlidesError}</small> : null}
              </label>
            </section>

            <section className="custom-deck-form-section">
              <h2>{deckType === "qbr" ? "Quarterly scorecard" : "Supporting files"}</h2>
              {deckType === "qbr" ? (
                <p className="helper-note">
                  Upload an optional Excel (.xlsx) or CSV scorecard with Metric and Actual columns. Add Plan, Prior period and Unit where available. Use one row per measure.
                  {" "}<a download="qbr-scorecard-sample.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent(qbrBenchmarkCsv)}`}>Download a sample scorecard</a>.
                </p>
              ) : <p className="helper-note">{commercialKind
                ? "Keep reference files with the draft. Enter the figures and findings you want to use in the review."
                : "The draft lists attached files by name. Paste the figures, findings and quotes you want to use into the fields below."}</p>}
              <DeckFileDropzone
                accept=".xlsx,.csv,.pdf,.docx,.txt,.pptx,.key,.numbers,.pages"
                disabled={!isPro}
                error={supportingError}
                files={supportingFiles}
                helper=".xlsx, .csv, .pdf, .docx, .txt, .pptx, .key, .numbers or .pages, up to 10MB each."
                id="supporting-data-files"
                label={deckType === "qbr" ? "Add a scorecard or reference file" : "Attach reference files"}
                multiple
                onFilesSelected={validateSupportingFiles}
                onRemoveFile={(index) => {
                  if (isQbrExample && supportingFiles[index]?.name === qbrSampleFilename) setIsQbrExample(false);
                  setSupportingFiles(supportingFiles.filter((_, fileIndex) => fileIndex !== index));
                  setSupportingError("");
                }}
              />
            </section>

            <section className="custom-deck-form-section">
              <h2>Deck-specific inputs</h2>
              {commercialKind ? <p className="helper-note">Start with the case you want to make. The review step covers figures, ownership and the planned slides.</p> : <div className="custom-deck-brief-guide">
                <strong>{selectedDeck.label} inputs</strong>
                <ul className="compact-list">
                  {selectedPlaybook.inputPrompts.map((prompt) => (
                    <li key={prompt}>{prompt}</li>
                  ))}
                </ul>
              </div>}
              <div className="deck-input-grid">
                {selectedPlaybook.inputPrompts.map((prompt, index) => (
                  <label className="field" key={prompt}>
                    <span>{deckType === "qbr" ? qbrQuestions[index] : commercialKind ? commercialConfig[commercialKind].questions[index] : prompt}</span>
                    <textarea
                      className="deck-input-textarea"
                      placeholder={commercialKind ? undefined : deckInputPlaceholder(prompt)}
                      value={deckInputs[prompt] ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        setDeckInputs((current) => ({ ...current, [prompt]: value }));
                      }}
                    />
                  </label>
                ))}
              </div>
              <label className="field">
                <span>{planning?.evidenceQuestion ?? "Extra brief or story notes"}</span>
                <textarea
                  className="deck-brief-textarea"
                  placeholder={planning ? undefined : selectedPlaybook.briefPlaceholder}
                  value={brief}
                  onChange={(event) => setBrief(event.target.value)}
                />
                <small>Optional. Use this for anything that does not fit the structured inputs.</small>
              </label>
            </section>

            <section className="custom-deck-form-section">
              <h2>Output preferences</h2>
              <p className="helper-note">Choose the audience, tone and slides for your draft.</p>
              <div className="output-preferences-grid">
                <div className="form-field">
                  <label htmlFor="custom-deck-audience">Audience</label>
                  <select id="custom-deck-audience" disabled={meetingMode} value={meetingMode ? planning?.audience ?? audience : audience} onChange={(event) => setAudience(event.target.value)}>
                    <option>Internal review</option>
                    <option>Retailer/customer meeting</option>
                    <option>Leadership review</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="custom-deck-tone">Tone</label>
                  <select id="custom-deck-tone" value={tone} onChange={(event) => setTone(event.target.value)}>
                    {toneOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="custom-deck-financial-summary">Include financial summary</label>
                  <select
                    id="custom-deck-financial-summary"
                    value={financialSummary}
                    onChange={(event) => setFinancialSummary(event.target.value)}
                  >
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="custom-deck-next-steps">Include next steps slide</label>
                  <select id="custom-deck-next-steps" value={nextStepsSlide} onChange={(event) => setNextStepsSlide(event.target.value)}>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="custom-deck-readability">Readability check</label>
                  <select id="custom-deck-readability" value={readabilityMode} onChange={(event) => setReadabilityMode(event.target.value as ReadabilityMode)}>
                    <option value="auto">Auto improve contrast</option>
                    <option value="preserve">Preserve template colours</option>
                  </select>
                  <p className="field-help">Auto mode adjusts generated text when the template background makes it hard to read.</p>
                </div>
              </div>
              <p className="helper-note">Choose the audience and the level of detail you want in the first draft.</p>
              <div className="output-format-field">
                <strong>PowerPoint export (.pptx)</strong>
                <p className="field-help">Download the file, then import it into Google Slides or open it in Keynote. Review the formatting after import.</p>
              </div>
            </section>
          </fieldset>

          <div className="custom-deck-action-area">
            {qbrReview ? <div hidden={Boolean(pendingLayoutReview)}>
              <QbrReview
                scorecard={qbrReview.scorecard}
                context={qbrReview.context}
                initialStory={qbrReview.initialStory}
                busy={isCreatingDeck}
                onConfirm={(approval) => void createAndSaveDeck(undefined, approval)}
                onBack={() => { setQbrReview(null); setRequestMessage(""); }}
              />
            </div> : null}
            {commercialReview ? <div hidden={Boolean(pendingLayoutReview)}>
              <CommercialDeckReview
                initial={commercialReview.initial}
                context={commercialReview.context}
                busy={isCreatingDeck}
                onConfirm={(approval) => void createAndSaveDeck(undefined, undefined, approval)}
                onBack={(draft) => { applyCommercialDraft(draft); setCommercialReview(null); setRequestMessage(""); }}
              />
            </div> : null}
            {pendingLayoutReview ? <TemplateLayoutReview
              review={pendingLayoutReview}
              deckName={deckName}
              busy={isCreatingDeck}
              onChange={(purpose, value) => setLayoutReview({ ...pendingLayoutReview, choices: { ...pendingLayoutReview.choices, [purpose]: value } })}
              onConfirm={() => void createAndSaveDeck(pendingLayoutReview)}
              onCancel={() => { setLayoutReview(null); setRequestMessage(""); }}
            /> : !qbrReview && !commercialReview ? <button className={isPro ? "button" : "button pro-only-button"} disabled={isCreatingDeck || isAuthLoading} type="button" onClick={() => void createAndSaveDeck()}>
              {isCreatingDeck ? "Preparing deck…" : deckType === "qbr" ? "Review QBR draft" : commercialKind ? `Review ${commercialConfig[commercialKind].short} draft` : "Create and save deck"}
            </button> : null}
            {!canCreateDeck ? (
              <p className="field-error">Upload or choose a PowerPoint template, or select the simple blank template.</p>
            ) : null}
            <p>
              This creates an editable PowerPoint draft, saves the deck record to your workspace and stores the file when account storage is available.
            </p>
            {requestMessage ? <p role="status" className="settings-message settings-message-success">{requestMessage}</p> : null}
            {generatedDeckUrl ? (
              <a className="button button-secondary button-small" download={generatedDeckFilename} href={generatedDeckUrl}>
                Download generated deck
              </a>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}
