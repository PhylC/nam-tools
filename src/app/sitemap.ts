import type { MetadataRoute } from "next";
import { quickCalculators } from "./data/quickCalculators";
import { SITE_URL } from "./seo";

const routes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/calculators", priority: 0.95, changeFrequency: "weekly" },
  { path: "/calculators/quick-calculators", priority: 0.9, changeFrequency: "weekly" },
  { path: "/roi-tool", priority: 0.95, changeFrequency: "weekly" },
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

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const calculatorRoutes = quickCalculators.map((calculator) => ({
    path: `/calculators/${calculator.slug}`,
    priority: 0.9,
    changeFrequency: "weekly" as const,
  }));

  return [...routes, ...calculatorRoutes].map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
