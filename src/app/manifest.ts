import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Account Planning Tools",
    short_name: "APT",
    description:
      "No-login commercial calculators, planning tools and templates for account managers.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#111922",
    icons: [
      {
        src: "/images/branding/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/images/branding/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/branding/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/images/branding/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
