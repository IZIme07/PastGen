import * as React from "react";

export interface BadgeProps {
  children?: React.ReactNode;
  /**
   * Semantic tone. Confidence tones (confirmed/probable/inferred/hypothesis)
   * mirror the verifiable-claim model; `conflict` flags contradictions.
   */
  tone?:
    | "neutral" | "brand" | "accent" | "info"
    | "confirmed" | "probable" | "inferred" | "hypothesis"
    | "conflict";
  /** Leading Lucide icon. */
  icon?: string;
  /** Show a leading status dot. */
  dot?: boolean;
  size?: "sm" | "md";
  style?: React.CSSProperties;
}

/** Compact status / category pill using the brand semantic palette. */
export function Badge(props: BadgeProps): JSX.Element;
