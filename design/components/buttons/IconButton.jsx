import { Icon } from "../icon/Icon.jsx";

/**
 * IconButton — square, icon-only control for toolbars, rails, and dense UI.
 * Variants: ghost (default), solid (evergreen), soft (tinted paper).
 */
export function IconButton({
  icon,
  label,                 // accessible label (required in practice)
  variant = "ghost",
  size = "md",
  active = false,
  disabled = false,
  onClick,
  style = {},
  ...rest
}) {
  const sizes = { sm: 30, md: 36, lg: 44 };
  const dim = sizes[size] || sizes.md;
  const iconSize = { sm: 16, md: 19, lg: 22 }[size] || 19;

  const palettes = {
    ghost: {
      bg: active ? "var(--paper-2)" : "transparent",
      color: active ? "var(--text-strong)" : "var(--text-muted)",
      hover: "var(--paper-2)", border: "transparent",
    },
    soft: {
      bg: "var(--brand-tint)", color: "var(--brand)",
      hover: "var(--evergreen-200)", border: "transparent",
    },
    solid: {
      bg: "var(--brand)", color: "var(--text-on-brand)",
      hover: "var(--brand-hover)", border: "transparent",
    },
  };
  const p = palettes[variant] || palettes.ghost;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = p.hover; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = p.bg; }}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: dim, height: dim,
        color: p.color, background: p.bg,
        border: `1px solid ${p.border}`,
        borderRadius: "var(--radius-sm)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)",
        ...style,
      }}
      {...rest}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
}
