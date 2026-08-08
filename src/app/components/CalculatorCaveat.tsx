"use client";

import type React from "react";
import { GENERAL_PLANNING_CAVEAT, STANDARD_PRICING_CAVEAT } from "../../lib/commercialCaveats";

type CalculatorCaveatProps = {
  children?: React.ReactNode;
  variant?: "pricing" | "planning";
};

export function CalculatorCaveat({ children, variant = "pricing" }: CalculatorCaveatProps) {
  const text = children ?? (variant === "pricing" ? STANDARD_PRICING_CAVEAT : GENERAL_PLANNING_CAVEAT);

  return (
    <p className={variant === "pricing" ? "calculator-caveat calculator-caveat-pricing" : "calculator-caveat"}>
      {text}
    </p>
  );
}
