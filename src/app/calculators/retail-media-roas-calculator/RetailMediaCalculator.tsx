"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { isAnalyticsEnabled, trackCalculatorCompleted, trackCalculatorOpened } from "../../../lib/analytics";
import { calculateRetailMediaReturn, retailMediaRoasName, retailMediaRoasSlug } from "../../../lib/retailMediaRoas";
import { LoadExampleButton } from "../../components/LoadExampleButton";
import styles from "./calculator.module.css";

type Mode = "direct" | "scenario";
type AmountKey = "attributedRetailSales" | "adSpend" | "fees" | "contributionMarginPercent" | "supplierSales";
type Inputs = Record<AmountKey, string>;
type Result = ReturnType<typeof calculateRetailMediaReturn>;

const initialInputs: Inputs = {
  attributedRetailSales: "", adSpend: "", fees: "", contributionMarginPercent: "", supplierSales: "",
};
const example: Inputs = {
  attributedRetailSales: "20000", adSpend: "5000", fees: "1000", contributionMarginPercent: "40", supplierSales: "8000",
};
const currencies = ["GBP", "EUR", "USD", "CAD", "AUD"];
const number = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 });

function run(inputs: Inputs, mode: Mode) {
  const campaign = {
    attributedRetailSales: Number(inputs.attributedRetailSales),
    adSpend: Number(inputs.adSpend),
    fees: Number(inputs.fees),
    contributionMarginPercent: Number(inputs.contributionMarginPercent),
  };
  const sales = Number(inputs.supplierSales);
  return calculateRetailMediaReturn(campaign, mode === "direct"
    ? { incrementalSupplierSales: sales }
    : { attributedSupplierSales: sales });
}

export function RetailMediaCalculator() {
  const [inputs, setInputs] = useState(initialInputs);
  const [mode, setMode] = useState<Mode>("direct");
  const [currency, setCurrency] = useState("GBP");
  const [result, setResult] = useState<Result | null>(null);
  const [exampleShown, setExampleShown] = useState(false);
  const completed = useRef(false);

  useEffect(() => { trackCalculatorOpened(retailMediaRoasSlug, retailMediaRoasName); }, []);

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(run(inputs, mode));
    if (!exampleShown && !completed.current && isAnalyticsEnabled()) {
      trackCalculatorCompleted(retailMediaRoasSlug, retailMediaRoasName);
      completed.current = true;
    }
  }

  function loadExample() {
    setMode("direct");
    setCurrency("GBP");
    setInputs(example);
    setResult(run(example, "direct"));
    setExampleShown(true);
  }

  function field(key: AmountKey, label: string, help: string, min?: number, max?: number) {
    return (
      <label className="field">
        <span className="field-label">{label}</span>
        <input type="number" inputMode="decimal" step="any" min={min} max={max}
          value={inputs[key]} required={key !== "fees"} aria-describedby={`retail-media-${key}-help`}
          onChange={(event) => {
            setInputs({ ...inputs, [key]: event.target.value });
            setResult(null);
            setExampleShown(false);
          }} />
        <span className="field-help" id={`retail-media-${key}-help`}>{help}</span>
      </label>
    );
  }

  const moneyFormat = new Intl.NumberFormat("en-GB", { style: "currency", currency });
  const money = (value: number | null) => value === null ? "Unavailable" : moneyFormat.format(value);
  const ratio = (value: number | null) => value === null ? "Unavailable" : `${number.format(value)}×`;
  const percent = (value: number | null) => value === null ? "Unavailable" : `${number.format(value)}%`;

  return (
    <section className="shell" id="calculator" aria-labelledby="retail-media-form-title">
      <div className="card calculator-guide-card">
        <h2 id="retail-media-form-title">Calculate retail media return</h2>
        <p>Use the same currency throughout. Enter supplier sales and campaign costs excluding recoverable tax.</p>
        <form onSubmit={calculate}>
          <div className="form-grid">
            <label className="field">
              <span className="field-label">Currency</span>
              <select value={currency} onChange={(event) => {
                setCurrency(event.target.value);
                setResult(null);
              }}>
                {currencies.map((code) => <option key={code}>{code}</option>)}
              </select>
            </label>
            {field("attributedRetailSales", "Retailer-attributed sales", "Use the sales value from the retailer’s campaign report.", 0)}
            {field("adSpend", "Media spend", "Use the ad spend used in that report.", 0)}
            {field("fees", "Other campaign costs", "Optional. Include fees or campaign costs you haven’t already counted.", 0)}
            {field("contributionMarginPercent", "Supplier contribution margin (%)", "Use your margin after variable costs and before the campaign costs entered above.", undefined, 100)}
            <label className="field">
              <span className="field-label">Supplier sales estimate</span>
              <select value={mode} onChange={(event) => {
                setMode(event.target.value as Mode);
                setInputs({ ...inputs, supplierSales: "" });
                setResult(null);
                setExampleShown(false);
              }}>
                <option value="direct">Use an incremental supplier sales estimate</option>
                <option value="scenario">Compare incrementality scenarios</option>
              </select>
            </label>
            {mode === "direct"
              ? field("supplierSales", "Incremental supplier net sales", "Enter the increase over the expected baseline. Enter a negative amount if sales fell.")
              : field("supplierSales", "Supplier net sales equivalent", "Enter the supplier net revenue for the retailer-attributed units. Use your net invoice values, excluding tax.", 0)}
          </div>
          <div className={styles.actions}>
            <button className="button" type="submit">Calculate return</button>
            <LoadExampleButton compact={false} label="Load worked example" onLoad={loadExample} />
          </div>
        </form>
        <div aria-live="polite">
          {result && (
            <div className={styles.results}>
              <h3>{exampleShown ? "Worked example results" : "Campaign results"}</h3>
              <dl className={styles.metrics}>
                <div><dt>Reported ROAS</dt><dd>{ratio(result.roas)}</dd></div>
                <div><dt>Total campaign cost</dt><dd>{money(result.campaignCost)}</dd></div>
                <div><dt>Break-even incremental supplier sales</dt><dd>{money(result.breakEvenSupplierSales)}</dd></div>
                {result.outcome && <>
                  <div><dt>Estimated campaign profit</dt><dd>{money(result.outcome.profit)}</dd></div>
                  <div><dt>Estimated campaign ROI</dt><dd>{percent(result.outcome.roiPercent)}</dd></div>
                </>}
              </dl>
              {result.roas === null && <p>ROAS requires media spend above zero.</p>}
              {result.breakEvenSupplierSales === null && <p>Sales can cover campaign cost only when contribution margin is positive.</p>}
              {result.campaignCost === 0 && <p>ROI requires a campaign cost above zero.</p>}
              {result.scenarios.length > 0 && (
                <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="Incrementality scenarios">
                  <table>
                    <caption>Illustrative incrementality scenarios</caption>
                    <thead><tr><th scope="col">Incremental share</th><th scope="col">Supplier sales lift</th><th scope="col">Profit</th><th scope="col">ROI</th></tr></thead>
                    <tbody>{result.scenarios.map((row) => (
                      <tr key={row.share}>
                        <th scope="row">{row.share}%</th>
                        <td>{money(row.supplierSales)}</td><td>{money(row.profit)}</td><td>{percent(row.roiPercent)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
