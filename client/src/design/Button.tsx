import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { Icon } from "./Icon";

export interface ButtonProps {
  children?: ReactNode;
  variant?: "primary" | "accent" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: string;
  iconTrailing?: string;
  iconOnly?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit";
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
  title?: string;
}

/** Button — основной элемент действия PastGen (порт из design/components/buttons). */
export function Button({
  children, variant = "primary", size = "md", icon, iconTrailing,
  iconOnly = false, disabled = false, fullWidth = false, type = "button",
  onClick, style = {}, ...rest
}: ButtonProps) {
  const sizes = {
    sm: { h: 30, px: 10, gap: 6, font: 13, icon: 15 },
    md: { h: 38, px: 14, gap: 8, font: 14, icon: 17 },
    lg: { h: 46, px: 20, gap: 9, font: 15, icon: 19 },
  };
  const s = sizes[size] ?? sizes.md;

  const palettes = {
    primary: {
      bg: "var(--brand)", color: "var(--text-on-brand)", border: "transparent",
      hover: "var(--brand-hover)", press: "var(--brand-press)", shadow: "var(--shadow-xs)",
    },
    accent: {
      bg: "var(--accent)", color: "#2A1E0C", border: "transparent",
      hover: "var(--accent-hover)", press: "var(--brass-700)", shadow: "var(--shadow-xs)",
    },
    secondary: {
      bg: "var(--surface-card)", color: "var(--text-strong)", border: "var(--border-default)",
      hover: "var(--paper-1)", press: "var(--paper-2)", shadow: "var(--shadow-xs)",
    },
    ghost: {
      bg: "transparent", color: "var(--text-body)", border: "transparent",
      hover: "var(--paper-2)", press: "var(--paper-3)", shadow: "none",
    },
    danger: {
      bg: "var(--danger)", color: "#fff", border: "transparent",
      hover: "var(--conflict-600)", press: "var(--conflict-600)", shadow: "var(--shadow-xs)",
    },
  };
  const p = palettes[variant] ?? palettes.primary;

  const base: CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: s.gap,
    height: s.h,
    padding: iconOnly ? 0 : `0 ${s.px}px`,
    width: iconOnly ? s.h : fullWidth ? "100%" : undefined,
    font: `var(--w-semibold) ${s.font}px/1 var(--font-sans)`,
    letterSpacing: "0.005em",
    color: p.color,
    background: p.bg,
    border: `1px solid ${p.border}`,
    borderRadius: "var(--radius-sm)",
    boxShadow: p.shadow,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "background var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)",
    whiteSpace: "nowrap",
    ...style,
  };

  const set = (e: MouseEvent<HTMLButtonElement>, bg: string, transform = "none") => {
    if (disabled) return;
    e.currentTarget.style.background = bg;
    e.currentTarget.style.transform = transform;
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={base}
      onMouseEnter={(e) => set(e, p.hover)}
      onMouseLeave={(e) => set(e, p.bg)}
      onMouseDown={(e) => set(e, p.press, "translateY(0.5px)")}
      onMouseUp={(e) => set(e, p.hover)}
      {...rest}
    >
      {icon && <Icon name={icon} size={s.icon} stroke={1.9} />}
      {!iconOnly && children}
      {iconTrailing && <Icon name={iconTrailing} size={s.icon} stroke={1.9} />}
    </button>
  );
}
