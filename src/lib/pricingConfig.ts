export type PricingCurrency = "GBP" | "USD" | "EUR";

type PricePoint = {
  minor: number;
};

export type AptProPricing = {
  currency: PricingCurrency;
  monthly: PricePoint;
  annual: PricePoint;
  symbol: string;
};

const eurozoneCountries = new Set([
  "AT",
  "BE",
  "HR",
  "CY",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PT",
  "SK",
  "SI",
  "ES",
]);

export const aptProPricing: Record<PricingCurrency, AptProPricing> = {
  GBP: {
    currency: "GBP",
    symbol: "£",
    monthly: { minor: 999 },
    annual: { minor: 9900 },
  },
  USD: {
    currency: "USD",
    symbol: "$",
    monthly: { minor: 1299 },
    annual: { minor: 12900 },
  },
  EUR: {
    currency: "EUR",
    symbol: "€",
    monthly: { minor: 1199 },
    annual: { minor: 11900 },
  },
};

export function currencyFromCountry(country: string | null | undefined): PricingCurrency {
  const normalisedCountry = country?.trim().toUpperCase();
  if (normalisedCountry === "GB" || normalisedCountry === "UK") return "GBP";
  if (normalisedCountry === "US") return "USD";
  if (normalisedCountry && eurozoneCountries.has(normalisedCountry)) return "EUR";
  return "GBP";
}

export function currencyFromLocale(locale: string | null | undefined): PricingCurrency {
  if (!locale) return "GBP";

  const normalisedLocale = locale.trim().replace("_", "-");
  if (!normalisedLocale) return "GBP";

  let region = "";
  try {
    region = new Intl.Locale(normalisedLocale).region ?? "";
  } catch {
    const parts = normalisedLocale.split("-");
    region = parts.length > 1 ? parts[parts.length - 1] ?? "" : "";
  }

  return currencyFromCountry(region);
}

export function currencyFromLocales(locales: readonly string[] | null | undefined): PricingCurrency {
  return currencyFromLocale(locales?.[0]);
}

export function getAptProPricing(currency: PricingCurrency = "GBP") {
  return aptProPricing[currency];
}

export function formatPriceMinor(pricing: AptProPricing, minor: number) {
  const amount = minor / 100;
  const formattedAmount = minor % 100 === 0 ? amount.toFixed(0) : amount.toFixed(2);
  return `${pricing.symbol}${formattedAmount}`;
}

export function getAptProPriceLabels(currency: PricingCurrency = "GBP") {
  const pricing = getAptProPricing(currency);
  const annualSavingMinor = pricing.monthly.minor * 12 - pricing.annual.minor;

  return {
    currency,
    monthly: `${formatPriceMinor(pricing, pricing.monthly.minor)}/month`,
    annual: `${formatPriceMinor(pricing, pricing.annual.minor)}/year`,
    annualSaving: `Save ${formatPriceMinor(pricing, annualSavingMinor)}/year`,
    annualDetail: `Or ${formatPriceMinor(pricing, pricing.annual.minor)}/year. Save ${formatPriceMinor(pricing, annualSavingMinor)}/year.`,
  };
}
