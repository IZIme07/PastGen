# PastGen — Production App Design

**Date:** 2026-06-13
**Status:** Approved by direction («доведи приложение до рабочего состояния, сразу в продакшн. Продумай все наперед»). The user delegated decisions; choices below are made autonomously and flagged where they are judgment calls.

## Goal

Turn the PastGen functional spec (`docs/01-functional-system-overview.md`) and the exported Claude Design system (PastGen Design System bundle) into a working, production-deployable application that proves the core scenario: **из хаоса — в проверяемое дерево** (from chaos to a verifiable tree).

## Inputs

- `docs/01-functional-system-overview.md` — functional spec (RU), defines entities, modes, MVP scope (§17).
- Design bundle `pastgen-design-system/` — tokens (warm paper / evergreen / brass, Spectral + IBM Plex), React primitives (Button, Input, Badge, Avatar, Icon, ConfidenceMeter, SourceChip, ClaimRow, PersonCard, ProposalCard), and an interactive UI kit (AppShell with mode rail, pan/zoom/drag Tree+Graph, lifespan Timeline, Map, Import/Proposals, AI assistant panel). The chat transcript shows the user specifically iterated on **tree navigation (pan/zoom/drag nodes)** and the **lifespan timeline** — these are must-keep behaviors.

## Scope (v1 = spec §17 MVP, mapped to the designed surfaces)

In scope:

1. **People & relationships** — full CRUD; relationship types from spec §15.5.
2. **Tree / Graph view** — pan, zoom-to-cursor, fit-to-screen, draggable nodes, tree↔graph toggle, branch colors, confidence rings, conflict flags. Click → dossier.
3. **Dossier** — claims with sources, confidence, alternatives and conflicts; profile confidence; Markdown biography (editable); research tasks; «next step».
4. **Claims model** — every fact is a claim: type, value, confidence, sources, alternative versions, status. Sources attach to claims, not just persons.
5. **Sources** — typed (document / photo / story / letter / archive / comment / link / audio), file upload or text, linked to claims/persons/events.
6. **Import & proposals layer** — upload images/PDF/text → AI extracts names, dates, places, relations, conflicts → creates proposals. Proposals are accepted / deferred / rejected; accepting applies a concrete mutation (create person, add/update claim, add alternative, link source, merge hint). Import never mutates the tree directly.
7. **Timeline** — lifespan view (birth→death bars per person, era guides, today line, disputed markers) driven by real data.
8. **Map** — real map (Leaflet + OpenStreetMap tiles, warm-styled) with place markers, person/event counts, migration routes. Places are entities with coordinates.
9. **AI genealogist** — task-driven assistant (check branch, find weak spots, next 5 steps, draft archive letter, interview questions, explain conflict) with the current person/branch + claims + sources as context. Server-side Anthropic API.
10. **Consistency checks** — rule engine: born after parent's death, parent too young/old, overlapping marriages, event before birth, death before birth, duplicate-person heuristic. Violations become research tasks / conflict flags, never input blockers.
11. **History** — audit log of applied changes (who/what/when/from which proposal).

Out of scope for v1 (per spec §17.2, documented as future):

- Face recognition; audio transcription (Claude API has no speech-to-text — audio files are stored as sources, transcription field editable manually); video stories; multi-user collaboration & sharing; PDF book export; historical border geography.

## Approaches considered

**A. Pure-frontend SPA (IndexedDB/localStorage).** Fastest, but "production" with AI requires exposing the Anthropic key in the browser — unacceptable — and file storage/OCR don't fit. Rejected.

**B. Full-stack Node monolith — React+Vite client, Express+SQLite server, single Docker image.** _Chosen._ Zero external services, one container + one volume, key stays server-side, SQLite is durable and right-sized for a family archive. Easiest credible production deployment for a self-hosted family app.

**C. Postgres + object storage + queue.** Over-engineered for a single-family archive; nothing in the spec needs concurrent writers or horizontal scale. Rejected (YAGNI).

## Architecture (approach B)

```
pastgen/
├─ client/            React 18 + Vite + TypeScript
│  ├─ src/design/     tokens CSS (ported verbatim from bundle), primitives as TSX
│  ├─ src/views/      TreeView, TimelineView, MapView, ImportView, DossierPanel, AssistantPanel, AppShell
│  ├─ src/api/        typed fetch client
│  └─ src/state/      lightweight store (React context + reducers; no Redux)
├─ server/            Node 22 + Express + better-sqlite3 + zod
│  ├─ src/db/         schema.sql, migrations, repository layer
│  ├─ src/routes/     /api/persons /relationships /claims /sources /events /places
│  │                  /proposals /import /assistant /tasks /history /health
│  ├─ src/ai/         Anthropic client, extraction + assistant prompts (RU)
│  ├─ src/consistency/ rule engine
│  └─ src/proposals/  apply-engine (proposal → mutations, transactional)
├─ docs/
├─ Dockerfile         multi-stage: build client → build server → slim runtime
├─ docker-compose.yml volume for /data (SQLite + uploads)
└─ .env.example       ANTHROPIC_API_KEY, PORT, DATA_DIR, BASIC_AUTH (optional)
```

Key decisions:

- **Persistence:** SQLite via better-sqlite3 (synchronous, transactional, single file at `$DATA_DIR/pastgen.db`). Uploads at `$DATA_DIR/uploads/<id>.<ext>`. Migrations run at startup.
- **API:** JSON REST, zod-validated request bodies, consistent error envelope `{error: {code, message}}`. The client never talks to Anthropic directly.
- **AI:** server module wraps the Anthropic SDK. Extraction uses vision (images/PDF) + structured-output prompting to emit proposals JSON; assistant tasks stream-free single responses in the archivist voice (RU). **Degrades gracefully:** without `ANTHROPIC_API_KEY`, import stores files + lets the user create sources/claims manually, and AI surfaces show a calm «ИИ не настроен» state with setup hint. Model ids/params verified against the claude-api reference at implementation time.
- **Auth/privacy:** self-hosted single-family deployment. Optional HTTP Basic Auth via `BASIC_AUTH=user:pass` env (off by default for localhost). Documented in README; full multi-user auth is future work.
- **Production hardening:** helmet, compression, payload limits, upload size/type validation, pino logging, global error handler, `/api/health`, graceful shutdown, Docker healthcheck, non-root container user.
- **Design fidelity:** tokens CSS copied verbatim; primitives re-implemented as typed TSX matching the prototype visuals; the four views ported from the UI kit JSX (keeping the iterated pan/zoom/drag tree and lifespan timeline) but driven by API data instead of `window.PG_DATA`. Lucide via `lucide-react`. Fonts self-hosted (woff2 bundled) per the bundle's own caveat — production must work offline from Google Fonts.

## Data model (SQLite)

- `persons` — id, primary names (фамилия/имя/отчество + display), alt_names JSON, sex, bio_md, notes; computed profile confidence.
- `relationships` — a, b, type (parent/child/spouse/ex_spouse/sibling/adoption/guardian/witness/neighbor/colleague/other), claim-backed confidence.
- `claims` — id, subject_type+subject_id, claim_type (birth_date, birth_place, death_date, death_place, marriage, occupation, name_change, residence, custom…), value JSON, confidence 0–100, status (`primary`/`alternative`/`rejected`), parent_claim_id (alternatives chain), conflict flag + note.
- `sources` — id, type, title, file path/url, recognized_text, metadata JSON, quality, added_at.
- `claim_sources` — claim↔source join with role note (e.g. «подпись на обороте»).
- `events` — id, type, date/date_range, place_id, description, confidence; `event_participants` join.
- `places` — id, name, alt_names, lat, lng, period.
- `proposals` — id, kind, title, detail, payload JSON (the exact mutation), confidence, conflict note, source_ids, status (`pending`/`accepted`/`deferred`/`rejected`), created_from (import id / assistant), decided_at.
- `research_tasks` — id, title, person_id?, status, origin (rule id / AI / manual).
- `history` — append-only audit of applied mutations.
- Profile confidence = weighted aggregate of primary claims' confidence (simple average weighted by claim type importance; documented constant table).

## Data flow (canonical scenario, spec §16)

upload → `/api/import` stores file + source row → AI extraction → proposal rows (pending) → UI Import view lists them as ProposalCards → user accepts → apply-engine runs the payload mutation in one transaction (+history row) → consistency engine re-checks affected persons → new conflicts become research tasks → tree/timeline/map/dossier re-fetch.

## Error handling

- Validation errors → 400 with field details; AI errors → 502 with calm RU message, proposals simply not created (file+source still saved); upload limits → 413. Client shows inline paper-toned alerts (design language: terracotta conflict color, never alarming).
- Consistency violations are **data**, not errors: stored as conflict flags + research tasks.

## Testing

- **Server (vitest):** consistency rule engine (table-driven cases from spec §9), proposal apply-engine (each proposal kind: apply + idempotency + transaction rollback), confidence aggregation, API routes happy/invalid paths via supertest with temp DB. AI module tested with a mocked Anthropic client (prompt→proposal parsing).
- **Client:** type-checked build + smoke render of AppShell with mocked API (vitest + testing-library) for the critical accept-proposal flow.
- **E2E gate:** `docker compose up` + health + manual scenario walkthrough before declaring done.

## Seed data

Ships with the Sokolov family demo dataset from the design bundle (`data.js`) as an optional `npm run seed` — so the production deployment starts empty, but a demo can be stood up instantly.
