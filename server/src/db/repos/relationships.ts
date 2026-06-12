import type { RelationshipDTO, RelationshipType } from "@pastgen/shared";
import { type DB, uid } from "../index.js";

export interface RelationshipInput {
  a_id: string;
  b_id: string;
  type: RelationshipType;
  confidence?: number | null;
}

export function create(db: DB, input: RelationshipInput, id = uid()): RelationshipDTO {
  db.prepare(
    "INSERT OR IGNORE INTO relationships (id, a_id, b_id, type, confidence) VALUES (?, ?, ?, ?, ?)",
  ).run(id, input.a_id, input.b_id, input.type, input.confidence ?? null);
  return db
    .prepare("SELECT * FROM relationships WHERE a_id=? AND b_id=? AND type=?")
    .get(input.a_id, input.b_id, input.type) as RelationshipDTO;
}

export function list(db: DB): RelationshipDTO[] {
  return db.prepare("SELECT * FROM relationships").all() as RelationshipDTO[];
}

export function listForPerson(db: DB, personId: string): RelationshipDTO[] {
  return db
    .prepare("SELECT * FROM relationships WHERE a_id = ? OR b_id = ?")
    .all(personId, personId) as RelationshipDTO[];
}

export function remove(db: DB, id: string): void {
  db.prepare("DELETE FROM relationships WHERE id = ?").run(id);
}

/** Перенос связей с drop на keep (для merge_persons). */
export function reassign(db: DB, fromId: string, toId: string): void {
  db.prepare("UPDATE OR IGNORE relationships SET a_id = ? WHERE a_id = ?").run(toId, fromId);
  db.prepare("UPDATE OR IGNORE relationships SET b_id = ? WHERE b_id = ?").run(toId, fromId);
  db.prepare("DELETE FROM relationships WHERE a_id = ? OR b_id = ?").run(fromId, fromId);
  db.prepare("DELETE FROM relationships WHERE a_id = b_id").run();
}
