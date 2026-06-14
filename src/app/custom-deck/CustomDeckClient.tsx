"use client";

import Link from "next/link";
import { ChangeEvent, DragEvent, FormEvent, useMemo, useState } from "react";
import { useAptMode } from "../components/AptMode";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";
import { getUserPlan } from "../../lib/userPlan";
import { readPresentationTemplates } from "../../lib/proSettings";

const DECK_TEMPLATE_MAX_FILE_BYTES = 20 * 1024 * 1024;
const SUPPORTING_FILE_MAX_BYTES = 10 * 1024 * 1024;
const MAX_SUPPORTING_FILES = 5;
const CUSTOM_DECK_REQUESTS_KEY = "aptCustomDeckRequests";
const deckTemplateExtensions = [".pptx", ".potx", ".pdf", ".key"];
const supportingFileExtensions = [".xlsx", ".csv", ".pdf", ".docx", ".txt", ".pptx", ".key", ".numbers", ".pages"];

const deckTypes = [
  { label: "Joint Business Plan", value: "jbp" },
  { label: "Quarterly Business Review", value: "qbr" },
  { label: "Promotional Proposal", value: "promo-proposal" },
  { label: "Range Review", value: "range-review" },
  { label: "New Product Launch", value: "product-launch" },
  { label: "Annual Planning", value: "annual-planning" },
  { label: "Buyer Meeting Prep", value: "buyer-meeting" },
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
  const { aptMode } = useAptMode();
  const { isAuthenticated } = useSupabaseAuth();
  const initialTemplate = normaliseTemplate(selectedTemplate);
  const [deckType, setDeckType] = useState(
    deckTypes.some((item) => item.value === initialTemplate) ? initialTemplate : "jbp",
  );
  const [savedTemplates] = useState(() => readPresentationTemplates());
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
  const isPro = getUserPlan(aptMode, null, isAuthenticated) === "pro";
  const selectedDeck = useMemo(
    () => deckTypes.find((item) => item.value === deckType) ?? deckTypes[0],
    [deckType],
  );

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

  function saveDeckRequest() {
    if (!isPro) return;
    setRequestMessage("");
    setGoogleSlidesError("");
    if (googleSlidesTemplateUrl.trim() && !isGoogleSlidesUrl(googleSlidesTemplateUrl)) {
      setGoogleSlidesError("Paste a shareable Google Slides presentation link.");
      return;
    }
    const requestPayload = {
      id: crypto.randomUUID ? crypto.randomUUID() : `deck-request-${Date.now()}`,
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
      createdAt: new Date().toISOString(),
    };
    if (typeof window !== "undefined") {
      let previous: unknown[] = [];
      try {
        const saved = window.localStorage.getItem(CUSTOM_DECK_REQUESTS_KEY);
        previous = saved ? JSON.parse(saved) : [];
      } catch {
        previous = [];
      }
      window.localStorage.setItem(CUSTOM_DECK_REQUESTS_KEY, JSON.stringify([requestPayload, ...previous].slice(0, 10)));
    }
    setRequestMessage("Deck request saved on this device.");
  }

  function preventSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveDeckRequest();
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
                <Link className="button button-secondary button-small" href="/pricing">
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
                    <small>PowerPoint files work best. Keynote and PDF files may be used as reference files.</small>
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
                    helper="Best supported: PowerPoint .pptx. Keynote and PDF uploads can be used as reference files where supported."
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
            <button className="button" disabled={!isPro} type="submit">
              Save deck request
            </button>
            <p>
              This saves your brief, selected format and file details on this device so you can review the request.
            </p>
            {requestMessage ? <p className="settings-message settings-message-success">{requestMessage}</p> : null}
          </div>
        </form>

        <aside className="card custom-deck-sidebar">
          <img
            alt="APT custom deck builder showing deck type, uploads and brief fields"
            className="custom-deck-preview-image"
            loading="lazy"
            src="/images/apt/apt-custom-deck-builder-preview.webp"
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
