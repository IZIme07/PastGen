import type { PersonDTO, Sex } from "@pastgen/shared";
import { type DB, nowIso, uid } from "../index.js";

interface Row {
  id: string;
  surname: string | null;
  given_name: string | null;
  patronymic: string | null;
  display_name: string;
  maiden_name: string | null;
  alt_names_json: string;
  sex: Sex;
  bio_md: string | null;
  notes: string | null;
  deceased: number;
  created_at: string;
  updated_at: string;
}

function toDto(r: Row): PersonDTO {
  return {
    id: r.id,
    surname: r.surname,
    given_name: r.given_name,
    patronymic: r.patronymic,
    display_name: r.display_name,
    maiden_name: r.maiden_name,
    alt_names: JSON.parse(r.alt_names_json),
    sex: r.sex,
    bio_md: r.bio_md,
    notes: r.notes,
    deceased: !!r.deceased,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export interface PersonInput {
  surname?: string | null;
  given_name?: string | null;
  patronymic?: string | null;
  display_name: string;
  maiden_name?: string | null;
  alt_names?: string[];
  sex?: Sex;
  bio_md?: string | null;
  notes?: string | null;
  deceased?: boolean;
}

export function create(db: DB, input: PersonInput, id = uid()): PersonDTO {
  const ts = nowIso();
  db.prepare(
    `INSERT INTO persons (id, surname, given_name, patronymic, display_name, maiden_name,
       alt_names_json, sex, bio_md, notes, deceased, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.surname ?? null,
    input.given_name ?? null,
    input.patronymic ?? null,
    input.display_name,
    input.maiden_name ?? null,
    JSON.stringify(input.alt_names ?? []),
    input.sex ?? "unknown",
    input.bio_md ?? null,
    input.notes ?? null,
    input.deceased ? 1 : 0,
    ts,
    ts,
  );
  return get(db, id)!;
}

export function get(db: DB, id: string): PersonDTO | null {
  const row = db.prepare("SELECT * FROM persons WHERE id = ?").get(id) as Row | undefined;
  return row ? toDto(row) : null;
}

export function list(db: DB): PersonDTO[] {
  const rows = db.prepare("SELECT * FROM persons ORDER BY display_name").all() as Row[];
  return rows.map(toDto);
}

export function update(db: DB, id: string, patch: Partial<PersonInput>): PersonDTO | null {
  const cur = get(db, id);
  if (!cur) return null;
  const next = { ...cur, ...patch, alt_names: patch.alt_names ?? cur.alt_names };
  db.prepare(
    `UPDATE persons SET surname=?, given_name=?, patronymic=?, display_name=?, maiden_name=?,
       alt_names_json=?, sex=?, bio_md=?, notes=?, deceased=?, updated_at=? WHERE id=?`,
  ).run(
    next.surname ?? null,
    next.given_name ?? null,
    next.patronymic ?? null,
    next.display_name,
    next.maiden_name ?? null,
    JSON.stringify(next.alt_names),
    next.sex ?? "unknown",
    next.bio_md ?? null,
    next.notes ?? null,
    next.deceased ? 1 : 0,
    nowIso(),
    id,
  );
  return get(db, id);
}

export function remove(db: DB, id: string): void {
  db.prepare("DELETE FROM persons WHERE id = ?").run(id);
}
