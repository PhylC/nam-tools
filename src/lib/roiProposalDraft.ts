export const roiProposalPath = "/custom-deck?template=promo-proposal&source=roi";
export const roiProposalStorageKey = "apt:roi-proposal";
export const roiWorkedExample = {
  currentInvoice: "4",
  baselineUnits: "1000",
  promoInvoice: "3.50",
  promoUnits: "1400",
  cogs: "2",
  fixedSupport: "200",
};

const currencies = ["GBP", "USD", "EUR"] as const;
type Currency = typeof currencies[number];
type ProposalLine = {
  baselineUnits: number;
  expectedUnits: number;
  fixedFunding: number;
  baselinePriceImpact: number;
  unitContribution: number | null;
};

export type RoiProposalDraft = {
  currency: Currency;
  baselineUnits: number;
  expectedUnits: number;
  fixedFunding: number;
  baselinePriceImpact: number;
  unitContribution: number | null;
};

function validMoney(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(Math.round(value * 100));
}

function validUnits(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function parseRoiProposalDraft(value: unknown): RoiProposalDraft | null {
  if (typeof value !== "object" || !value) return null;
  const { currency, baselineUnits, expectedUnits, fixedFunding, baselinePriceImpact, unitContribution } = value as Partial<RoiProposalDraft>;
  if (!currency || !currencies.includes(currency) || !validUnits(baselineUnits) || !validUnits(expectedUnits)
    || !validMoney(fixedFunding) || fixedFunding < 0 || !validMoney(baselinePriceImpact)
    || (unitContribution !== null && !validMoney(unitContribution))) return null;
  return { currency, baselineUnits, expectedUnits, fixedFunding, baselinePriceImpact, unitContribution };
}

export function buildRoiProposalDraft(lines: ProposalLine[], currency: string): RoiProposalDraft | null {
  if (!lines.length || lines.some((line) => !validUnits(line.baselineUnits) || !validUnits(line.expectedUnits)
    || !validMoney(line.fixedFunding) || line.fixedFunding < 0 || !validMoney(line.baselinePriceImpact)
    || (line.unitContribution !== null && !validMoney(line.unitContribution)))) return null;
  const total = (select: (line: ProposalLine) => number) => lines.reduce((sum, line) => sum + select(line), 0);
  const pennies = (value: number) => Math.round(value * 100);
  const candidateContribution = lines[0].unitContribution;
  // A mixed SKU scenario needs an explicit sales mix before it can predict contribution per incremental unit.
  const unitContribution = candidateContribution !== null && lines.every((line) => line.unitContribution !== null
    && pennies(line.unitContribution) === pennies(candidateContribution)) ? pennies(candidateContribution) / 100 : null;
  return parseRoiProposalDraft({
    currency,
    baselineUnits: total((line) => line.baselineUnits),
    expectedUnits: total((line) => line.expectedUnits),
    fixedFunding: total((line) => pennies(line.fixedFunding)) / 100,
    baselinePriceImpact: total((line) => pennies(line.baselinePriceImpact)) / 100,
    unitContribution,
  });
}

export function readRoiProposalDraft(storage: Storage) {
  const value = storage.getItem(roiProposalStorageKey);
  return value && value.length < 10000 ? parseRoiProposalDraft(JSON.parse(value)) : null;
}

export function roiProposalEvidence(draft: RoiProposalDraft) {
  return "The baseline and expected volume came from the ROI planner. Confirm that the periods and stores are comparable. "
    + (draft.unitContribution === null ? "Add a contribution per incremental unit if you can substantiate it for this sales mix." : "");
}
