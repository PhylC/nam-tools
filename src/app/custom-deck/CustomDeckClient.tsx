"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useAptMode } from "../components/AptMode";

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

const allowedSupportingExtensions = [".xlsx", ".csv", ".pdf", ".docx", ".txt"];

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
      <p>{helper}</p>
      <label className={disabled ? "button button-secondary button-small file-button file-button-disabled" : "button button-secondary button-small file-button"} htmlFor={id}>
        Select file
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
  );
}

export function CustomDeckClient({ selectedTemplate }: { selectedTemplate: string }) {
  const { aptMode, setAptMode } = useAptMode();
  const initialTemplate = normaliseTemplate(selectedTemplate);
  const [deckType, setDeckType] = useState(
    deckTypes.some((item) => item.value === initialTemplate) ? initialTemplate : "jbp",
  );
  const [templateFileName, setTemplateFileName] = useState("");
  const [supportingFileName, setSupportingFileName] = useState("");
  const [templateError, setTemplateError] = useState("");
  const [supportingError, setSupportingError] = useState("");
  const [brief, setBrief] = useState("");
  const [audience, setAudience] = useState("Retailer/customer meeting");
  const [tone, setTone] = useState("Concise and commercial");
  const [financialSummary, setFinancialSummary] = useState("Yes");
  const [nextStepsSlide, setNextStepsSlide] = useState("Yes");
  const isPro = aptMode === "pro";
  const selectedDeck = useMemo(
    () => deckTypes.find((item) => item.value === deckType) ?? deckTypes[0],
    [deckType],
  );

  function validateTemplateFile(file: File | undefined) {
    setTemplateError("");
    if (!file) return;
    if (fileExtension(file.name) !== ".pptx") {
      setTemplateFileName("");
      setTemplateError("Please upload a PowerPoint .pptx file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setTemplateFileName("");
      setTemplateError("Please upload a supported file under 10MB.");
      return;
    }
    setTemplateFileName(file.name);
  }

  function validateSupportingFile(file: File | undefined) {
    setSupportingError("");
    if (!file) return;
    const extension = fileExtension(file.name);
    if (!allowedSupportingExtensions.includes(extension) || file.size > MAX_FILE_BYTES) {
      setSupportingFileName("");
      setSupportingError("Please upload a supported file under 10MB.");
      return;
    }
    setSupportingFileName(file.name);
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
              <div>
                <p className="eyebrow">Choose deck type</p>
                <h2>Deck setup</h2>
              </div>
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
              <div>
                <p className="eyebrow">Upload files</p>
                <h2>Files to follow</h2>
              </div>
              <div className="grid-two">
                <FileUploadField
                  accept=".pptx"
                  disabled={!isPro}
                  error={templateError}
                  filename={templateFileName}
                  helper="Upload your standard PowerPoint template or an existing deck you want APT to follow."
                  id="company-template-deck"
                  label="Upload company or template deck"
                  onChange={validateTemplateFile}
                />
                <FileUploadField
                  accept=".xlsx,.csv,.pdf,.docx,.txt"
                  disabled={!isPro}
                  error={supportingError}
                  filename={supportingFileName}
                  helper="File handling is being prepared. For now, use the brief field below to describe the source data."
                  id="supporting-data"
                  label="Upload supporting data"
                  onChange={validateSupportingFile}
                />
              </div>
            </section>

            <section className="custom-deck-form-section">
              <div>
                <p className="eyebrow">Brief</p>
                <h2>Deck brief</h2>
              </div>
              <label className="field">
                <span>Deck brief</span>
                <textarea
                  placeholder="Tell APT what the deck is for, who the audience is, the customer/retailer, key objectives, important numbers and anything that must be included."
                  value={brief}
                  onChange={(event) => setBrief(event.target.value)}
                />
                <small>The better the brief, the stronger the first draft.</small>
              </label>
            </section>

            <section className="custom-deck-form-section">
              <div>
                <p className="eyebrow">Output preferences</p>
                <h2>Preferences</h2>
              </div>
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
                    <option>Concise and commercial</option>
                    <option>Detailed and analytical</option>
                    <option>Retailer-facing</option>
                  </select>
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
