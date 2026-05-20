import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PptxGenJS from "pptxgenjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const outDir = path.join(__dirname, "..", "public", "templates");
const logoPath = path.join(__dirname, "..", "public", "images", "branding", "logo-full.png");

const palette = {
  ink: "20302D",
  muted: "5D6D68",
  teal: "2E7D73",
  mint: "EAF6F3",
  cream: "FFF8E8",
  amber: "D8942A",
  border: "D8E2DF",
  danger: "B64A3B",
  white: "FFFFFF",
};

const decks = [
  {
    file: "joint-business-plan-template.pptx",
    type: "Joint Business Plan",
    title: "2026 Joint Business Plan",
    customer: "Northstar Retail",
    brand: "Orchard & Co",
    kpis: ["+9.4% net sales", "+£1.8m RSV", "4 growth pillars"],
    slides: [
      "Executive summary",
      "Customer objectives",
      "Business performance overview",
      "Category trends",
      "Growth pillars",
      "Innovation pipeline",
      "Promotional strategy",
      "Financial targets",
      "Risks and opportunities",
      "Next steps and action plan",
    ],
  },
  {
    file: "quarterly-business-review-template.pptx",
    type: "Quarterly Business Review",
    title: "Q3 Quarterly Business Review",
    customer: "Bridgeway Grocers",
    brand: "Harbour Kitchen",
    kpis: ["+6.8% RSV", "+3.2pts distribution", "£420k promo RSV"],
    slides: [
      "Quarter summary",
      "KPI scorecard",
      "Sales performance",
      "Promo performance",
      "Distribution and range updates",
      "Wins and challenges",
      "Competitor activity",
      "Next quarter priorities",
      "Commercial asks",
    ],
  },
  {
    file: "promotional-proposal-template.pptx",
    type: "Promotional Proposal",
    title: "Spring Multibuy Promotional Proposal",
    customer: "Westfield Stores",
    brand: "Vale Snacks",
    kpis: ["+42% unit uplift", "£186k incremental RSV", "2.7x revenue ROI"],
    slides: [
      "Proposal summary",
      "Promotional mechanic",
      "Commercial rationale",
      "Forecast uplift",
      "ROI assumptions",
      "Retailer benefit",
      "Support requested",
      "Recommendation",
    ],
  },
  {
    file: "range-review-template.pptx",
    type: "Range Review",
    title: "Core Range Review",
    customer: "Market Lane",
    brand: "Cedar Pantry",
    kpis: ["+11% ROS gap", "6 priority SKUs", "£920k space upside"],
    slides: [
      "Current range overview",
      "SKU productivity",
      "Distribution gaps",
      "Rate of sale analysis",
      "Category trends",
      "Rationalisation opportunities",
      "Innovation recommendations",
      "Recommended actions",
    ],
  },
  {
    file: "new-product-launch-template.pptx",
    type: "New Product Launch",
    title: "New Product Launch Sell-In",
    customer: "Northbank Pharmacy",
    brand: "Luma Health",
    kpis: ["£1.2m year-one RSV", "58% purchase intent", "18-week launch plan"],
    slides: [
      "Launch overview",
      "Consumer insight",
      "Market opportunity",
      "Product proposition",
      "Forecast",
      "Activation plan",
      "Launch timeline",
      "Commercial ask",
    ],
  },
  {
    file: "annual-planning-template.pptx",
    type: "Annual Planning",
    title: "FY27 Annual Account Plan",
    customer: "Eastmere Retail Group",
    brand: "Foundry Foods",
    kpis: ["+8.0% FY target", "£2.4m investment", "4 quarterly sprints"],
    slides: [
      "FY review",
      "Strategic objectives",
      "Annual targets",
      "Investment priorities",
      "Quarterly roadmap",
      "Risk areas",
    ],
  },
  {
    file: "buyer-meeting-prep-template.pptx",
    type: "Buyer Meeting Prep",
    title: "Buyer Meeting Prep",
    customer: "Greenbridge Convenience",
    brand: "Pioneer Drinks",
    kpis: ["1 decision needed", "3 proof points", "2 fallback options"],
    slides: [
      "Meeting objective",
      "Buyer priorities",
      "Key talking points",
      "Objection handling",
      "Supporting data",
      "Desired outcome",
      "Follow-up actions",
    ],
  },
  {
    file: "category-opportunity-deck-template.pptx",
    type: "Category Opportunity Deck",
    title: "Category Opportunity Deck",
    customer: "Crownfield Superstores",
    brand: "Meridian Home",
    kpis: ["+5.6% category growth", "£3.1m white space", "9 target stores"],
    slides: [
      "Category performance",
      "Shopper trends",
      "White space opportunities",
      "Competitor benchmarking",
      "Opportunity sizing",
      "Recommendations",
    ],
  },
];

function addBrand(slide, pptx, deck, section) {
  slide.background = { color: palette.white };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.12, fill: { color: palette.teal }, line: { color: palette.teal } });
  if (fs.existsSync(logoPath)) {
    slide.addImage({ path: logoPath, x: 0.45, y: 0.28, w: 1.25, h: 0.38 });
  } else {
    slide.addText("APT", { x: 0.45, y: 0.25, w: 1, h: 0.3, fontFace: "Aptos Display", fontSize: 18, bold: true, color: palette.teal });
  }
  slide.addText(section, { x: 9.3, y: 0.28, w: 3.45, h: 0.28, align: "right", fontFace: "Aptos", fontSize: 8.5, bold: true, color: palette.muted });
  slide.addText(`${deck.brand} x ${deck.customer}`, { x: 0.45, y: 7.08, w: 6, h: 0.22, fontFace: "Aptos", fontSize: 7.5, color: palette.muted });
  slide.addText("Fictional editable example data", { x: 9.6, y: 7.08, w: 3.25, h: 0.22, align: "right", fontFace: "Aptos", fontSize: 7.5, color: palette.muted });
}

function addTitle(slide, text, subtitle) {
  slide.addText(text, {
    x: 0.55,
    y: 0.88,
    w: 7.6,
    h: 0.58,
    fontFace: "Aptos Display",
    fontSize: 26,
    bold: true,
    color: palette.ink,
    margin: 0,
  });
  slide.addText(subtitle, {
    x: 0.58,
    y: 1.5,
    w: 7.9,
    h: 0.36,
    fontFace: "Aptos",
    fontSize: 11,
    color: palette.muted,
    breakLine: false,
  });
}

function addKpis(slide, pptx, deck) {
  deck.kpis.forEach((kpi, index) => {
    const x = 0.6 + index * 2.15;
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 5.6,
      w: 1.95,
      h: 0.78,
      rectRadius: 0.06,
      fill: { color: index === 1 ? palette.cream : palette.mint },
      line: { color: index === 1 ? "E8DAB6" : "CDE4DF" },
    });
    const [value, ...label] = kpi.split(" ");
    slide.addText(value, { x: x + 0.14, y: 5.75, w: 0.72, h: 0.25, fontFace: "Aptos Display", fontSize: 15, bold: true, color: index === 1 ? palette.amber : palette.teal });
    slide.addText(label.join(" "), { x: x + 0.14, y: 6.04, w: 1.55, h: 0.18, fontFace: "Aptos", fontSize: 7.5, bold: true, color: palette.muted });
  });
}

function addCover(pptx, deck) {
  const slide = pptx.addSlide();
  addBrand(slide, pptx, deck, deck.type);
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0.12, w: 13.333, h: 7.38, fill: { color: "F7FAF9", transparency: 0 }, line: { color: "F7FAF9" } });
  if (fs.existsSync(logoPath)) slide.addImage({ path: logoPath, x: 0.62, y: 0.58, w: 1.48, h: 0.45 });
  slide.addText(deck.type, { x: 0.65, y: 1.35, w: 4.6, h: 0.26, fontFace: "Aptos", fontSize: 10, bold: true, color: palette.teal });
  slide.addText(deck.title, { x: 0.62, y: 1.78, w: 6.35, h: 1.14, fontFace: "Aptos Display", fontSize: 33, bold: true, color: palette.ink, breakLine: false, fit: "shrink" });
  slide.addText(`${deck.customer}\nPrepared with editable fictional data for NAM and commercial planning.`, { x: 0.66, y: 3.08, w: 5.8, h: 0.72, fontFace: "Aptos", fontSize: 13, color: palette.muted, breakLine: false });
  slide.addShape(pptx.ShapeType.rect, { x: 8.2, y: 1.1, w: 3.95, h: 4.55, fill: { color: palette.white }, line: { color: palette.border } });
  slide.addText("Editable deck starter", { x: 8.55, y: 1.42, w: 3.3, h: 0.35, fontFace: "Aptos Display", fontSize: 19, bold: true, color: palette.ink });
  slide.addText("Use these slides as a practical customer-facing first draft. Replace the example data, narrative and actions with your own account plan.", { x: 8.55, y: 1.95, w: 3.1, h: 1.2, fontFace: "Aptos", fontSize: 12, color: palette.muted, breakLine: false, valign: "mid" });
  addKpis(slide, pptx, deck);
}

function addScorecard(slide, pptx, deck, seed) {
  const rows = [
    [{ text: "Metric", options: { bold: true } }, { text: "Current", options: { bold: true } }, { text: "Target", options: { bold: true } }, { text: "Status", options: { bold: true } }],
    ["Net sales", `£${(4.1 + seed / 10).toFixed(1)}m`, `£${(4.6 + seed / 9).toFixed(1)}m`, "Ahead"],
    ["Units", `${(2.8 + seed / 20).toFixed(1)}m`, `${(3.1 + seed / 18).toFixed(1)}m`, "On track"],
    ["Gross margin", `${(31.5 + seed / 5).toFixed(1)}%`, `${(33.0 + seed / 4).toFixed(1)}%`, "Watch"],
    ["Distribution", `${74 + seed}%`, `${82 + seed}%`, "Opportunity"],
  ];
  slide.addTable(rows, {
    x: 0.65,
    y: 2.14,
    w: 5.6,
    h: 2.55,
    border: { type: "solid", color: palette.border, pt: 0.7 },
    fill: { color: palette.white },
    color: palette.ink,
    fontFace: "Aptos",
    fontSize: 9.3,
    margin: 0.08,
    valign: "mid",
  });
  slide.addShape(pptx.ShapeType.rect, { x: 6.65, y: 2.14, w: 5.8, h: 2.55, fill: { color: "F8FBFA" }, line: { color: palette.border } });
  slide.addText("Editable chart placeholder", { x: 6.95, y: 2.42, w: 2.8, h: 0.28, fontFace: "Aptos", fontSize: 10, bold: true, color: palette.teal });
  [2.95, 3.35, 3.75, 4.15].forEach((y, index) => {
    slide.addShape(pptx.ShapeType.rect, { x: 7.0, y, w: 1.1 + index * 0.75 + seed / 12, h: 0.18, fill: { color: index % 2 ? palette.amber : palette.teal }, line: { color: index % 2 ? palette.amber : palette.teal } });
    slide.addText(["Q1", "Q2", "Q3", "Q4"][index], { x: 10.75, y: y - 0.04, w: 0.4, h: 0.18, fontFace: "Aptos", fontSize: 7.5, color: palette.muted });
  });
}

function addSlideContent(pptx, deck, slideTitle, index) {
  const slide = pptx.addSlide();
  addBrand(slide, pptx, deck, deck.type);
  addTitle(slide, slideTitle, `${deck.customer} example view using editable commercial data and assumptions.`);

  const leftText = [
    `Headline: ${deck.brand} has a credible growth story for ${deck.customer}, with practical actions buyers can assess quickly.`,
    `Evidence: example sales, units, distribution and support assumptions are included for editing.`,
    `Decision: agree the priority action, owner and next step for this workstream.`,
  ];
  slide.addText(leftText.map((line) => ({ text: line, options: { breakLine: true, bullet: { type: "ul" } } })), {
    x: 0.72,
    y: 2.05,
    w: 4.85,
    h: 1.25,
    fontFace: "Aptos",
    fontSize: 10.5,
    color: palette.ink,
    breakLine: false,
    fit: "shrink",
  });

  addScorecard(slide, pptx, deck, index + 1);

  slide.addShape(pptx.ShapeType.roundRect, { x: 0.65, y: 5.1, w: 11.8, h: 1.25, rectRadius: 0.04, fill: { color: index % 2 ? palette.cream : palette.mint }, line: { color: index % 2 ? "E8DAB6" : "CDE4DF" } });
  slide.addText("Narrative prompt", { x: 0.95, y: 5.32, w: 1.8, h: 0.22, fontFace: "Aptos", fontSize: 9, bold: true, color: index % 2 ? palette.amber : palette.teal });
  slide.addText(`Edit this box with the customer-specific implication for ${slideTitle.toLowerCase()}. Keep it commercial, concise and linked to the buyer decision.`, {
    x: 0.95,
    y: 5.7,
    w: 10.7,
    h: 0.28,
    fontFace: "Aptos",
    fontSize: 11,
    color: palette.ink,
  });
}

async function generateDeck(deck) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "APT Account Planning Tools";
  pptx.company = "APT";
  pptx.subject = `${deck.type} editable template`;
  pptx.title = deck.title;
  pptx.lang = "en-GB";
  pptx.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos",
    lang: "en-GB",
  };
  pptx.defineLayout({ name: "LAYOUT_WIDE", width: 13.333, height: 7.5 });

  addCover(pptx, deck);
  deck.slides.forEach((slideTitle, index) => addSlideContent(pptx, deck, slideTitle, index));

  await pptx.writeFile({ fileName: path.join(outDir, deck.file) });
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  for (const deck of decks) {
    await generateDeck(deck);
    console.log(`Generated ${deck.file}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
