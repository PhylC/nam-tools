"use client";

import { useState } from "react";
import { ProductSectionTabs, useAptMode } from "../components/AptMode";

type SupportMode = "soa" | "promoInvoice";

type RoiLine = {
  id: string;
  sku: string;
  product: string;
  currentInvoice: string;
  promoInvoice: string;
  soa: string;
  currentSrp: string;
  promoSrp: string;
  baselineUnits: string;
  promoUnits: string;
  cogs: string;
  fixedSupport: string;
  supportMode: SupportMode;
};

type RoiScenario = {
  id: string;
  name: string;
  lines: RoiLine[];
};

type RoiGroup = {
  id: string;
  name: string;
  scenarios: RoiScenario[];
};

type SavedRoiGroup = RoiGroup & {
  savedAt: string;
};

function initialRoiPlannerState() {
  const group = blankGroup();
  return {
    groups: [group],
    activeGroupId: group.id,
    activeScenarioId: group.scenarios[0]?.id ?? "",
  };
}

const blankLine = (): RoiLine => ({
  id: crypto.randomUUID(),
  sku: "",
  product: "",
  currentInvoice: "",
  promoInvoice: "",
  soa: "",
  currentSrp: "",
  promoSrp: "",
  baselineUnits: "",
  promoUnits: "",
  cogs: "",
  fixedSupport: "",
  supportMode: "promoInvoice",
});

const blankScenario = (name = "Base scenario"): RoiScenario => ({
  id: crypto.randomUUID(),
  name,
  lines: [blankLine()],
});

const blankGroup = (name = "Q4 Retailer Promo Plan"): RoiGroup => ({
  id: crypto.randomUUID(),
  name,
  scenarios: [blankScenario()],
});

function n(value: string) {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function has(value: string) {
  return value.trim() !== "";
}

function money(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function pct(value: number) {
  return Number.isFinite(value)
    ? new Intl.NumberFormat("en-GB", { style: "percent", maximumFractionDigits: 1 }).format(value)
    : "n/a";
}

function calculateLine(line: RoiLine) {
  const currentInvoice = n(line.currentInvoice);
  const supportPerUnit =
    line.supportMode === "soa" ? n(line.soa) : currentInvoice - n(line.promoInvoice);
  const promoInvoice =
    line.supportMode === "soa" ? currentInvoice - supportPerUnit : n(line.promoInvoice);
  const baselineUnits = n(line.baselineUnits);
  const promoUnits = n(line.promoUnits);
  const incrementalUnits = promoUnits - baselineUnits;
  const baselineRevenue = baselineUnits * currentInvoice;
  const promoRevenue = promoUnits * promoInvoice;
  const incrementalRevenue = promoRevenue - baselineRevenue;
  const supportCost = supportPerUnit * promoUnits + n(line.fixedSupport);
  const hasCogs = has(line.cogs);
  const baselineProfit = hasCogs ? (currentInvoice - n(line.cogs)) * baselineUnits : 0;
  const promoProfit = hasCogs ? (promoInvoice - n(line.cogs)) * promoUnits - n(line.fixedSupport) : 0;
  const profitImpact = hasCogs ? promoProfit - baselineProfit : 0;
  const revenueRoi = supportCost !== 0 ? incrementalRevenue / supportCost : 0;
  const profitRoi = hasCogs && supportCost !== 0 ? profitImpact / supportCost : 0;

  return {
    supportPerUnit,
    promoInvoice,
    incrementalUnits,
    baselineRevenue,
    promoRevenue,
    incrementalRevenue,
    supportCost,
    hasCogs,
    baselineProfit,
    promoProfit,
    profitImpact,
    revenueRoi,
    profitRoi,
  };
}

function aggregate(lines: RoiLine[]) {
  return lines.reduce(
    (total, line) => {
      const calc = calculateLine(line);
      total.baselineUnits += n(line.baselineUnits);
      total.promoUnits += n(line.promoUnits);
      total.incrementalUnits += calc.incrementalUnits;
      total.revenueImpact += calc.incrementalRevenue;
      total.supportCost += calc.supportCost;
      total.profitImpact += calc.hasCogs ? calc.profitImpact : 0;
      total.profitRows += calc.hasCogs ? 1 : 0;
      return total;
    },
    {
      baselineUnits: 0,
      promoUnits: 0,
      incrementalUnits: 0,
      revenueImpact: 0,
      supportCost: 0,
      profitImpact: 0,
      profitRows: 0,
    },
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  optional,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
}) {
  return (
    <label className="field">
      <span className="field-label">
        <span>{label}</span>
        <span className={optional ? "field-status" : "field-status field-required"}>
          {optional ? "Optional" : "Required"}
        </span>
      </span>
      <input placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function updateLine(lines: RoiLine[], id: string, patch: Partial<RoiLine>) {
  return lines.map((line) => (line.id === id ? { ...line, ...patch } : line));
}

function RoiLineEditor({
  line,
  onChange,
  onDuplicate,
  onDelete,
}: {
  line: RoiLine;
  onChange: (line: RoiLine) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}) {
  return (
    <article className="mini-card">
      <div className="output-header">
        <div>
          <span className="pill">ROI line</span>
          <h3>{line.product || line.sku || "New line"}</h3>
        </div>
        <div className="summary-actions">
          {onDuplicate ? <button className="button button-secondary button-small" onClick={onDuplicate} type="button">Duplicate</button> : null}
          {onDelete ? <button className="button button-secondary button-small" onClick={onDelete} type="button">Delete</button> : null}
        </div>
      </div>
      <div className="form-grid">
        <Field label="SKU / Model / Item Number" placeholder="e.g. SKU-1001" value={line.sku} onChange={(value) => onChange({ ...line, sku: value })} />
        <Field label="Product name" placeholder="e.g. Core 500ml pack" value={line.product} onChange={(value) => onChange({ ...line, product: value })} />
        <Field label="Current invoice price" placeholder="e.g. 1.75" value={line.currentInvoice} onChange={(value) => onChange({ ...line, currentInvoice: value })} />
        <label className="field">
          <span className="field-label">
            <span>Support input</span>
            <span className="field-status field-required">Required</span>
          </span>
          <select value={line.supportMode} onChange={(event) => onChange({ ...line, supportMode: event.target.value as SupportMode })}>
            <option value="promoInvoice">Promo invoice price</option>
            <option value="soa">SOA / supplier support per unit</option>
          </select>
        </label>
        {line.supportMode === "promoInvoice" ? (
          <Field label="Promo invoice price" placeholder="e.g. 1.40" value={line.promoInvoice} onChange={(value) => onChange({ ...line, promoInvoice: value })} />
        ) : (
          <Field label="SOA / supplier support per unit" placeholder="e.g. 0.35" value={line.soa} onChange={(value) => onChange({ ...line, soa: value })} />
        )}
        <Field label="Current SRP" optional placeholder="e.g. 2.50" value={line.currentSrp} onChange={(value) => onChange({ ...line, currentSrp: value })} />
        <Field label="Promo SRP" optional placeholder="e.g. 2.00" value={line.promoSrp} onChange={(value) => onChange({ ...line, promoSrp: value })} />
        <Field label="Units baseline" placeholder="e.g. 10,000" value={line.baselineUnits} onChange={(value) => onChange({ ...line, baselineUnits: value })} />
        <Field label="Units on promotion" placeholder="e.g. 18,000" value={line.promoUnits} onChange={(value) => onChange({ ...line, promoUnits: value })} />
        <Field label="COGS" optional placeholder="e.g. 1.10" value={line.cogs} onChange={(value) => onChange({ ...line, cogs: value })} />
        <Field label="Fixed support" optional placeholder="e.g. 2,500" value={line.fixedSupport} onChange={(value) => onChange({ ...line, fixedSupport: value })} />
      </div>
    </article>
  );
}

function ResultCards({ line }: { line: RoiLine }) {
  const calc = calculateLine(line);
  const ready =
    has(line.currentInvoice) &&
    (line.supportMode === "soa" ? has(line.soa) : has(line.promoInvoice)) &&
    has(line.baselineUnits) &&
    has(line.promoUnits);

  if (!ready) {
    return <p className="empty-state">Enter the required fields to see your result.</p>;
  }

  return (
    <div className="result-grid">
      <div className="result-item"><span className="result-label">Incremental units</span><strong>{calc.incrementalUnits.toLocaleString("en-GB")}</strong></div>
      <div className="result-item"><span className="result-label">Incremental revenue</span><strong>{money(calc.incrementalRevenue)}</strong></div>
      <div className="result-item"><span className="result-label">Total support cost</span><strong>{money(calc.supportCost)}</strong></div>
      <div className="result-item"><span className="result-label">Revenue ROI</span><strong>{pct(calc.revenueRoi)}</strong></div>
      {calc.hasCogs ? (
        <>
          <div className="result-item"><span className="result-label">Gross profit impact</span><strong>{money(calc.profitImpact)}</strong></div>
          <div className="result-item"><span className="result-label">Profit ROI</span><strong>{pct(calc.profitRoi)}</strong></div>
        </>
      ) : (
        <div className="result-item"><span className="result-label">Profit ROI</span><strong>Add COGS</strong></div>
      )}
    </div>
  );
}

export function RoiFreeTool() {
  const [line, setLine] = useState<RoiLine>(blankLine);

  return (
    <section className="shell section">
      <div className="section-header">
        <p className="eyebrow">Free ROI Tool</p>
        <h2>Single-line promotion ROI check.</h2>
        <p className="section-lead">
          Use this for one SKU, model or item. COGS and fixed support are optional, so you can start with a revenue ROI view and add profit later.
        </p>
      </div>
      <article className="card tool-form">
        <RoiLineEditor line={line} onChange={setLine} />
        <div className="result-box">
          <div className="output-header">
            <div>
              <span className="pill">Free result</span>
              <h3>ROI summary</h3>
            </div>
          </div>
          <ResultCards line={line} />
          <p className="planning-disclaimer">
            Pricing is at the sole discretion of the retailer. Outputs are estimates for planning only.
          </p>
        </div>
      </article>
    </section>
  );
}

function CsvExportButton({ groups }: { groups: RoiGroup[] }) {
  function exportCsv() {
    const rows = [
      [
        "Group",
        "Scenario",
        "SKU / Model / Item Number",
        "Product name",
        "Current invoice price",
        "Promo invoice price",
        "SOA/support per unit",
        "Current SRP",
        "Promo SRP",
        "Baseline units",
        "Promo units",
        "COGS",
        "Fixed support",
        "Incremental units",
        "Revenue impact",
        "Total support cost",
        "Profit impact",
        "Revenue ROI",
        "Profit ROI",
      ],
    ];

    groups.forEach((group) => {
      group.scenarios.forEach((scenario) => {
        scenario.lines.forEach((line) => {
          const calc = calculateLine(line);
          rows.push([
            group.name,
            scenario.name,
            line.sku,
            line.product,
            line.currentInvoice,
            String(calc.promoInvoice),
            String(calc.supportPerUnit),
            line.currentSrp,
            line.promoSrp,
            line.baselineUnits,
            line.promoUnits,
            line.cogs,
            line.fixedSupport,
            String(calc.incrementalUnits),
            String(calc.incrementalRevenue),
            String(calc.supportCost),
            calc.hasCogs ? String(calc.profitImpact) : "",
            String(calc.revenueRoi),
            calc.hasCogs ? String(calc.profitRoi) : "",
          ]);
        });
        const total = aggregate(scenario.lines);
        rows.push([
          group.name,
          `${scenario.name} aggregate`,
          "",
          "SUMMARY",
          "",
          "",
          "",
          "",
          "",
          String(total.baselineUnits),
          String(total.promoUnits),
          "",
          "",
          String(total.incrementalUnits),
          String(total.revenueImpact),
          String(total.supportCost),
          total.profitRows > 0 ? String(total.profitImpact) : "",
          total.supportCost ? String(total.revenueImpact / total.supportCost) : "",
          total.profitRows > 0 && total.supportCost ? String(total.profitImpact / total.supportCost) : "",
        ]);
      });
    });

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "apt-roi-scenarios.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button className="button" onClick={exportCsv} type="button">
      Export CSV
    </button>
  );
}

export function RoiProPlanner() {
  const [plannerState, setPlannerState] = useState(initialRoiPlannerState);
  const { groups, activeGroupId, activeScenarioId } = plannerState;
  const [savedGroups, setSavedGroups] = useState<SavedRoiGroup[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = window.localStorage.getItem("apt-roi-saved-groups");
    if (!saved) return [];
    try {
      return JSON.parse(saved) as SavedRoiGroup[];
    } catch {
      return [];
    }
  });

  function setGroups(nextGroups: RoiGroup[]) {
    setPlannerState((current) => ({
      ...current,
      groups: nextGroups.length ? nextGroups : [blankGroup()],
    }));
  }

  function setActiveGroupId(nextGroupId: string) {
    setPlannerState((current) => ({ ...current, activeGroupId: nextGroupId }));
  }

  function setActiveScenarioId(nextScenarioId: string) {
    setPlannerState((current) => ({ ...current, activeScenarioId: nextScenarioId }));
  }

  function saveLocal() {
    // Temporary local save. Replace with database-backed saved groups after auth is added.
    if (!activeGroup) return;
    const snapshot: SavedRoiGroup = { ...activeGroup, savedAt: new Date().toISOString() };
    const nextSaved = [snapshot, ...savedGroups.filter((group) => group.id !== activeGroup.id)];
    setSavedGroups(nextSaved);
    window.localStorage.setItem("apt-roi-saved-groups", JSON.stringify(nextSaved));
  }

  function loadLocal(groupId: string) {
    const saved = savedGroups.find((group) => group.id === groupId);
    if (!saved) return;
    setPlannerState((current) => {
      const nextGroups = [saved, ...current.groups.filter((group) => group.id !== saved.id)];
      return {
        groups: nextGroups,
        activeGroupId: saved.id,
        activeScenarioId: saved.scenarios[0]?.id ?? "",
      };
    });
  }

  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? groups[0];
  const activeScenario =
    activeGroup?.scenarios.find((scenario) => scenario.id === activeScenarioId) ??
    activeGroup?.scenarios[0];
  const summary = aggregate(activeScenario?.lines ?? []);

  function setActiveScenarioLines(lines: RoiLine[]) {
    setPlannerState((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === activeGroup.id
          ? {
              ...group,
              scenarios: group.scenarios.map((scenario) =>
                scenario.id === activeScenario?.id ? { ...scenario, lines } : scenario,
              ),
            }
          : group,
      ),
    }));
  }

  return (
    <section className="shell section">
      <div className="section-header">
        <p className="eyebrow">Pro Preview</p>
        <h2>Multi-SKU ROI planner.</h2>
        <p className="section-lead">
          Pro Preview helps you plan multi-SKU promotions, compare scenarios and export the numbers for internal sign-off.
        </p>
      </div>

      <div className="grid-two">
        <article className="card">
          <span className="pill pro-pill">Pro Preview</span>
          <h3>Upload spreadsheet to populate fields</h3>
          <input accept=".csv,.xlsx" type="file" />
          <p>
            Spreadsheet mapping workflow prepared — parser to be connected later.
            Suggested columns include SKU, product name, invoice price, promo invoice,
            SOA/support, SRP, baseline units, promo units, COGS and fixed support.
          </p>
        </article>
        <article className="card">
          <span className="pill">Local save for now</span>
          <h3>Save for future</h3>
          <p>Saved locally on this device for now. Account saving will be added with Pro login later.</p>
          <div className="cta-row">
            <button className="button button-secondary" onClick={saveLocal} type="button">Save locally</button>
            <CsvExportButton groups={groups} />
          </div>
          <label className="field">
            <span>Load saved group</span>
            <select defaultValue="" onChange={(event) => loadLocal(event.target.value)}>
              <option value="">Choose a locally saved group</option>
              {savedGroups.map((group) => (
                <option key={`${group.id}-${group.savedAt}`} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
        </article>
      </div>

      <article className="card tool-form">
        <div className="output-header">
          <div>
            <span className="pill pro-pill">Scenario groups</span>
            <h3>{activeGroup?.name}</h3>
          </div>
          <div className="summary-actions">
            <button className="button button-secondary button-small" onClick={() => setGroups([...groups, blankGroup(`Group ${groups.length + 1}`)])} type="button">Add group</button>
            <button className="button button-secondary button-small" onClick={() => activeGroup && setGroups(groups.map((group) => group.id === activeGroup.id ? { ...group, id: crypto.randomUUID(), name: `${group.name} copy`, scenarios: group.scenarios.map((scenario) => ({ ...scenario, id: crypto.randomUUID(), lines: scenario.lines.map((line) => ({ ...line, id: crypto.randomUUID() })) })) } : group))} type="button">Duplicate group</button>
          </div>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Load saved group</span>
            <select value={activeGroup?.id ?? ""} onChange={(event) => {
              setActiveGroupId(event.target.value);
              const nextGroup = groups.find((group) => group.id === event.target.value);
              setActiveScenarioId(nextGroup?.scenarios[0]?.id ?? "");
            }}>
              {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select>
          </label>
          <Field label="Rename group" value={activeGroup?.name ?? ""} onChange={(value) => setGroups(groups.map((group) => group.id === activeGroup.id ? { ...group, name: value } : group))} />
        </div>

        <div className="output-header">
          <div>
            <span className="pill pro-pill">Scenarios</span>
            <h3>{activeScenario?.name}</h3>
          </div>
          <div className="summary-actions">
            <button className="button button-secondary button-small" onClick={() => activeGroup && setGroups(groups.map((group) => group.id === activeGroup.id ? { ...group, scenarios: [...group.scenarios, blankScenario(`Scenario ${group.scenarios.length + 1}`)] } : group))} type="button">Add scenario</button>
            <button className="button button-secondary button-small" onClick={() => activeGroup && activeScenario && setGroups(groups.map((group) => group.id === activeGroup.id ? { ...group, scenarios: [...group.scenarios, { ...activeScenario, id: crypto.randomUUID(), name: `${activeScenario.name} copy`, lines: activeScenario.lines.map((line) => ({ ...line, id: crypto.randomUUID() })) }] } : group))} type="button">Duplicate scenario</button>
            <button className="button button-secondary button-small" onClick={() => activeGroup && activeScenario && setGroups(groups.map((group) => group.id === activeGroup.id ? { ...group, scenarios: group.scenarios.filter((scenario) => scenario.id !== activeScenario.id) } : group))} type="button">Delete scenario</button>
          </div>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Scenario</span>
            <select value={activeScenario?.id ?? ""} onChange={(event) => setActiveScenarioId(event.target.value)}>
              {activeGroup?.scenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.name}</option>)}
            </select>
          </label>
          <Field label="Rename scenario" value={activeScenario?.name ?? ""} onChange={(value) => setGroups(groups.map((group) => group.id === activeGroup.id ? { ...group, scenarios: group.scenarios.map((scenario) => scenario.id === activeScenario?.id ? { ...scenario, name: value } : scenario) } : group))} />
        </div>

        <div className="result-box">
          <div className="output-header">
            <h3>Aggregate summary</h3>
            <button className="button button-secondary button-small" onClick={() => setActiveScenarioLines([...(activeScenario?.lines ?? []), blankLine()])} type="button">Add line</button>
          </div>
          <div className="result-grid">
            <div className="result-item"><span className="result-label">Total baseline units</span><strong>{summary.baselineUnits.toLocaleString("en-GB")}</strong></div>
            <div className="result-item"><span className="result-label">Total promo units</span><strong>{summary.promoUnits.toLocaleString("en-GB")}</strong></div>
            <div className="result-item"><span className="result-label">Total incremental units</span><strong>{summary.incrementalUnits.toLocaleString("en-GB")}</strong></div>
            <div className="result-item"><span className="result-label">Total revenue impact</span><strong>{money(summary.revenueImpact)}</strong></div>
            <div className="result-item"><span className="result-label">Total support cost</span><strong>{money(summary.supportCost)}</strong></div>
            <div className="result-item"><span className="result-label">Overall ROI</span><strong>{pct(summary.supportCost ? summary.revenueImpact / summary.supportCost : 0)}</strong></div>
            <div className="result-item"><span className="result-label">Total profit impact</span><strong>{summary.profitRows ? money(summary.profitImpact) : "Add COGS"}</strong></div>
          </div>
        </div>

        {(activeScenario?.lines ?? []).map((line) => (
          <RoiLineEditor
            key={line.id}
            line={line}
            onChange={(nextLine) => setActiveScenarioLines(updateLine(activeScenario?.lines ?? [], line.id, nextLine))}
            onDelete={() => setActiveScenarioLines((activeScenario?.lines ?? []).filter((item) => item.id !== line.id))}
            onDuplicate={() => setActiveScenarioLines([...(activeScenario?.lines ?? []), { ...line, id: crypto.randomUUID(), sku: `${line.sku} copy` }])}
          />
        ))}
      </article>
    </section>
  );
}

export function RoiToolProduct() {
  const { aptMode } = useAptMode();

  return (
    <>
      <section className="shell section">
        <ProductSectionTabs />
      </section>
      <RoiFreeTool />
      {aptMode === "pro" ? (
        <RoiProPlanner />
      ) : (
        <section className="shell section">
          <article className="card split-band">
            <div>
              <p className="eyebrow">Pro Preview</p>
              <h2>Plan multi-SKU promotions and export the numbers.</h2>
              <p>
                Switch the header toggle to Pro Preview to try local scenario groups,
                multiple lines, CSV export and device-only saving.
              </p>
            </div>
            <span className="pill pro-pill">Future account feature</span>
          </article>
        </section>
      )}
    </>
  );
}
