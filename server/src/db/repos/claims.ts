import type { ClaimDTO, ClaimStatus, ClaimType, SourceRef, SourceType } from "@pastgen/shared";
import { type DB, nowIso, uid } from "../index.js";

interface Row {
  id: string;
  subject_type: "person" | "event" | "relationship";
  subject_id: string;
  claim_type: ClaimType;
  value_json: string;
  confidence: number;
  status: ClaimStatus;
  parent_claim_id: string | null;
  conflict: number;
  conflict_note: string | null;
  created_at: string;
  updated_at: string;
}

function toDto(db: DB, r: Row): ClaimDTO {
  return {
    id: r.id,
    subject_type: r.subject_type,
    subject_id: r.subject_id,
    claim_type: r.claim_type,
    value: JSON.parse(r.value_json),
    confidence: r.confidence,
    status: r.status,
    parent_claim_id: r.parent_claim_id,
    conflict: !!r.conflict,
    conflict_note: r.conflict_note,
    sources: sourcesFor(db, r.id),
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function sourcesFor(db: DB, claimId: string): SourceRef[] {
  return db
    .prepare(
      `SELECT s.id as source_id, s.type, s.title, cs.note
       FROM claim_sources cs JOIN sources s ON s.id = cs.source_id WHERE cs.claim_id = ?`,
    )
    .all(claimId) as { source_id: string; type: SourceType; title: string; note: string | null }[];
}

export interface ClaimInput {
  subject_type: "person" | "event" | "relationship";
  subject_id: string;
  claim_type: ClaimType;
  value: Record<string, unknown>;
  confidence: number;
  status?: ClaimStatus;
  parent_claim_id?: string | null;
  conflict?: boolean;
  conflict_note?: string | null;
}

export function create(db: DB, input: ClaimInput, id = uid()): ClaimDTO {
  const ts = nowIso();
  db.prepare(
    `INSERT INTO claims (id, subject_type, subject_id, claim_type, value_json, confidence,
       status, parent_claim_id, conflict, conflict_note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.subject_type,
    input.subject_id,
    input.claim_type,
    JSON.stringify(input.value),
    input.confidence,
    input.status ?? "primary",
    input.parent_claim_id ?? null,
    input.conflict ? 1 : 0,
    input.conflict_note ?? null,
    ts,
    ts,
  );
  return get(db, id)!;
}

export function get(db: DB, id: string): ClaimDTO | null {
  const row = db.prepare("SELECT * FROM claims WHERE id = ?").get(id) as Row | undefined;
  return row ? toDto(db, row) : null;
}

export function listForSubject(
  db: DB,
  subjectType: string,
  subjectId: string,
): ClaimDTO[] {
  const rows = db
    .prepare("SELECT * FROM claims WHERE subject_type = ? AND subject_id = ? ORDER BY created_at")
    .all(subjectType, subjectId) as Row[];
  return rows.map((r) => toDto(db, r));
}

export interface ClaimPatch {
  value?: Record<string, unknown>;
  confidence?: number;
  status?: ClaimStatus;
  conflict?: boolean;
  conflict_note?: string | null;
}

export function update(db: DB, id: string, patch: ClaimPatch): ClaimDTO | null {
  const cur = get(db, id);
  if (!cur) return null;
  db.prepare(
    `UPDATE claims SET value_json=?, confidence=?, status=?, conflict=?, conflict_note=?, updated_at=? WHERE id=?`,
  ).run(
    JSON.stringify(patch.value ?? cur.value),
    patch.confidence ?? cur.confidence,
    patch.status ?? cur.status,
    (patch.conflict ?? cur.conflict) ? 1 : 0,
    patch.conflict_note !== undefined ? patch.conflict_note : cur.conflict_note,
    nowIso(),
    id,
  );
  return get(db, id);
}

export function remove(db: DB, id: string): void {
  db.prepare("DELETE FROM claims WHERE id = ?").run(id);
}

export function linkSource(db: DB, claimId: string, sourceId: string, note: string | null): void {
  db.prepare(
    "INSERT OR REPLACE INTO claim_sources (claim_id, source_id, note) VALUES (?, ?, ?)",
  ).run(claimId, sourceId, note);
}

/** Перенос утверждений с drop на keep (для merge_persons). */
export function reassignSubject(db: DB, fromId: string, toId: string): void {
  db.prepare("UPDATE claims SET subject_id = ? WHERE subject_type = 'person' AND subject_id = ?").run(
    toId,
    fromId,
  );
}
