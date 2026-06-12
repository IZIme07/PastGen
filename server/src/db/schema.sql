-- Схема PastGen. Все id — TEXT (uuid), время — TEXT (ISO 8601).
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS persons (
  id TEXT PRIMARY KEY,
  surname TEXT,
  given_name TEXT,
  patronymic TEXT,
  display_name TEXT NOT NULL,
  maiden_name TEXT,
  alt_names_json TEXT NOT NULL DEFAULT '[]',
  sex TEXT NOT NULL DEFAULT 'unknown' CHECK (sex IN ('male','female','unknown')),
  bio_md TEXT,
  notes TEXT,
  deceased INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS relationships (
  id TEXT PRIMARY KEY,
  a_id TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  b_id TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('parent','spouse','ex_spouse','sibling','adoption','guardian','witness','neighbor','colleague','other')),
  confidence INTEGER,
  UNIQUE (a_id, b_id, type)
);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('document','photo','story','letter','archive','comment','link','audio')),
  title TEXT NOT NULL,
  file_path TEXT,
  url TEXT,
  recognized_text TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  quality INTEGER,
  added_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('person','event','relationship')),
  subject_id TEXT NOT NULL,
  claim_type TEXT NOT NULL,
  value_json TEXT NOT NULL DEFAULT '{}',
  confidence INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'primary' CHECK (status IN ('primary','alternative','rejected')),
  parent_claim_id TEXT REFERENCES claims(id) ON DELETE SET NULL,
  conflict INTEGER NOT NULL DEFAULT 0,
  conflict_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_claims_subject ON claims(subject_type, subject_id);

CREATE TABLE IF NOT EXISTS claim_sources (
  claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  note TEXT,
  PRIMARY KEY (claim_id, source_id)
);

CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  alt_names_json TEXT NOT NULL DEFAULT '[]',
  lat REAL,
  lng REAL,
  period TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  date_from TEXT,
  date_to TEXT,
  place_id TEXT REFERENCES places(id) ON DELETE SET NULL,
  description TEXT,
  confidence INTEGER
);

CREATE TABLE IF NOT EXISTS event_participants (
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  person_id TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  role TEXT,
  PRIMARY KEY (event_id, person_id)
);

CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('add_person','add_claim','add_alternative','update_claim','link_source','add_relationship','add_event','merge_persons')),
  title TEXT NOT NULL,
  detail TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  confidence INTEGER NOT NULL DEFAULT 50,
  conflict_note TEXT,
  source_ids_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','deferred','rejected')),
  created_from TEXT,
  created_at TEXT NOT NULL,
  decided_at TEXT
);

CREATE TABLE IF NOT EXISTS research_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  person_id TEXT REFERENCES persons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','done','dismissed')),
  origin TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS history (
  id TEXT PRIMARY KEY,
  ts TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  detail_json TEXT NOT NULL DEFAULT '{}',
  proposal_id TEXT
);
