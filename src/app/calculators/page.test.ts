import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("calculators hub search targeting", () => {
  it("targets sales and retail calculator intent without creating duplicate hubs", () => {
    expect(source).toContain('title: "Sales & Retail Calculators"');
    expect(source).toContain('"sales calculators"');
    expect(source).toContain('"retail calculators"');
    expect(source).toContain('title="Sales and retail calculators for commercial planning"');
    expect(source).toContain("Which sales calculators are available?");
    expect(source).toContain("Which retail calculators are available?");
    expect(source).toContain('href="#promotion-tools"');
    expect(source).toContain('href="#pricing-tools"');
  });
});
