import type { Metadata } from "next";
import { SiteShell } from "./components/Shell";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://namtools.co.uk"),
  title: {
    default: "NAM Tools | Practical commercial tools for account managers",
    template: "%s | NAM Tools",
  },
  description:
    "No-login calculators, planning tools and templates for National Account Managers, Key Account Managers and commercial teams.",
  applicationName: "NAM Tools",
  authors: [{ name: "NAM Tools" }],
  creator: "NAM Tools",
  publisher: "NAM Tools",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/images/branding/favicon.ico", sizes: "any" },
      { url: "/images/branding/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/branding/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/images/branding/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "icon",
        url: "/images/branding/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "icon",
        url: "/images/branding/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://namtools.co.uk",
    siteName: "NAM Tools",
    title: "NAM Tools | Practical commercial tools for account managers",
    description:
      "No-login commercial calculators and planning tools for promotion reviews, trade spend, margin, account plans, JBPs and buyer meetings.",
    images: [
      {
        url: "/images/branding/og-image.png",
        width: 1200,
        height: 630,
        alt: "APT Account Planning Tools logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NAM Tools | Practical commercial tools for account managers",
    description:
      "No-login commercial calculators and planning tools for NAMs, KAMs and commercial teams.",
    images: [
      {
        url: "/images/branding/og-image.png",
        alt: "APT Account Planning Tools logo",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
