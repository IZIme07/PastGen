import type { PlaceDTO } from "@pastgen/shared";
import { type DB, uid } from "../index.js";

interface Row {
  id: string;
  name: string;
  alt_names_json: string;
  lat: number | null;
  lng: number | null;
  period: string | null;
}

function toDto(r: Row): PlaceDTO {
  return { ...r, alt_names: JSON.parse(r.alt_names_json) };
}

export interface PlaceInput {
  name: string;
  alt_names?: string[];
  lat?: number | null;
  lng?: number | null;
  period?: string | null;
}

export function create(db: DB, input: PlaceInput, id = uid()): PlaceDTO {
  db.prepare(
    "INSERT INTO places (id, name, alt_names_json, lat, lng, period) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(id, input.name, JSON.stringify(input.alt_names ?? []), input.lat ?? null, input.lng ?? null, input.period ?? null);
  return get(db, id)!;
}

export function get(db: DB, id: string): PlaceDTO | null {
  const row = db.prepare("SELECT * FROM places WHERE id = ?").get(id) as Row | undefined;
  return row ? toDto(row) : null;
}

export function findByName(db: DB, name: string): PlaceDTO | null {
  const row = db.prepare("SELECT * FROM places WHERE name = ? COLLATE NOCASE").get(name) as
    | Row
    | undefined;
  return row ? toDto(row) : null;
}

export function list(db: DB): PlaceDTO[] {
  return (db.prepare("SELECT * FROM places ORDER BY name").all() as Row[]).map(toDto);
}
