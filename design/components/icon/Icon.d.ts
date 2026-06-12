import * as React from "react";

export interface IconProps {
  /** Lucide icon name in kebab-case, e.g. "git-fork", "map-pin", "sparkles". */
  name: string;
  /** Pixel size of the square icon. Default 18. */
  size?: number;
  /** Stroke width. Default 1.75 (slightly lighter than Lucide default for an archival feel). */
  stroke?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Accessible label; when omitted the icon is aria-hidden. */
  title?: string;
}

/**
 * Brand iconography primitive. Wraps Lucide stroke icons; the host page must
 * load the Lucide UMD script from CDN. Inherits `currentColor`.
 */
export function Icon(props: IconProps): JSX.Element;
