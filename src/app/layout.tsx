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
  },
  twitter: {
    card: "summary",
    title: "NAM Tools | Practical commercial tools for account managers",
    description:
      "No-login commercial calculators and planning tools for NAMs, KAMs and commercial teams.",
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
