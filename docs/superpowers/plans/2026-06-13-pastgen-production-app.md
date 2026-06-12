# PastGen Production App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the PastGen family-history application to production-deployable state from the functional spec and the exported design system bundle.

**Architecture:** npm-workspaces monolith — React 18 + Vite + TS client (design tokens/primitives ported from the bundle), Express + better-sqlite3 + zod server with an AI module (Anthropic API, graceful no-key degradation), proposals apply-engine and consistency rule engine; single Docker image serving API + static client, one `/data` volume.

**Tech Stack:** Node 22, TypeScript, React 18, Vite, Express 4, better-sqlite3, zod, multer, pino, helmet, @anthropic-ai/sdk, leaflet, react-markdown, @fontsource (Spectral, IBM Plex Sans/Mono), lucide-react, vitest + supertest.

**Source of visual truth:** the design bundle vendored at `design/` (Task 0). Views are ported from `design/project/ui_kits/app/*.jsx`, primitives from `design/project/components/**`, tokens copied verbatim from `design/project/tokens/*.css`. Russian UI copy comes from the bundle — do not invent new copy.

---

### Task 0: Vendor the design bundle into the repo

**Files:** Create `design/` (copy of `C:\Users\rrr\AppData\Local\Temp\design-bundle\pastgen-design-system\project\`), `.gitattributes`.

- [ ] Copy bundle: `cp -r /c/Users/rrr/AppData/Local/Temp/design-bundle/pastgen-design-system/project design` (drop `_ds_bundle.js`, `_ds_manifest.json`, `_adherence.oxlintrc.json` — generated artifacts).
- [ ] Commit: `git add design && git commit -m "Vendor PastGen design system bundle"`.

### Task 1: Monorepo scaffold

**Files:** Create `package.json` (workspaces `["server","client","shared"]`, scripts `dev`, `build`, `test`, `seed`, `start`), `shared/package.json`, `shared/src/types.ts`, `server/package.json`, `server/tsconfig.json`, `client/` via `npm create vite@latest client -- --template react-ts`, `.gitignore`, `.env.example`.

- [ ] `shared/src/types.ts` defines the domain types used by both sides (PersonDTO, ClaimDTO, SourceDTO, ProposalDTO with `kind` union `"add_person"|"add_claim"|"add_alternative"|"update_claim"|"link_source"|"add_relationship"|"add_event"|"merge_persons"`, EventDTO, PlaceDTO, ResearchTaskDTO, RelationshipType union per spec §15.5, SourceType union `"document"|"photo"|"story"|"letter"|"archive"|"comment"|"link"|"audio"`).
- [ ] `.env.example`: `ANTHROPIC_API_KEY=`, `PORT=8080`, `DATA_DIR=./data`, `BASIC_AUTH=` (`user:pass` to enable), `ANTHROPIC_MODEL=` (default set in code from claude-api reference).
- [ ] Root scripts: `dev` runs server (tsx watch, port 8080) + client (vite, proxy `/api`→8080); `build` builds shared→client→server; `test` runs vitest in server and client.
- [ ] Verify: `npm install && npm run build` passes. Commit.

### Task 2: DB schema + repositories

**Files:** Create `server/src/db/schema.sql`, `server/src/db/index.ts` (open DB at `$DATA_DIR/pastgen.db`, run schema, FKs on, WAL), `server/src/db/repos/{persons,relationships,claims,sources,events,places,proposals,tasks,history}.ts`. Test: `server/test/db.test.ts` (temp-dir DB fixture).

- [ ] schema.sql tables (all ids TEXT uuid, timestamps TEXT ISO):
  - `persons(id, surname, given_name, patronymic, display_name, maiden_name, alt_names_json, sex, bio_md, notes, deceased INTEGER, created_at, updated_at)`
  - `relationships(id, a_id→persons, b_id→persons, type, confidence, UNIQUE(a_id,b_id,type))`
  - `claims(id, subject_type, subject_id, claim_type, value_json, confidence, status DEFAULT 'primary' CHECK(status IN('primary','alternative','rejected')), parent_claim_id, conflict INTEGER, conflict_note, created_at, updated_at)`
  - `sources(id, type, title, file_path, url, recognized_text, metadata_json, quality, added_at)`
  - `claim_sources(claim_id, source_id, note, PRIMARY KEY(claim_id,source_id))`
  - `events(id, type, date_from, date_to, place_id, description, confidence)` + `event_participants(event_id, person_id, role)`
  - `places(id, name, alt_names_json, lat, lng, period)`
  - `proposals(id, kind, title, detail, payload_json, confidence, conflict_note, source_ids_json, status DEFAULT 'pending' CHECK(status IN('pending','accepted','deferred','rejected')), created_from, created_at, decided_at)`
  - `research_tasks(id, title, person_id, status DEFAULT 'open', origin, created_at)`
  - `history(id, ts, action, entity_type, entity_id, detail_json, proposal_id)`
- [ ] Repos: plain functions over prepared statements (`create`, `get`, `list`, `update`, `remove`, plus `claims.listForSubject`, `relationships.listForPerson`). Test-first: write `db.test.ts` covering person CRUD, claim with alternative chain, claim_sources join, FK cascade on person delete. Run `npm -w server run test` → fail → implement → pass. Commit.

### Task 3: Profile confidence aggregation

**Files:** Create `server/src/domain/confidence.ts`. Test: `server/test/confidence.test.ts`.

- [ ] `profileConfidence(claims: {claim_type, confidence, status}[]): number` — mean of `primary` claims weighted by `WEIGHTS = {birth_date:3, birth_place:2, death_date:2, death_place:1, marriage:2, relationship:2, default:1}`, rounded; 0 claims → 0. Table-driven tests (incl. Maria: birth 70 + marriage 95 + children 90 + death 38 ≈ 74). TDD cycle, commit.

### Task 4: Consistency rule engine

**Files:** Create `server/src/consistency/{rules.ts,engine.ts}`. Test: `server/test/consistency.test.ts`.

- [ ] Rules (each `(ctx, personId) → Violation[]` where Violation = `{rule, personIds, message}` with RU messages in the archivist voice):
  `born_after_parent_death`, `parent_too_young` (<13), `parent_too_old` (mother >55 at birth), `overlapping_marriages`, `event_before_birth`, `death_before_birth`, `possible_duplicate` (same surname + given_name + birth year ±1).
- [ ] `runChecks(db, personIds)` collects violations, sets claim `conflict` flags, and upserts `research_tasks` (origin = rule id, no duplicates for same rule+person). Table-driven tests from spec §9 first → implement → pass. Commit.

### Task 5: Proposal apply-engine

**Files:** Create `server/src/proposals/apply.ts`. Test: `server/test/apply.test.ts`.

- [ ] `applyProposal(db, proposalId)` — in one transaction, switch on `kind`:
  - `add_person` payload `{person}` → insert person (+ optional relationship)
  - `add_claim` `{subject_id, claim_type, value, confidence}` → insert primary claim; if a primary of same type exists with different value → insert as `alternative` + set conflict on both
  - `add_alternative` `{claim_id, value, confidence}` → alternative child claim
  - `update_claim` `{claim_id, value?, confidence?}` → update
  - `link_source` `{claim_id, source_id, note?}` → claim_sources row
  - `add_relationship` `{a_id, b_id, type}` → relationship
  - `add_event` `{event}` (+participants, optional new place by name+coords)
  - `merge_persons` `{keep_id, drop_id}` → move claims/relationships/event_participants to keep, drop person, record alt name
  Then: mark proposal accepted, write `history` row, `runChecks` on affected persons. Reject/defer = status update only. Applying a non-pending proposal → error (idempotency). Tests per kind incl. rollback on bad payload (TDD). Commit.

### Task 6: REST API

**Files:** Create `server/src/app.ts` (express app factory, used by tests), `server/src/index.ts` (listen + graceful shutdown), `server/src/middleware/{errors.ts,auth.ts}`, `server/src/routes/{persons,relationships,claims,sources,events,places,proposals,tasks,history,health}.ts`. Test: `server/test/api.test.ts` (supertest, temp DB).

- [ ] Routes (zod-validated, error envelope `{error:{code,message,details?}}`):
  - `GET/POST /api/persons`, `GET/PATCH/DELETE /api/persons/:id` (GET returns person + claims + relationships + profile confidence + open tasks — the dossier payload)
  - `GET/POST/DELETE /api/relationships`
  - `POST /api/claims`, `PATCH/DELETE /api/claims/:id`, `POST /api/claims/:id/sources`
  - `GET/POST /api/sources`, `GET /api/sources/:id/file` (stream upload)
  - `GET/POST /api/events`, `GET/POST /api/places`
  - `GET /api/proposals?status=`, `POST /api/proposals/:id/{accept,defer,reject}`
  - `GET/POST/PATCH /api/tasks`, `GET /api/history`, `GET /api/health` → `{ok:true, ai:boolean}`
  - `GET /api/tree` → `{persons[], relationships[]}` (one call for tree/timeline/map)
- [ ] Middleware: helmet, compression, `express.json({limit:'1mb'})`, pino-http, optional basic auth from `BASIC_AUTH`, 404 + error handlers. Static client serving from `client/dist` when present.
- [ ] supertest coverage: person create→dossier fetch, invalid body 400, proposal accept flow end-to-end, health. TDD, commit.

### Task 7: Import pipeline + AI module

**Files:** Create `server/src/ai/{client.ts,extract.ts,assistant.ts,prompts.ts}`, `server/src/routes/{import.ts,assistant.ts}`. Test: `server/test/{import.test.ts,ai.test.ts}` (Anthropic client mocked).

- [ ] **Before writing `client.ts`, consult the `claude-api` skill** for current model id, vision/PDF input format, and max_tokens; pin default model in one constant, overridable by `ANTHROPIC_MODEL`.
- [ ] `POST /api/import` (multer → `$DATA_DIR/uploads/<uuid>.<ext>`; accept jpg/png/webp/pdf/txt/md/mp3/m4a/ogg, 25 MB cap; also accepts raw text body): always create a `sources` row; if AI configured and type is image/pdf/text → `extract.ts` sends content + RU system prompt demanding strict JSON `{proposals:[{kind,title,detail,confidence,payload,conflict_note?}], recognized_text}` (use existing persons list as matching context); persist recognized_text and proposal rows linked to the source. AI failure → 200 with `{source, proposals: [], ai_error}` (file is never lost). No key → same shape with `ai: false`.
- [ ] `POST /api/assistant` `{task, person_id?}` — task union from spec §8 (`check_branch`,`weak_spots`,`next_steps`,`archive_letter`,`interview_questions`,`explain_conflict`,`summarize_branch`); context = dossier payload + relationships + open tasks; returns `{text}` in the archivist voice; some tasks may also return proposals (created as pending). No key → 503 `{error:{code:'ai_not_configured'}}`.
- [ ] Tests: mocked extraction returns parseable + unparseable JSON (unparseable → proposals skipped, source kept); upload type/size rejection; assistant without key → 503. TDD, commit.

### Task 8: Seed script

**Files:** Create `server/src/seed.ts` (root script `npm run seed`).

- [ ] Port the Sokolov dataset from `design/ui_kits/app/data.js`: 7 persons (numeric years from `years`, branch info as notes), 11 relationships, Maria's 4 claims with sources + alternatives (1928/1930 birth conflict), 4 pending proposals, places Тула/Москва/Калуга with real coords (54.19/37.62, 55.75/37.62, 54.51/36.26), events (эвакуация 1941, брак 1949), Maria's research tasks and bio_md from the dossier summary. Idempotent (skips if persons exist). Verify by running + hitting `/api/tree`. Commit.

### Task 9: Client design layer

**Files:** Create `client/src/design/tokens/*.css` (verbatim from `design/tokens/`), `client/src/design/styles.css` (imports + fontsource imports), `client/src/design/{Icon,Button,IconButton,Input,Badge,Avatar,ConfidenceMeter,SourceChip,ClaimRow,PersonCard,ProposalCard}.tsx` (typed ports of `design/components/**/*.jsx`, props from the sibling `.d.ts` files), `client/src/api/client.ts`, `client/src/state/store.tsx`.

- [ ] Replace Google Fonts CDN with `@fontsource/spectral`, `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono` (cyrillic+latin, weights used by tokens). Icons via `lucide-react` wrapped in `Icon` (strokeWidth 1.75).
- [ ] `api/client.ts`: typed fetch wrappers for every route in Task 6/7; `state/store.tsx`: React context with `{tree, selectedPersonId, proposals, view}` + refetch actions.
- [ ] Verify: vitest smoke render of ConfidenceMeter + ClaimRow; `npm -w client run build` clean. Commit.

### Task 10: AppShell + TreeView

**Files:** Create `client/src/views/{AppShell,TreeView}.tsx`, modify `client/src/App.tsx`.

- [ ] Port `design/ui_kits/app/AppShell.jsx` (64px evergreen mode rail, 56px topbar with search, 300px filters sidebar, dossier orchestration) and `TreeView.jsx` **preserving the iterated behaviors**: drag-to-pan, wheel zoom-to-cursor, +/− controls, fit-to-screen, per-node dragging with live edges, Дерево↔Граф toggle, branch accent rails, confidence rings, conflict flags. Data from `/api/tree`; layout computed from relationships (generations via parent edges) instead of hardcoded x/gen. Node click → select person (dossier opens). «Добавить человека» button → minimal create form (Input + Button primitives) posting to `/api/persons`.
- [ ] Verify in browser against seed data; build clean. Commit.

### Task 11: DossierPanel

**Files:** Create `client/src/views/DossierPanel.tsx`.

- [ ] Port `DossierPanel.jsx`: 400px right panel — serif name + alt names, profile ConfidenceMeter, ClaimRows (sources, confidence, alternatives, conflict notes), research tasks, «следующий шаг», bio as rendered Markdown (react-markdown) with edit toggle (textarea → PATCH person). Add claim (type/value/confidence/source picker) and add relationship inline forms. All data from `GET /api/persons/:id`. Verify with Maria's seeded dossier. Commit.

### Task 12: Timeline + Map

**Files:** Create `client/src/views/{TimelineView,MapView}.tsx`.

- [ ] TimelineView: port lifespan design (year axis with decades, birth→death/present bar per person grouped by generation, gutter confidence rings, era guide lines from events, today line, «?» marker on disputed birth claims). Driven by `/api/tree` + events.
- [ ] MapView: Leaflet + OSM tiles (warm CSS filter per design palette), markers from `/api/places` with person/event counts in paper-styled popups, polyline migration routes from move-type events, places rail as in `MapView.jsx`. Attribution kept. Commit.

### Task 13: ImportView + AssistantPanel

**Files:** Create `client/src/views/{ImportView,AssistantPanel}.tsx`.

- [ ] ImportView: drag-drop/file upload + paste-text → `POST /api/import`; left rail lists sources; right side pending ProposalCards with Принять/Отложить/Отклонить → proposal endpoints → refetch tree. AI-off and ai_error states show the calm «ИИ не настроен» / error notes from the design language.
- [ ] AssistantPanel: brass-accent slide-in panel, task buttons (spec §8 list), responses rendered as Markdown, proposals created by assistant link to ImportView. 503 → setup hint. Commit.

### Task 14: Production packaging

**Files:** Create `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `README.md` (RU quick start: dev, seed, deploy, env, backup `/data`).

- [ ] Multi-stage Dockerfile: deps → build (shared, client, server) → `node:22-slim` runtime, non-root `node` user, only prod deps + `client/dist` + compiled server, `ENV DATA_DIR=/data`, `EXPOSE 8080`, `HEALTHCHECK CMD node -e "fetch('http://localhost:8080/api/health').then(r=>{if(!r.ok)process.exit(1)})"`. compose: one service, `./data:/data` volume, env_file.
- [ ] Verify: `docker compose up --build` → health ok, seeded scenario works through the container. Commit.

### Task 15: Final verification gate

- [ ] `npm test` (all workspaces) green; `npm run build` clean; docker build + health green.
- [ ] Walk the canonical scenario (spec §16) against the running app: import text mentioning a new fact → proposal appears → accept → dossier/tree/timeline update → consistency task appears for a planted contradiction.
- [ ] Update README with screenshots section placeholder removed; commit; report with evidence (verification-before-completion skill).
