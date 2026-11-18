import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";

describe("sitemap modification dates", () => {
  it("dates today's changed calculator hub without refreshing untouched routes", () => {
    const entries = sitemap();
    const calculators = entries.find((entry) => entry.url === "https://accountplanningtools.com/calculators");
    const about = entries.find((entry) => entry.url === "https://accountplanningtools.com/about");

    expect(calculators?.lastModified).toEqual(new Date("2026-11-18T00:00:00.000Z"));
    expect(about?.lastModified).toEqual(new Date("2026-08-12T00:00:00.000Z"));
  });
});
