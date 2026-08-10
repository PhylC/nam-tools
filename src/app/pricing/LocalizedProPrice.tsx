"use client";

import { useLocalizedPricing } from "../../lib/useLocalizedPricing";

export function LocalizedProPrice() {
  const pricing = useLocalizedPricing();

  return (
    <>
      <div className="price">{pricing.monthly}</div>
      <p>{pricing.annualDetail}</p>
    </>
  );
}
