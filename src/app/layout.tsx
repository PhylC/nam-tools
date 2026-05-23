import type { Metadata } from "next";
import { SiteShell } from "./components/Shell";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://accountplanningtools.co.uk"),
  title: {
    default: "Account Planning Tools | Practical commercial tools for account managers",
    template: "%s | Account Planning Tools",
  },
  description:
    "No-login calculators, planning tools and templates for National Account Managers, Key Account Managers and commercial teams.",
  applicationName: "Account Planning Tools",
  authors: [{ name: "Account Planning Tools" }],
  creator: "Account Planning Tools",
  publisher: "Account Planning Tools",
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
    url: "https://accountplanningtools.co.uk",
    siteName: "Account Planning Tools",
    title: "Account Planning Tools | Practical commercial tools for account managers",
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
    title: "Account Planning Tools | Practical commercial tools for account managers",
    description:
      "No-login commercial calculators and planning tools for account managers, KAMs and commercial teams.",
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
