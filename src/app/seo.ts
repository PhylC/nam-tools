import type { Metadata } from "next";

export const SITE_URL = "https://accountplanningtools.com";
export const SITE_NAME = "Account Planning Tools";
export const OG_IMAGE = "/images/branding/og-image.png";
export const SITE_LAST_MODIFIED = "2026-08-12T00:00:00.000Z";

export type FaqItem = {
  question: string;
  answer: string;
};

type BreadcrumbItem = {
  name: string;
  path: string;
};

type SeoMetadataInput = {
  title: string;
  absoluteTitle?: string;
  description: string;
  path: string;
};

export function seoMetadata({ title, absoluteTitle, description, path }: SeoMetadataInput): Metadata {
  const socialTitle = absoluteTitle ?? `${title} | ${SITE_NAME}`;

  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      locale: "en_GB",
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      url: path,
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
      title: socialTitle,
      description,
      images: [
        {
          url: OG_IMAGE,
          alt: "Account Planning Tools social preview",
        },
      ],
    },
  };
}

export function privateMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export function absoluteUrl(path: string) {
  if (path === "/") return SITE_URL;
  return `${SITE_URL}${path}`;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function webApplicationJsonLd() {
  return {
    "@type": "WebApplication",
    "@id": `${SITE_URL}/#webapp`,
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript. Works in modern web browsers.",
    description:
      "Commercial planning calculators and account planning tools for sales teams, account managers and retail supplier teams.",
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/pricing`,
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
    },
  };
}
