import { Icon } from "../icon/Icon.jsx";

/**
 * Badge — compact status / category pill.
 * Tones map to the brand's semantic palette, including the confidence scale.
 */
export function Badge({
  children,
  tone = "neutral",
  icon,
  dot = false,
  size = "md",
  style = {},
}) {
  const tones = {
    neutral:    { bg: "var(--paper-2)",            fg: "var(--ink-700)",        bd: "var(--line-strong)" },
    brand:      { bg: "var(--evergreen-050)",      fg: "var(--evergreen-700)",  bd: "var(--evergreen-200)" },
    accent:     { bg: "var(--brass-050)",          fg: "var(--brass-700)",      bd: "var(--brass-300)" },
    confirmed:  { bg: "var(--conf-confirmed-bg)",  fg: "var(--conf-confirmed)", bd: "transparent" },
    probable:   { bg: "var(--conf-probable-bg)",   fg: "var(--brass-700)",      bd: "transparent" },
    inferred:   { bg: "var(--conf-inferred-bg)",   fg: "var(--brass-700)",      bd: "transparent" },
    hypothesis: { bg: "var(--conf-hypothesis-bg)", fg: "var(--ink-700)",        bd: "transparent" },
    conflict:   { bg: "var(--conflict-100)",       fg: "var(--conflict-600)",   bd: "transparent" },
    info:       { bg: "var(--assist-100)",         fg: "var(--assist-600)",     bd: "transparent" },
  };
  const t = tones[tone] || tones.neutral;
  const sm = size === "sm";

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: sm ? 4 : 5,
      height: sm ? 20 : 24,
      padding: `0 ${sm ? 7 : 9}px`,
      font: `var(--w-semibold) ${sm ? 11 : 12}px/1 var(--font-sans)`,
      letterSpacing: "0.01em",
      color: t.fg,
      background: t.bg,
      border: `1px solid ${t.bd}`,
      borderRadius: "var(--radius-pill)",
      whiteSpace: "nowrap",
      ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: t.fg, flex: "0 0 auto" }} />}
      {icon && <Icon name={icon} size={sm ? 12 : 13} stroke={2} />}
      {children}
    </span>
  );
}
