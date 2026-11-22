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
