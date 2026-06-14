"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useAptMode } from "../components/AptMode";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";
import { getUserPlan } from "../../lib/userPlan";
import { readPresentationTemplates } from "../../lib/proSettings";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

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
type TemplateSource = "saved" | "one_off" | "apt_default";

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

function FileUploadField({
  accept,
  disabled,
  error,
  filename,
  helper,
  id,
  label,
  onChange,
}: {
  accept: string;
  disabled: boolean;
  error: string;
  filename: string;
  helper: string;
  id: string;
  label: string;
  onChange: (file: File | undefined) => void;
}) {
  return (
    <div className="file-upload-control">
      <span>{label}</span>
      <div className="compact-file-row">
        <label
          className={disabled ? "button button-secondary button-small file-button file-button-disabled" : "button button-secondary button-small file-button"}
          htmlFor={id}
        >
          Choose file
        </label>
        <input
          accept={accept}
          className="visually-hidden"
          disabled={disabled}
          id={id}
          type="file"
          onChange={(event) => onChange(event.target.files?.[0])}
        />
        <small className={error ? "field-error" : "selected-file"}>{error || filename || "No file selected"}</small>
      </div>
      <p>{helper}</p>
    </div>
  );
}

export function CustomDeckClient({ selectedTemplate }: { selectedTemplate: string }) {
  const { aptMode, setAptMode } = useAptMode();
  const { isAuthenticated } = useSupabaseAuth();
  const initialTemplate = normaliseTemplate(selectedTemplate);
  const [deckType, setDeckType] = useState(
    deckTypes.some((item) => item.value === initialTemplate) ? initialTemplate : "jbp",
  );
  const [savedTemplates] = useState(() => readPresentationTemplates());
  const defaultSavedTemplate = savedTemplates.find((template) => template.isDefault) ?? savedTemplates[0] ?? null;
  const [templateSource, setTemplateSource] = useState<TemplateSource>(defaultSavedTemplate ? "saved" : "apt_default");
  const [selectedSavedTemplateId, setSelectedSavedTemplateId] = useState(defaultSavedTemplate?.id ?? "");
  const [oneOffTemplateFileName, setOneOffTemplateFileName] = useState("");
  const [templateError, setTemplateError] = useState("");
  const [brief, setBrief] = useState("");
  const [audience, setAudience] = useState("Retailer/customer meeting");
  const [tone, setTone] = useState("concise_commercial");
  const [financialSummary, setFinancialSummary] = useState("Yes");
  const [nextStepsSlide, setNextStepsSlide] = useState("Yes");
  const isPro = getUserPlan(aptMode, null, isAuthenticated) === "pro";
  const selectedDeck = useMemo(
    () => deckTypes.find((item) => item.value === deckType) ?? deckTypes[0],
    [deckType],
  );

  function validateOneOffTemplateFile(file: File | undefined) {
    setTemplateError("");
    if (!file) return;
    if (fileExtension(file.name) !== ".pptx") {
      setOneOffTemplateFileName("");
      setTemplateError("Please upload a PowerPoint .pptx file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setOneOffTemplateFileName("");
      setTemplateError("Please upload a PowerPoint .pptx file under 10MB.");
      return;
    }
    setOneOffTemplateFileName(file.name);
  }

  function preventSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
                <button className="button button-secondary button-small" onClick={() => setAptMode("pro")} type="button">
                  Switch to Pro
                </button>
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
              <p className="helper-note">Use a saved template, upload a one-off .pptx file or start from the APT default layout.</p>
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
                    <small>Upload a PowerPoint template for this deck only.</small>
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
                  <FileUploadField
                    accept=".pptx"
                    disabled={!isPro}
                    error={templateError}
                    filename={oneOffTemplateFileName}
                    helper="Upload a PowerPoint template for this deck only."
                    id="one-off-template-deck"
                    label="Upload one-off template"
                    onChange={validateOneOffTemplateFile}
                  />
                  <label className="checkbox-row checkbox-row-disabled">
                    <input disabled type="checkbox" />
                    <span>Also save this to my template library</span>
                  </label>
                  <small className="helper-note">
                    {savedTemplates.length >= 3
                      ? "You already have 3 saved templates. Remove one in Settings to save another."
                      : "Template file storage will be connected next. Save reusable templates from Settings for now."}
                  </small>
                </div>
              ) : null}
            </section>

            <section className="custom-deck-form-section">
              <h2>Supporting data</h2>
              <p className="helper-note">Add spreadsheets, notes or briefing files with the numbers and context for this deck.</p>
              <div className="supporting-data-note">
                <div>
                  <strong>Supporting file upload</strong>
                  <span>Supporting file upload is being prepared. For now, describe the source data in the brief below.</span>
                </div>
                <button className="button button-secondary button-small" disabled type="button">
                  Upload supporting data
                </button>
                <small>Coming soon</small>
              </div>
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
              <div className="form-grid">
                <label className="field">
                  <span>Audience</span>
                  <select value={audience} onChange={(event) => setAudience(event.target.value)}>
                    <option>Internal review</option>
                    <option>Retailer/customer meeting</option>
                    <option>Leadership review</option>
                    <option>Other</option>
                  </select>
                </label>
                <label className="field">
                  <span>Tone</span>
                  <select value={tone} onChange={(event) => setTone(event.target.value)}>
                    {toneOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <small>Choose how polished or detailed the first draft should feel.</small>
                </label>
                <label className="field">
                  <span>Include financial summary</span>
                  <select value={financialSummary} onChange={(event) => setFinancialSummary(event.target.value)}>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </label>
                <label className="field">
                  <span>Include next steps slide</span>
                  <select value={nextStepsSlide} onChange={(event) => setNextStepsSlide(event.target.value)}>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </label>
              </div>
            </section>
          </fieldset>

          <div className="custom-deck-action-area">
            <button className="button" disabled type="button">
              Custom deck generation is being prepared
            </button>
            <p>
              Custom deck generation is being prepared. For now, download the editable templates or use APT Pro
              settings to save your presentation template.
            </p>
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
