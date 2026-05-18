"use client";

import { useMemo, useState } from "react";
import { Field, ResultGrid } from "./Shell";
import type { QuickCalculatorId } from "../data/quickCalculators";

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const money2 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const number = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat("en-GB", {
  style: "percent",
  maximumFractionDigits: 1,
});

const currencyChoices = [
  { label: "GBP (£)", value: "GBP", symbol: "£" },
  { label: "EUR (€)", value: "EUR", symbol: "€" },
  { label: "USD ($)", value: "USD", symbol: "$" },
  { label: "CAD (C$)", value: "CAD", symbol: "C$" },
  { label: "AUD (A$)", value: "AUD", symbol: "A$" },
  { label: "NZD (NZ$)", value: "NZD", symbol: "NZ$" },
  { label: "CHF (CHF)", value: "CHF", symbol: "CHF " },
  { label: "SEK (kr)", value: "SEK", symbol: "kr " },
  { label: "NOK (kr)", value: "NOK", symbol: "kr " },
  { label: "DKK (kr)", value: "DKK", symbol: "kr " },
  { label: "PLN (zł)", value: "PLN", symbol: "zł" },
  { label: "JPY (¥)", value: "JPY", symbol: "¥" },
  { label: "ZAR (R)", value: "ZAR", symbol: "R" },
  { label: "Other (¤)", value: "Other", symbol: "¤" },
];

function formatCurrencyValue(value: number, currencyCode: string, digits: number) {
  const selected = currencyChoices.find((item) => item.value === currencyCode) ?? currencyChoices[0];
  const formatted = new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

  return `${selected.symbol}${formatted}`;
}

function num(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rate(value: string) {
  return num(value) / 100;
}

function safePercent(value: number) {
  return Number.isFinite(value) ? percent.format(value) : "n/a";
}

function InfoLabel({ label, info }: { label: string; info?: string }) {
  if (!info) {
    return <>{label}</>;
  }

  return (
    <span className="field-label">
      <span>{label}</span>
      <span aria-label={`${label}: ${info}`} className="info-dot" tabIndex={0}>
        i
        <span className="info-tooltip" role="tooltip">
          {info}
        </span>
      </span>
    </span>
  );
}

function NumericInput({
  label,
  help,
  value,
  onChange,
  step = "0.01",
}: {
  label: string;
  help: string;
  value: string;
  onChange: (value: string) => void;
  step?: string;
}) {
  return (
    <Field label={<InfoLabel label={label} info={help} />} help={help}>
      <input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function TextInput({
  label,
  help,
  value,
  onChange,
  multiline,
}: {
  label: string;
  help: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <Field label={<InfoLabel label={label} info={help} />} help={help}>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </Field>
  );
}

function SelectInput({
  label,
  help,
  value,
  onChange,
  options,
}: {
  label: string;
  help: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <Field label={<InfoLabel label={label} info={help} />} help={help}>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function CopyButton({ text, label = "Copy output" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button className="button button-secondary copy-button" type="button" onClick={copy}>
      {copied ? "Copied" : label}
    </button>
  );
}

function BadgeRow() {
  return (
    <div className="badge-row" aria-label="Tool access level">
      <span className="pill">Free</span>
      <span className="pill pro-pill">Pro preview</span>
    </div>
  );
}

function PlanningDisclaimer() {
  return (
    <p className="planning-disclaimer">
      Use this as a commercial planning guide only. Validate numbers before making customer commitments.
    </p>
  );
}

function RetailerPricingCaveat() {
  return (
    <p className="planning-disclaimer">
      Pricing is at the sole discretion of the retailer. Outputs are estimates
      for planning only. Tax treatment varies by market. Retailer/customer
      margin estimates are indicative only and depend on actual buy price,
      retail price, sales tax/VAT/IVA treatment, mechanics and retailer
      accounting.
    </p>
  );
}

function AdvancedAssumptions({ children }: { children: React.ReactNode }) {
  return (
    <details className="advanced-box">
      <summary>Advanced assumptions</summary>
      <div className="form-grid advanced-grid">{children}</div>
    </details>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="insight-panel">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function FreeResult({
  summary,
  children,
}: {
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <div className="result-box">
      <div className="output-header">
        <div>
          <span className="pill">Free result</span>
          <h2>Quick commercial read</h2>
        </div>
        <CopyButton text={summary} />
      </div>
      <PlanningDisclaimer />
      {children}
    </div>
  );
}

function ProPreview({ features }: { features: string[] }) {
  return (
    <aside className="pro-preview">
      <span className="pill pro-pill">Pro preview</span>
      <h2>Upgrade later for deeper work</h2>
      <div className="locked-grid" aria-label="Locked Pro feature previews">
        <div className="locked-card">
          <strong>Retailer-friendly view</strong>
          <span>Turn the deal into a clean customer-facing story.</span>
        </div>
        <div className="locked-card">
          <strong>Locked scenarios</strong>
          <span>Compare multiple scenarios side by side.</span>
        </div>
        <div className="locked-card">
          <strong>Locked save/export</strong>
          <span>Save plans and download PDF/deck-ready outputs.</span>
        </div>
        <div className="locked-card">
          <strong>Locked team pack</strong>
          <span>Build fuller customer-ready write-ups and team reviews.</span>
        </div>
      </div>
      <ul className="compact-list">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <div className="locked-card">
        <strong>Retailer-friendly Pro preview</strong>
        <span>
          Pro will turn the same calculation into a clean customer-facing story,
          showing the commercial upside for the retailer without exposing
          unnecessary internal supplier commentary.
        </span>
      </div>
      <p>Placeholder only. No login, payment or Stripe integration is live yet.</p>
    </aside>
  );
}

type DealTab = "promo" | "margin" | "spend" | "investment";
type VatBasis = "includes" | "excludes";

const dealTabs: { id: DealTab; label: string }[] = [
  { id: "promo", label: "Supplier profit" },
  { id: "margin", label: "Retailer view" },
  { id: "spend", label: "Trade spend" },
  { id: "investment", label: "Investment ask" },
];

function dealTabTitle(tab: DealTab) {
  return dealTabs.find((item) => item.id === tab)?.label ?? "Deal summary";
}

function CalculationDetail({
  summary,
  children,
}: {
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <details className="advanced-box calculation-detail">
      <summary>Show calculation detail</summary>
      <div className="detail-content">
        {children}
        <CopyButton text={summary} label="Copy detailed calculation" />
      </div>
    </details>
  );
}

function DealProPreview() {
  return (
    <aside className="pro-preview">
      <span className="pill pro-pill">Pro preview</span>
      <h2>Upgrade later for deeper deal work</h2>
      <div className="locked-grid locked-grid-three" aria-label="Locked Pro feature previews">
        <div className="locked-card">
          <strong>Excel import/export</strong>
          <span>Paste SKU or customer rows and export the finished deal view.</span>
        </div>
        <div className="locked-card">
          <strong>Scenario comparison</strong>
          <span>Compare mechanics, support levels and volume assumptions side by side.</span>
        </div>
        <div className="locked-card">
          <strong>Retailer-ready deck output</strong>
          <span>Create a cleaner customer-facing story with charts and notes.</span>
        </div>
      </div>
      <p>Placeholder only. No login, payment or Stripe integration is live yet.</p>
    </aside>
  );
}

export function CommercialDealCalculator({ defaultTab = "promo" }: { defaultTab?: DealTab }) {
  const [activeTab, setActiveTab] = useState<DealTab>(defaultTab);
  const [currencyCode, setCurrencyCode] = useState("GBP");
  const [baselineUnits, setBaselineUnits] = useState("10000");
  const [promoUnits, setPromoUnits] = useState("18000");
  const [srp, setSrp] = useState("2.50");
  const [promoSrp, setPromoSrp] = useState("2.00");
  const [cogs, setCogs] = useState("1.10");
  const [soa, setSoa] = useState("0.35");
  const [fixedCost, setFixedCost] = useState("2500");
  const [retailerBuyPrice, setRetailerBuyPrice] = useState("1.75");
  const [retailerVatBasis, setRetailerVatBasis] = useState<VatBasis>("includes");
  const [vatRate, setVatRate] = useState("20");
  const [averageDiscount, setAverageDiscount] = useState("12");
  const [rebate, setRebate] = useState("3");
  const [marketingContribution, setMarketingContribution] = useState("2500");
  const [expectedUplift, setExpectedUplift] = useState("8");
  const [grossMargin, setGrossMargin] = useState("32");
  const [requestedInvestment, setRequestedInvestment] = useState("3");
  const [probability, setProbability] = useState("65");
  const [cannibalisation, setCannibalisation] = useState("10");
  const [postPromoDip, setPostPromoDip] = useState("2");
  const [retailerMarginRequirement, setRetailerMarginRequirement] = useState("25");
  const [contractMonths, setContractMonths] = useState("12");
  const [otherDeductions, setOtherDeductions] = useState("1");
  const [retentionValue, setRetentionValue] = useState("0");

  const currency = useMemo(
    () => ({ format: (value: number) => formatCurrencyValue(value, currencyCode, 0) }),
    [currencyCode],
  );
  const money2 = useMemo(
    () => ({ format: (value: number) => formatCurrencyValue(value, currencyCode, 2) }),
    [currencyCode],
  );

  const result = useMemo(() => {
    const baseline = num(baselineUnits);
    const units = num(promoUnits);
    const srpValue = num(srp);
    const promoSrpValue = num(promoSrp);
    const cogsValue = num(cogs);
    const soaPerUnit = num(soa);
    const fixed = num(fixedCost);
    const retailerBuy = num(retailerBuyPrice);
    const retailerSellOutEntered = promoSrpValue;
    const vatRateValue = rate(vatRate);
    const retailerSellOutExVat =
      retailerVatBasis === "includes"
        ? retailerSellOutEntered / (1 + vatRateValue)
        : retailerSellOutEntered;
    const incrementalUnits = units - baseline;
    const cannibalisedUnits = Math.max(0, incrementalUnits) * rate(cannibalisation);
    const postPromoDipUnits = units * rate(postPromoDip);
    const netIncrementalUnits = incrementalUnits - cannibalisedUnits - postPromoDipUnits;
    const baseGpPerUnit = srpValue - cogsValue;
    const baseGm = srpValue > 0 ? baseGpPerUnit / srpValue : 0;
    const baseTotalGp = baseGpPerUnit * units;
    const baselineGrossProfit = baseGpPerUnit * baseline;
    const promoGpBeforeSoaPerUnit = promoSrpValue - cogsValue;
    const promoGmBeforeSoa = promoSrpValue > 0 ? promoGpBeforeSoaPerUnit / promoSrpValue : 0;
    const soaValue = units * soaPerUnit;
    const soaRate = srpValue > 0 ? soaPerUnit / srpValue : 0;
    const totalInvestment = soaValue + fixed;
    const promoGpBeforeInvestment = units * promoGpBeforeSoaPerUnit;
    const incrementalGpBeforeInvestment = promoGpBeforeInvestment - baselineGrossProfit;
    const netProfitImpact = incrementalGpBeforeInvestment - totalInvestment;
    const roi = totalInvestment > 0 ? netProfitImpact / totalInvestment : 0;
    const breakEvenIncrementalUnits = totalInvestment / Math.max(baseGpPerUnit, 0.01);
    const promoGpAfterSoaPerUnit = promoSrpValue - cogsValue - soaPerUnit;
    const promoGmAfterSoa = promoSrpValue > 0 ? promoGpAfterSoaPerUnit / promoSrpValue : 0;
    const promoGpAfterSoaFixed = promoGpAfterSoaPerUnit * units - fixed;
    const gpChangeVsBase = promoGpAfterSoaFixed - baseTotalGp;
    const retailerGrossSales = units * retailerSellOutExVat;
    const retailerCostOfGoods = units * retailerBuy;
    const supplierFundingReceived = totalInvestment;
    const retailerGpBeforeFunding = retailerGrossSales - retailerCostOfGoods;
    const retailerEstimatedProfitAfterFunding = retailerGpBeforeFunding + supplierFundingReceived;
    const retailerCashProfitPerUnitBeforeFunding = retailerSellOutExVat - retailerBuy;
    const retailerCashProfitPerUnitAfterFunding =
      retailerCashProfitPerUnitBeforeFunding + (units > 0 ? supplierFundingReceived / units : 0);
    const retailerMarginBeforeFunding =
      retailerSellOutExVat > 0 ? retailerCashProfitPerUnitBeforeFunding / retailerSellOutExVat : 0;
    const retailerMarginAfterFunding =
      retailerSellOutExVat > 0 ? retailerCashProfitPerUnitAfterFunding / retailerSellOutExVat : 0;
    const retailerSupportedMargin = promoSrpValue > 0 ? soaPerUnit / promoSrpValue : 0;
    const retailerMarginGapVsRequirement = rate(retailerMarginRequirement) - retailerMarginAfterFunding;
    const grossSales = units * srpValue;
    const invoiceSales = units * retailerBuy;
    const variableDiscountValue = grossSales * rate(averageDiscount);
    const rebateValue = grossSales * rate(rebate);
    const otherDeductionValue = grossSales * rate(otherDeductions);
    const totalTradeSpend =
      variableDiscountValue + rebateValue + fixed + num(marketingContribution) + otherDeductionValue;
    const netSalesAfterTradeSpend = grossSales - totalTradeSpend;
    const tradeSpendGrossRate = grossSales > 0 ? totalTradeSpend / grossSales : 0;
    const tradeSpendInvoiceRate = invoiceSales > 0 ? totalTradeSpend / invoiceSales : 0;
    const investmentValue = grossSales * rate(requestedInvestment);
    const expectedIncrementalRevenue = grossSales * rate(expectedUplift);
    const expectedGrossProfit = expectedIncrementalRevenue * rate(grossMargin);
    const probabilityAdjustedRevenue = expectedIncrementalRevenue * rate(probability);
    const probabilityAdjustedNetImpact =
      probabilityAdjustedRevenue * rate(grossMargin) + num(retentionValue) - investmentValue;
    const monthlyPayback = num(contractMonths) > 0 ? probabilityAdjustedNetImpact / num(contractMonths) : 0;
    const investmentRecommendation =
      probabilityAdjustedNetImpact > investmentValue * 0.15
        ? "Support"
        : probabilityAdjustedNetImpact >= 0
          ? "Negotiate"
          : "Reject / reshape";
    const promoVerdict =
      netProfitImpact < 0 && retailerEstimatedProfitAfterFunding > 0
        ? "Retailer-friendly but supplier-heavy"
        : roi > 0.25 && netProfitImpact > totalInvestment * 0.25
          ? "Strong commercial shape"
          : netProfitImpact >= 0
            ? "Works, but watch assumptions"
            : "Loss-making unless strategic";
    const marginVerdict =
      promoGmAfterSoa < 0 || promoGpAfterSoaFixed < 0
        ? "Risky"
        : promoGmAfterSoa < baseGm - 0.1 || gpChangeVsBase < 0
          ? "Thin"
          : "Healthy";
    const spendIntensity =
      tradeSpendGrossRate > 0.25 ? "heavy" : tradeSpendGrossRate > 0.12 ? "normal" : "light";

    return {
      netIncrementalUnits,
      soaValue,
      soaRate,
      fixed,
      totalInvestment,
      incrementalGpBeforeInvestment,
      netProfitImpact,
      roi,
      breakEvenIncrementalUnits,
      retailerGrossSales,
      retailerSellOutEntered,
      retailerSellOutExVat,
      vatRateValue,
      retailerCostOfGoods,
      retailerGpBeforeFunding,
      supplierFundingReceived,
      retailerEstimatedProfitAfterFunding,
      retailerMarginBeforeFunding,
      retailerMarginAfterFunding,
      retailerCashProfitPerUnitAfterFunding,
      baseGm,
      baseGpPerUnit,
      baseTotalGp,
      promoGmBeforeSoa,
      promoGmAfterSoa,
      promoGpAfterSoaFixed,
      gpChangeVsBase,
      retailerSupportedMargin,
      retailerMarginGapVsRequirement,
      grossSales,
      invoiceSales,
      variableDiscountValue,
      rebateValue,
      marketingContributionValue: num(marketingContribution),
      otherDeductionValue,
      totalTradeSpend,
      netSalesAfterTradeSpend,
      tradeSpendGrossRate,
      tradeSpendInvoiceRate,
      investmentValue,
      expectedIncrementalRevenue,
      expectedGrossProfit,
      probabilityAdjustedRevenue,
      probabilityAdjustedNetImpact,
      monthlyPayback,
      investmentRecommendation,
      promoVerdict,
      marginVerdict,
      spendIntensity,
    };
  }, [
    baselineUnits,
    promoUnits,
    srp,
    promoSrp,
    cogs,
    soa,
    fixedCost,
    retailerBuyPrice,
    retailerVatBasis,
    vatRate,
    averageDiscount,
    rebate,
    marketingContribution,
    expectedUplift,
    grossMargin,
    requestedInvestment,
    probability,
    cannibalisation,
    postPromoDip,
    retailerMarginRequirement,
    contractMonths,
    otherDeductions,
    retentionValue,
  ]);

  const retailerVatBasisLabel =
    retailerVatBasis === "includes" ? "Includes sales tax / VAT / IVA" : "Excludes sales tax / VAT / IVA";
  const retailerVatSummary = `Promotional retail selling price entered: ${money2.format(result.retailerSellOutEntered)} (${retailerVatBasisLabel}); sales tax / VAT / IVA rate: ${safePercent(result.vatRateValue)}; excluding-tax retail selling price used for margin: ${money2.format(result.retailerSellOutExVat)}. Currency is for formatting only. This tool does not convert exchange rates.`;

  const retailerVerdict =
    result.retailerMarginAfterFunding >= rate(retailerMarginRequirement)
      ? "Retailer view looks supported"
      : "Retailer margin may need checking";

  const simpleSummaries: Record<DealTab, string> = {
    promo: `Supplier profit summary
Verdict: ${result.promoVerdict}
Total investment: ${currency.format(result.totalInvestment)}
Net profit impact: ${currency.format(result.netProfitImpact)}
ROI: ${safePercent(result.roi)}
Break-even incremental units: ${number.format(result.breakEvenIncrementalUnits)}
${retailerVatSummary}
Pricing is at the sole discretion of the retailer. Outputs are estimates for planning only.`,
    margin: `Retailer view summary
Verdict: ${retailerVerdict}
Retailer estimated profit: ${currency.format(result.retailerEstimatedProfitAfterFunding)}
Retailer margin after support: ${safePercent(result.retailerMarginAfterFunding)}
SOA / supplier support received: ${currency.format(result.supplierFundingReceived)}
Retailer cash profit per unit: ${money2.format(result.retailerCashProfitPerUnitAfterFunding)}
${retailerVatSummary}
Pricing is at the sole discretion of the retailer. Outputs are estimates for planning only.`,
    spend: `Trade spend summary
Spend level: ${result.spendIntensity}
Total trade spend: ${currency.format(result.totalTradeSpend)}
Net sales after trade spend: ${currency.format(result.netSalesAfterTradeSpend)}
Trade spend % of gross sales: ${safePercent(result.tradeSpendGrossRate)}
${retailerVatSummary}
Pricing is at the sole discretion of the retailer. Outputs are estimates for planning only.`,
    investment: `Investment ask summary
Recommendation: ${result.investmentRecommendation}
Investment value: ${currency.format(result.investmentValue)}
Expected incremental revenue: ${currency.format(result.expectedIncrementalRevenue)}
Expected gross profit: ${currency.format(result.expectedGrossProfit)}
Probability-adjusted net impact: ${currency.format(result.probabilityAdjustedNetImpact)}
${retailerVatSummary}
Pricing is at the sole discretion of the retailer. Outputs are estimates for planning only.`,
  };

  const detailedSummaries: Record<DealTab, string> = {
    promo: `${simpleSummaries.promo}
Net incremental units: ${number.format(result.netIncrementalUnits)}
SOA / supplier support per unit value: ${currency.format(result.soaValue)}
Fixed supplier support: ${currency.format(result.fixed)}
Incremental gross profit before support: ${currency.format(result.incrementalGpBeforeInvestment)}
Retailer estimated profit after support: ${currency.format(result.retailerEstimatedProfitAfterFunding)}`,
    margin: `${simpleSummaries.margin}
Retailer gross sales excluding tax: ${currency.format(result.retailerGrossSales)}
Retailer invoice/buy value: ${currency.format(result.retailerCostOfGoods)}
Retailer profit before support: ${currency.format(result.retailerGpBeforeFunding)}
Retailer margin before support: ${safePercent(result.retailerMarginBeforeFunding)}
Retailer margin gap vs target: ${safePercent(result.retailerMarginGapVsRequirement)}`,
    spend: `${simpleSummaries.spend}
Gross sales value: ${currency.format(result.grossSales)}
Variable discount value: ${currency.format(result.variableDiscountValue)}
Rebate/overrider value: ${currency.format(result.rebateValue)}
Marketing contribution: ${currency.format(result.marketingContributionValue)}
Other deductions: ${currency.format(result.otherDeductionValue)}
Trade spend % of invoice sales: ${safePercent(result.tradeSpendInvoiceRate)}`,
    investment: `${simpleSummaries.investment}
Probability-adjusted revenue: ${currency.format(result.probabilityAdjustedRevenue)}
Monthly payback / contract period view: ${currency.format(result.monthlyPayback)}
Retention value included: ${currency.format(num(retentionValue))}`,
  };

  const tabSummaries: Record<DealTab, string> = {
    promo:
      result.netProfitImpact >= 0
        ? `This deal is estimated to create ${currency.format(result.netProfitImpact)} after supplier support. Check whether the assumptions are realistic before committing.`
        : `This deal is estimated to lose ${currency.format(Math.abs(result.netProfitImpact))} after supplier support. It needs a strategic reason or a better mechanic.`,
    margin: `The retailer/customer is estimated to make ${currency.format(result.retailerEstimatedProfitAfterFunding)} after supplier support. Pricing remains entirely at retailer discretion.`,
    spend: `Total trade spend is ${currency.format(result.totalTradeSpend)}, equal to ${safePercent(result.tradeSpendGrossRate)} of gross sales. High spend should buy a clear customer commitment.`,
    investment:
      result.probabilityAdjustedNetImpact >= 0
        ? `The investment ask appears to pay back on a probability-adjusted basis. Still challenge the uplift, timing and customer commitment.`
        : `The investment ask does not appear to pay back on a probability-adjusted basis. Negotiate the ask, reshape the terms or reject it.`,
  };

  return (
    <article className="card tool-form commercial-deal-calculator">
      <BadgeRow />
      <section className="deal-input-panel" aria-label="Shared commercial deal inputs">
        <div>
          <span className="pill">60-second inputs</span>
          <h2>Start with the few numbers most NAMs already have.</h2>
        </div>
        <RetailerPricingCaveat />
        <div className="form-grid">
          <SelectInput
            label="Currency"
            help="Currency is for formatting only. This tool does not convert exchange rates."
            value={currencyCode}
            onChange={setCurrencyCode}
            options={currencyChoices.map(({ label, value }) => ({ label, value }))}
          />
          <NumericInput label="Baseline units before promotion" help="Estimated units sold in the normal comparison period before the promotion." value={baselineUnits} onChange={setBaselineUnits} step="1" />
          <NumericInput label="Forecast units during promotion" help="Expected units sold during the promotion or deal period." value={promoUnits} onChange={setPromoUnits} step="1" />
          <NumericInput label="Retail selling price before promotion" help="The normal price paid by the shopper/end customer. Specify sales tax / VAT / IVA basis where relevant." value={srp} onChange={setSrp} />
          <NumericInput label="Promotional retail selling price" help="The promotional price paid by the shopper/end customer. Pricing is at the sole discretion of the retailer." value={promoSrp} onChange={setPromoSrp} />
          <NumericInput label="Supplier COGS per unit" help="Your internal cost of goods sold per unit. This is not the retailer invoice price." value={cogs} onChange={setCogs} />
          <NumericInput label="SOA / supplier support per unit" help="Supplier-funded support per unit, such as saving on allowance, off-invoice support, scan support or per-unit promotional funding." value={soa} onChange={setSoa} />
          <NumericInput label="Fixed supplier support" help="Fixed investment such as media, feature fee, activation support, listing support or lump-sum customer funding." value={fixedCost} onChange={setFixedCost} />
          <NumericInput label="Retailer invoice/buy price per unit" help="The price the retailer/customer pays the supplier per unit, before any shopper retail price is applied. This is used for retailer margin estimates." value={retailerBuyPrice} onChange={setRetailerBuyPrice} />
          <SelectInput
            label="Retail price tax basis"
            help="Choose whether the retailer selling price entered is inclusive or exclusive of sales tax / VAT / IVA."
            value={retailerVatBasis}
            onChange={(value) => setRetailerVatBasis(value as VatBasis)}
            options={[
              { label: "Includes sales tax / VAT / IVA", value: "includes" },
              { label: "Excludes sales tax / VAT / IVA", value: "excludes" },
            ]}
          />
          <NumericInput label="Sales tax / VAT / IVA rate %" help="Used to convert retail selling price to an excluding-tax value for margin estimates." value={vatRate} onChange={setVatRate} />
          <p className="form-note">
            Retailer prices are often discussed including sales tax / VAT / IVA,
            but margin is usually assessed excluding tax. This tool converts the
            entered price where needed.
          </p>
        </div>
        <AdvancedAssumptions>
          <NumericInput label="Retailer margin target %" help="Target retailer/customer margin for a quick sense-check." value={retailerMarginRequirement} onChange={setRetailerMarginRequirement} />
          <NumericInput label="Estimated cannibalisation %" help="Sales that may switch from your other products." value={cannibalisation} onChange={setCannibalisation} />
          <NumericInput label="Estimated post-promo dip %" help="Sales that may be pulled forward from after the event." value={postPromoDip} onChange={setPostPromoDip} />
          <NumericInput label="Average invoice discount %" help="Average discount or price support applied to invoice sales." value={averageDiscount} onChange={setAverageDiscount} />
          <NumericInput label="Rebate / overrider %" help="Back-end terms as a percentage of sales." value={rebate} onChange={setRebate} />
          <NumericInput label="Marketing contribution" help="Retail media, shopper or activation contribution." value={marketingContribution} onChange={setMarketingContribution} />
          <NumericInput label="Expected sales uplift %" help="Expected uplift from the ask or plan." value={expectedUplift} onChange={setExpectedUplift} />
          <NumericInput label="Supplier gross margin %" help="Supplier margin to apply to expected uplift." value={grossMargin} onChange={setGrossMargin} />
          <NumericInput label="Requested investment %" help="Customer ask as a percentage of deal value." value={requestedInvestment} onChange={setRequestedInvestment} />
          <NumericInput label="Probability of success %" help="Confidence the uplift will happen." value={probability} onChange={setProbability} />
          <NumericInput label="Contract length in months" help="Period for the investment ask." value={contractMonths} onChange={setContractMonths} step="1" />
          <NumericInput label="Other deductions %" help="Extra deductions to include in trade spend." value={otherDeductions} onChange={setOtherDeductions} />
          <NumericInput label="Retention value" help="Optional value of defending current business." value={retentionValue} onChange={setRetentionValue} />
        </AdvancedAssumptions>
        <details className="advanced-box input-definitions">
          <summary>Input definitions</summary>
          <dl>
            <dt>Retail selling price</dt>
            <dd>The price paid by the shopper/end customer. Retailer pricing is at the sole discretion of the retailer.</dd>
            <dt>Retailer invoice/buy price</dt>
            <dd>The price the retailer/customer pays the supplier per unit before any shopper retail price is applied.</dd>
            <dt>Supplier COGS</dt>
            <dd>Your internal cost of goods sold per unit. This is not the retailer invoice/buy price.</dd>
            <dt>SOA / supplier support</dt>
            <dd>Supplier-funded per-unit promotional support, such as saving on allowance, off-invoice support or scan support.</dd>
            <dt>Fixed supplier support</dt>
            <dd>Fixed customer funding such as media, feature fees, activation support or lump-sum investment.</dd>
            <dt>Sales tax / VAT / IVA basis</dt>
            <dd>Whether the entered retail selling price includes sales tax / VAT / IVA. Retailer margin is estimated from an excluding-tax retail selling price.</dd>
          </dl>
        </details>
      </section>

      <section className="deal-tabs" aria-label="Commercial deal calculation tabs">
        <div className="tab-list" role="tablist" aria-label="Calculator views">
          {dealTabs.map((tab) => (
            <button
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? "tab-button tab-button-active" : "tab-button"}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="result-box" role="tabpanel">
          <div className="output-header">
            <div>
              <span className="pill">Free result</span>
              <h2>{dealTabTitle(activeTab)}</h2>
            </div>
            <div className="summary-actions">
              <CopyButton text={simpleSummaries[activeTab]} label="Copy simple summary" />
            </div>
          </div>
          <RetailerPricingCaveat />
          <p className="vat-note">{retailerVatSummary}</p>
          <p className="tab-summary">{tabSummaries[activeTab]}</p>

          {activeTab === "promo" && (
            <>
              <ResultGrid
                items={[
                  { label: "Net profit impact", value: currency.format(result.netProfitImpact), tone: result.netProfitImpact >= 0 ? "good" : "bad" },
                  { label: "ROI", value: safePercent(result.roi), tone: result.roi >= 0 ? "good" : "bad" },
                  { label: "Total SOA / supplier support", value: currency.format(result.totalInvestment) },
                  { label: "Break-even units", value: number.format(result.breakEvenIncrementalUnits) },
                  { label: "Verdict", value: result.promoVerdict, tone: result.netProfitImpact >= 0 ? "good" : "bad" },
                ]}
              />
              <CalculationDetail summary={detailedSummaries.promo}>
                <ResultGrid
                  items={[
                    { label: "Net incremental units", value: number.format(result.netIncrementalUnits), tone: result.netIncrementalUnits >= 0 ? "good" : "bad" },
                    { label: "SOA / supplier support value", value: currency.format(result.soaValue) },
                    { label: "Fixed supplier support", value: currency.format(result.fixed) },
                    { label: "Incremental GP before SOA / supplier support", value: currency.format(result.incrementalGpBeforeInvestment), tone: result.incrementalGpBeforeInvestment >= 0 ? "good" : "bad" },
                    { label: "Retailer estimated profit after support", value: currency.format(result.retailerEstimatedProfitAfterFunding) },
                    { label: "Excluding-tax selling price used", value: money2.format(result.retailerSellOutExVat) },
                  ]}
                />
              </CalculationDetail>
            </>
          )}

          {activeTab === "margin" && (
            <>
              <ResultGrid
                items={[
                  { label: "Retailer estimated profit", value: currency.format(result.retailerEstimatedProfitAfterFunding), tone: result.retailerEstimatedProfitAfterFunding >= 0 ? "good" : "bad" },
                  { label: "Retailer margin after support", value: safePercent(result.retailerMarginAfterFunding), tone: result.retailerMarginAfterFunding >= rate(retailerMarginRequirement) ? "good" : "bad" },
                  { label: "SOA / supplier support received", value: currency.format(result.supplierFundingReceived) },
                  { label: "Retailer cash profit per unit", value: money2.format(result.retailerCashProfitPerUnitAfterFunding) },
                  { label: "Retailer verdict", value: retailerVerdict, tone: result.retailerMarginAfterFunding >= rate(retailerMarginRequirement) ? "good" : "neutral" },
                ]}
              />
              <CalculationDetail summary={detailedSummaries.margin}>
                <ResultGrid
                  items={[
                    { label: "Promotional retail selling price entered", value: money2.format(result.retailerSellOutEntered) },
                    { label: "Retail price tax basis", value: retailerVatBasisLabel },
                    { label: "Sales tax / VAT / IVA rate", value: safePercent(result.vatRateValue) },
                    { label: "Excluding-tax selling price used", value: money2.format(result.retailerSellOutExVat) },
                    { label: "Retailer gross sales excluding tax", value: currency.format(result.retailerGrossSales) },
                    { label: "Retailer invoice/buy value", value: currency.format(result.retailerCostOfGoods) },
                    { label: "Retailer profit before support", value: currency.format(result.retailerGpBeforeFunding), tone: result.retailerGpBeforeFunding >= 0 ? "good" : "bad" },
                    { label: "Retailer margin before support", value: safePercent(result.retailerMarginBeforeFunding) },
                    { label: "Retailer margin gap vs requirement", value: safePercent(result.retailerMarginGapVsRequirement), tone: result.retailerMarginGapVsRequirement > 0 ? "bad" : "good" },
                  ]}
                />
              </CalculationDetail>
            </>
          )}

          {activeTab === "spend" && (
            <>
              <ResultGrid
                items={[
                  { label: "Total trade spend", value: currency.format(result.totalTradeSpend), tone: result.spendIntensity === "heavy" ? "bad" : "neutral" },
                  { label: "Trade spend % of gross sales", value: safePercent(result.tradeSpendGrossRate), tone: result.spendIntensity === "heavy" ? "bad" : "good" },
                  { label: "Net sales after SOA / supplier support", value: currency.format(result.netSalesAfterTradeSpend), tone: result.netSalesAfterTradeSpend >= 0 ? "good" : "bad" },
                  { label: "Variable SOA / supplier support", value: currency.format(result.variableDiscountValue + result.rebateValue + result.otherDeductionValue) },
                  { label: "Fixed supplier support", value: currency.format(result.fixed + result.marketingContributionValue) },
                ]}
              />
              <CalculationDetail summary={detailedSummaries.spend}>
                <ResultGrid
                  items={[
                    { label: "Gross sales value", value: currency.format(result.grossSales) },
                    { label: "Variable discount value", value: currency.format(result.variableDiscountValue) },
                    { label: "Rebate/overrider value", value: currency.format(result.rebateValue) },
                    { label: "Marketing contribution", value: currency.format(result.marketingContributionValue) },
                    { label: "Other deductions", value: currency.format(result.otherDeductionValue) },
                    { label: "Trade spend % of invoice sales", value: safePercent(result.tradeSpendInvoiceRate) },
                  ]}
                />
              </CalculationDetail>
            </>
          )}

          {activeTab === "investment" && (
            <>
              <ResultGrid
                items={[
                  { label: "Investment value", value: currency.format(result.investmentValue) },
                  { label: "Expected uplift value", value: currency.format(result.expectedIncrementalRevenue) },
                  { label: "Expected gross profit", value: currency.format(result.expectedGrossProfit) },
                  { label: "Net impact", value: currency.format(result.probabilityAdjustedNetImpact), tone: result.probabilityAdjustedNetImpact >= 0 ? "good" : "bad" },
                  { label: "Recommendation", value: result.investmentRecommendation, tone: result.investmentRecommendation === "Support" ? "good" : result.investmentRecommendation.startsWith("Reject") ? "bad" : "neutral" },
                ]}
              />
              <CalculationDetail summary={detailedSummaries.investment}>
                <ResultGrid
                  items={[
                    { label: "Probability-adjusted revenue", value: currency.format(result.probabilityAdjustedRevenue) },
                    { label: "Monthly payback / contract period view", value: currency.format(result.monthlyPayback), tone: result.monthlyPayback >= 0 ? "good" : "bad" },
                    { label: "Retention value", value: currency.format(num(retentionValue)) },
                  ]}
                />
              </CalculationDetail>
            </>
          )}
        </div>
      </section>

      <DealProPreview />
    </article>
  );
}

export function PromotionRoiCalculator() {
  return <CommercialDealCalculator defaultTab="promo" />;
}

export function TradeSpendCalculator() {
  return <CommercialDealCalculator defaultTab="spend" />;
}

export function GrossMarginCalculator() {
  return <CommercialDealCalculator defaultTab="margin" />;
}

export function TermsInvestmentCalculator() {
  return <CommercialDealCalculator defaultTab="investment" />;
}

function vatAdjustedPrice(price: number, basis: VatBasis, vat: number) {
  const exVat = basis === "includes" ? price / (1 + vat) : price;
  return {
    exVat,
    incVat: basis === "includes" ? price : price * (1 + vat),
    vatAmount: basis === "includes" ? price - exVat : price * vat,
  };
}

function QuickCalculatorCard({
  id,
  title,
  question,
  children,
  summary,
  results,
  explanation,
}: {
  id?: string;
  title: string;
  question: string;
  children: React.ReactNode;
  summary: string;
  results: { label: string; value: string; tone?: "good" | "bad" | "neutral" }[];
  explanation?: React.ReactNode;
}) {
  return (
    <article className="card quick-calculator-card" id={id}>
      <div>
        <span className="pill">Quick calculator</span>
        <h2>{title}</h2>
        <p>{question}</p>
      </div>
      <div className="form-grid">{children}</div>
      <div className="result-box">
        <div className="output-header">
          <h3>Answer</h3>
          <CopyButton text={summary} label="Copy result" />
        </div>
        <ResultGrid items={results} />
        <RetailerPricingCaveat />
        {explanation}
      </div>
    </article>
  );
}

export function QuickCommercialCalculators({ only }: { only?: QuickCalculatorId } = {}) {
  const [currencyCode, setCurrencyCode] = useState("GBP");
  const [soaInvoice, setSoaInvoice] = useState("1.75");
  const [soaRetail, setSoaRetail] = useState("2.00");
  const [soaVatBasis, setSoaVatBasis] = useState<VatBasis>("includes");
  const [soaVat, setSoaVat] = useState("20");
  const [soaMargin, setSoaMargin] = useState("25");
  const [soaFixed, setSoaFixed] = useState("0");

  const requiredSoa = useMemo(() => {
    const retail = vatAdjustedPrice(num(soaRetail), soaVatBasis, rate(soaVat));
    const requiredCost = retail.exVat * (1 - rate(soaMargin));
    const support = num(soaInvoice) - requiredCost;
    const promoInvoice = num(soaInvoice) - support;
    return {
      retail,
      requiredCost,
      support,
      promoInvoice,
      supportInvoiceRate: num(soaInvoice) > 0 ? support / num(soaInvoice) : 0,
      supportRetailRate: retail.exVat > 0 ? support / retail.exVat : 0,
    };
  }, [soaInvoice, soaRetail, soaVatBasis, soaVat, soaMargin]);

  const [rspInvoice, setRspInvoice] = useState("1.75");
  const [rspMargin, setRspMargin] = useState("25");
  const [rspVat, setRspVat] = useState("20");
  const [rspShowInc, setRspShowInc] = useState("yes");

  const retailFromInvoice = useMemo(() => {
    const exVat = num(rspInvoice) / Math.max(1 - rate(rspMargin), 0.01);
    const incVat = exVat * (1 + rate(rspVat));
    return { exVat, incVat, cashMargin: exVat - num(rspInvoice), margin: exVat > 0 ? (exVat - num(rspInvoice)) / exVat : 0 };
  }, [rspInvoice, rspMargin, rspVat]);

  const [actualInvoice, setActualInvoice] = useState("1.75");
  const [actualMode, setActualMode] = useState("soa");
  const [actualSupport, setActualSupport] = useState("0.35");
  const [actualPromoInvoice, setActualPromoInvoice] = useState("1.40");
  const [actualRetail, setActualRetail] = useState("2.00");
  const [actualVatBasis, setActualVatBasis] = useState<VatBasis>("includes");
  const [actualVat, setActualVat] = useState("20");
  const [actualFixed, setActualFixed] = useState("0");
  const [actualUnits, setActualUnits] = useState("0");

  const actualMargin = useMemo(() => {
    const retail = vatAdjustedPrice(num(actualRetail), actualVatBasis, rate(actualVat));
    const effectiveCost = actualMode === "soa" ? num(actualInvoice) - num(actualSupport) : num(actualPromoInvoice);
    const perUnitSupport = actualMode === "soa" ? num(actualSupport) : num(actualInvoice) - num(actualPromoInvoice);
    const cashMargin = retail.exVat - effectiveCost;
    const units = num(actualUnits);
    return {
      retail,
      effectiveCost,
      cashMargin,
      margin: retail.exVat > 0 ? cashMargin / retail.exVat : 0,
      totalRetailerProfit: units > 0 ? cashMargin * units + num(actualFixed) : 0,
      totalSupport: units > 0 ? perUnitSupport * units + num(actualFixed) : 0,
    };
  }, [actualInvoice, actualMode, actualSupport, actualPromoInvoice, actualRetail, actualVatBasis, actualVat, actualFixed, actualUnits]);

  const [invoiceRetail, setInvoiceRetail] = useState("2.00");
  const [invoiceVatBasis, setInvoiceVatBasis] = useState<VatBasis>("includes");
  const [invoiceVat, setInvoiceVat] = useState("20");
  const [invoiceMargin, setInvoiceMargin] = useState("25");

  const impliedInvoice = useMemo(() => {
    const retail = vatAdjustedPrice(num(invoiceRetail), invoiceVatBasis, rate(invoiceVat));
    const invoice = retail.exVat * (1 - rate(invoiceMargin));
    return { retail, invoice, cashMargin: retail.exVat - invoice };
  }, [invoiceRetail, invoiceVatBasis, invoiceVat, invoiceMargin]);

  const [supportValue, setSupportValue] = useState("0.35");
  const [supportInvoice, setSupportInvoice] = useState("1.75");
  const [supportRetail, setSupportRetail] = useState("2.00");
  const [supportVatBasis, setSupportVatBasis] = useState<VatBasis>("includes");
  const [supportVat, setSupportVat] = useState("20");

  const supportPercent = useMemo(() => {
    const retail = vatAdjustedPrice(num(supportRetail), supportVatBasis, rate(supportVat));
    return {
      retail,
      invoiceRate: num(supportInvoice) > 0 ? num(supportValue) / num(supportInvoice) : 0,
      exVatRate: retail.exVat > 0 ? num(supportValue) / retail.exVat : 0,
      incVatRate: retail.incVat > 0 ? num(supportValue) / retail.incVat : 0,
    };
  }, [supportValue, supportInvoice, supportRetail, supportVatBasis, supportVat]);

  const [promoInvoiceCurrent, setPromoInvoiceCurrent] = useState("1.75");
  const [promoInvoiceSupport, setPromoInvoiceSupport] = useState("0.35");
  const [promoInvoiceUnits, setPromoInvoiceUnits] = useState("0");

  const promoInvoice = useMemo(() => {
    const effective = num(promoInvoiceCurrent) - num(promoInvoiceSupport);
    return {
      effective,
      totalSupport: num(promoInvoiceUnits) > 0 ? num(promoInvoiceSupport) * num(promoInvoiceUnits) : 0,
      supportRate: num(promoInvoiceCurrent) > 0 ? num(promoInvoiceSupport) / num(promoInvoiceCurrent) : 0,
    };
  }, [promoInvoiceCurrent, promoInvoiceSupport, promoInvoiceUnits]);

  const [converterPrice, setConverterPrice] = useState("2.00");
  const [converterBasis, setConverterBasis] = useState<VatBasis>("includes");
  const [converterVat, setConverterVat] = useState("20");
  const convertedVat = useMemo(() => vatAdjustedPrice(num(converterPrice), converterBasis, rate(converterVat)), [converterPrice, converterBasis, converterVat]);

  const [markupCost, setMarkupCost] = useState("1.75");
  const [markupRetail, setMarkupRetail] = useState("2.50");
  const markup = useMemo(() => {
    const profit = num(markupRetail) - num(markupCost);
    return {
      profit,
      margin: num(markupRetail) > 0 ? profit / num(markupRetail) : 0,
      markup: num(markupCost) > 0 ? profit / num(markupCost) : 0,
    };
  }, [markupCost, markupRetail]);

  const currency = useMemo(
    () => ({ format: (value: number) => formatCurrencyValue(value, currencyCode, 0) }),
    [currencyCode],
  );
  const money2 = useMemo(
    () => ({ format: (value: number) => formatCurrencyValue(value, currencyCode, 2) }),
    [currencyCode],
  );

  const vatOptions = [
    { label: "Includes sales tax / VAT / IVA", value: "includes" },
    { label: "Excludes sales tax / VAT / IVA", value: "excludes" },
  ];
  const shouldShow = (id: QuickCalculatorId) => !only || only === id;

  return (
    <div className="quick-calculator-list">
      <section className="card quick-settings-card">
        <div>
          <span className="pill">Settings</span>
          <h2>Formatting</h2>
          <p>Choose the currency symbol used in calculator outputs.</p>
        </div>
        <div className="form-grid">
          <SelectInput
            label="Currency"
            help="Currency is for formatting only. This tool does not convert exchange rates."
            value={currencyCode}
            onChange={setCurrencyCode}
            options={currencyChoices.map(({ label, value }) => ({ label, value }))}
          />
        </div>
      </section>
      {shouldShow("required-soa-calculator") ? (
      <QuickCalculatorCard
        id="required-soa-calculator"
        title="Required SOA Calculator"
        question="I have current invoice price, SRP, promo SRP and target retailer margin. What SOA or promo invoice is needed?"
        summary={`Required SOA: ${money2.format(requiredSoa.support)} per unit. Promo invoice: ${money2.format(requiredSoa.promoInvoice)}. Promo retail price excluding tax: ${money2.format(requiredSoa.retail.exVat)}. Pricing is at the sole discretion of the retailer. Currency is for formatting only; this tool does not convert exchange rates.`}
        results={[
          { label: "Promo retail price excluding tax", value: money2.format(requiredSoa.retail.exVat) },
          { label: "Required retailer cost price", value: money2.format(requiredSoa.requiredCost) },
          { label: "Required SOA per unit", value: money2.format(requiredSoa.support), tone: requiredSoa.support >= 0 ? "neutral" : "bad" },
          { label: "New effective promo invoice price", value: money2.format(requiredSoa.promoInvoice) },
          { label: "SOA % of current invoice", value: safePercent(requiredSoa.supportInvoiceRate) },
          { label: "SOA % of promo retail price", value: safePercent(requiredSoa.supportRetailRate) },
        ]}
      >
        <NumericInput label="Current retailer invoice/buy price" help="Current price the retailer pays the supplier per unit." value={soaInvoice} onChange={setSoaInvoice} />
        <NumericInput label="Promotional retail selling price" help="Promo price paid by the shopper/end customer." value={soaRetail} onChange={setSoaRetail} />
        <SelectInput label="Retail price tax basis" help="Choose whether the promo retail price includes or excludes sales tax / VAT / IVA." value={soaVatBasis} onChange={(value) => setSoaVatBasis(value as VatBasis)} options={vatOptions} />
        <NumericInput label="Sales tax / VAT / IVA rate %" help="Used to convert retail price to excluding tax." value={soaVat} onChange={setSoaVat} />
        <NumericInput label="Target retailer margin %" help="Retailer/customer target margin on excluding-tax retail selling price." value={soaMargin} onChange={setSoaMargin} />
        <NumericInput label="Optional fixed supplier support" help="Fixed support to remember separately. Not included in per-unit SOA." value={soaFixed} onChange={setSoaFixed} />
      </QuickCalculatorCard>
      ) : null}

      {shouldShow("retail-selling-price-calculator") ? (
      <QuickCalculatorCard
        id="retail-selling-price-calculator"
        title="Retail Selling Price from Invoice + Margin"
        question="Estimate retail/sale price from invoice price and target retailer margin."
        summary={`Estimated retail/sale price excluding sales tax / VAT / IVA: ${money2.format(retailFromInvoice.exVat)}. Estimated retail/sale price including sales tax / VAT / IVA: ${money2.format(retailFromInvoice.incVat)}. Margin: ${safePercent(retailFromInvoice.margin)}. Pricing is at the sole discretion of the retailer.`}
        results={[
          { label: "Estimated retail/sale price excluding sales tax / VAT / IVA", value: money2.format(retailFromInvoice.exVat) },
          { label: "Estimated retail/sale price including sales tax / VAT / IVA", value: money2.format(retailFromInvoice.incVat) },
          { label: "Cash margin per unit", value: money2.format(retailFromInvoice.cashMargin) },
          { label: "Margin %", value: safePercent(retailFromInvoice.margin) },
        ]}
      >
        <NumericInput label="Retailer invoice/buy price" help="Price the retailer pays the supplier per unit." value={rspInvoice} onChange={setRspInvoice} />
        <NumericInput label="Target retailer margin %" help="Target margin on excluding-tax retail selling price." value={rspMargin} onChange={setRspMargin} />
        <NumericInput label="Sales tax / VAT / IVA rate %" help="Used to show the including-tax retail price." value={rspVat} onChange={setRspVat} />
        <SelectInput label="Show retail price including tax?" help="Choose whether to emphasise the shopper-facing price including sales tax / VAT / IVA." value={rspShowInc} onChange={setRspShowInc} options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]} />
      </QuickCalculatorCard>
      ) : null}

      {shouldShow("actual-retailer-margin-calculator") ? (
      <QuickCalculatorCard
        id="actual-retailer-margin-calculator"
        title="Actual Retailer Margin Calculator"
        question="I know the invoice price, SOA/promo invoice and promo retail price. What margin is the retailer actually making?"
        summary={`Retailer margin: ${safePercent(actualMargin.margin)}. Effective retailer cost: ${money2.format(actualMargin.effectiveCost)}. Retailer cash margin/unit: ${money2.format(actualMargin.cashMargin)}.`}
        results={[
          { label: "Promo retail price excluding tax", value: money2.format(actualMargin.retail.exVat) },
          { label: "Effective retailer cost price", value: money2.format(actualMargin.effectiveCost) },
          { label: "Retailer cash margin per unit", value: money2.format(actualMargin.cashMargin), tone: actualMargin.cashMargin >= 0 ? "good" : "bad" },
          { label: "Retailer margin %", value: safePercent(actualMargin.margin), tone: actualMargin.margin >= 0 ? "good" : "bad" },
          { label: "Total retailer cash profit", value: num(actualUnits) > 0 ? currency.format(actualMargin.totalRetailerProfit) : "Enter units" },
          { label: "Total supplier support", value: num(actualUnits) > 0 ? currency.format(actualMargin.totalSupport) : "Enter units" },
        ]}
      >
        <NumericInput label="Normal retailer invoice/buy price" help="Normal price the retailer pays the supplier per unit." value={actualInvoice} onChange={setActualInvoice} />
        <SelectInput label="Support input mode" help="Use SOA per unit or enter the final promo invoice price." value={actualMode} onChange={setActualMode} options={[{ label: "SOA / supplier support", value: "soa" }, { label: "Promo invoice price", value: "promoInvoice" }]} />
        <NumericInput label="SOA / supplier support per unit" help="Per-unit support funded by the supplier." value={actualSupport} onChange={setActualSupport} />
        <NumericInput label="Promo invoice price" help="Effective invoice/buy price during the promotion." value={actualPromoInvoice} onChange={setActualPromoInvoice} />
        <NumericInput label="Promo retail selling price" help="Promo price paid by the shopper/end customer." value={actualRetail} onChange={setActualRetail} />
        <SelectInput label="Retail price tax basis" help="Choose whether the promo retail price includes or excludes sales tax / VAT / IVA." value={actualVatBasis} onChange={(value) => setActualVatBasis(value as VatBasis)} options={vatOptions} />
        <NumericInput label="Sales tax / VAT / IVA rate %" help="Used to convert retail price to excluding tax." value={actualVat} onChange={setActualVat} />
        <NumericInput label="Fixed support" help="Optional fixed supplier support." value={actualFixed} onChange={setActualFixed} />
        <NumericInput label="Units" help="Optional units for total profit/support." value={actualUnits} onChange={setActualUnits} step="1" />
      </QuickCalculatorCard>
      ) : null}

      {shouldShow("invoice-price-calculator") ? (
      <QuickCalculatorCard
        id="invoice-price-calculator"
        title="Invoice Price from Retail Price + Margin"
        question="Calculate the implied retailer invoice/buy price from retail price and target margin."
        summary={`Implied retailer invoice/buy price: ${money2.format(impliedInvoice.invoice)}. Retail price excluding tax: ${money2.format(impliedInvoice.retail.exVat)}.`}
        results={[
          { label: "Retail price excluding tax", value: money2.format(impliedInvoice.retail.exVat) },
          { label: "Implied retailer invoice/buy price", value: money2.format(impliedInvoice.invoice) },
          { label: "Retailer cash margin per unit", value: money2.format(impliedInvoice.cashMargin) },
        ]}
      >
        <NumericInput label="Retail selling price" help="Price paid by the shopper/end customer." value={invoiceRetail} onChange={setInvoiceRetail} />
        <SelectInput label="Retail price tax basis" help="Choose whether the retail selling price includes or excludes sales tax / VAT / IVA." value={invoiceVatBasis} onChange={(value) => setInvoiceVatBasis(value as VatBasis)} options={vatOptions} />
        <NumericInput label="Sales tax / VAT / IVA rate %" help="Used to convert retail price to excluding tax." value={invoiceVat} onChange={setInvoiceVat} />
        <NumericInput label="Target retailer margin %" help="Target margin on excluding-tax retail price." value={invoiceMargin} onChange={setInvoiceMargin} />
      </QuickCalculatorCard>
      ) : null}

      {shouldShow("soa-support-percent-calculator") ? (
      <QuickCalculatorCard
        id="soa-support-percent-calculator"
        title="SOA % / Support % Calculator"
        question="What percentage support am I giving?"
        summary={`SOA as % of invoice: ${safePercent(supportPercent.invoiceRate)}. SOA as % of retail price excluding tax: ${safePercent(supportPercent.exVatRate)}.`}
        results={[
          { label: "SOA as % of invoice price", value: safePercent(supportPercent.invoiceRate) },
          { label: "SOA as % of retail price excluding tax", value: safePercent(supportPercent.exVatRate) },
          { label: "SOA as % of retail price including tax", value: safePercent(supportPercent.incVatRate) },
        ]}
      >
        <NumericInput label="SOA / supplier support per unit" help="Per-unit support funded by the supplier." value={supportValue} onChange={setSupportValue} />
        <NumericInput label="Retailer invoice/buy price" help="Price the retailer pays the supplier per unit." value={supportInvoice} onChange={setSupportInvoice} />
        <NumericInput label="Retail selling price" help="Price paid by the shopper/end customer." value={supportRetail} onChange={setSupportRetail} />
        <SelectInput label="Retail price tax basis" help="Choose whether the retail selling price includes or excludes sales tax / VAT / IVA." value={supportVatBasis} onChange={(value) => setSupportVatBasis(value as VatBasis)} options={vatOptions} />
        <NumericInput label="Sales tax / VAT / IVA rate %" help="Used to convert retail price to excluding tax." value={supportVat} onChange={setSupportVat} />
      </QuickCalculatorCard>
      ) : null}

      {shouldShow("promo-invoice-calculator") ? (
      <QuickCalculatorCard
        id="promo-invoice-calculator"
        title="Promo Invoice Calculator"
        question="If I give a per-unit SOA, what is the promo invoice price?"
        summary={`Effective promo invoice price: ${money2.format(promoInvoice.effective)}. Support % of invoice: ${safePercent(promoInvoice.supportRate)}.`}
        results={[
          { label: "Effective promo invoice price", value: money2.format(promoInvoice.effective), tone: promoInvoice.effective >= 0 ? "good" : "bad" },
          { label: "Total supplier support", value: num(promoInvoiceUnits) > 0 ? currency.format(promoInvoice.totalSupport) : "Enter units" },
          { label: "Support % of invoice", value: safePercent(promoInvoice.supportRate) },
        ]}
      >
        <NumericInput label="Current retailer invoice/buy price" help="Current price the retailer pays the supplier per unit." value={promoInvoiceCurrent} onChange={setPromoInvoiceCurrent} />
        <NumericInput label="SOA / supplier support per unit" help="Per-unit support funded by the supplier." value={promoInvoiceSupport} onChange={setPromoInvoiceSupport} />
        <NumericInput label="Units" help="Optional units for total supplier support." value={promoInvoiceUnits} onChange={setPromoInvoiceUnits} step="1" />
      </QuickCalculatorCard>
      ) : null}

      {shouldShow("sales-tax-vat-iva-retail-price-converter") ? (
      <QuickCalculatorCard
        id="sales-tax-vat-iva-retail-price-converter"
        title="Sales Tax / VAT / IVA Retail Price Converter"
        question="Convert retail price including tax to excluding tax, or excluding tax to including tax."
        summary={`Retail price excluding tax: ${money2.format(convertedVat.exVat)}. Sales tax / VAT / IVA amount: ${money2.format(convertedVat.vatAmount)}. Retail price including tax: ${money2.format(convertedVat.incVat)}.`}
        results={[
          { label: "Retail price excluding tax", value: money2.format(convertedVat.exVat) },
          { label: "Sales tax / VAT / IVA amount", value: money2.format(convertedVat.vatAmount) },
          { label: "Retail price including tax", value: money2.format(convertedVat.incVat) },
        ]}
      >
        <NumericInput label="Retail selling price" help="Price paid by the shopper/end customer." value={converterPrice} onChange={setConverterPrice} />
        <SelectInput label="Retail price tax basis" help="Choose whether the entered retail price includes or excludes sales tax / VAT / IVA." value={converterBasis} onChange={(value) => setConverterBasis(value as VatBasis)} options={vatOptions} />
        <NumericInput label="Sales tax / VAT / IVA rate %" help="Sales tax / VAT / IVA rate used to convert the retail price." value={converterVat} onChange={setConverterVat} />
      </QuickCalculatorCard>
      ) : null}

      {shouldShow("markup-vs-margin-helper") ? (
      <QuickCalculatorCard
        id="markup-vs-margin-helper"
        title="Markup vs Margin Helper"
        question="What is the difference between markup and margin on this deal?"
        summary={`Cash profit: ${money2.format(markup.profit)}. Margin: ${safePercent(markup.margin)}. Markup: ${safePercent(markup.markup)}.`}
        results={[
          { label: "Cash profit", value: money2.format(markup.profit), tone: markup.profit >= 0 ? "good" : "bad" },
          { label: "Margin %", value: safePercent(markup.margin), tone: markup.margin >= 0 ? "good" : "bad" },
          { label: "Markup %", value: safePercent(markup.markup), tone: markup.markup >= 0 ? "good" : "bad" },
        ]}
        explanation={<p className="tab-summary">Margin is profit as a percentage of selling price. Markup is profit as a percentage of cost.</p>}
      >
        <NumericInput label="Cost / invoice price" help="Cost or invoice/buy price used as the base." value={markupCost} onChange={setMarkupCost} />
        <NumericInput label="Retail selling price excluding tax" help="Selling price excluding sales tax / VAT / IVA." value={markupRetail} onChange={setMarkupRetail} />
      </QuickCalculatorCard>
      ) : null}
    </div>
  );
}

export function BuyerMeetingPrepTool() {
  const [customer, setCustomer] = useState("Retailer A");
  const [objective, setObjective] = useState("Secure agreement for a summer promotional plan");
  const [issue, setIssue] = useState("The buyer needs stronger value perception without adding range complexity.");
  const [ask, setAsk] = useState("Approve a 6-week feature and display plan on the core range.");
  const [evidence, setEvidence] = useState("Last event delivered +18% units, 94% availability and positive shopper feedback.");
  const [nextStep, setNextStep] = useState("Agree the mechanic, timing and approval route this week.");

  const sections: [string, string][] = [
    ["Meeting objective", `For ${customer}, the objective is to ${objective.toLowerCase()}. Desired next step: ${nextStep}`],
    ["5-minute opening", `Thanks for making the time. I want to focus on ${issue.toLowerCase()} and show a practical way forward: ${ask}`],
    ["Commercial story", `The case is built on this evidence: ${evidence}. The recommendation is to keep the plan focused, measurable and easy to execute.`],
    ["Likely buyer objections", "The investment is too high.\nThe timing is difficult.\nThe uplift is not proven.\nThe plan adds store workload.\nThere is not enough space or support."],
    ["Suggested responses", "Link the investment to the customer objective.\nOffer a controlled test if full approval is hard.\nUse the evidence and define success measures.\nShow how execution is kept simple.\nAsk what condition would make the plan acceptable."],
    ["Questions to ask the buyer", "What would make this worth approving?\nWhich measure matters most for this event?\nWhat execution risk worries you?\nWhat internal approval is needed?\nWhat timing would work best?"],
    ["Closing ask", `Can we agree ${nextStep.toLowerCase()}?`],
    ["Follow-up email draft", `Thanks for your time today. As discussed, the opportunity is: ${issue}. My proposed ask is: ${ask}. The supporting evidence is: ${evidence}. The next step we discussed is: ${nextStep}.`],
  ];

  return (
    <GeneratorShell
      fields={<>
        <TextInput label="Customer name" help="Retailer, channel or buyer group." value={customer} onChange={setCustomer} />
        <TextInput label="Meeting objective" help="The decision you want from the meeting." value={objective} onChange={setObjective} multiline />
        <TextInput label="Current issue/opportunity" help="The buyer pressure point or growth opportunity." value={issue} onChange={setIssue} multiline />
        <TextInput label="Proposed ask" help="The specific commitment you want." value={ask} onChange={setAsk} multiline />
        <TextInput label="Evidence or numbers" help="The proof you will bring." value={evidence} onChange={setEvidence} multiline />
        <TextInput label="Desired next step" help="The action you want agreed." value={nextStep} onChange={setNextStep} multiline />
      </>}
      sections={sections}
      proFeatures={["Full meeting pack", "Objection handling library", "Senior stakeholder version", "Follow-up email variations", "Negotiation plan"]}
    />
  );
}

export function JbpBuilder() {
  const [customer, setCustomer] = useState("Retailer A");
  const [opportunity, setOpportunity] = useState("Grow premium penetration in high-value missions.");
  const [objective, setObjective] = useState("Deliver profitable category growth over the next 12 months.");
  const [initiative, setInitiative] = useState("Quarterly feature plan, range optimisation and joint digital support.");
  const [investment, setInvestment] = useState("£45k trade and media investment");
  const [measure, setMeasure] = useState("Incremental revenue, margin, distribution gains and repeat rate.");

  const sections: [string, string][] = [
    ["One-page JBP summary", `${customer} can unlock ${opportunity.toLowerCase()} through ${initiative.toLowerCase()}`],
    ["Shared objective", objective],
    ["Growth pillars", "Grow the priority shopper mission.\nImprove distribution and availability on priority SKUs.\nExecute fewer, stronger activations with clearer measures."],
    ["Activation plan", initiative],
    ["Investment ask", investment],
    ["Measures of success", measure],
    ["Risks and dependencies", "Customer feature space, internal funding approval, availability, accurate baseline data and clear review ownership."],
    ["Next steps", "Confirm owners, validate the financial case, agree timings and schedule the first review checkpoint."],
  ];

  return (
    <GeneratorShell
      fields={<>
        <TextInput label="Customer" help="Customer or account name." value={customer} onChange={setCustomer} />
        <TextInput label="Category opportunity" help="The category or shopper growth prize." value={opportunity} onChange={setOpportunity} multiline />
        <TextInput label="Joint objective" help="The shared commercial outcome." value={objective} onChange={setObjective} multiline />
        <TextInput label="Growth initiative" help="The core activation or growth idea." value={initiative} onChange={setInitiative} multiline />
        <TextInput label="Investment needed" help="Funding, media, range support or resource." value={investment} onChange={setInvestment} />
        <TextInput label="Success measure" help="How success will be judged." value={measure} onChange={setMeasure} multiline />
      </>}
      sections={sections}
      proFeatures={["Full JBP pack", "Quarterly milestones", "Customer-specific action tracker", "PDF/export", "Internal sell-in version"]}
    />
  );
}

export function AccountPlanGenerator() {
  const [account, setAccount] = useState("Retailer A");
  const [performance, setPerformance] = useState("Sales are growing behind promotions, but base rate of sale is flat.");
  const [opportunity, setOpportunity] = useState("Improve distribution on priority SKUs and sharpen promotional mix.");
  const [risk, setRisk] = useState("Margin pressure and competitor space gains.");
  const [products, setProducts] = useState("Core range, premium formats and seasonal packs.");
  const [action, setAction] = useState("Book buyer meeting to agree range and promo recommendations.");

  const sections: [string, string][] = [
    ["Account overview", `${account}: ${performance}`],
    ["Opportunity summary", opportunity],
    ["Risk summary", risk],
    ["Commercial strategy", `Prioritise ${products}. Focus investment on actions that improve rate of sale, distribution quality and margin.`],
    ["30/60/90 day plan", `30 days: validate numbers and align internal owners.\n60 days: present recommendation and secure customer agreement.\n90 days: review execution and scale what works. Next action: ${action}`],
    ["Internal support needed", "Pricing guardrails, trade spend envelope, supply readiness, category evidence and senior sponsorship."],
    ["Review cadence", "Weekly internal action check, monthly customer trading review and quarterly strategic review."],
  ];

  return (
    <GeneratorShell
      fields={<>
        <TextInput label="Account name" help="Retailer, customer or channel." value={account} onChange={setAccount} />
        <TextInput label="Current performance" help="What is happening now?" value={performance} onChange={setPerformance} multiline />
        <TextInput label="Biggest growth opportunity" help="Where growth is most likely." value={opportunity} onChange={setOpportunity} multiline />
        <TextInput label="Biggest risk" help="What could derail the plan." value={risk} onChange={setRisk} multiline />
        <TextInput label="Priority products/ranges" help="The range or products to focus on." value={products} onChange={setProducts} multiline />
        <TextInput label="Next commercial action" help="The next real action." value={action} onChange={setAction} multiline />
      </>}
      sections={sections}
      proFeatures={["Full account plan template", "Range review prep", "Annual customer plan", "Saved account plans", "Team sharing"]}
    />
  );
}

export function CustomerReviewTemplate() {
  const [customer, setCustomer] = useState("Retailer A");
  const [period, setPeriod] = useState("Q2");
  const [performance, setPerformance] = useState("Revenue grew 6%, with strong promo weeks but weaker base sales.");
  const [worked, setWorked] = useState("Distribution gains, better feature compliance and improved availability.");
  const [missed, setMissed] = useState("Promotion margin was below target and one launch missed the timing window.");
  const [priority, setPriority] = useState("Improve base rate of sale, protect margin and tighten launch planning.");

  const sections: [string, string][] = [
    ["Executive summary", `${customer} ${period}: ${performance} The next priority is to ${priority.toLowerCase()}`],
    ["Performance narrative", performance],
    ["Wins", worked],
    ["Misses", missed],
    ["Recommended actions", `Focus the next period on: ${priority}`],
    ["Proposed asks", "Agree the priority actions, confirm support levels, align success measures and remove execution blockers."],
    ["Follow-up actions", "Send agreed numbers, owners and timings within 24 hours. Schedule the next checkpoint and document decisions."],
  ];

  return (
    <GeneratorShell
      fields={<>
        <TextInput label="Customer" help="Customer or account name." value={customer} onChange={setCustomer} />
        <TextInput label="Review period" help="Quarter, half year or trading period." value={period} onChange={setPeriod} />
        <TextInput label="Sales performance" help="Headline sales and margin story." value={performance} onChange={setPerformance} multiline />
        <TextInput label="What worked" help="What went well and why." value={worked} onChange={setWorked} multiline />
        <TextInput label="What missed" help="What underperformed or caused friction." value={missed} onChange={setMissed} multiline />
        <TextInput label="Next priority" help="The main focus for the next period." value={priority} onChange={setPriority} multiline />
      </>}
      sections={sections}
      proFeatures={["Full QBR pack", "Customer-ready review deck structure", "Promo performance review", "Action tracker", "PDF/export"]}
    />
  );
}

function GeneratorShell({
  fields,
  sections,
  proFeatures,
}: {
  fields: React.ReactNode;
  sections: [string, string][];
  proFeatures: string[];
}) {
  const output = sections.map(([title, body]) => `${title}\n${body}`).join("\n\n");

  return (
    <article className="card tool-form">
      <BadgeRow />
      <div className="form-grid">{fields}</div>
      <div className="result-box output-block">
        <div className="output-header">
          <div>
            <span className="pill">Free result</span>
            <h2>Copy-ready output</h2>
          </div>
          <CopyButton text={output} />
        </div>
        <PlanningDisclaimer />
        {sections.map(([title, body]) => (
          <section key={title}>
            <h3>{title}</h3>
            {body.includes("\n") ? (
              <ul>
                {body.split("\n").map((line) => (
                  <li key={line}>{line.replace(/^\d+\.\s*/, "")}</li>
                ))}
              </ul>
            ) : (
              <p>{body}</p>
            )}
          </section>
        ))}
        <InfoPanel title="Watch-outs">
          <ul>
            <li>Add real sales, margin, distribution and customer context before sharing externally.</li>
            <li>Use the output as a structured first draft, not a final approved recommendation.</li>
          </ul>
        </InfoPanel>
      </div>
      <ProPreview features={proFeatures} />
    </article>
  );
}
