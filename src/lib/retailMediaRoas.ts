export const retailMediaRoasSlug = "retail-media-roas-calculator";
export const retailMediaRoasPath = `/calculators/${retailMediaRoasSlug}`;
export const retailMediaRoasName = "Retail Media ROAS & Profit Calculator";

type Campaign = {
  attributedRetailSales: number;
  adSpend: number;
  fees: number;
  contributionMarginPercent: number;
};

type SalesEstimate =
  | { incrementalSupplierSales: number }
  | { attributedSupplierSales: number };

const scenarioShares = [25, 50, 75];

export function calculateRetailMediaReturn(campaign: Campaign, estimate: SalesEstimate) {
  const { attributedRetailSales, adSpend, fees, contributionMarginPercent } = campaign;
  const campaignCost = adSpend + fees;
  const margin = contributionMarginPercent / 100;
  const breakEvenSupplierSales = margin > 0 ? campaignCost / margin : null;

  function profitAt(supplierSales: number) {
    const profit = supplierSales * margin - campaignCost;
    return { supplierSales, profit, roiPercent: campaignCost > 0 ? profit / campaignCost * 100 : null };
  }

  return {
    roas: adSpend > 0 ? attributedRetailSales / adSpend : null,
    campaignCost,
    breakEvenSupplierSales,
    outcome: "incrementalSupplierSales" in estimate ? profitAt(estimate.incrementalSupplierSales) : null,
    scenarios: "attributedSupplierSales" in estimate
      ? scenarioShares.map((share) => ({ share, ...profitAt(estimate.attributedSupplierSales * share / 100) }))
      : [],
  };
}
