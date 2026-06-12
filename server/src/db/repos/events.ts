import type { EventDTO, EventType } from "@pastgen/shared";
import { type DB, uid } from "../index.js";

interface Row {
  id: string;
  type: EventType;
  date_from: string | null;
  date_to: string | null;
  place_id: string | null;
  description: string | null;
  confidence: number | null;
}

function toDto(db: DB, r: Row): EventDTO {
  const participants = db
    .prepare("SELECT person_id, role FROM event_participants WHERE event_id = ?")
    .all(r.id) as { person_id: string; role: string | null }[];
  return { ...r, participants };
}

export interface EventInput {
  type: EventType;
  date_from?: string | null;
  date_to?: string | null;
  place_id?: string | null;
  description?: string | null;
  confidence?: number | null;
  participants?: { person_id: string; role?: string | null }[];
}

export function create(db: DB, input: EventInput, id = uid()): EventDTO {
  db.prepare(
    "INSERT INTO events (id, type, date_from, date_to, place_id, description, confidence) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(
    id,
    input.type,
    input.date_from ?? null,
    input.date_to ?? null,
    input.place_id ?? null,
    input.description ?? null,
    input.confidence ?? null,
  );
  for (const p of input.participants ?? []) {
    db.prepare(
      "INSERT OR IGNORE INTO event_participants (event_id, person_id, role) VALUES (?, ?, ?)",
    ).run(id, p.person_id, p.role ?? null);
  }
  return get(db, id)!;
}

export function get(db: DB, id: string): EventDTO | null {
  const row = db.prepare("SELECT * FROM events WHERE id = ?").get(id) as Row | undefined;
  return row ? toDto(db, row) : null;
}

export function list(db: DB): EventDTO[] {
  const rows = db.prepare("SELECT * FROM events ORDER BY date_from").all() as Row[];
  return rows.map((r) => toDto(db, r));
}

export function listForPerson(db: DB, personId: string): EventDTO[] {
  const rows = db
    .prepare(
      `SELECT e.* FROM events e JOIN event_participants ep ON ep.event_id = e.id
       WHERE ep.person_id = ? ORDER BY e.date_from`,
    )
    .all(personId) as Row[];
  return rows.map((r) => toDto(db, r));
}

/** Перенос участия в событиях с drop на keep (для merge_persons). */
export function reassignParticipant(db: DB, fromId: string, toId: string): void {
  db.prepare("UPDATE OR IGNORE event_participants SET person_id = ? WHERE person_id = ?").run(toId, fromId);
  db.prepare("DELETE FROM event_participants WHERE person_id = ?").run(fromId);
}
