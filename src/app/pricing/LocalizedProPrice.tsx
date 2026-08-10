"use client";

import { useLocalizedPricing } from "../../lib/useLocalizedPricing";

export function LocalizedFreePrice() {
  const pricing = useLocalizedPricing();

  return (
    <>
      <div className="price">{pricing.free}</div>
      <p>Best for quick checks.</p>
    </>
  );
}

export function LocalizedProPrice() {
  const pricing = useLocalizedPricing();

  return (
    <>
      <div className="price">{pricing.monthly}</div>
      <p>{pricing.annualDetail}</p>
    </>
  );
}
