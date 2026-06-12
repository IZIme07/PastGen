import type { CSSProperties } from "react";

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: number;
  ring?: string;
  deceased?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
}

/** Avatar — портрет: фото или инициалы на детерминированной тёплой подложке; «†» — для ушедших. */
export function Avatar({ name = "", src, size = 44, ring, deceased = false, style = {}, onClick }: AvatarProps) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const tints: [string, string][] = [
    ["#E7DCC6", "#6E5836"], ["#DEE7DF", "#34503F"], ["#E9DED1", "#7A5A3C"],
    ["#DCE4E8", "#3E6275"], ["#ECE0D6", "#8A5A3A"], ["#E2E6D8", "#5A6A40"],
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % tints.length;
  const [bg, fg] = tints[h];

  const fontSize = Math.round(size * 0.38);

  return (
    <div
      onClick={onClick}
      title={name}
      style={{
        position: "relative",
        width: size, height: size,
        borderRadius: "var(--radius-pill)",
        background: src ? `center/cover no-repeat url(${src})` : bg,
        color: fg,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        font: `var(--w-semibold) ${fontSize}px/1 var(--font-serif)`,
        boxShadow: ring
          ? `0 0 0 2px var(--paper-0), 0 0 0 ${Math.max(2, size * 0.06)}px ${ring}`
          : "inset 0 0 0 1px rgba(58,47,33,0.10)",
        cursor: onClick ? "pointer" : "default",
        flex: "0 0 auto",
        filter: deceased ? "grayscale(0.25)" : "none",
        ...style,
      }}
    >
      {!src && initials}
      {deceased && (
        <span style={{
          position: "absolute", bottom: -2, right: -2,
          width: Math.max(12, size * 0.32), height: Math.max(12, size * 0.32),
          borderRadius: 999, background: "var(--paper-0)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          boxShadow: "inset 0 0 0 1px var(--line-strong)",
          color: "var(--ink-500)", font: `${Math.max(8, size * 0.2)}px/1 var(--font-serif)`,
        }}>
          †
        </span>
      )}
    </div>
  );
}
