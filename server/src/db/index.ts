import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type DB = Database.Database;

const here = path.dirname(fileURLToPath(import.meta.url));

function schemaPath(): string {
  // dist/db → ../../src/db/schema.sql не существует в Docker; schema.sql копируется рядом при сборке.
  const candidates = [
    path.join(here, "schema.sql"),
    path.join(here, "../../src/db/schema.sql"),
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  throw new Error("schema.sql not found");
}

/** Открывает (создавая при необходимости) базу в каталоге dataDir и применяет схему. */
export function openDb(dataDir: string): DB {
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new Database(path.join(dataDir, "pastgen.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(fs.readFileSync(schemaPath(), "utf-8"));
  return db;
}

/** База в памяти — для тестов. */
export function openMemoryDb(): DB {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(fs.readFileSync(schemaPath(), "utf-8"));
  return db;
}

export const nowIso = () => new Date().toISOString();
export const uid = () => crypto.randomUUID();
