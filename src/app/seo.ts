import type { Metadata } from "next";

export const SITE_URL = "https://accountplanningtools.com";
export const SITE_NAME = "Account Planning Tools";
export const OG_IMAGE = "/images/branding/og-image.png";

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
