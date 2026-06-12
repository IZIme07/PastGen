import { ConfidenceMeter } from "../confidence/ConfidenceMeter.jsx";
import { SourceChip } from "../confidence/SourceChip.jsx";
import { Badge } from "../data-display/Badge.jsx";

/**
 * ClaimRow — one verifiable claim in a person's dossier: a labelled fact,
 * its value, a confidence meter, the sources that back it, and optional
 * conflict / alternative-version flags.
 */
export function ClaimRow({
  label,                 // e.g. "Дата рождения"
  value,                 // e.g. "1928, Тула"
  confidence = 0,
  sources = [],          // [{ type, label }]
  alternatives,          // number of alternative versions
  conflict,              // string note if contradicted
  onClick,
  style = {},
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "10px 16px",
        padding: "14px 16px",
        background: "var(--surface-card)",
        border: `1px solid ${conflict ? "var(--conflict-100)" : "var(--line)"}`,
        borderLeft: conflict ? "3px solid var(--conflict-500)" : "1px solid var(--line)",
        borderRadius: "var(--radius-md)",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div className="pg-overline" style={{ marginBottom: 3 }}>{label}</div>
        <div style={{
          font: "var(--w-medium) 16px/1.3 var(--font-sans)", color: "var(--text-strong)",
        }}>
          {value}
        </div>
      </div>

      <ConfidenceMeter value={confidence} size={40} style={{ gridRow: "1 / span 2", alignSelf: "center" }} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", gridColumn: 1 }}>
        {sources.map((s, i) => (
          <SourceChip key={i} type={s.type} label={s.label} quality={s.quality} />
        ))}
        {alternatives > 0 && (
          <Badge tone="neutral" icon="git-compare" size="sm">
            {alternatives} {alternatives === 1 ? "версия" : "версии"}
          </Badge>
        )}
        {conflict && (
          <Badge tone="conflict" icon="triangle-alert" size="sm">{conflict}</Badge>
        )}
      </div>
    </div>
  );
}
