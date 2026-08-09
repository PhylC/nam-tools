import type { MetadataRoute } from "next";
import { SITE_URL } from "./seo";

const publicRoutes = [
  "/",
  "/calculators",
  "/calculators/",
  "/roi-tool",
  "/pricing",
  "/tools",
  "/tools/",
  "/presentation-templates",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/cookie-policy",
  "/disclaimer",
  "/copyright",
  "/refund-policy",
];

const privateRoutes = [
  "/api/",
  "/account",
  "/workspace",
  "/settings",
  "/login",
  "/create-account",
  "/forgot-password",
  "/update-password",
  "/custom-deck",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: publicRoutes,
        disallow: privateRoutes,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
