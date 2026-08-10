"use client";

import { useEffect, useState } from "react";
import { currencyFromLocales, getAptProPriceLabels, type PricingCurrency } from "./pricingConfig";

function browserCurrency(): PricingCurrency {
  if (typeof navigator === "undefined") return "GBP";

  const languages = navigator.languages?.length ? navigator.languages : [navigator.language].filter(Boolean);
  return currencyFromLocales(languages);
}

export function useLocalizedPricing() {
  const [currency, setCurrency] = useState<PricingCurrency>("GBP");

  useEffect(() => {
    setCurrency(browserCurrency());
  }, []);

  return getAptProPriceLabels(currency);
}
