This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Promo ROI Layout Note

The Promo ROI / ROI Tool planner uses a spreadsheet-style table on desktop and a stacked card layout on mobile. Both layouts read and write the same scenario and line-item data in `RoiToolClient`, so any future ROI fields should be added to both the desktop table and the mobile card editor to keep the experiences in sync.

## Internal Test Mode

The temporary Free / Pro test-mode switch is only for the authorised internal test account while billing-backed plan detection is being prepared.

Set `NEXT_PUBLIC_SHOW_PLAN_TOGGLE=true` and `APT_TEST_USER_EMAIL=<internal test email>` in the deployment environment to enable it for that account. If `APT_TEST_USER_EMAIL` is unset, the switch is hidden and the temporary Pro override is ignored for everyone.

## Analytics

Optional GA4 tracking is controlled by `NEXT_PUBLIC_GA_MEASUREMENT_ID`. Leave it unset to disable analytics locally or in any environment where tracking should not run. When it is set, GA4 still loads only after the visitor accepts analytics through the cookie consent control.

Tracked events are limited to public page views and core product events: calculator opened/completed, signup started/completed, login completed, logout completed and upgrade clicks. Events must not include email addresses, user IDs, SKU names, prices, margins, COGS, support values, scenario names or other commercial inputs/results.

Analytics is suppressed for the authorised internal test-mode account through the same `APT_TEST_USER_EMAIL` gate used by the Free / Pro QA toggle. Consent choices are stored in local browser storage under `apt-analytics-consent`.

## Mobile Navigation Note

Mobile navigation intentionally uses one compact Menu control instead of duplicating site navigation below the header. This avoids horizontal overflow on small screens while keeping the authorised internal test-mode switch available only when configured.

## Primary Navigation Note

Primary navigation is intentionally limited to ROI Tool, Calculators, Presentations and Pricing. Buyer meeting templates sit within Presentations rather than appearing as a separate top-level product area.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
