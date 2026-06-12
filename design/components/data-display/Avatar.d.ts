import * as React from "react";

export interface AvatarProps {
  /** Full name; drives initials and the deterministic tint. */
  name?: string;
  /** Photo URL; falls back to initials. */
  src?: string;
  /** Pixel diameter. Default 44. */
  size?: number;
  /** CSS color for an outer ring (e.g. confidence or branch color). */
  ring?: string;
  /** Render the deceased dagger marker. */
  deceased?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/** Person portrait — photo or serif initials on a warm archival tint. */
export function Avatar(props: AvatarProps): JSX.Element;
