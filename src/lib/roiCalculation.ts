export type SupportMode = "soa" | "promoInvoice";

type RoiLineAmounts = {
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
  const hasCogs = line.cogs.trim() !== "";
  const baselineProfit = hasCogs ? (currentInvoice - roiNumber(line.cogs)) * baselineUnits : 0;
  const promoProfit = hasCogs ? (promoInvoice - roiNumber(line.cogs)) * promoUnits - fixedSupport : 0;
  const profitImpact = hasCogs ? promoProfit - baselineProfit : 0;
  const revenueRoi = supportCost > 0 ? incrementalRevenue / supportCost : null;
  const profitRoi = hasCogs && supportCost > 0 ? profitImpact / supportCost : null;

  return {
    supportPerUnit,
    promoInvoice,
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
