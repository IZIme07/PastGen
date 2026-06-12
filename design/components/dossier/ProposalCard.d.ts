import * as React from "react";
import { ClaimSource } from "./ClaimRow";

export type ProposalKind =
  | "add_person" | "merge" | "add_fact" | "add_alt"
  | "add_place" | "link_photo" | "add_source" | "conflict";

/**
 * The update-layer card — AI proposes a change from imported chaos; the user resolves it.
 */
export interface ProposalCardProps {
  /** What kind of tree change is proposed; sets icon + eyebrow. */
  kind?: ProposalKind;
  /** Headline of the change, e.g. "Дата рождения → 1928". */
  title: string;
  /** Supporting explanation. */
  detail?: string;
  /** 0–100 system confidence in the proposal. */
  confidence?: number;
  /** Sources that triggered the proposal. */
  sources?: ClaimSource[];
  /** Conflict note shown as a terracotta callout. */
  conflict?: string;
  onAccept?: () => void;
  onDefer?: () => void;
  onReject?: () => void;
  style?: React.CSSProperties;
}

/** The update-layer proposal card. */
export function ProposalCard(props: ProposalCardProps): JSX.Element;
