import * as React from "react";

export interface IconButtonProps {
  /** Lucide icon name. */
  icon: string;
  /** Accessible label (used as aria-label + title). */
  label?: string;
  variant?: "ghost" | "soft" | "solid";
  size?: "sm" | "md" | "lg";
  /** Highlighted / selected state (ghost variant). */
  active?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}

/** Square icon-only button for toolbars, mode rails and dense UI. */
export function IconButton(props: IconButtonProps): JSX.Element;
