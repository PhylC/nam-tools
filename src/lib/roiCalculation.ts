export type SupportMode = "soa" | "promoInvoice";

export type RoiLineAmounts = {
  supportMode: SupportMode;
  currentInvoice: string;
  promoInvoice: string;
  soa: string;
  baselineUnits: string;
  promoUnits: string;
  cogs: string;
  fixedSupport: string;
};

export function roiNumber(value: string) {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function isNonNegativeAmount(value: string) {
  const text = value.replaceAll(",", "").trim();
  const amount = Number(text);
  return Boolean(text) && Number.isFinite(amount) && amount >= 0;
}

export function calculateLine(line: RoiLineAmounts) {
  const currentInvoice = roiNumber(line.currentInvoice);
  const fixedSupport = roiNumber(line.fixedSupport);
  const promoInvoice = line.supportMode === "soa"
    ? currentInvoice - roiNumber(line.soa)
    : line.promoInvoice.trim() ? roiNumber(line.promoInvoice) : currentInvoice;
  const supportPerUnit = line.supportMode === "soa" ? roiNumber(line.soa) : currentInvoice - promoInvoice;
  const baselineUnits = roiNumber(line.baselineUnits);
  const promoUnits = roiNumber(line.promoUnits);
  const incrementalUnits = promoUnits - baselineUnits;
  const baselineRevenue = baselineUnits * currentInvoice;
  const promoRevenue = promoUnits * promoInvoice;
  const incrementalRevenue = promoRevenue - baselineRevenue;
  const supportCost = supportPerUnit * promoUnits + fixedSupport;
  const hasCogs = isNonNegativeAmount(line.cogs);
  const baselineProfit = hasCogs ? (currentInvoice - roiNumber(line.cogs)) * baselineUnits : 0;
  const promoProfit = hasCogs ? (promoInvoice - roiNumber(line.cogs)) * promoUnits - fixedSupport : 0;
  const profitImpact = hasCogs ? promoProfit - baselineProfit : 0;
  const revenueRoi = supportCost > 0 ? incrementalRevenue / supportCost : null;
  const profitRoi = hasCogs && supportCost > 0 ? profitImpact / supportCost : null;

  return {
    currentInvoice,
    supportPerUnit,
    promoInvoice,
    baselineUnits,
    promoUnits,
    incrementalUnits,
    baselineRevenue,
    promoRevenue,
    incrementalRevenue,
    supportCost,
    hasCogs,
    baselineProfit,
    promoProfit,
    profitImpact,
    revenueRoi,
    profitRoi,
  };
}

export function summarizeRoiLines(lines: RoiLineAmounts[]) {
  const totals = {
    baselineUnits: 0, promoUnits: 0, incrementalUnits: 0, baselineRevenue: 0, promoRevenue: 0,
    revenueImpact: 0, supportCost: 0, baselineProfit: 0, promoProfit: 0, profitImpact: 0,
  };
  let complete = lines.length > 0;
  let allCostsEntered = lines.length > 0;
  for (const line of lines) {
    const calc = calculateLine(line);
    complete &&= [line.currentInvoice, line.baselineUnits, line.promoUnits].every(isNonNegativeAmount);
    allCostsEntered &&= calc.hasCogs;
    totals.baselineUnits += calc.baselineUnits;
    totals.promoUnits += calc.promoUnits;
    totals.incrementalUnits += calc.incrementalUnits;
    totals.baselineRevenue += calc.baselineRevenue;
    totals.promoRevenue += calc.promoRevenue;
    totals.revenueImpact += calc.incrementalRevenue;
    totals.supportCost += calc.supportCost;
    totals.baselineProfit += calc.baselineProfit;
    totals.promoProfit += calc.promoProfit;
    totals.profitImpact += calc.profitImpact;
  }
  const showProfit = complete && allCostsEntered;
  return {
    ...totals,
    complete,
    allCostsEntered,
    baselineProfit: showProfit ? totals.baselineProfit : null,
    promoProfit: showProfit ? totals.promoProfit : null,
    profitImpact: showProfit ? totals.profitImpact : null,
    profitRoi: showProfit && totals.supportCost > 0 ? totals.profitImpact / totals.supportCost : null,
    revenueRoi: totals.supportCost > 0 ? totals.revenueImpact / totals.supportCost : null,
  };
}

type RoiComparisonMetrics = {
  revenue: number | null;
  support: number | null;
  profit: number | null;
  revenueRoi: number | null;
  profitRoi: number | null;
};

function bestBy<T>(items: T[], valueOf: (item: T) => number | null, direction = 1) {
  let best: T | null = null;
  let score = -Infinity;
  for (const item of items) {
    const value = valueOf(item);
    if (value !== null && Number.isFinite(value) && value * direction > score) {
      best = item;
      score = value * direction;
    }
  }
  return best;
}

export function rankRoiScenarios<T extends RoiComparisonMetrics>(scenarios: T[]) {
  const bestProfit = bestBy(scenarios, (item) => item.profit);
  const complete = scenarios.every((item) => item.revenue !== null);
  const hasAllCosts = complete && scenarios.every((item) => item.profit !== null);
  const recommended = hasAllCosts && (bestProfit?.profit ?? 0) > 0 ? bestProfit : null;
  return {
    bestRevenue: bestBy(scenarios, (item) => item.revenue),
    bestRevenueRoi: bestBy(scenarios, (item) => item.revenueRoi),
    bestProfitRoi: bestBy(scenarios, (item) => item.profitRoi),
    bestProfit,
    lowestSupport: bestBy(scenarios, (item) => item.support, -1),
    highestSupport: bestBy(scenarios, (item) => item.support),
    complete,
    hasAllCosts,
    recommended,
  };
}
