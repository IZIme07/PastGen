import { Avatar } from "../data-display/Avatar.jsx";
import { ConfidenceMeter } from "../confidence/ConfidenceMeter.jsx";
import { Icon } from "../icon/Icon.jsx";

/**
 * PersonCard — compact person unit used in the tree, search results, and
 * relation lists. Shows portrait, serif name, lifespan, role and profile
 * confidence. `selected` raises it; `branch` paints a left accent.
 */
export function PersonCard({
  name,
  lifespan,              // e.g. "1928–2009"
  role,                  // e.g. "Бабушка · отцовская линия"
  photo,
  confidence,            // 0–100 profile confidence
  deceased = false,
  selected = false,
  branch,                // CSS color for branch accent
  flags = [],            // e.g. ["conflict"]
  onClick,
  style = {},
}) {
  const hasConflict = flags.includes("conflict");
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 12px",
        background: "var(--surface-card)",
        border: `1px solid ${selected ? "var(--brand)" : "var(--line)"}`,
        borderLeft: branch ? `3px solid ${branch}` : (selected ? "1px solid var(--brand)" : "1px solid var(--line)"),
        borderRadius: "var(--radius-md)",
        boxShadow: selected ? "var(--shadow-sm)" : "var(--shadow-xs)",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)",
        ...style,
      }}
    >
      <Avatar name={name} src={photo} size={42} deceased={deceased}
        ring={confidence >= 85 ? "var(--conf-confirmed)" : undefined} />

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{
            font: "var(--w-semibold) 16px/1.2 var(--font-serif)", color: "var(--text-strong)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {name}
          </span>
          {lifespan && (
            <span style={{ font: "13px/1 var(--font-mono)", color: "var(--text-muted)", flex: "0 0 auto" }}>
              {lifespan}
            </span>
          )}
        </div>
        {role && (
          <div style={{
            display: "flex", alignItems: "center", gap: 5, marginTop: 2,
            font: "var(--text-ui-small)", color: "var(--text-muted)",
          }}>
            {hasConflict && <Icon name="triangle-alert" size={13} style={{ color: "var(--conflict-500)" }} />}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{role}</span>
          </div>
        )}
      </div>

      {typeof confidence === "number" && (
        <ConfidenceMeter value={confidence} size={34} />
      )}
    </div>
  );
}
