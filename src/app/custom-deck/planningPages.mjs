import { at, money, normalizedRows, readNumber, signedMoney, units } from "./deckBenchmarkFormat.mjs";
import { planningConfig } from "./planningBenchmarks.mjs";

const cases = ["Downside", "Expected", "Upside"];
const scenarioColumns = ["Measure", ...cases];
const scenarioWidths = [.36, .21, .21, .22];
const confidence = ["low", "medium", "high"];
const initialTitles = {
  "range-review": "Range decision and shopper benefit",
  "product-launch": "Listing decision and shopper proposition",
  "category-opportunity": "Retailer opportunity and decision",
  "account-plan": "Account priorities and internal decision",
  "annual-planning": "Annual priorities and funding decision",
  "buyer-meeting": "Meeting objective and desired outcome",
  "buyer-meeting-external": "Proposal and decision requested",
};
const wholeFields = ["stores", "weeks", "gainedUnits", "displacedUnits"];

export function planningPages(kind, data, { financial = true, next = true } = {}) {
  const config = planningConfig[kind];
  const pages = [];
  const errors = [];
  const notes = [];
  const narrative = (title, guidance, records, execution = false) => {
    const rows = records.filter(([, value]) => value);
    if (rows.length) pages.push({ title, guidance, rows, execution });
  };
  const table = (title, guidance, headers, rows, widths, execution = false, keepLabels = false) => {
    const count = Math.ceil(rows.length / 4);
    for (let index = 0; index < count; index++) {
      pages.push({
        title: count > 1 ? `${title} (${index + 1} of ${count})` : title,
        guidance, headers, rows: rows.slice(index * 4, index * 4 + 4), widths, execution, keepLabels,
      });
    }
  };
  const addChart = (title, guidance, points) => {
    if (points.length > 1 && points.some(({ value }) => value)) pages.push({ title, guidance, chart: points });
  };

  narrative(initialTitles[kind], "State the decision, scope and commercial benefit up front.", [
    ["Decision requested", at(data, "decision")], ["Scope", at(data, "scope")],
    [kind === "account-plan" || kind === "annual-planning" ? "Priority" : "Retailer benefit", at(data, "benefit")],
  ]);
  narrative("Evidence and assumptions", "Give the source, period and assumptions that support the decision.", [["Evidence", at(data, "evidence")]]);

  const values = Object.fromEntries((financial ? config.numeric : []).map(({ key, label }) => {
    const value = readNumber(at(data, key), wholeFields.includes(key));
    if (Number.isNaN(value) || value < 0 || (["stores", "weeks"].includes(key) && value === 0)) {
      errors.push(`Enter a valid value for ${label}.`);
    }
    return [key, value];
  }));
  const someValues = Object.values(values).some((value) => value !== null);
  const groups = config.groups.filter((entry) => (financial || !entry.financial) && (next || !entry.next));
  const groupRows = Object.fromEntries(groups.map((entry) => {
    const rows = normalizedRows(data, entry.key, entry.labels.length);
    if (rows.some((row) => row.some((cell) => !cell))) errors.push(`Complete each row in ${entry.title.toLowerCase()} or remove it.`);
    return [entry.key, rows];
  }));

  if (kind === "range-review" && someValues) {
    const { gainedUnits, displacedUnits } = values;
    if (![gainedUnits, displacedUnits].every(Number.isFinite)) errors.push("Enter both units gained and units displaced. Enter zero if no displacement is assumed.");
    else {
      const net = gainedUnits - displacedUnits;
      const summary = `${units.format(net)} net incremental units after displacement`;
      notes.push(summary + ".");
      table("Range change and displacement", "Compare the same stores and weeks. Check contribution separately before rollout.",
        ["Forecast movement", "Units"], [
          ["Forecast gained", units.format(gainedUnits)], ["Forecast displaced", units.format(displacedUnits)], ["Net incremental units", units.format(net)],
        ], [.64,.36], false, true);
    }
  }

  if ((kind === "product-launch" || kind === "category-opportunity") && someValues) {
    const { stores, weeks, downsideRate, expectedRate, upsideRate, unitValue, marketValue } = values;
    const category = kind === "category-opportunity";
    const rates = [downsideRate, expectedRate, upsideRate];
    const hasRetailForecast = [stores, weeks, ...rates, ...(category ? [unitValue] : [])].some((value) => value !== null);
    if (category && Number.isFinite(marketValue)) {
      narrative("Total category opportunity", "State the market definition and source. The retailer forecast uses its own addressable store base.", [["Market opportunity", money(marketValue)]]);
    }
    if (hasRetailForecast) {
      if (![stores, weeks, expectedRate, ...(category ? [unitValue] : [])].every(Number.isFinite)) {
        errors.push(category ? "Enter eligible stores, weeks, expected incremental rate and retail value per unit." : "Enter ranged stores, weeks on shelf and the expected rate of sale.");
      } else if ((downsideRate !== null && downsideRate > expectedRate) || (upsideRate !== null && upsideRate < expectedRate)) {
        errors.push("Put downside, expected and upside rates in ascending order.");
      } else {
        const volumes = rates.map((rate) => rate === null ? null : Math.round(stores * weeks * rate));
        const figures = category ? volumes.map((volume) => volume === null ? null : volume * unitValue) : volumes;
        const display = category ? money : units.format;
        if (figures.some((value) => value !== null && !Number.isSafeInteger(Math.round(value * 100)))) errors.push("The forecast is too large to calculate. Check the inputs.");
        else {
          const result = category ? `${display(figures[1])} expected retailer sales value` : `${display(figures[1])} units in the expected launch case`;
          notes.push(result + ".");
          const rows = [
            [category ? "Incremental units / store / week" : "Units / store / week", ...rates.map((rate) => rate === null ? "—" : units.format(rate))],
            [category ? "Incremental retailer units" : "Forecast launch units", ...volumes.map((volume) => volume === null ? "—" : units.format(volume))],
          ];
          if (category) rows.push(["Incremental retail sales", ...figures.map((value) => value === null ? "—" : money(value))]);
          table(category ? "Retailer opportunity scenarios" : "Launch forecast by scenario",
            `${units.format(stores)} ${category ? "eligible" : "ranged"} stores × ${units.format(weeks)} weeks${category ? ` · ${money(unitValue)} per incremental unit` : ""}.`,
            scenarioColumns, rows, scenarioWidths, false, true);
          addChart(category ? "Retailer sales opportunity by scenario" : "Expected launch volume range",
            category ? "Value is limited to the stated retailer scope." : "Bars show units across the stated launch window.",
            figures.flatMap((value, index) => value === null ? [] : [{ label: cases[index], value, display: display(value) }]));
          if (category && Number.isFinite(marketValue) && figures[1] > marketValue) {
            notes.push("Expected retailer value exceeds the category estimate. Check the scope, period and value basis before sharing.");
          }
        }
      }
    }
  }

  if (kind === "annual-planning" && financial) {
    const { priorPlan, priorActual, nextTarget, envelope } = values;
    const validSales = [priorPlan, priorActual, nextTarget].every(Number.isFinite);
    if ([priorPlan, priorActual, nextTarget].some((value) => value !== null) && !validSales) errors.push("Enter prior-year plan, actual and next-year target on the same net sales basis.");
    if (validSales) {
      notes.push(`Last year closed ${signedMoney(priorActual - priorPlan)} versus plan. The new target requires ${signedMoney(nextTarget - priorActual)} versus actual.`);
      table("Prior-year performance and new target", "Compare supplier net sales using the same reporting basis.", ["Measure", "Value"], [
        ["Prior-year net sales plan", money(priorPlan)], ["Prior-year net sales actual", money(priorActual)],
        ["Actual vs plan", signedMoney(priorActual - priorPlan)], ["Next-year net sales target", money(nextTarget)],
      ], [.62,.38], false, true);
    }
    if (groupRows.drivers.length && !validSales) errors.push("Enter the sales plan, actual and target to reconcile the growth drivers.");
    if (groupRows.investment.length && !Number.isFinite(envelope)) errors.push("Enter the investment envelope to reconcile funding.");
    if (Number.isFinite(envelope) && !groupRows.investment.length) narrative("Investment envelope", "Record the overall budget for approval.", [["Proposed envelope", money(envelope)]]);
  }

  for (const entry of groups) {
    let rows = groupRows[entry.key];
    let guidance = entry.guidance;
    if (rows.length && (entry.rank || (kind === "annual-planning" && entry.financial))) {
      const allowNegative = entry.key === "drivers";
      let priced = rows.map((row) => ({ row, amount: readNumber(row[1]) }));
      if (priced.some(({ amount }) => !Number.isFinite(amount) || (!allowNegative && amount < 0))) {
        errors.push(`Enter a ${allowNegative ? "signed" : "non-negative"} amount on each row in ${entry.title.toLowerCase()}.`);
      } else {
        if (entry.rank) {
          const rank = (row) => confidence.indexOf(row[2].toLowerCase());
          if (priced.some(({ row }) => rank(row) === -1)) errors.push("Use High, Medium or Low confidence for each opportunity.");
          priced = priced.sort((a, b) => b.amount - a.amount || rank(b.row) - rank(a.row));
        }
        else {
          const total = priced.reduce((sum, { amount }) => sum + Math.round(amount * 100), 0) / 100;
          const target = entry.key === "drivers" ? values.nextTarget - values.priorActual : values.envelope;
          if (Math.round(target * 100) !== Math.round(total * 100)) {
            errors.push(`${entry.title} total ${money(total)}. Reconcile with the ${money(target)} ${entry.key === "drivers" ? "change in target" : "investment envelope"}.`);
          } else {
            guidance = `Reconciled total: ${money(total)}. ${entry.guidance}`;
            notes.push(`${entry.title} reconcile to ${money(total)}.`);
          }
        }
        rows = priced.map(({ row, amount }) => [row[0], allowNegative ? signedMoney(amount) : money(amount), ...row.slice(2)]);
      }
    }
    table(entry.title, guidance, entry.labels, rows, entry.widths, entry.next, entry.keepLabels);
  }
  if (next) narrative("Decision gates and follow-up", "Confirm what happens after the decision and when the team will review it.", [["Next decision or review", at(data, "governance")]], true);
  return { pages, errors, notes: errors.length ? [] : notes };
}
