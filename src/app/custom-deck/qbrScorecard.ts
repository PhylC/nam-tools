export type QbrMetric = {
  id: string;
  name: string;
  actual: number;
  plan: number | null;
  prior: number | null;
  unit: string;
  source: string;
};
export type QbrScorecard = { groups: QbrMetric[][]; warnings: string[] };

type Sheet = { name: string; rows: { number: number; cells: string[] }[] };

export function parseCsv(text: string): Sheet["rows"] {
  const rows: Sheet["rows"] = [];
  const fieldPattern = /("(?:[^"]|"")*"|[^",\r\n]*)(,|\r\n|\n|\r|$)/gy;
  const input = text.replace(/^\uFEFF/, "");
  let cells: string[] = [];
  let position = 0;
  let rowNumber = 1;
  while (position < input.length) {
    fieldPattern.lastIndex = position;
    const match = fieldPattern.exec(input);
    if (!match || !match[0].length) throw new Error("Check the CSV separators and quotation marks.");
    const value = match[1];
    cells.push(value.startsWith('"') ? value.slice(1, -1).replace(/""/g, '"') : value);
    if (/^[\r\n]/.test(match[2])) {
      rows.push({ number: rowNumber++, cells });
      cells = [];
    }
    position = fieldPattern.lastIndex;
  }
  if (input.endsWith(",")) cells.push("");
  if (cells.length) rows.push({ number: rowNumber, cells });
  return rows;
}

function columnIndex(address: string) {
  let index = 0;
  for (const letter of (address.match(/^[A-Z]+/)?.[0] ?? "")) index = index * 26 + letter.charCodeAt(0) - 64;
  return index - 1;
}

function columnName(index: number) {
  let letters = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) letters = String.fromCharCode(65 + (n - 1) % 26) + letters;
  return letters;
}

async function readWorkbook(file: File): Promise<Sheet[]> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const read = async (path: string) => {
    const entry = zip.file(path);
    if (!entry) return null;
    const document = new DOMParser().parseFromString(await entry.async("text"), "application/xml");
    if (document.getElementsByTagNameNS("*", "parsererror").length) throw new Error("This workbook contains unreadable Excel data.");
    return document;
  };
  const elements = (node: Document | Element | null, name: string) => Array.from(node?.getElementsByTagNameNS("*", name) ?? []);
  const text = (node: Element) => elements(node, "t").map((child) => child.textContent ?? "").join("");
  const [book, rels, strings, styles] = await Promise.all([
    read("xl/workbook.xml"), read("xl/_rels/workbook.xml.rels"), read("xl/sharedStrings.xml"), read("xl/styles.xml"),
  ]);
  const shared = elements(strings, "si").map(text);
  const percentageIds = new Set(["9", "10"]);
  for (const style of elements(styles, "numFmt")) {
    if (style.getAttribute("formatCode")?.replace(/"[^"]*"|\\./g, "").includes("%")) percentageIds.add(style.getAttribute("numFmtId") ?? "");
  }
  const percentageStyles = Array.from(elements(styles, "cellXfs")[0]?.children ?? [], (style) => percentageIds.has(style.getAttribute("numFmtId") ?? ""));
  const sheets: Sheet[] = [];
  for (const sheet of elements(book, "sheet")) {
    if (sheet.getAttribute("state") && sheet.getAttribute("state") !== "visible") continue;
    const id = sheet.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
    const link = elements(rels, "Relationship").find((element) => element.getAttribute("Id") === id);
    const target = link?.getAttribute("Target");
    if (!target || !link?.getAttribute("Type")?.endsWith("/worksheet") || link.getAttribute("TargetMode") === "External") continue;
    const document = await read(target.startsWith("/") ? target.slice(1) : "xl/" + target);
    const rows = elements(document, "row").map((row, index) => {
      const cells: string[] = [];
      for (const cell of elements(row, "c")) {
        const column = columnIndex(cell.getAttribute("r") ?? "");
        if (column < 0 || column >= 16384) continue;
        const type = cell.getAttribute("t");
        const value = elements(cell, "v")[0]?.textContent ?? "";
        cells[column] = type === "s" ? shared[Number(value)] ?? ""
          : type === "inlineStr" ? text(cell)
          : type === "e" || type === "b" || type === "d" ? ""
          : value && percentageStyles[Number(cell.getAttribute("s"))] && (!type || type === "n") ? `${Number(value) * 100}%`
          : value;
      }
      return { number: Number(row.getAttribute("r")) || index + 1, cells };
    });
    sheets.push({ name: sheet.getAttribute("name") ?? "Sheet", rows });
  }
  return sheets;
}

function unitCode(unit: string) {
  const trimmed = unit.trim();
  if (/^(?:%|percent|per cent)$/i.test(trimmed)) return "%";
  const currency = ({ "£": "GBP", "$": "USD", "€": "EUR" }[trimmed] ?? trimmed).toUpperCase();
  return ["GBP", "USD", "EUR"].includes(currency) ? currency : trimmed.toLowerCase();
}

export function readMetricNumber(text: string) {
  let input = text.trim().replace(/\u2212/g, "-");
  if (!input) return null;
  if (/^\(.+\)$/.test(input)) input = "-" + input.slice(1, -1);
  const currency = input.match(/[£$€]|\b(?:GBP|USD|EUR)\b/i)?.[0] ?? "";
  const percent = input.endsWith("%");
  if (currency && percent) return null;
  const unit = unitCode(percent ? "%" : currency);
  input = input.replace(/[£$€]|\b(?:GBP|USD|EUR)\b|%$/gi, "").trim().replace(/^([+-])\s+/, "$1");
  if (!/^[+-]?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/i.test(input)) return null;
  const value = Number(input.replace(/,/g, ""));
  return Number.isFinite(value) ? { value, unit } : null;
}

const columnLabels = {
  metric: ["metric", "measure", "kpi", "indicator"],
  actual: ["actual", "actuals", "result", "current actual", "current"],
  plan: ["plan", "target", "budget", "planned"],
  prior: ["prior", "previous", "prior period", "last year", "prior year"],
  unit: ["unit", "units", "currency"],
};

function loadRows(sheet: Sheet, filename: string) {
  const metrics: QbrMetric[] = [];
  const warnings: string[] = [];
  const normalized = (text: string) => text.toLowerCase().trim().replace(/[_-]/g, " ").replace(/\s+/g, " ");
  const sourceName = sheet.name ? `${filename} · ${sheet.name}` : filename;
  let columns: number[] | undefined;
  for (const { number, cells } of sheet.rows) {
    const headings = cells.map((cell) => normalized(cell ?? ""));
    const found = Object.values(columnLabels).map((labels) => headings.findIndex((heading) => labels.includes(heading)));
    if (found[0] >= 0 && found[1] >= 0) {
      columns = found;
      continue;
    }
    if (!columns) continue;
    const marked = columns.filter((index) => index >= 0);
    const source = sheet.name ? `${sourceName}!${columnName(Math.min(...marked))}${number}:${columnName(Math.max(...marked))}${number}` : `${sourceName} · row ${number}`;
    const [name, actualText, planText, priorText, declared] = columns.map((index) => cells[index]?.trim() ?? "");
    if (![name, actualText, planText, priorText].some(Boolean)) continue;
    const actual = readMetricNumber(actualText);
    const plan = readMetricNumber(planText);
    const prior = readMetricNumber(priorText);
    if (!name || !actual) {
      warnings.push(`${source} has no metric name or numeric actual and was left out.`);
      continue;
    }
    if ((planText && !plan) || (priorText && !prior)) warnings.push(`${source} has an unreadable comparison. Its actual is available.`);
    const declaredUnit = unitCode(declared);
    const defaultUnit = declaredUnit || (/\(%\)|%$/.test(name) ? "%" : "");
    const units = new Set([defaultUnit, actual.unit, plan?.unit, prior?.unit].filter(Boolean));
    if (units.size > 1) {
      warnings.push(`${source} mixes units and was left out.`);
      continue;
    }
    const unit = [...units][0] || "";
    metrics.push({ id: source, name, actual: actual.value, plan: plan?.value ?? null, prior: prior?.value ?? null, unit, source });
  }
  return { metrics, warnings, foundHeader: Boolean(columns) };
}

export function groupMetrics(metrics: QbrMetric[]): QbrMetric[][] {
  const groups = new Map<string, QbrMetric[]>();
  for (const metric of metrics) {
    const key = metric.name.trim().toLocaleLowerCase("en-GB").replace(/\s+/g, " ");
    const group = groups.get(key) ?? [];
    if (!group.some(({ actual, plan, prior, unit }) => actual === metric.actual && plan === metric.plan && prior === metric.prior && unit === metric.unit)) group.push(metric);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export async function readQbrScorecards(files: File[]): Promise<QbrScorecard> {
  const metrics: QbrMetric[] = [];
  const warnings: string[] = [];
  for (const [fileIndex, file] of files.entries()) {
    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      warnings.push(`${file.name} is available as a reference. Paste relevant findings into the QBR brief.`);
      continue;
    }
    try {
      const sheets = /\.csv$/i.test(file.name) ? [{ name: "", rows: parseCsv(await file.text()) }] : await readWorkbook(file);
      let found = false;
      for (const sheet of sheets) {
        const result = loadRows(sheet, file.name);
        found ||= result.foundHeader;
        metrics.push(...result.metrics.map((metric) => ({ ...metric, id: `${fileIndex}:${metric.id}` })));
        warnings.push(...result.warnings);
      }
      if (!found) warnings.push(`${file.name} needs a scorecard with Metric and Actual columns. Plan, Prior and Unit are optional.`);
    } catch {
      warnings.push(`${file.name} could not be read. Check the file format before using any figures from it.`);
    }
  }
  return { groups: groupMetrics(metrics), warnings };
}
