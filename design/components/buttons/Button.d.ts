import * as React from "react";

/**
 * Primary action control for PastGen. Evergreen primary, brass accent,
 * terracotta danger; sm/md/lg with optional leading/trailing icons.
 */
export interface ButtonProps {
  children?: React.ReactNode;
  /** Visual style. Default "primary". */
  variant?: "primary" | "secondary" | "ghost" | "accent" | "danger";
  /** Default "md". */
  size?: "sm" | "md" | "lg";
  /** Leading Lucide icon name. */
  icon?: string;
  /** Trailing Lucide icon name. */
  iconTrailing?: string;
  /** Render as a square icon-only button. */
  iconOnly?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}

/**
 * Primary action control for PastGen.
 */
export function Button(props: ButtonProps): JSX.Element;
