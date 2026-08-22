"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import type PptxGenJS from "pptxgenjs";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";
import { buildUpgradeHref, useProAction } from "../components/ProActionGuard";
import { loadAccountSettings, SavedPresentationTemplate } from "../../lib/proSettings";
import { saveDeckBrief } from "../../lib/saveStore";
import { uploadGeneratedDeck } from "../../lib/storageUploads";

const DECK_TEMPLATE_MAX_FILE_BYTES = 20 * 1024 * 1024;
const SUPPORTING_FILE_MAX_BYTES = 10 * 1024 * 1024;
const MAX_SUPPORTING_FILES = 5;
const deckTemplateExtensions = [".pptx", ".potx", ".pdf", ".key"];
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
}: {
  deckLabel: string;
  brief: string;
  audience: string;
  tone: string;
  includeFinancialSummary: boolean;
  includeNextStepsSlide: boolean;
  supportingFiles: File[];
  templateDesign: TemplateDesign;
}): Promise<GeneratedDeckResult> {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const design = templateDesign;
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

  const outline = deckOutline(deckLabel, brief, includeFinancialSummary, includeNextStepsSlide);
  const briefPoints = briefSentences(brief);
  const sourceSummary = supportingFiles.length
    ? supportingFiles.map((file) => `${file.name} (${formatFileSize(file.size)})`)
    : ["No supporting files attached to this draft."];

  const cover = pptx.addSlide();
  cover.background = { color: design.backgroundColor };
  cover.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.18, fill: { color: design.accentColor }, line: { color: design.accentColor } });
  cover.addShape(pptx.ShapeType.rect, { x: 0, y: 7.22, w: 13.333, h: 0.28, fill: { color: design.secondaryColor }, line: { color: design.secondaryColor } });
  cover.addText(deckLabel, { x: 0.72, y: 1.35, w: 8.8, h: 0.7, fontFace: design.headFontFace, fontSize: 34, bold: true, color: design.textColor, margin: 0 });
  cover.addText(`Draft for ${audience}`, { x: 0.75, y: 2.18, w: 7.5, h: 0.35, fontFace: design.bodyFontFace, fontSize: 15, bold: true, color: design.accentColor, margin: 0 });
  cover.addText(brief || "Generated from your custom deck brief. Add more detail to sharpen the next version.", {
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

  addTextBlock(pptx.addSlide(), "Draft story flow", outline.map((item, index) => `${index + 1}. ${item}`), design);
  addTextBlock(pptx.addSlide(), "Brief and assumptions", briefPoints.length ? briefPoints : ["Add the customer context, commercial objective and core ask.", "Attach sales data or prior decks to improve the next draft."], design);
  addTextBlock(pptx.addSlide(), "Supporting data used", sourceSummary, design);
  addTextBlock(pptx.addSlide(), "Recommended story", [
    "Lead with the customer opportunity and the decision needed.",
    "Connect the commercial ask to the retailer or customer benefit.",
    "Use the attached data to prove the size of prize, risk and payback.",
  ], design);
  if (includeFinancialSummary) {
    addTextBlock(pptx.addSlide(), "Financial summary", [
      "Add revenue, margin, support and ROI outputs from the relevant APT calculator.",
      "Separate confirmed facts from assumptions.",
      "Show the decision threshold or negotiation guardrail clearly.",
    ], design);
  }
  addTextBlock(pptx.addSlide(), "Risks and watchouts", [
    "Call out data gaps, approval dependencies and commercial assumptions.",
    "Highlight where retailer/customer policy may affect final pricing or support treatment.",
    "Use this draft as a working structure before customer-facing use.",
  ], design);
  if (includeNextStepsSlide) {
    addTextBlock(pptx.addSlide(), "Next steps", [
      "Confirm data sources and final commercial assumptions.",
      "Replace placeholder bullets with account-specific evidence.",
      "Agree the recommended ask, owner and timing.",
    ], design);
  }

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
  const [deckType, setDeckType] = useState(
    deckTypes.some((item) => item.value === initialTemplate) ? initialTemplate : "jbp",
  );
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
  const selectedDeck = useMemo(
    () => deckTypes.find((item) => item.value === deckType) ?? deckTypes[0],
    [deckType],
  );

  useEffect(() => {
    let isMounted = true;
    loadAccountSettings().then((result) => {
      if (!isMounted) return;
      const templates = result.data.presentationTemplates;
      setSavedTemplates(templates);
      const defaultTemplate = templates.find((template) => template.isDefault) ?? templates[0] ?? null;
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
      setTemplateError("Please upload a .pptx, .potx, .pdf or .key file under 20MB.");
      return;
    }
    setOneOffTemplateFiles([file]);
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
    setGoogleSlidesError("");
    if (googleSlidesTemplateUrl.trim() && !isGoogleSlidesUrl(googleSlidesTemplateUrl)) {
      setGoogleSlidesError("Paste a shareable Google Slides presentation link.");
      return;
    }
    setIsCreatingDeck(true);
    try {
      if (generatedDeckUrl) URL.revokeObjectURL(generatedDeckUrl);
      setGeneratedDeckUrl("");
      setGeneratedDeckFilename("");
      const templateFileForDesign = templateSource === "one_off" ? oneOffTemplateFiles[0] ?? null : null;
      const templateDesign = await extractTemplateDesign(templateFileForDesign);
      const generated = await createDeckFile({
        deckLabel: selectedDeck.label,
        brief,
        audience,
        tone,
        includeFinancialSummary: financialSummary === "Yes",
        includeNextStepsSlide: nextStepsSlide === "Yes",
        supportingFiles,
        templateDesign,
      });
      const downloadUrl = URL.createObjectURL(generated.file);
      const uploaded = await uploadGeneratedDeck(generated.file, user.id);
      const requestPayload = {
        id: crypto.randomUUID ? crypto.randomUUID() : `deck-request-${Date.now()}`,
        name: `${selectedDeck.label} generated deck`,
        deck_name: `${selectedDeck.label} generated deck`,
        template_type: selectedDeck.label,
        deckType,
        templateSource,
        savedTemplateId: templateSource === "saved" ? selectedSavedTemplateId : "",
        oneOffTemplateFileMeta: templateSource === "one_off" && oneOffTemplateFiles[0] ? toFileMeta(oneOffTemplateFiles[0]) : null,
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
            ? `Deck created and saved to your account using design cues from ${templateDesign.sourceName}.`
            : "Deck created and saved to your account."
          : `Deck created, but file storage did not save it: ${uploaded.error ?? "storage unavailable"}. Use the download link below.`,
      );
    } catch {
      setRequestMessage("Could not create the deck. Please try again.");
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
            <section className="custom-deck-form-section">
              <h2>Deck setup</h2>
              <label className="field">
                <span>Deck type</span>
                <select value={deckType} onChange={(event) => setDeckType(event.target.value)}>
                  {deckTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="helper-note">Selected template: {selectedDeck.label}</p>
            </section>

            <section className="custom-deck-form-section">
              <h2>Deck template</h2>
              <p className="helper-note">
                Use a saved template, upload a one-off deck file, paste a Google Slides reference or start from the APT default layout.
              </p>
              <div className="template-source-group" role="radiogroup" aria-label="Template source">
                <label className="template-source-option">
                  <input
                    checked={templateSource === "saved"}
                    disabled={savedTemplates.length === 0}
                    name="template-source"
                    type="radio"
                    value="saved"
                    onChange={() => setTemplateSource("saved")}
                  />
                  <span>
                    <strong>Use saved template</strong>
                    <small>Choose one of your saved Pro templates.</small>
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
                    <small>PowerPoint files are read for theme colours and fonts. Keynote and PDF files are saved as references.</small>
                  </span>
                </label>
                <label className="template-source-option">
                  <input
                    checked={templateSource === "apt_default"}
                    name="template-source"
                    type="radio"
                    value="apt_default"
                    onChange={() => setTemplateSource("apt_default")}
                  />
                  <span>
                    <strong>Use APT default template</strong>
                    <small>Use APT&apos;s standard structure and styling.</small>
                  </span>
                </label>
              </div>
              {savedTemplates.length === 0 ? (
                <p className="helper-note">
                  No saved templates yet. Add up to 3 in{" "}
                  <Link className="text-link" href="/settings#presentation-templates">
                    Manage templates
                  </Link>
                  .
                </p>
              ) : null}
              {templateSource === "saved" && savedTemplates.length > 0 ? (
                <label className="field">
                  <span>Saved template</span>
                  <select value={selectedSavedTemplateId} onChange={(event) => setSelectedSavedTemplateId(event.target.value)}>
                    {savedTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.displayName}{template.isDefault ? " (Default)" : ""}
                      </option>
                    ))}
                  </select>
                  {savedTemplates.find((template) => template.id === selectedSavedTemplateId) ? (
                    <small>
                      {savedTemplates.find((template) => template.id === selectedSavedTemplateId)?.filename} · uploaded{" "}
                      {new Date(
                        savedTemplates.find((template) => template.id === selectedSavedTemplateId)?.uploadedAt ?? "",
                      ).toLocaleDateString("en-GB")}
                    </small>
                  ) : null}
                </label>
              ) : null}
              {templateSource === "one_off" ? (
                <div className="template-one-off-fields">
                  <DeckFileDropzone
                    accept=".pptx,.potx,.pdf,.key"
                    disabled={!isPro}
                    error={templateError}
                    files={oneOffTemplateFiles}
                    helper="Best supported: PowerPoint .pptx or .potx for design cues. Keynote and PDF uploads are saved as reference files."
                    id="one-off-template-deck"
                    label="Upload one-off template"
                    onFilesSelected={validateOneOffTemplateFiles}
                    onRemoveFile={() => {
                      setOneOffTemplateFiles([]);
                      setTemplateError("");
                    }}
                  />
                  <label className="checkbox-row checkbox-row-disabled">
                    <input disabled type="checkbox" />
                    <span>Also save this to my template library</span>
                  </label>
                  <small className="helper-note">
                    {savedTemplates.length >= 3
                      ? "You already have 3 saved templates. Remove one in Settings to save another."
                      : "Save reusable templates from Settings for now."}
                  </small>
                </div>
              ) : null}
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
            <button className={isPro ? "button" : "button pro-only-button"} disabled={isCreatingDeck} type="submit">
              {isCreatingDeck ? "Creating deck..." : "Create and save deck"}
            </button>
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
