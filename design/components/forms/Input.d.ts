import * as React from "react";

export interface InputProps {
  label?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  /** Leading Lucide icon (single-line only). */
  icon?: string;
  /** Helper text below the field. */
  hint?: string;
  /** Error text; turns the field terracotta and shows an alert glyph. */
  error?: string;
  type?: string;
  /** Render a textarea instead of an input. */
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  id?: string;
  style?: React.CSSProperties;
}

/** Text field with label, leading icon, hint and error states. Supports multiline. */
export function Input(props: InputProps): JSX.Element;
