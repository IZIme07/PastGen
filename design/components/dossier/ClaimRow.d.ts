import * as React from "react";
import { SourceType } from "../confidence/SourceChip";

export interface ClaimSource {
  type: SourceType;
  label?: string;
  quality?: number;
}

/**
 * One verifiable fact in a person's dossier — value, confidence, provenance, conflicts.
 */
export interface ClaimRowProps {
  /** Claim type label, e.g. "Дата рождения". */
  label: string;
  /** The claimed value, e.g. "1928, Тула". */
  value: string;
  /** 0–100 confidence in this claim. */
  confidence?: number;
  /** Sources backing the claim. */
  sources?: ClaimSource[];
  /** Count of stored alternative versions. */
  alternatives?: number;
  /** Conflict note; paints a terracotta left rail + badge. */
  conflict?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/** One verifiable claim row. */
export function ClaimRow(props: ClaimRowProps): JSX.Element;
