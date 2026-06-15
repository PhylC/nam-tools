import type { MetadataRoute } from "next";
import { quickCalculators } from "./data/quickCalculators";

const baseUrl = "https://accountplanningtools.co.uk";

const routes = [
  "",
  "/calculators",
  "/calculators/quick-calculators",
  "/roi-tool",
  "/presentation-templates",
  "/tools",
  "/tools/quick-commercial-calculators",
  "/tools/commercial-deal-calculator",
  "/tools/promotion-roi-calculator",
  "/tools/trade-spend-calculator",
  "/tools/gross-margin-calculator",
  "/tools/buyer-meeting-prep",
  "/tools/joint-business-plan-builder",
  "/tools/account-plan-generator",
  "/tools/terms-investment-calculator",
  "/tools/customer-review-template",
  "/templates",
  "/settings",
  "/account",
  "/login",
  "/create-account",
  "/forgot-password",
  "/update-password",
  "/pricing",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/cookie-policy",
  "/disclaimer",
  "/copyright",
  "/refund-policy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const calculatorRoutes = quickCalculators.map((calculator) => `/calculators/${calculator.slug}`);

  return [...routes, ...calculatorRoutes].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route.startsWith("/tools") || route.startsWith("/calculators") || route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route.startsWith("/calculators") || route.startsWith("/tools") ? 0.9 : 0.7,
  }));
}
