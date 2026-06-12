import * as React from "react";

/**
 * Compact person card: portrait, serif name, lifespan, role, profile confidence.
 */
export interface PersonCardProps {
  name: string;
  /** Lifespan string, e.g. "1928–2009". */
  lifespan?: string;
  /** Role / relation line, e.g. "Бабушка · отцовская линия". */
  role?: string;
  photo?: string;
  /** 0–100 profile confidence; ≥85 adds a green avatar ring. */
  confidence?: number;
  deceased?: boolean;
  selected?: boolean;
  /** CSS color for a branch accent rail. */
  branch?: string;
  /** Flags such as ["conflict"]. */
  flags?: string[];
  onClick?: () => void;
  style?: React.CSSProperties;
}

/** Compact person card. */
export function PersonCard(props: PersonCardProps): JSX.Element;
