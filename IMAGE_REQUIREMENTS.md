# APT Image Requirements

This backlog keeps image usage focused. Every image should explain the product, preview a real output, or help someone decide what to do next.

## Created and wired
| Filename | Page/section | Purpose |
|---|---|---|
| `apt-homepage-hero-dashboard.webp` | Homepage hero | Shows calculator inputs, results and export options. |
| `apt-pro-workflow-visual.webp` | Homepage Free vs Pro section | Shows saved scenarios, comparison and export workflow. |
| `apt-template-jbp-preview.webp` | `/presentation-templates` | Flat thumbnail for the Joint Business Plan template card. |
| `apt-template-qbr-preview.webp` | `/presentation-templates` | Flat thumbnail for the Quarterly Business Review template card. |
| `apt-template-promo-proposal-preview.webp` | `/presentation-templates` | Flat thumbnail for the Promotional Proposal template card. |
| `apt-roi-planner-clean-preview.webp` | `/calculators` hero | Supports the ROI tool entry point without appearing above live calculator inputs. |
| `apt-icon-promo-roi.svg` | Homepage, calculator hub and workspace cards | Promo ROI / ROI planner card icon. |
| `apt-icon-margin.svg` | Homepage, calculator hub and quick calculator cards | Margin and retail price calculator card icon. |
| `apt-icon-support.svg` | Homepage, calculator hub and quick calculator cards | SOA/support calculator card icon. |
| `apt-icon-export.svg` | Homepage and workspace cards | Presentation/export/deck card icon. |
| `apt-icon-scenario-compare.svg` | Homepage and workspace cards | ROI planner and saved scenario card icon. |
| `apt-workspace-dashboard-preview.webp` | `/workspace` Pro intro | Shows saved analyses, scenarios, decks and exports. |
| `apt-custom-deck-builder-preview.webp` | `/custom-deck` sidebar | Shows deck type, uploads and brief fields as a supporting visual. |

## Created but not wired
| Filename | Reason |
|---|---|
| `apt-settings-custom-defaults-preview.webp` | Replaced by the simpler Batch 3 settings visual. Keep for future help/onboarding content if needed. |
| `apt-workspace-pro-preview.webp` | Replaced by `apt-workspace-dashboard-preview.webp` so the workspace has one consistent visual. |
| `apt-workspace-free-preview.webp` | Free/signed-out workspace states are cleaner as text-led locked messages. |
| `apt-workspace-empty-state-preview.webp` | Workspace empty states are currently cleaner as compact text states. |
| `apt-workspace-empty-analyses-preview.webp` | Keep unused unless a future empty state needs a visual. |
| `apt-mobile-roi-planner-preview.webp` | Not wired because live ROI/calculator pages should prioritize the form. |
| `apt-mobile-roi-line-card-preview.webp` | Not wired because large mobile mockups should not sit above live calculator inputs. |
| `apt-presentation-templates-clean-preview.webp` | Not wired because `/presentation-templates` already has functional template cards and previews. |
| `apt-icon-set-reference.webp` | Reference image only. Do not wire directly. |
| `apt-settings-simplified-preview.webp` | Removed from the `/settings` top prompt so the calculator defaults form starts sooner. Keep for future help/onboarding use if needed. |

## Missing / still needed
| Filename | Page/section | Purpose |
|---|---|---|
| `apt-calculator-result-example.webp` | Calculator result areas | Optional small example output visual, only if it helps explain results without pushing inputs down. |
| `apt-template-range-review-preview.webp` | Presentation templates | Final Range Review deck preview. |
| `apt-template-product-launch-preview.webp` | Presentation templates | Final New Product Launch deck preview. |
| `apt-template-annual-planning-preview.webp` | Presentation templates | Final Annual Planning deck preview. |
| `apt-template-buyer-meeting-preview.webp` | Presentation templates | Final Buyer Meeting Prep deck preview. |
| `apt-template-category-opportunity-preview.webp` | Presentation templates | Final Category Opportunity deck preview. |

## Usage rules
- Large mockups should be used sparingly and never placed above calculator inputs.
- Large WebP mockups are for workflow explanation only. Do not make template cards image-led.
- Template preview images are restored as flat thumbnails because they add useful visual confidence on the presentation templates page. They should not be wrapped in nested cards or large preview frames.
- The separate presentation hero preview strip was removed because it duplicated the template cards and pushed useful actions down. Template images should only be used inside actual cards or optional previews.
- Settings visuals should not appear above the settings form; the top account prompt should stay compact and text-led.
- Icons can be used on tool cards and workspace cards where they improve scanability.
- Do not add placeholder images that only decorate the page.
- Do not wire reference images directly.
- Use one strong visual per section; avoid repeating similar dashboard mockups across adjacent sections.
- Use meaningful alt text for product/template visuals and empty alt text for decorative icons.
- Hide or shrink supportive mockups on mobile if they add scroll before the user reaches the task.
