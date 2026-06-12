import type { ResearchTaskDTO } from "@pastgen/shared";
import { type DB, nowIso, uid } from "../index.js";

export interface TaskInput {
  title: string;
  person_id?: string | null;
  origin?: string;
}

export function create(db: DB, input: TaskInput, id = uid()): ResearchTaskDTO {
  db.prepare(
    "INSERT INTO research_tasks (id, title, person_id, status, origin, created_at) VALUES (?, ?, ?, 'open', ?, ?)",
  ).run(id, input.title, input.person_id ?? null, input.origin ?? "manual", nowIso());
  return get(db, id)!;
}

/** Создаёт задачу, если открытой с тем же origin и person_id ещё нет. */
export function upsertByOrigin(db: DB, input: Required<Pick<TaskInput, "title" | "origin">> & { person_id: string | null }): ResearchTaskDTO {
  const existing = db
    .prepare(
      "SELECT * FROM research_tasks WHERE origin = ? AND person_id IS ? AND status = 'open'",
    )
    .get(input.origin, input.person_id) as ResearchTaskDTO | undefined;
  if (existing) return existing;
  return create(db, input);
}

export function get(db: DB, id: string): ResearchTaskDTO | null {
  return (db.prepare("SELECT * FROM research_tasks WHERE id = ?").get(id) as ResearchTaskDTO) ?? null;
}

export function list(db: DB, personId?: string): ResearchTaskDTO[] {
  return (
    personId
      ? db.prepare("SELECT * FROM research_tasks WHERE person_id = ? ORDER BY created_at").all(personId)
      : db.prepare("SELECT * FROM research_tasks ORDER BY created_at").all()
  ) as ResearchTaskDTO[];
}

export function setStatus(db: DB, id: string, status: "open" | "done" | "dismissed"): ResearchTaskDTO | null {
  db.prepare("UPDATE research_tasks SET status = ? WHERE id = ?").run(status, id);
  return get(db, id);
}
