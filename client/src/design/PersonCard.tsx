import type { CSSProperties } from "react";
import { Avatar } from "./Avatar";
import { ConfidenceMeter } from "./ConfidenceMeter";
import { Icon } from "./Icon";

export interface PersonCardProps {
  name: string;
  lifespan?: string;
  role?: string;
  photo?: string;
  confidence?: number;
  deceased?: boolean;
  selected?: boolean;
  branch?: string;
  flags?: string[];
  onClick?: () => void;
  style?: CSSProperties;
}

/** PersonCard — компактная карточка человека: портрет, имя серифом, годы, роль, уверенность. */
export function PersonCard({
  name, lifespan, role, photo, confidence, deceased = false,
  selected = false, branch, flags = [], onClick, style = {},
}: PersonCardProps) {
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
        ring={confidence !== undefined && confidence >= 85 ? "var(--conf-confirmed)" : undefined} />

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

      {typeof confidence === "number" && <ConfidenceMeter value={confidence} size={34} />}
    </div>
  );
}
