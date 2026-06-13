# APT Image Requirements

This backlog keeps image production focused. Every image should explain the product, preview a real output, or help someone decide what to do next.

## Batch 1 — Highest priority
| Filename | Page/section | Purpose | Size/aspect | Notes |
|---|---|---|---|---|
| `public/images/apt/apt-homepage-hero-dashboard.webp` | Homepage hero | Show calculator inputs, result summary and export options. | 4:3 or 16:10 | Product-style mockup, not stock imagery. Replace `public/images/hero-commercial-dashboard.svg` when ready. |
| `public/images/apt/apt-pro-workflow-visual.webp` | Homepage Pro section / pricing support | Show saved scenarios, scenario comparison, account defaults and export options. | 4:3 or 16:10 | Keep compact. Replace `public/images/pricing-pro-workflow.svg` when ready. |
| `public/images/apt/apt-calculator-result-example.webp` | Calculator pages / result area | Show a clean example result summary. | 16:9 or 4:3 | Optional small support visual only. Do not place above inputs. |

## Batch 2 — Template previews
| Filename | Page/section | Purpose | Size/aspect | Notes |
|---|---|---|---|---|
| `public/images/apt/apt-template-jbp-preview.webp` | Presentation templates | Preview the Joint Business Plan deck. | 16:9 | Clean PowerPoint slide mockup. Current SVG preview remains useful until replaced. |
| `public/images/apt/apt-template-qbr-preview.webp` | Presentation templates | Preview the Quarterly Business Review deck. | 16:9 | Clean PowerPoint slide mockup. |
| `public/images/apt/apt-template-promo-proposal-preview.webp` | Presentation templates | Preview the Promotional Proposal deck. | 16:9 | Clean PowerPoint slide mockup. |
| `public/images/apt/apt-template-range-review-preview.webp` | Presentation templates | Preview the Range Review deck. | 16:9 | Clean PowerPoint slide mockup. |
| `public/images/apt/apt-template-product-launch-preview.webp` | Presentation templates | Preview the New Product Launch deck. | 16:9 | Clean PowerPoint slide mockup. |
| `public/images/apt/apt-template-annual-planning-preview.webp` | Presentation templates | Preview the Annual Planning deck. | 16:9 | Clean PowerPoint slide mockup. |
| `public/images/apt/apt-template-buyer-meeting-preview.webp` | Presentation templates | Preview the Buyer Meeting Prep deck. | 16:9 | Show objectives, talking points and action tracking. |
| `public/images/apt/apt-template-category-opportunity-preview.webp` | Presentation templates | Preview the Category Opportunity deck. | 16:9 | Show category performance, opportunity sizing and recommendation flow. |
| `public/images/apt/apt-template-account-plan-preview.webp` | Account planning / presentations | Preview an account plan output. | 16:9 | Use only where an account planning output page needs it. |

## Batch 3 — Helpful icons / small visuals
| Filename | Page/section | Purpose | Size/aspect | Notes |
|---|---|---|---|---|
| `public/images/apt/apt-icon-promo-roi.svg` | Calculator hub/cards | Promo ROI category icon. | Square | Simple APT line/icon style. |
| `public/images/apt/apt-icon-margin.svg` | Calculator hub/cards | Margin calculator category icon. | Square | Simple APT line/icon style. |
| `public/images/apt/apt-icon-support.svg` | Calculator hub/cards | SOA/support category icon. | Square | Simple APT line/icon style. |
| `public/images/apt/apt-icon-pricing-tax.svg` | Calculator hub/cards | Pricing/tax category icon. | Square | Simple APT line/icon style. |
| `public/images/apt/apt-icon-export.svg` | Pro/locked actions | Export feature icon. | Square | Use beside export actions only if it clarifies the action. |
| `public/images/apt/apt-icon-scenario-compare.svg` | Pro/locked actions | Scenario comparison icon. | Square | Use in compact Pro prompts or empty states. |
| `public/images/apt/apt-settings-defaults-flow.webp` | Settings page | Show defaults flowing into calculators and exports. | 16:9 | Optional. Keep small and secondary if added. |

## Removed placeholders
| Page | Placeholder removed | Reason |
|---|---|---|
| Homepage | Standalone hero visual section below the headline | Moved into the hero beside the copy so it supports the page without delaying the next action. |
| Pricing | Large `pricing-pro-workflow.svg` visual band | The comparison table and cards carry the buying decision more clearly. Removed to reduce decorative clutter. |
| About | Large `about-commercial-planning-workspace.svg` visual band | The page is stronger as founder/product copy; the image was generic and slowed the story down. |
| Tools hub | Large `tools-grid.svg` visual band | Repeated the hub concept without helping users choose ROI Tool, Calculators or Presentations. |
| Individual calculator pages | Calculator hero visual from shared `ToolPage` | Calculator inputs should appear sooner; result examples can be added later near outputs if useful. |
| Reusable image caption | Generic caption pill | Removed because it read like staging language. |

## Existing images to keep
| Filename/current reference | Page/section | Keep/replace later | Notes |
|---|---|---|---|
| `public/images/branding/logo-full.png` | Header/footer | Keep | Core APT logo asset. Do not replace for this audit. |
| `public/images/branding/*` | Icons, favicon, Open Graph | Keep | Required brand and metadata assets. |
| `public/images/hero-commercial-dashboard.svg` | Homepage hero | Replace later | Useful slot. Replace with `apt-homepage-hero-dashboard.webp`. |
| `public/images/pricing-pro-workflow.svg` | Homepage Pro section | Replace later | Useful slot when compact. Replace with `apt-pro-workflow-visual.webp`. |
| `public/images/commercial-deal-calculator.svg` | Calculators hub and ROI tool hero | Replace later | Useful for compact hero support only. Avoid using above individual calculator inputs. |
| `public/templates/*/preview.svg` | Presentation templates | Keep, replace later | These previews are useful and should stay until higher-fidelity 16:9 WebP previews are produced. |
| `public/images/about-commercial-planning-workspace.svg` | Unused after audit | Replace only if a specific founder/product story visual is needed. | Do not re-add as generic decorative imagery. |
| `public/images/tools-grid.svg` | Unused after audit | Replace only if a compact resources overview is needed. | Avoid broad dashboard filler. |

## Placement rules
- Calculator and ROI inputs should never be pushed down by a large image.
- Product mockups belong beside hero copy on desktop and should shrink or hide naturally on mobile.
- Template previews are functional content and should remain consistent in size and framing.
- Pricing should favor the comparison table, feature copy and calls to action over decorative imagery.
- Legal pages should use only the global header/footer brand assets.
