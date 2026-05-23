"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useAptMode } from "../components/AptMode";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";
import { uploadDeckTemplate } from "../../lib/storageUploads";
import {
  CalculatorDefaults,
  defaultCalculatorDefaults,
  defaultExportDefaults,
  ExportDefaults,
  PRESENTATION_TEMPLATE_LIMIT_BYTES,
  PresentationTemplateMeta,
  readCalculatorDefaults,
  readExportDefaults,
  readPresentationTemplateMeta,
  saveCalculatorDefaults,
  saveExportDefaults,
  savePresentationTemplateMeta,
} from "../../lib/proSettings";

const currencies = ["GBP", "EUR", "USD"];
const markets = ["UK", "Ireland", "United States", "Europe", "Other"];
const taxBasisOptions = [
  { label: "Includes sales tax / VAT / IVA", value: "includes_tax" },
  { label: "Excludes sales tax / VAT / IVA", value: "excludes_tax" },
] as const;
const taxLabels = ["VAT", "Sales tax", "IVA", "Custom"] as const;
const cogsOptions = [
  { label: "Ask when needed", value: "ask_when_needed" },
  { label: "Usually include COGS", value: "usually_include_cogs" },
  { label: "Hide unless I turn it on", value: "hide_unless_enabled" },
] as const;
const supportTerms = ["SOA", "Trade spend", "Promo support", "Funding", "Custom"] as const;
const exportFormats = [
  { label: "PowerPoint", value: "powerpoint" },
  { label: "Excel", value: "excel" },
  { label: "PDF", value: "pdf" },
] as const;

type Message = { tone: "success" | "error" | "info"; text: string } | null;

export function SettingsClient() {
  const { aptMode, setAptMode } = useAptMode();
  const { user, isAuthenticated } = useSupabaseAuth();
  const [calculatorDefaults, setCalculatorDefaults] = useState<CalculatorDefaults>(() => readCalculatorDefaults());
  const [exportDefaults, setExportDefaults] = useState<ExportDefaults>(() => readExportDefaults());
  const [templateMeta, setTemplateMeta] = useState<PresentationTemplateMeta>(() => readPresentationTemplateMeta());
  const [message, setMessage] = useState<Message>(null);
  const isPro = aptMode === "pro";

  const uploadedTemplateLabel = useMemo(() => {
    if (!templateMeta) return "No template uploaded";
    const date = new Date(templateMeta.uploadedAt);
    return `${templateMeta.filename} · ${date.toLocaleDateString("en-GB")}`;
  }, [templateMeta]);

  function updateCalculatorDefaults(next: CalculatorDefaults, text?: string) {
    setCalculatorDefaults(next);
    saveCalculatorDefaults(next);
    setMessage(text ? { tone: "success", text } : null);
  }

  function updateExportDefaults(next: ExportDefaults, text?: string) {
    setExportDefaults(next);
    saveExportDefaults(next);
    setMessage(text ? { tone: "success", text } : null);
  }

  function handleLogoFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    // TODO: Upload company logos to authenticated Pro profile storage when account settings are connected.
    updateExportDefaults({ ...exportDefaults, companyLogoFilename: file.name }, "Logo selected.");
  }

  async function handleTemplateFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pptx")) {
      setMessage({ tone: "error", text: "Please upload a PowerPoint .pptx template." });
      return;
    }

    if (file.size > PRESENTATION_TEMPLATE_LIMIT_BYTES) {
      setMessage({ tone: "error", text: "Please upload a .pptx file under 10MB." });
      return;
    }

    let storagePath: string | null = null;
    if (isAuthenticated && user) {
      // TODO: Persist this storage path against the authenticated Pro user profile.
      const upload = await uploadDeckTemplate(file, user.id);
      storagePath = upload.path;
    }

    const next = {
      filename: file.name,
      uploadedAt: new Date().toISOString(),
      size: file.size,
      storagePath,
    };
    setTemplateMeta(next);
    savePresentationTemplateMeta(next);
    setMessage({
      tone: "success",
      text: storagePath
        ? "Presentation template uploaded."
        : "Presentation template selected. It will be used when custom presentation exports are connected.",
    });
  }

  function removeTemplate() {
    setTemplateMeta(null);
    savePresentationTemplateMeta(null);
    setMessage({ tone: "success", text: "Presentation template removed." });
  }

  function resetSettings() {
    setCalculatorDefaults(defaultCalculatorDefaults);
    setExportDefaults(defaultExportDefaults);
    saveCalculatorDefaults(defaultCalculatorDefaults);
    saveExportDefaults(defaultExportDefaults);
    setMessage({ tone: "success", text: "Settings reset." });
  }

  return (
    <section className="shell section">
      <div className="settings-layout">
        {!isPro ? (
          <article className="card pro-upgrade-panel">
            <div>
              <span className="pill">Free</span>
              <h3>Saved account defaults are included with APT Pro.</h3>
              <p>Free calculators still work — you’ll just set these manually where needed.</p>
            </div>
            <button className="button button-small" onClick={() => setAptMode("pro")} type="button">
              Switch to Pro
            </button>
          </article>
        ) : null}

        <article className="card settings-card">
          <div className="settings-card-header">
            <div>
              <p className="eyebrow">Calculator defaults</p>
              <h2>Save your usual calculator setup.</h2>
            </div>
            <button className="button button-secondary button-small" onClick={resetSettings} type="button">
              Reset
            </button>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Default currency</span>
              <select
                value={calculatorDefaults.currency}
                onChange={(event) => updateCalculatorDefaults({ ...calculatorDefaults, currency: event.target.value })}
              >
                {currencies.map((currency) => (
                  <option key={currency}>{currency}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Default country / market</span>
              <select
                value={calculatorDefaults.market}
                onChange={(event) => updateCalculatorDefaults({ ...calculatorDefaults, market: event.target.value })}
              >
                {markets.map((market) => (
                  <option key={market}>{market}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Default retail price tax basis</span>
              <select
                value={calculatorDefaults.retailTaxBasis}
                onChange={(event) =>
                  updateCalculatorDefaults({
                    ...calculatorDefaults,
                    retailTaxBasis: event.target.value as CalculatorDefaults["retailTaxBasis"],
                  })
                }
              >
                {taxBasisOptions.map((basis) => (
                  <option key={basis.value} value={basis.value}>
                    {basis.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Default sales tax / VAT / IVA rate %</span>
              <input
                min="0"
                step="0.01"
                type="number"
                value={calculatorDefaults.taxRate}
                onChange={(event) =>
                  updateCalculatorDefaults({ ...calculatorDefaults, taxRate: Number(event.target.value) || 0 })
                }
              />
            </label>
            <label className="field">
              <span>Default tax label</span>
              <select
                value={calculatorDefaults.taxLabel}
                onChange={(event) =>
                  updateCalculatorDefaults({
                    ...calculatorDefaults,
                    taxLabel: event.target.value as CalculatorDefaults["taxLabel"],
                  })
                }
              >
                {taxLabels.map((label) => (
                  <option key={label}>{label}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>COGS behaviour</span>
              <select
                value={calculatorDefaults.cogsBehaviour}
                onChange={(event) =>
                  updateCalculatorDefaults({
                    ...calculatorDefaults,
                    cogsBehaviour: event.target.value as CalculatorDefaults["cogsBehaviour"],
                  })
                }
              >
                {cogsOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Support terminology</span>
              <select
                value={calculatorDefaults.supportTerminology}
                onChange={(event) =>
                  updateCalculatorDefaults({
                    ...calculatorDefaults,
                    supportTerminology: event.target.value as CalculatorDefaults["supportTerminology"],
                  })
                }
              >
                {supportTerms.map((term) => (
                  <option key={term}>{term}</option>
                ))}
              </select>
            </label>
          </div>
        </article>

        <article className="card settings-card">
          <div className="settings-card-header">
            <div>
              <p className="eyebrow">Export defaults</p>
              <h2>Use consistent export details.</h2>
            </div>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Company name</span>
              <input
                value={exportDefaults.companyName}
                onChange={(event) => updateExportDefaults({ ...exportDefaults, companyName: event.target.value })}
              />
            </label>
            <label className="field">
              <span>User name</span>
              <input
                value={exportDefaults.userName}
                onChange={(event) => updateExportDefaults({ ...exportDefaults, userName: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Job title</span>
              <input
                value={exportDefaults.jobTitle}
                onChange={(event) => updateExportDefaults({ ...exportDefaults, jobTitle: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Company logo upload</span>
              <input accept="image/png,image/jpeg,image/svg+xml" type="file" onChange={handleLogoFile} />
              <small>{exportDefaults.companyLogoFilename || "No logo selected"}</small>
            </label>
            <label className="field">
              <span>Default export format</span>
              <select
                value={exportDefaults.defaultExportFormat}
                onChange={(event) =>
                  updateExportDefaults({
                    ...exportDefaults,
                    defaultExportFormat: event.target.value as ExportDefaults["defaultExportFormat"],
                  })
                }
              >
                {exportFormats.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Default disclaimer</span>
            <textarea
              value={exportDefaults.disclaimer}
              onChange={(event) => updateExportDefaults({ ...exportDefaults, disclaimer: event.target.value })}
            />
          </label>
        </article>

        <article className={`card settings-card presentation-template-card ${!isPro ? "settings-locked" : ""}`}>
          <div className="settings-card-header">
            <div>
              <p className="eyebrow">Presentation template</p>
              <h2>Presentation template</h2>
            </div>
            <span className="pill pro-pill">Pro</span>
          </div>
          <p>
            Upload your standard PowerPoint template so APT can use your preferred format for presentation exports.
          </p>
          {!isPro ? (
            <div className="locked-card">
              <strong>Presentation template uploads are included with APT Pro.</strong>
            </div>
          ) : (
            <div className="template-upload-panel">
              <div>
                <strong>{uploadedTemplateLabel}</strong>
                <small>.pptx only · maximum 10MB</small>
              </div>
              <div className="cta-row">
                <label className="button button-secondary button-small">
                  {templateMeta ? "Replace template" : "Upload template"}
                  <input className="visually-hidden" accept=".pptx" type="file" onChange={handleTemplateFile} />
                </label>
                {templateMeta ? (
                  <button className="button button-secondary button-small" onClick={removeTemplate} type="button">
                    Remove template
                  </button>
                ) : null}
              </div>
              <p className="helper-note">
                Use a clean template with your preferred title slide, section slide and content slide layouts. APT will use it as the
                starting point for future presentation exports.
              </p>
            </div>
          )}
        </article>

        {message ? <p className={`settings-message settings-message-${message.tone}`}>{message.text}</p> : null}
      </div>
    </section>
  );
}
