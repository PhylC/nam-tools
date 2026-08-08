import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/templates",
        destination: "/presentation-templates",
        permanent: true,
      },
      {
        source: "/tools/quick-commercial-calculators",
        destination: "/calculators/quick-calculators",
        permanent: true,
      },
      {
        source: "/tools/commercial-deal-calculator",
        destination: "/roi-tool",
        permanent: true,
      },
      {
        source: "/tools/promo-roi-calculator",
        destination: "/tools/promotion-roi-calculator",
        permanent: true,
      },
      {
        source: "/calculators/soa-calculator",
        destination: "/calculators/required-soa-calculator",
        permanent: true,
      },
      {
        source: "/calculators/support-calculator",
        destination: "/calculators/required-soa-calculator",
        permanent: true,
      },
      {
        source: "/calculators/required-support-calculator",
        destination: "/calculators/required-soa-calculator",
        permanent: true,
      },
      {
        source: "/calculators/soa-support-calculator",
        destination: "/calculators/required-soa-calculator",
        permanent: true,
      },
      {
        source: "/calculators/sales-tax-calculator",
        destination: "/calculators/sales-tax-vat-iva-calculator",
        permanent: true,
      },
      {
        source: "/calculators/vat-calculator",
        destination: "/calculators/sales-tax-vat-iva-calculator",
        permanent: true,
      },
      {
        source: "/calculators/sales-tax-vat-iva-retail-price-converter",
        destination: "/calculators/sales-tax-vat-iva-calculator",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
