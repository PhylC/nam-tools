export function DeckReviewRows({ kind, labels, rows, onChange, maxRows }: {
  kind: string;
  labels: string[];
  rows: string[][];
  onChange: (rows: string[][]) => void;
  maxRows?: number;
}) {
  const emptyRow = () => labels.map(() => "");
  const items = rows.length ? rows : [emptyRow()];
  return (
    <div className="qbr-editable-rows">
      {items.map((row, index) => (
        <div className="qbr-editable-row" role="group" aria-label={`${kind} ${index + 1}`} key={index}>
          <div className="qbr-editable-fields">
            {labels.map((label, column) => (
              <label className="field" key={label}>
                <span>{label}</span>
                <input
                  aria-label={`${label} for ${kind.toLowerCase()} ${index + 1}`}
                  value={row[column] ?? ""}
                  onChange={(event) => onChange(items.map((current, i) => i === index
                    ? labels.map((_, j) => j === column ? event.target.value : current[j] ?? "")
                    : current))}
                />
              </label>
            ))}
          </div>
          {rows.length ? <button type="button" className="button button-secondary button-small"
            aria-label={`Remove ${kind.toLowerCase()} ${index + 1}`}
            onClick={() => onChange(rows.filter((_, i) => index !== i))}>
            Remove
          </button> : null}
        </div>
      ))}
      {(!maxRows || items.length < maxRows) ? (
        <button type="button" className="button button-secondary button-small" onClick={() => onChange([...items, emptyRow()])}>
          Add {kind.toLowerCase()}
        </button>
      ) : null}
    </div>
  );
}
