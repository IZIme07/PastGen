import type { SourceDTO, SourceType } from "@pastgen/shared";
import { type DB, nowIso, uid } from "../index.js";

interface Row {
  id: string;
  type: SourceType;
  title: string;
  file_path: string | null;
  url: string | null;
  recognized_text: string | null;
  metadata_json: string;
  quality: number | null;
  added_at: string;
}

function toDto(r: Row): SourceDTO {
  return { ...r, metadata: JSON.parse(r.metadata_json) };
}

export interface SourceInput {
  type: SourceType;
  title: string;
  file_path?: string | null;
  url?: string | null;
  recognized_text?: string | null;
  metadata?: Record<string, unknown>;
  quality?: number | null;
}

export function create(db: DB, input: SourceInput, id = uid()): SourceDTO {
  db.prepare(
    `INSERT INTO sources (id, type, title, file_path, url, recognized_text, metadata_json, quality, added_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.type,
    input.title,
    input.file_path ?? null,
    input.url ?? null,
    input.recognized_text ?? null,
    JSON.stringify(input.metadata ?? {}),
    input.quality ?? null,
    nowIso(),
  );
  return get(db, id)!;
}

export function get(db: DB, id: string): SourceDTO | null {
  const row = db.prepare("SELECT * FROM sources WHERE id = ?").get(id) as Row | undefined;
  return row ? toDto(row) : null;
}

export function list(db: DB): SourceDTO[] {
  const rows = db.prepare("SELECT * FROM sources ORDER BY added_at DESC").all() as Row[];
  return rows.map(toDto);
}

export function update(
  db: DB,
  id: string,
  patch: Partial<Pick<SourceInput, "recognized_text" | "title" | "quality">>,
): SourceDTO | null {
  const cur = get(db, id);
  if (!cur) return null;
  db.prepare("UPDATE sources SET title=?, recognized_text=?, quality=? WHERE id=?").run(
    patch.title ?? cur.title,
    patch.recognized_text !== undefined ? patch.recognized_text : cur.recognized_text,
    patch.quality !== undefined ? patch.quality : cur.quality,
    id,
  );
  return get(db, id);
}
