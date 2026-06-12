import * as React from "react";

export type SourceType =
  | "document" | "archive" | "photo" | "caption" | "audio"
  | "story" | "letter" | "pdf" | "link" | "comment";

export interface SourceChipProps {
  /** Source kind; sets icon, tint and default label. */
  type?: SourceType;
  /** Override the default type label with a specific source title. */
  label?: string;
  /** Optional 0–100 source quality, shown as a 3-dot scale. */
  quality?: number;
  onClick?: () => void;
  removable?: boolean;
  onRemove?: () => void;
  style?: React.CSSProperties;
}

/** Provenance chip — cites the type (and optionally quality/title) of a source backing a claim. */
export function SourceChip(props: SourceChipProps): JSX.Element;
