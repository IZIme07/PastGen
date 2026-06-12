import type { HistoryDTO } from "@pastgen/shared";
import { type DB, nowIso, uid } from "../index.js";

export function record(
  db: DB,
  action: string,
  entityType: string,
  entityId: string,
  detail: Record<string, unknown> = {},
  proposalId: string | null = null,
): void {
  db.prepare(
    "INSERT INTO history (id, ts, action, entity_type, entity_id, detail_json, proposal_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(uid(), nowIso(), action, entityType, entityId, JSON.stringify(detail), proposalId);
}

export function list(db: DB, limit = 200): HistoryDTO[] {
  const rows = db
    .prepare("SELECT * FROM history ORDER BY ts DESC LIMIT ?")
    .all(limit) as (Omit<HistoryDTO, "detail"> & { detail_json: string })[];
  return rows.map((r) => ({ ...r, detail: JSON.parse(r.detail_json) }));
}
