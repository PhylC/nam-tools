import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";

describe("sitemap modification dates", () => {
  it("dates today's changed calculator hub without refreshing untouched routes", () => {
    const entries = sitemap();
    const calculators = entries.find((entry) => entry.url === "https://accountplanningtools.com/calculators");
    const about = entries.find((entry) => entry.url === "https://accountplanningtools.com/about");
    const roas = entries.filter((entry) => entry.url === "https://accountplanningtools.com/calculators/retail-media-roas-calculator");

    expect(calculators?.lastModified).toEqual(new Date("2026-11-22T00:00:00.000Z"));
    expect(roas).toHaveLength(1);
    expect(roas[0].lastModified).toEqual(calculators?.lastModified);
    expect(about?.lastModified).toEqual(new Date("2026-11-21T00:00:00.000Z"));
  });
});
