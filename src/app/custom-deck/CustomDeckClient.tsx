"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import type PptxGenJS from "pptxgenjs";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";
import { buildUpgradeHref, useProAction } from "../components/ProActionGuard";
import { loadAccountSettings, SavedPresentationTemplate } from "../../lib/proSettings";
import { saveDeckBrief } from "../../lib/saveStore";
import { downloadDeckTemplate, uploadGeneratedDeck } from "../../lib/storageUploads";

const DECK_TEMPLATE_MAX_FILE_BYTES = 20 * 1024 * 1024;
const SUPPORTING_FILE_MAX_BYTES = 10 * 1024 * 1024;
const MAX_SUPPORTING_FILES = 5;
const deckTemplateExtensions = [".pptx", ".potx"];
const supportingFileExtensions = [".xlsx", ".csv", ".pdf", ".docx", ".txt", ".pptx", ".key", ".numbers", ".pages"];

const deckTypes = [
  { label: "Joint Business Plan", value: "jbp" },
  { label: "Quarterly Business Review", value: "qbr" },
  { label: "Promotional Proposal", value: "promo-proposal" },
  { label: "Range Review", value: "range-review" },
  { label: "New Product Launch", value: "product-launch" },
  { label: "Annual Planning", value: "annual-planning" },
  { label: "Buyer Meeting Planner", value: "buyer-meeting" },
  { label: "Category Opportunity", value: "category-opportunity" },
];

const toneOptions = [
  { label: "Concise and commercial", value: "concise_commercial" },
  { label: "Detailed and analytical", value: "detailed_analytical" },
  { label: "Executive and polished", value: "executive_polished" },
];
const exportFormatOptions = [
  { label: "PowerPoint (.pptx)", value: "pptx" },
  { label: "Google Slides compatible", value: "google_slides_compatible" },
  { label: "Keynote compatible", value: "keynote_compatible" },
];
type TemplateSource = "saved" | "one_off" | "apt_default";
type ExportFormat = "pptx" | "google_slides_compatible" | "keynote_compatible";
type FileMeta = {
  name: string;
  size: number;
  type: string;
  extension: string;
};
type GeneratedDeckResult = {
  file: File;
  filename: string;
  outline: string[];
  templateDesignApplied: boolean;
};
type TemplateDesign = {
  sourceName: string;
  backgroundColor: string;
  panelFillColor: string;
  accentColor: string;
  secondaryColor: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  headFontFace: string;
  bodyFontFace: string;
};
type DeckSlideContent = {
  title: string;
  lines: string[];
};
type ReusableSavedTemplate = SavedPresentationTemplate & {
  storagePathOrUrl: string;
};

function normaliseTemplate(value: string) {
  const aliases: Record<string, string> = {
    "joint-business-plan": "jbp",
    "qbr-template": "qbr",
    "promotional-proposal": "promo-proposal",
    "promo-proposal": "promo-proposal",
  };
  return aliases[value] ?? value;
}

function fileExtension(filename: string) {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : "";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function toFileMeta(file: File): FileMeta {
  return {
    name: file.name,
    size: file.size,
    type: file.type || "unknown",
    extension: fileExtension(file.name),
  };
}

function isPowerPointTemplateFile(file: File) {
  return [".pptx", ".potx"].includes(fileExtension(file.name));
}

function isReusableSavedTemplate(template: SavedPresentationTemplate): template is ReusableSavedTemplate {
  return Boolean(template.storagePathOrUrl && [".pptx", ".potx"].includes(fileExtension(template.filename)));
}

function isGoogleSlidesUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.hostname.includes("docs.google.com") && url.pathname.includes("/presentation/");
  } catch {
    return false;
  }
}

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "custom-deck";
}

function briefSentences(value: string) {
  return value
    .split(/[\n.]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function deckOutline(deckLabel: string, brief: string, includeFinancialSummary: boolean, includeNextStepsSlide: boolean) {
  const briefPoints = briefSentences(brief);
  return [
    `${deckLabel} overview`,
    "Meeting objective and context",
    ...(briefPoints.length ? ["Key brief points"] : ["Commercial priorities"]),
    "Recommended story",
    ...(includeFinancialSummary ? ["Financial summary"] : []),
    "Risks and watchouts",
    ...(includeNextStepsSlide ? ["Next steps"] : []),
  ];
}

function buildDeckContent({
  deckLabel,
  brief,
  includeFinancialSummary,
  includeNextStepsSlide,
  supportingFiles,
}: {
  deckLabel: string;
  brief: string;
  includeFinancialSummary: boolean;
  includeNextStepsSlide: boolean;
  supportingFiles: File[];
}) {
  const outline = deckOutline(deckLabel, brief, includeFinancialSummary, includeNextStepsSlide);
  const briefPoints = briefSentences(brief);
  const sourceSummary = supportingFiles.length
    ? supportingFiles.map((file) => `${file.name} (${formatFileSize(file.size)})`)
    : ["No supporting files attached to this draft."];
  const contents: DeckSlideContent[] = [
    { title: deckLabel, lines: brief ? [brief] : ["Generated from your custom deck brief. Add more detail to sharpen the next version."] },
    { title: "Draft story flow", lines: outline.map((item, index) => `${index + 1}. ${item}`) },
    { title: "Brief and assumptions", lines: briefPoints.length ? briefPoints : ["Add the customer context, commercial objective and core ask.", "Attach sales data or prior decks to improve the next draft."] },
    { title: "Supporting data used", lines: sourceSummary },
    {
      title: "Recommended story",
      lines: [
        "Lead with the customer opportunity and the decision needed.",
        "Connect the commercial ask to the retailer or customer benefit.",
        "Use the attached data to prove the size of prize, risk and payback.",
      ],
    },
    ...(includeFinancialSummary
      ? [
          {
            title: "Financial summary",
            lines: [
              "Add revenue, margin, support and ROI outputs from the relevant APT calculator.",
              "Separate confirmed facts from assumptions.",
              "Show the decision threshold or negotiation guardrail clearly.",
            ],
          },
        ]
      : []),
    {
      title: "Risks and watchouts",
      lines: [
        "Call out data gaps, approval dependencies and commercial assumptions.",
        "Highlight where retailer/customer policy may affect final pricing or support treatment.",
        "Use this draft as a working structure before customer-facing use.",
      ],
    },
    ...(includeNextStepsSlide
      ? [
          {
            title: "Next steps",
            lines: [
              "Confirm data sources and final commercial assumptions.",
              "Replace placeholder bullets with account-specific evidence.",
              "Agree the recommended ask, owner and timing.",
            ],
          },
        ]
      : []),
  ];
  return { outline, contents };
}

const defaultTemplateDesign: TemplateDesign = {
  sourceName: "APT default",
  backgroundColor: "F7FAF9",
  panelFillColor: "FFFFFF",
  accentColor: "0F766E",
  secondaryColor: "AAC6C2",
  textColor: "16202A",
  mutedTextColor: "4B5966",
  borderColor: "CFE1DE",
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
};

function normaliseHex(value: string | undefined, fallback: string) {
  const cleaned = value?.replace(/[^a-fA-F0-9]/g, "").slice(0, 6).toUpperCase();
  return cleaned && cleaned.length === 6 ? cleaned : fallback;
}

function colorLuminance(hex: string) {
  const value = normaliseHex(hex, "FFFFFF");
  const [red, green, blue] = [0, 2, 4].map((start) => parseInt(value.slice(start, start + 2), 16) / 255);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function readableTextColor(background: string) {
  return colorLuminance(background) > 0.62 ? "16202A" : "FFFFFF";
}

function extractSchemeColor(xml: string, name: string, fallback: string) {
  const block = new RegExp(`<a:${name}[^>]*>([\\s\\S]*?)<\\/a:${name}>`).exec(xml)?.[1] ?? "";
  return normaliseHex(/<a:srgbClr[^>]+val="([^"]+)"/.exec(block)?.[1] ?? /<a:sysClr[^>]+lastClr="([^"]+)"/.exec(block)?.[1], fallback);
}

function extractTypeface(xml: string, fontGroup: "majorFont" | "minorFont", fallback: string) {
  const block = new RegExp(`<a:${fontGroup}[^>]*>([\\s\\S]*?)<\\/a:${fontGroup}>`).exec(xml)?.[1] ?? "";
  return /<a:latin[^>]+typeface="([^"]+)"/.exec(block)?.[1] || fallback;
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function emu(inches: number) {
  return Math.round(inches * 914400);
}

function maxShapeId(slideXml: string) {
  const ids = [...slideXml.matchAll(/<p:cNvPr[^>]+id="(\d+)"/g)].map((match) => Number(match[1])).filter(Number.isFinite);
  return ids.length ? Math.max(...ids) : 1000;
}

function maxSlideId(presentationXml: string) {
  const ids = [...presentationXml.matchAll(/<p:sldId[^>]+id="(\d+)"/g)].map((match) => Number(match[1])).filter(Number.isFinite);
  return ids.length ? Math.max(...ids) : 255;
}

function maxRelationshipId(relsXml: string) {
  const ids = [...relsXml.matchAll(/\bId="rId(\d+)"/g)].map((match) => Number(match[1])).filter(Number.isFinite);
  return ids.length ? Math.max(...ids) : 0;
}

function textParagraph(text: string, fontFace: string, color: string, size: number, bold = false) {
  return `<a:p><a:r><a:rPr lang="en-US" sz="${size}"${bold ? ' b="1"' : ""}><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:latin typeface="${xmlEscape(fontFace)}"/></a:rPr><a:t>${xmlEscape(text)}</a:t></a:r><a:endParaRPr lang="en-US" sz="${size}"/></a:p>`;
}

function templateTextBodyXml(paragraphs: string[], design: TemplateDesign, options?: { title?: boolean; combined?: boolean }) {
  const text = paragraphs
    .filter(Boolean)
    .map((paragraph, index) => {
      const isTitle = Boolean(options?.title || (options?.combined && index === 0));
      const bodyText = isTitle || options?.combined ? paragraph : `- ${paragraph}`;
      return textParagraph(
        bodyText,
        isTitle ? design.headFontFace : design.bodyFontFace,
        isTitle ? design.textColor : design.mutedTextColor,
        isTitle ? 2600 : 1550,
        isTitle || index === 0,
      );
    })
    .join("");

  return `<p:txBody><a:bodyPr wrap="square" rtlCol="0"><a:spAutoFit/></a:bodyPr><a:lstStyle/>${text}</p:txBody>`;
}

function templateTextBoxXml(id: number, name: string, x: number, y: number, w: number, h: number, paragraphs: string[], design: TemplateDesign, options?: { title?: boolean }) {
  return `
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id="${id}" name="${xmlEscape(name)}"/>
        <p:cNvSpPr txBox="1"/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:noFill/>
        <a:ln><a:noFill/></a:ln>
      </p:spPr>
      ${templateTextBodyXml(paragraphs, design, options)}
    </p:sp>`;
}

function replaceTemplateTextPlaceholders(slideXml: string, content: DeckSlideContent, design: TemplateDesign) {
  const shapeRegex = /<p:sp\b[\s\S]*?<\/p:sp>/g;
  const textShapes = [...slideXml.matchAll(shapeRegex)].filter((match) => match[0].includes("<p:txBody"));
  if (!textShapes.length) return { xml: slideXml, replacementCount: 0 };

  const replacementBodies =
    textShapes.length === 1
      ? [templateTextBodyXml([content.title, ...content.lines.slice(0, 9)], design, { combined: true })]
      : [
          templateTextBodyXml([content.title], design, { title: true }),
          templateTextBodyXml(content.lines.slice(0, 9), design),
          ...textShapes.slice(2).map(() => templateTextBodyXml([], design)),
        ];
  let replacementIndex = 0;
  const xml = slideXml.replace(shapeRegex, (shape) => {
    if (replacementIndex >= replacementBodies.length || !shape.includes("<p:txBody")) return shape;
    const nextBody = replacementBodies[replacementIndex];
    replacementIndex += 1;
    return shape.replace(/<p:txBody>[\s\S]*?<\/p:txBody>/, nextBody);
  });

  return { xml, replacementCount: replacementIndex };
}

function populateTemplateSlide(slideXml: string, content: DeckSlideContent, design: TemplateDesign) {
  const replaced = replaceTemplateTextPlaceholders(slideXml, content, design);
  if (replaced.replacementCount > 0) return replaced.xml;

  if (!slideXml.includes("</p:spTree>")) return slideXml;
  const baseId = maxShapeId(slideXml) + 1;
  const injected = [
    templateTextBoxXml(baseId, "APT generated title", 0.65, 0.55, 6.7, 0.8, [content.title], design, { title: true }),
    templateTextBoxXml(baseId + 1, "APT generated body", 0.75, 1.55, 6.55, 4.65, content.lines.slice(0, 9), design),
  ].join("");
  return slideXml.replace("</p:spTree>", `${injected}</p:spTree>`);
}

function ensurePresentationSlideReferences(zipFileNames: string[], presentationXml: string, presentationRelsXml: string, targetSlideCount: number) {
  const existingSlideNumbers = zipFileNames
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .map((path) => Number(path.match(/slide(\d+)\.xml$/)?.[1] ?? 0))
    .filter(Number.isFinite);
  const nextSlideNumber = Math.max(0, ...existingSlideNumbers) + 1;
  const nextSlideId = maxSlideId(presentationXml) + 1;
  const nextRelId = maxRelationshipId(presentationRelsXml) + 1;
  const additions = Array.from({ length: targetSlideCount - existingSlideNumbers.length }, (_, index) => ({
    slideNumber: nextSlideNumber + index,
    slideId: nextSlideId + index,
    relId: `rId${nextRelId + index}`,
  }));

  if (!additions.length) return { additions, presentationXml, presentationRelsXml };

  const slideIdXml = additions.map((item) => `<p:sldId id="${item.slideId}" r:id="${item.relId}"/>`).join("");
  const relsXml = additions
    .map(
      (item) =>
        `<Relationship Id="${item.relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${item.slideNumber}.xml"/>`,
    )
    .join("");

  return {
    additions,
    presentationXml: presentationXml.replace("</p:sldIdLst>", `${slideIdXml}</p:sldIdLst>`),
    presentationRelsXml: presentationRelsXml.replace("</Relationships>", `${relsXml}</Relationships>`),
  };
}

function ensureSlideContentTypes(contentTypesXml: string, slideNumbers: number[]) {
  let nextXml = contentTypesXml.replace(
    "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml",
  );
  const overrideType = "application/vnd.openxmlformats-officedocument.presentationml.slide+xml";
  slideNumbers.forEach((slideNumber) => {
    const partName = `/ppt/slides/slide${slideNumber}.xml`;
    if (nextXml.includes(`PartName="${partName}"`)) return;
    nextXml = nextXml.replace("</Types>", `<Override PartName="${partName}" ContentType="${overrideType}"/></Types>`);
  });
  return nextXml;
}

function contentForTemplateSlide(contents: DeckSlideContent[], index: number, slideCount: number) {
  if (slideCount >= contents.length) return contents[index] ?? contents[contents.length - 1];
  if (index < slideCount - 1) return contents[index] ?? contents[contents.length - 1];
  const remaining = contents.slice(index);
  return {
    title: remaining[0]?.title ?? "Additional content",
    lines: remaining.flatMap((item) => [item.title, ...item.lines]).slice(0, 12),
  };
}

async function createDeckFromUploadedTemplate({
  deckLabel,
  templateFile,
  templateDesign,
  outline,
  contents,
}: {
  deckLabel: string;
  templateFile: File;
  templateDesign: TemplateDesign;
  outline: string[];
  contents: DeckSlideContent[];
}): Promise<GeneratedDeckResult | null> {
  if (![".pptx", ".potx"].includes(fileExtension(templateFile.name))) return null;

  try {
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(await templateFile.arrayBuffer());
    const slidePaths = Object.keys(zip.files)
      .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
      .toSorted((left, right) => Number(left.match(/slide(\d+)\.xml$/)?.[1] ?? 0) - Number(right.match(/slide(\d+)\.xml$/)?.[1] ?? 0));
    if (!slidePaths.length) return null;

    const presentationXml = await zip.file("ppt/presentation.xml")?.async("text");
    const presentationRelsXml = await zip.file("ppt/_rels/presentation.xml.rels")?.async("text");
    if (presentationXml && presentationRelsXml && contents.length > slidePaths.length) {
      const expanded = ensurePresentationSlideReferences(Object.keys(zip.files), presentationXml, presentationRelsXml, contents.length);
      zip.file("ppt/presentation.xml", expanded.presentationXml);
      zip.file("ppt/_rels/presentation.xml.rels", expanded.presentationRelsXml);
      await Promise.all(
        expanded.additions.map(async (item, index) => {
          const sourcePath = slidePaths[(slidePaths.length + index) % slidePaths.length];
          const sourceXml = await zip.file(sourcePath)?.async("text");
          if (sourceXml) zip.file(`ppt/slides/slide${item.slideNumber}.xml`, sourceXml);
          const sourceRelPath = sourcePath.replace("ppt/slides/", "ppt/slides/_rels/") + ".rels";
          const sourceRelXml = await zip.file(sourceRelPath)?.async("text");
          if (sourceRelXml) zip.file(`ppt/slides/_rels/slide${item.slideNumber}.xml.rels`, sourceRelXml);
        }),
      );
      const contentTypesXml = await zip.file("[Content_Types].xml")?.async("text");
      if (contentTypesXml) {
        zip.file("[Content_Types].xml", ensureSlideContentTypes(contentTypesXml, expanded.additions.map((item) => item.slideNumber)));
      }
    } else {
      const contentTypesXml = await zip.file("[Content_Types].xml")?.async("text");
      if (contentTypesXml) zip.file("[Content_Types].xml", ensureSlideContentTypes(contentTypesXml, []));
    }

    const generatedSlidePaths = Object.keys(zip.files)
      .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
      .toSorted((left, right) => Number(left.match(/slide(\d+)\.xml$/)?.[1] ?? 0) - Number(right.match(/slide(\d+)\.xml$/)?.[1] ?? 0))
      .slice(0, Math.max(contents.length, slidePaths.length));

    await Promise.all(
      generatedSlidePaths.map(async (path, index) => {
        const slideXml = await zip.file(path)?.async("text");
        if (!slideXml) return;
        const content = contentForTemplateSlide(contents, index, generatedSlidePaths.length);
        zip.file(path, populateTemplateSlide(slideXml, content, templateDesign));
      }),
    );

    const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
    const filename = `${safeFilename(deckLabel)}-${Date.now()}.pptx`;
    return {
      file: new File([blob], filename, { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }),
      filename,
      outline,
      templateDesignApplied: true,
    };
  } catch {
    return null;
  }
}

async function extractTemplateDesign(file: File | null): Promise<TemplateDesign> {
  if (!file || ![".pptx", ".potx"].includes(fileExtension(file.name))) return defaultTemplateDesign;

  try {
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const themeXml = (await zip.file("ppt/theme/theme1.xml")?.async("text")) ?? "";
    const slideXml = (await zip.file("ppt/slides/slide1.xml")?.async("text")) ?? "";
    const backgroundFromSlide = /<p:bg[\s\S]*?<a:srgbClr[^>]+val="([^"]+)"/.exec(slideXml)?.[1];
    const accentColor = extractSchemeColor(themeXml, "accent1", defaultTemplateDesign.accentColor);
    const secondaryColor = extractSchemeColor(themeXml, "accent2", defaultTemplateDesign.secondaryColor);
    const backgroundColor = normaliseHex(backgroundFromSlide, extractSchemeColor(themeXml, "lt1", defaultTemplateDesign.backgroundColor));
    const textColor = extractSchemeColor(themeXml, "dk1", readableTextColor(backgroundColor));

    return {
      sourceName: file.name,
      backgroundColor,
      panelFillColor: colorLuminance(backgroundColor) > 0.84 ? "FFFFFF" : "F7FAF9",
      accentColor,
      secondaryColor,
      textColor,
      mutedTextColor: colorLuminance(backgroundColor) > 0.62 ? "4B5966" : "E5EEF0",
      borderColor: secondaryColor,
      headFontFace: extractTypeface(themeXml, "majorFont", defaultTemplateDesign.headFontFace),
      bodyFontFace: extractTypeface(themeXml, "minorFont", defaultTemplateDesign.bodyFontFace),
    };
  } catch {
    return defaultTemplateDesign;
  }
}

function addTextBlock(slide: PptxGenJS.Slide, title: string, lines: string[], design: TemplateDesign, y = 1.55) {
  slide.background = { color: design.backgroundColor };
  slide.addText(title, { x: 0.7, y: 0.62, w: 11.9, h: 0.45, fontFace: design.headFontFace, fontSize: 23, bold: true, color: design.textColor, margin: 0 });
  slide.addShape("line", { x: 0.7, y: 1.23, w: 11.9, h: 0, line: { color: design.accentColor, width: 1.2 } });
  slide.addText(
    lines.map((line) => `- ${line}`).join("\n"),
    { x: 0.9, y, w: 11.35, h: 4.8, fontFace: design.bodyFontFace, fontSize: 16, color: design.textColor, breakLine: false, fit: "shrink", valign: "top" },
  );
}

async function createDeckFile({
  deckLabel,
  brief,
  audience,
  tone,
  includeFinancialSummary,
  includeNextStepsSlide,
  supportingFiles,
  templateDesign,
  templateFile,
}: {
  deckLabel: string;
  brief: string;
  audience: string;
  tone: string;
  includeFinancialSummary: boolean;
  includeNextStepsSlide: boolean;
  supportingFiles: File[];
  templateDesign: TemplateDesign;
  templateFile: File | null;
}): Promise<GeneratedDeckResult> {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const design = templateDesign;
  const { outline, contents } = buildDeckContent({ deckLabel, brief, includeFinancialSummary, includeNextStepsSlide, supportingFiles });
  if (templateFile && [".pptx", ".potx"].includes(fileExtension(templateFile.name))) {
    const templatedDeck = await createDeckFromUploadedTemplate({ deckLabel, templateFile, templateDesign: design, outline, contents });
    if (templatedDeck) return templatedDeck;
    throw new Error("The uploaded PowerPoint template could not be used. Please try a .pptx or .potx file with editable slides.");
  }

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "APT Account Planning Tools";
  pptx.company = "APT";
  pptx.subject = `${deckLabel} generated draft`;
  pptx.title = deckLabel;
  pptx.theme = {
    headFontFace: design.headFontFace,
    bodyFontFace: design.bodyFontFace,
  };

  const cover = pptx.addSlide();
  cover.background = { color: design.backgroundColor };
  cover.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.18, fill: { color: design.accentColor }, line: { color: design.accentColor } });
  cover.addShape(pptx.ShapeType.rect, { x: 0, y: 7.22, w: 13.333, h: 0.28, fill: { color: design.secondaryColor }, line: { color: design.secondaryColor } });
  cover.addText(deckLabel, { x: 0.72, y: 1.35, w: 8.8, h: 0.7, fontFace: design.headFontFace, fontSize: 34, bold: true, color: design.textColor, margin: 0 });
  cover.addText(`Draft for ${audience}`, { x: 0.75, y: 2.18, w: 7.5, h: 0.35, fontFace: design.bodyFontFace, fontSize: 15, bold: true, color: design.accentColor, margin: 0 });
  cover.addText(contents[0]?.lines.join("\n") || "Generated from your custom deck brief. Add more detail to sharpen the next version.", {
    x: 0.75,
    y: 2.8,
    w: 6.5,
    h: 1.2,
    fontSize: 16,
    fontFace: design.bodyFontFace,
    color: design.mutedTextColor,
    fit: "shrink",
    margin: 0,
  });
  cover.addShape(pptx.ShapeType.rect, { x: 8.1, y: 1.35, w: 4.25, h: 3.85, fill: { color: design.panelFillColor }, line: { color: design.borderColor } });
  cover.addText(`Audience\n${audience}\n\nTone\n${toneOptions.find((item) => item.value === tone)?.label ?? tone}\n\nTemplate\n${design.sourceName}`, {
    x: 8.45,
    y: 1.75,
    w: 3.55,
    h: 2.9,
    fontFace: design.bodyFontFace,
    fontSize: 15,
    color: design.textColor,
    bold: true,
    breakLine: true,
    margin: 0.06,
  });

  contents.slice(1).forEach((content) => addTextBlock(pptx.addSlide(), content.title, content.lines, design));

  const output = await pptx.write({ outputType: "blob" });
  const blob = output as Blob;
  const filename = `${safeFilename(deckLabel)}-${Date.now()}.pptx`;
  return {
    file: new File([blob], filename, { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }),
    filename,
    outline,
    templateDesignApplied: design.sourceName !== defaultTemplateDesign.sourceName,
  };
}

function DeckFileDropzone({
  accept,
  disabled,
  error,
  files,
  helper,
  id,
  label,
  multiple = false,
  onFilesSelected,
  onRemoveFile,
}: {
  accept: string;
  disabled: boolean;
  error: string;
  files: File[];
  helper: string;
  id: string;
  label: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    onFilesSelected(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleDrag(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (!disabled) setIsDragging(event.type === "dragenter" || event.type === "dragover");
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    onFilesSelected(Array.from(event.dataTransfer.files ?? []));
  }

  return (
    <div className="deck-dropzone-control">
      <span>{label}</span>
      <label
        className={`deck-dropzone${isDragging ? " deck-dropzone-active" : ""}${disabled ? " deck-dropzone-disabled" : ""}`}
        htmlFor={id}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          accept={accept}
          className="visually-hidden"
          disabled={disabled}
          id={id}
          multiple={multiple}
          type="file"
          onChange={handleFiles}
        />
        <strong>{multiple ? "Drag and drop supporting files here, or choose files" : "Drag and drop a deck template here, or choose a file"}</strong>
        <span>{helper}</span>
      </label>
      {files.length > 0 ? (
        <ul className="deck-file-list">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.size}-${index}`}>
              <span>
                {file.name} <small>{formatFileSize(file.size)}</small>
              </span>
              <button className="text-link" disabled={disabled} type="button" onClick={() => onRemoveFile(index)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <small className="selected-file">No file selected</small>
      )}
      {error ? <small className="field-error">{error}</small> : null}
    </div>
  );
}

export function CustomDeckClient({ selectedTemplate }: { selectedTemplate: string }) {
  const { plan, user } = useSupabaseAuth();
  const { requirePro } = useProAction({ from: "custom-deck", feature: "custom-deck" });
  const initialTemplate = normaliseTemplate(selectedTemplate);
  const initialDeckType = deckTypes.some((item) => item.value === initialTemplate) ? initialTemplate : "jbp";
  const initialDeckLabel = deckTypes.find((item) => item.value === initialDeckType)?.label ?? deckTypes[0].label;
  const [deckType, setDeckType] = useState(initialDeckType);
  const [deckName, setDeckName] = useState(`${initialDeckLabel} deck`);
  const [savedTemplates, setSavedTemplates] = useState<SavedPresentationTemplate[]>([]);
  const defaultSavedTemplate = savedTemplates.find((template) => template.isDefault) ?? savedTemplates[0] ?? null;
  const [templateSource, setTemplateSource] = useState<TemplateSource>(defaultSavedTemplate ? "saved" : "apt_default");
  const [selectedSavedTemplateId, setSelectedSavedTemplateId] = useState(defaultSavedTemplate?.id ?? "");
  const [oneOffTemplateFiles, setOneOffTemplateFiles] = useState<File[]>([]);
  const [googleSlidesTemplateUrl, setGoogleSlidesTemplateUrl] = useState("");
  const [templateError, setTemplateError] = useState("");
  const [googleSlidesError, setGoogleSlidesError] = useState("");
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [supportingError, setSupportingError] = useState("");
  const [brief, setBrief] = useState("");
  const [audience, setAudience] = useState("Retailer/customer meeting");
  const [tone, setTone] = useState("concise_commercial");
  const [financialSummary, setFinancialSummary] = useState("Yes");
  const [nextStepsSlide, setNextStepsSlide] = useState("Yes");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pptx");
  const [requestMessage, setRequestMessage] = useState("");
  const [generatedDeckUrl, setGeneratedDeckUrl] = useState("");
  const [generatedDeckFilename, setGeneratedDeckFilename] = useState("");
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const isPro = plan === "pro" || plan === "team";
  const reusableSavedTemplates = useMemo(
    () => savedTemplates.filter(isReusableSavedTemplate),
    [savedTemplates],
  );
  const unavailableSavedTemplates = useMemo(
    () => savedTemplates.filter((template) => !isReusableSavedTemplate(template)),
    [savedTemplates],
  );
  const selectedDeck = useMemo(
    () => deckTypes.find((item) => item.value === deckType) ?? deckTypes[0],
    [deckType],
  );
  const selectedSavedTemplate = useMemo(
    () => reusableSavedTemplates.find((template) => template.id === selectedSavedTemplateId) ?? null,
    [reusableSavedTemplates, selectedSavedTemplateId],
  );
  const supportingTemplateFile = useMemo(
    () => supportingFiles.find(isPowerPointTemplateFile) ?? null,
    [supportingFiles],
  );
  const activeUploadedTemplate = oneOffTemplateFiles[0] ?? supportingTemplateFile;
  const activeTemplateName = activeUploadedTemplate?.name
    ?? (templateSource === "saved" && selectedSavedTemplate ? selectedSavedTemplate.displayName || selectedSavedTemplate.filename : "Upload a .pptx or .potx template");
  const activeTemplateKind = oneOffTemplateFiles[0]
    ? "Uploaded deck design template"
    : supportingTemplateFile
      ? "PowerPoint template found in supporting data"
    : templateSource === "saved" && selectedSavedTemplate
      ? "Saved template"
      : "No design template selected";
  const hasActiveDesignTemplate = Boolean(activeUploadedTemplate || (templateSource === "saved" && selectedSavedTemplate));

  useEffect(() => {
    let isMounted = true;
    loadAccountSettings().then((result) => {
      if (!isMounted) return;
      const templates = result.data.presentationTemplates;
      setSavedTemplates(templates);
      const reusableTemplates = templates.filter(isReusableSavedTemplate);
      const defaultTemplate = reusableTemplates.find((template) => template.isDefault) ?? reusableTemplates[0] ?? null;
      if (!defaultTemplate) return;
      setSelectedSavedTemplateId((current) => current || defaultTemplate.id);
      setTemplateSource((current) => (current === "apt_default" ? "saved" : current));
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (generatedDeckUrl) URL.revokeObjectURL(generatedDeckUrl);
    };
  }, [generatedDeckUrl]);

  function validateOneOffTemplateFiles(files: File[]) {
    setTemplateError("");
    const file = files[0];
    if (!file) {
      setOneOffTemplateFiles([]);
      return;
    }
    if (!deckTemplateExtensions.includes(fileExtension(file.name)) || file.size > DECK_TEMPLATE_MAX_FILE_BYTES) {
      setOneOffTemplateFiles([]);
      setTemplateError("Please upload a .pptx or .potx PowerPoint template under 20MB.");
      return;
    }
    setOneOffTemplateFiles([file]);
    setTemplateSource("one_off");
  }

  function validateSupportingFiles(files: File[]) {
    setSupportingError("");
    const next = [...supportingFiles, ...files].slice(0, MAX_SUPPORTING_FILES);
    if (supportingFiles.length + files.length > MAX_SUPPORTING_FILES) {
      setSupportingError("You can upload up to 5 supporting files.");
      return;
    }
    const invalidType = next.some((file) => !supportingFileExtensions.includes(fileExtension(file.name)));
    if (invalidType) {
      setSupportingError("Please upload supported files only: .xlsx, .csv, .pdf, .docx, .txt, .pptx, .key, .numbers or .pages.");
      return;
    }
    const tooLarge = next.some((file) => file.size > SUPPORTING_FILE_MAX_BYTES);
    if (tooLarge) {
      setSupportingError("Each file must be under 10MB.");
      return;
    }
    setSupportingFiles(next);
  }

  async function createAndSaveDeck() {
    if (!requirePro(() => undefined, { feature: "custom-deck", location: "custom_deck_save_request" })) return;
    if (!user?.id) {
      setRequestMessage("Sign in to create and save a deck.");
      return;
    }
    setRequestMessage("");
    setTemplateError("");
    setGoogleSlidesError("");
    if (!deckName.trim()) {
      setRequestMessage("Name the deck before creating it so it is easy to find in Workspace.");
      return;
    }
    if (googleSlidesTemplateUrl.trim() && !isGoogleSlidesUrl(googleSlidesTemplateUrl)) {
      setGoogleSlidesError("Paste a shareable Google Slides presentation link.");
      return;
    }
    setIsCreatingDeck(true);
    try {
      if (generatedDeckUrl) URL.revokeObjectURL(generatedDeckUrl);
      setGeneratedDeckUrl("");
      setGeneratedDeckFilename("");
      const resolvedDeckName = deckName.trim() || `${selectedDeck.label} generated deck`;
      let templateFileForDesign = activeUploadedTemplate ?? null;
      if (!templateFileForDesign && templateSource === "saved" && selectedSavedTemplate) {
        const downloaded = await downloadDeckTemplate(selectedSavedTemplate.storagePathOrUrl, selectedSavedTemplate.filename);
        if (downloaded.file) {
          templateFileForDesign = downloaded.file;
        } else {
          setTemplateError(downloaded.error ?? "Could not download the selected saved template.");
          return;
        }
      }
      if (!templateFileForDesign) {
        setTemplateError(
          savedTemplates.length
            ? "Choose a reusable saved PowerPoint template, or replace your older saved template with a .pptx/.potx upload."
            : "Upload a .pptx or .potx template before creating the deck.",
        );
        setRequestMessage("A reusable PowerPoint template is required so the generated deck uses your design instead of the APT default.");
        return;
      }
      const templateDesign = await extractTemplateDesign(templateFileForDesign);
      const generated = await createDeckFile({
        deckLabel: resolvedDeckName,
        brief,
        audience,
        tone,
        includeFinancialSummary: financialSummary === "Yes",
        includeNextStepsSlide: nextStepsSlide === "Yes",
        supportingFiles,
        templateDesign,
        templateFile: templateFileForDesign,
      });
      const downloadUrl = URL.createObjectURL(generated.file);
      const uploaded = await uploadGeneratedDeck(generated.file, user.id);
      const requestPayload = {
        id: crypto.randomUUID ? crypto.randomUUID() : `deck-request-${Date.now()}`,
        name: resolvedDeckName,
        deck_name: resolvedDeckName,
        template_type: selectedDeck.label,
        deckType,
        templateSource: activeUploadedTemplate ? "one_off" : templateSource,
        savedTemplateId: !activeUploadedTemplate && templateSource === "saved" ? selectedSavedTemplateId : "",
        oneOffTemplateFileMeta: activeUploadedTemplate ? toFileMeta(activeUploadedTemplate) : null,
        googleSlidesTemplateUrl: googleSlidesTemplateUrl.trim(),
        supportingFilesMeta: supportingFiles.map(toFileMeta),
        brief,
        audience,
        tone,
        includeFinancialSummary: financialSummary === "Yes",
        includeNextStepsSlide: nextStepsSlide === "Yes",
        exportFormat,
        generatedOutline: generated.outline,
        generated_outline: generated.outline,
        templateDesign: {
          applied: generated.templateDesignApplied,
          sourceName: templateDesign.sourceName,
          accentColor: templateDesign.accentColor,
          secondaryColor: templateDesign.secondaryColor,
          backgroundColor: templateDesign.backgroundColor,
          headFontFace: templateDesign.headFontFace,
          bodyFontFace: templateDesign.bodyFontFace,
        },
        generatedDeck: {
          filename: generated.filename,
          fileSize: generated.file.size,
          fileType: generated.file.type,
          storagePath: uploaded.path,
          generatedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
      };
      const result = await saveDeckBrief(requestPayload);
      if (!result.data) {
        URL.revokeObjectURL(downloadUrl);
        setRequestMessage(result.message ?? "Could not save deck brief.");
        return;
      }
      setGeneratedDeckUrl(downloadUrl);
      setGeneratedDeckFilename(generated.filename);
      setRequestMessage(
        uploaded.path
          ? generated.templateDesignApplied
            ? `Deck created and saved to your account using ${templateDesign.sourceName} as the design base.`
            : "Deck created and saved to your account."
          : `Deck created, but file storage did not save it: ${uploaded.error ?? "storage unavailable"}. Use the download link below.`,
      );
    } catch (error) {
      setRequestMessage(error instanceof Error ? error.message : "Could not create the deck. Please try again.");
    } finally {
      setIsCreatingDeck(false);
    }
  }

  function preventSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void createAndSaveDeck();
  }

  return (
    <section className="shell section">
      <div className="custom-deck-layout">
        <form className="card custom-deck-page-form" onSubmit={preventSubmit}>
          {!isPro ? (
            <div className="locked-card custom-deck-lock">
              <div>
                <strong>Custom deck building is included with APT Pro.</strong>
                <span>
                  Free users can download editable templates. APT Pro lets you build custom decks from your data,
                  brief and presentation template.
                </span>
              </div>
              <div className="summary-actions">
                <Link className="button button-secondary button-small" href={buildUpgradeHref({ from: "custom-deck", feature: "custom-deck" })}>
                  Switch to Pro
                </Link>
                <Link className="button button-secondary button-small" href="/presentation-templates">
                  Download free templates
                </Link>
              </div>
            </div>
          ) : null}

          <fieldset className="settings-fieldset" disabled={!isPro}>
            <section className="custom-deck-form-section custom-deck-name-section">
              <h2>Deck setup</h2>
              <div className="custom-deck-setup-grid">
                <label className="field">
                  <span>Deck name</span>
                  <input
                    required
                    placeholder={`${selectedDeck.label} for Tesco Q3`}
                    value={deckName}
                    onChange={(event) => setDeckName(event.target.value)}
                  />
                  <small>Shown in Workspace and used for the generated file.</small>
                </label>
                <label className="field">
                  <span>Deck type</span>
                  <select value={deckType} onChange={(event) => setDeckType(event.target.value)}>
                    {deckTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <small>Controls the first-draft story structure.</small>
                </label>
              </div>
            </section>

            <section className="custom-deck-form-section">
              <h2>Deck template</h2>
              <p className="helper-note">
                Upload a PowerPoint template to make the generated deck use that design. If you upload a file here, it overrides the saved/default options.
              </p>
              <DeckFileDropzone
                accept=".pptx,.potx"
                disabled={!isPro}
                error={templateError}
                files={oneOffTemplateFiles}
                helper="Best supported: PowerPoint .pptx or .potx. The generated deck is created inside this uploaded file's slide design."
                id="one-off-template-deck"
                label="Upload deck design template"
                onFilesSelected={validateOneOffTemplateFiles}
                onRemoveFile={() => {
                  setOneOffTemplateFiles([]);
                  setTemplateError("");
                }}
              />
              <div className="active-template-banner">
                <span>{activeTemplateKind}</span>
                <strong>{activeTemplateName}</strong>
              </div>
              <div className="template-source-group" role="radiogroup" aria-label="Template source">
                <label className="template-source-option">
                  <input
                    checked={templateSource === "saved"}
                    disabled={reusableSavedTemplates.length === 0}
                    name="template-source"
                    type="radio"
                    value="saved"
                    onChange={() => setTemplateSource("saved")}
                  />
                  <span>
                    <strong>Use saved template</strong>
                    <small>Choose a saved .pptx/.potx template that has a stored file.</small>
                  </span>
                </label>
                <label className="template-source-option">
                  <input
                    checked={templateSource === "one_off"}
                    name="template-source"
                    type="radio"
                    value="one_off"
                    onChange={() => setTemplateSource("one_off")}
                  />
                  <span>
                    <strong>Upload one-off template</strong>
                    <small>The uploaded file above will be used as the design base.</small>
                  </span>
                </label>
              </div>
              {reusableSavedTemplates.length === 0 ? (
                <p className="helper-note">
                  No reusable saved PowerPoint templates yet. Add or replace one in{" "}
                  <Link className="text-link" href="/settings#presentation-templates">
                    Manage templates
                  </Link>
                  .
                </p>
              ) : null}
              {unavailableSavedTemplates.length > 0 ? (
                <p className="helper-note">
                  Some older saved templates need replacing before they can be used here:{" "}
                  {unavailableSavedTemplates.map((template) => template.displayName || template.filename).join(", ")}.
                </p>
              ) : null}
              {templateSource === "saved" && reusableSavedTemplates.length > 0 ? (
                <label className="field">
                  <span>Saved template</span>
                  <select value={selectedSavedTemplateId} onChange={(event) => setSelectedSavedTemplateId(event.target.value)}>
                    {reusableSavedTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.displayName}{template.isDefault ? " (Default)" : ""}
                      </option>
                    ))}
                  </select>
                  {selectedSavedTemplate ? (
                    <small>
                      {selectedSavedTemplate.filename} · uploaded {new Date(selectedSavedTemplate.uploadedAt).toLocaleDateString("en-GB")}
                    </small>
                  ) : null}
                </label>
              ) : null}
              <label className="checkbox-row checkbox-row-disabled">
                <input disabled type="checkbox" />
                <span>Also save this to my template library</span>
              </label>
              <small className="helper-note">
                {savedTemplates.length >= 3
                  ? "You already have 3 saved templates. Remove one in Settings to save another."
                  : "Save reusable templates from Settings for now."}
              </small>
              <label className="field">
                <span>Google Slides link</span>
                <input
                  placeholder="https://docs.google.com/presentation/..."
                  type="url"
                  value={googleSlidesTemplateUrl}
                  onChange={(event) => {
                    setGoogleSlidesTemplateUrl(event.target.value);
                    setGoogleSlidesError("");
                  }}
                />
                <small>Paste a shareable Google Slides link as a reference. Make sure sharing is enabled.</small>
                {googleSlidesError ? <small className="field-error">{googleSlidesError}</small> : null}
              </label>
            </section>

            <section className="custom-deck-form-section">
              <h2>Supporting data</h2>
              <p className="helper-note">Upload spreadsheets, notes, briefing files or existing decks with the numbers and context for this deck.</p>
              {supportingTemplateFile ? (
                <p className="helper-note">
                  PowerPoint design detected: {supportingTemplateFile.name}. This file will be used as the deck design template unless you upload a different
                  template above.
                </p>
              ) : null}
              <DeckFileDropzone
                accept=".xlsx,.csv,.pdf,.docx,.txt,.pptx,.key,.numbers,.pages"
                disabled={!isPro}
                error={supportingError}
                files={supportingFiles}
                helper=".xlsx, .csv, .pdf, .docx, .txt, .pptx, .key, .numbers or .pages, up to 10MB each."
                id="supporting-data-files"
                label="Upload supporting data"
                multiple
                onFilesSelected={validateSupportingFiles}
                onRemoveFile={(index) => {
                  setSupportingFiles(supportingFiles.filter((_, fileIndex) => fileIndex !== index));
                  setSupportingError("");
                }}
              />
            </section>

            <section className="custom-deck-form-section">
              <h2>Deck brief</h2>
              <label className="field">
                <span>Brief</span>
                <textarea
                  className="deck-brief-textarea"
                  placeholder="Example: Build a QBR for Tesco covering Q3 performance, promo results, risks, next-quarter asks and recommended actions."
                  value={brief}
                  onChange={(event) => setBrief(event.target.value)}
                />
                <small>The better the brief, the stronger the first draft.</small>
              </label>
            </section>

            <section className="custom-deck-form-section">
              <h2>Output preferences</h2>
              <p className="helper-note">Choose the audience, tone, slides and output format you want included.</p>
              <div className="output-preferences-grid">
                <div className="form-field">
                  <label htmlFor="custom-deck-audience">Audience</label>
                  <select id="custom-deck-audience" value={audience} onChange={(event) => setAudience(event.target.value)}>
                    <option>Internal review</option>
                    <option>Retailer/customer meeting</option>
                    <option>Leadership review</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="custom-deck-tone">Tone</label>
                  <select id="custom-deck-tone" value={tone} onChange={(event) => setTone(event.target.value)}>
                    {toneOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="custom-deck-financial-summary">Include financial summary</label>
                  <select
                    id="custom-deck-financial-summary"
                    value={financialSummary}
                    onChange={(event) => setFinancialSummary(event.target.value)}
                  >
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="custom-deck-next-steps">Include next steps slide</label>
                  <select id="custom-deck-next-steps" value={nextStepsSlide} onChange={(event) => setNextStepsSlide(event.target.value)}>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>
              </div>
              <p className="helper-note">Choose the audience and the level of detail you want in the first draft.</p>
              <div className="output-format-field">
                <div className="form-field">
                  <label htmlFor="custom-deck-export-format">Export format</label>
                  <select id="custom-deck-export-format" value={exportFormat} onChange={(event) => setExportFormat(event.target.value as ExportFormat)}>
                    {exportFormatOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="field-help">PowerPoint is the standard export. Google Slides and Keynote options create files intended to open cleanly in those tools.</p>
                </div>
              </div>
            </section>
          </fieldset>

          <div className="custom-deck-action-area">
            <button className={isPro ? "button" : "button pro-only-button"} disabled={isCreatingDeck || !hasActiveDesignTemplate} type="submit">
              {isCreatingDeck ? "Creating deck..." : "Create and save deck"}
            </button>
            {!hasActiveDesignTemplate ? (
              <p className="field-error">Upload or choose a PowerPoint template before creating the deck.</p>
            ) : null}
            <p>
              This creates an editable PowerPoint draft, saves the deck record to your workspace and stores the file when account storage is available.
            </p>
            {requestMessage ? <p className="settings-message settings-message-success">{requestMessage}</p> : null}
            {generatedDeckUrl ? (
              <a className="button button-secondary button-small" download={generatedDeckFilename} href={generatedDeckUrl}>
                Download generated deck
              </a>
            ) : null}
          </div>
        </form>

        <aside className="card custom-deck-sidebar">
          <Image
            alt="APT custom deck builder showing deck type, uploads and brief fields"
            className="custom-deck-preview-image"
            height={525}
            loading="lazy"
            src="/images/apt/apt-custom-deck-builder-preview.webp"
            width={663}
          />
          <h2>What to include</h2>
          <ul className="compact-list">
            <li>Your audience and meeting objective</li>
            <li>Customer or retailer context</li>
            <li>Key commercial numbers</li>
            <li>Risks, asks and next steps</li>
            <li>Any slides or format you want followed</li>
          </ul>
          <div className="custom-deck-side-note">
            <strong>{selectedDeck.label}</strong>
            <span>APT will use this as the starting structure for the brief.</span>
          </div>
          <Link className="text-link" href="/presentation-templates">
            Back to presentation templates
          </Link>
        </aside>
      </div>
    </section>
  );
}
