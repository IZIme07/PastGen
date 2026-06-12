import type { ProposalDTO, ProposalKind, ProposalStatus } from "@pastgen/shared";
import { type DB, nowIso, uid } from "../index.js";

interface Row {
  id: string;
  kind: ProposalKind;
  title: string;
  detail: string | null;
  payload_json: string;
  confidence: number;
  conflict_note: string | null;
  source_ids_json: string;
  status: ProposalStatus;
  created_from: string | null;
  created_at: string;
  decided_at: string | null;
}

function toDto(r: Row): ProposalDTO {
  return {
    id: r.id,
    kind: r.kind,
    title: r.title,
    detail: r.detail,
    payload: JSON.parse(r.payload_json),
    confidence: r.confidence,
    conflict_note: r.conflict_note,
    source_ids: JSON.parse(r.source_ids_json),
    status: r.status,
    created_from: r.created_from,
    created_at: r.created_at,
    decided_at: r.decided_at,
  };
}

export interface ProposalInput {
  kind: ProposalKind;
  title: string;
  detail?: string | null;
  payload: Record<string, unknown>;
  confidence: number;
  conflict_note?: string | null;
  source_ids?: string[];
  created_from?: string | null;
}

export function create(db: DB, input: ProposalInput, id = uid()): ProposalDTO {
  db.prepare(
    `INSERT INTO proposals (id, kind, title, detail, payload_json, confidence, conflict_note,
       source_ids_json, status, created_from, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
  ).run(
    id,
    input.kind,
    input.title,
    input.detail ?? null,
    JSON.stringify(input.payload),
    input.confidence,
    input.conflict_note ?? null,
    JSON.stringify(input.source_ids ?? []),
    input.created_from ?? null,
    nowIso(),
  );
  return get(db, id)!;
}

export function get(db: DB, id: string): ProposalDTO | null {
  const row = db.prepare("SELECT * FROM proposals WHERE id = ?").get(id) as Row | undefined;
  return row ? toDto(row) : null;
}

export function list(db: DB, status?: ProposalStatus): ProposalDTO[] {
  const rows = (
    status
      ? db.prepare("SELECT * FROM proposals WHERE status = ? ORDER BY created_at DESC").all(status)
      : db.prepare("SELECT * FROM proposals ORDER BY created_at DESC").all()
  ) as Row[];
  return rows.map(toDto);
}

export function setStatus(db: DB, id: string, status: ProposalStatus): ProposalDTO | null {
  db.prepare("UPDATE proposals SET status = ?, decided_at = ? WHERE id = ?").run(
    status,
    nowIso(),
    id,
  );
  return get(db, id);
}
