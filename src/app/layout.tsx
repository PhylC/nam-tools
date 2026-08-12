import type { Metadata, Viewport } from "next";
import { JsonLd } from "./components/JsonLd";
import { SiteShell } from "./components/Shell";
import { OG_IMAGE, SITE_NAME, SITE_URL, webApplicationJsonLd } from "./seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Account Planning Tools | Commercial Planning Calculators for Sales & Account Teams",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Run promo ROI, retailer margin, invoice price and SOA support calculators, then create clearer account plans and buyer-ready commercial summaries.",
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
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
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Account Planning Tools | Commercial Planning Calculators for Sales & Account Teams",
    description:
      "Run promo ROI, margin, invoice price and support checks with clearer outputs for retailer meetings, internal reviews and account planning.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Account Planning Tools social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Account Planning Tools | Commercial Planning Calculators for Sales & Account Teams",
    description:
      "Commercial planning tools for account managers, sales leads and commercial teams.",
    images: [
      {
        url: OG_IMAGE,
        alt: "Account Planning Tools social preview",
      },
    ],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/images/branding/logo-full.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
      description:
        "Commercial planning calculators and tools for account managers, sales teams and retail supplier teams.",
    },
    webApplicationJsonLd(),
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body>
        <JsonLd data={structuredData} />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
