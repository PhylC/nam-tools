import type { MetadataRoute } from "next";
import { quickCalculators } from "./data/quickCalculators";
import { SITE_LAST_MODIFIED, SITE_URL } from "./seo";

const routes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/calculators", priority: 0.95, changeFrequency: "weekly" },
  { path: "/calculators/quick-calculators", priority: 0.9, changeFrequency: "weekly" },
  { path: "/roi-tool", priority: 0.95, changeFrequency: "weekly" },
  { path: "/international-account-planning-tools", priority: 0.9, changeFrequency: "monthly" },
  { path: "/presentation-templates", priority: 0.85, changeFrequency: "monthly" },
  { path: "/tools", priority: 0.85, changeFrequency: "weekly" },
  { path: "/tools/promotion-roi-calculator", priority: 0.85, changeFrequency: "weekly" },
  { path: "/tools/trade-spend-calculator", priority: 0.8, changeFrequency: "weekly" },
  { path: "/tools/gross-margin-calculator", priority: 0.8, changeFrequency: "weekly" },
  { path: "/tools/buyer-meeting-prep", priority: 0.75, changeFrequency: "monthly" },
  { path: "/tools/joint-business-plan-builder", priority: 0.75, changeFrequency: "monthly" },
  { path: "/tools/account-plan-generator", priority: 0.75, changeFrequency: "monthly" },
  { path: "/tools/terms-investment-calculator", priority: 0.8, changeFrequency: "weekly" },
  { path: "/tools/customer-review-template", priority: 0.7, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.85, changeFrequency: "monthly" },
  { path: "/about", priority: 0.55, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.55, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.35, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.35, changeFrequency: "yearly" },
  { path: "/cookie-policy", priority: 0.25, changeFrequency: "yearly" },
  { path: "/disclaimer", priority: 0.35, changeFrequency: "yearly" },
  { path: "/copyright", priority: 0.25, changeFrequency: "yearly" },
  { path: "/refund-policy", priority: 0.25, changeFrequency: "yearly" },
];

const routeLastModified: Record<string, string> = {
  "/tools/trade-spend-calculator": "2026-11-21T00:00:00.000Z",
  "/tools/joint-business-plan-builder": "2026-11-21T00:00:00.000Z",
  "/tools/account-plan-generator": "2026-11-21T00:00:00.000Z",
  "/presentation-templates": "2026-11-21T00:00:00.000Z",
  "/calculators/soa-support-percent-calculator": "2026-11-21T00:00:00.000Z",
  "/calculators": "2026-11-21T00:00:00.000Z",
  "/calculators/retail-selling-price-calculator": "2026-11-21T00:00:00.000Z",
  "/calculators/actual-retailer-margin-calculator": "2026-11-21T00:00:00.000Z",
  "/roi-tool": "2026-11-21T00:00:00.000Z",
  "/calculators/markup-vs-margin-calculator": "2026-11-21T00:00:00.000Z",
  "/calculators/invoice-price-calculator": "2026-11-21T00:00:00.000Z",
  "/calculators/promo-invoice-calculator": "2026-11-21T00:00:00.000Z",
  "/tools/promotion-roi-calculator": "2026-11-21T00:00:00.000Z",
  "/tools/buyer-meeting-prep": "2026-11-21T00:00:00.000Z",
  "/calculators/required-soa-calculator": "2026-11-20T00:00:00.000Z",
};

export default function sitemap(): MetadataRoute.Sitemap {
  const calculatorRoutes = quickCalculators.map((calculator) => ({
    path: `/calculators/${calculator.slug}`,
    priority: 0.9,
    changeFrequency: "weekly" as const,
  }));

  return [...routes, ...calculatorRoutes].map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(routeLastModified[route.path] ?? SITE_LAST_MODIFIED),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
