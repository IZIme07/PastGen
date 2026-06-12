import * as React from "react";

/**
 * Signature element: visualises trust in a claim as a colored ring or bar.
 */
export interface ConfidenceMeterProps {
  /** 0–100. Level + color are derived: ≥85 confirmed, ≥60 probable, ≥35 inferred, else hypothesis. */
  value: number;
  variant?: "ring" | "bar";
  /** Ring diameter in px. Default 48. */
  size?: number;
  /** Show the numeric value. Default true. */
  showValue?: boolean;
  /** Append the Russian level word. */
  showLabel?: boolean;
  /** Ring stroke width override. */
  thickness?: number;
  style?: React.CSSProperties;
}

/** Signature confidence meter. */
export function ConfidenceMeter(props: ConfidenceMeterProps): JSX.Element;
