"use client";

import { useSyncExternalStore } from "react";
import { currencyFromLocales, getAptProPriceLabels, type PricingCurrency } from "./pricingConfig";

function browserCurrency(): PricingCurrency {
  if (typeof navigator === "undefined") return "GBP";

  const languages = navigator.languages?.length ? navigator.languages : [navigator.language].filter(Boolean);
  return currencyFromLocales(languages);
}

export function useLocalizedPricing() {
  const currency = useSyncExternalStore<PricingCurrency>(
    () => () => {},
    browserCurrency,
    () => "GBP",
  );

  return getAptProPriceLabels(currency);
}
