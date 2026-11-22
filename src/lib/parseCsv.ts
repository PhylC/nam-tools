type CsvRow = { number: number; cells: string[] };

export function parseCsv(text: string): CsvRow[] {
  const rows: CsvRow[] = [];
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
