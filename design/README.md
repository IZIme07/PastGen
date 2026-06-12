# PastGen Design System

**PastGen** is an app for creating, researching and preserving family history.
Its central promise: you should never fill out long forms. You *talk to* your
family tree — upload scattered photos, documents, PDFs, audio and notes, and an
AI genealogist turns that chaos into a **verifiable, beautiful, living family
system**. Tree, timeline and map are three equal ways of looking at one story;
every fact explains where it came from.

This design system gives agents the foundations, components and full-screen UI
kits to design *for* PastGen — in its real voice and visual language.

---

## Sources

| Source | Link | Notes |
|--------|------|-------|
| Functional spec (RU) | `github.com/IZIme07/PastGen` → `docs/01-functional-system-overview.md` | The **only** existing material. No code, no UI, no brand assets. |

> Explore the repository to do better work:
> **https://github.com/IZIme07/PastGen**
>
> Because the product ships no interface yet, **every visual decision in this
> system is an original proposal** grounded in the spec — not a recreation of an
> existing product. Treat the brand below as a strong v1 to iterate on, not as a
> fixed fact.

The spec's section 19 explicitly leaves the visual style open ("warm family
archive / research graph / minimal work product"). We chose a deliberate blend.

---

## The chosen direction — "a research instrument with an archival soul"

Warm paper surfaces, a literary serif and a heritage palette give PastGen the
feeling of a well-bound family archive. A precise humanist sans + mono, and
**confidence + provenance treated as first-class brand color**, keep it a real
research tool. Uncertainty is always *visible* but never *alarming*; conflicts
become research tasks, not error states.

- **Primary** — heritage evergreen `#2F5043` (the living tree)
- **Accent** — heirloom brass `#B68A4B` (highlights, the AI invocation)
- **Surfaces** — warm paper `#FBF8F1 → #ECE4D4`
- **Signature semantics** — a four-step confidence scale (confirmed → probable →
  inferred → hypothesis) plus a terracotta *conflict* color.

---

## Content fundamentals

PastGen's product copy is **Russian** (matching the source spec). The voice is
that of a **calm, literate archivist** — precise, warm, never bureaucratic.

- **Address the user with «вы» implicitly; speak about the work, not the tool.**
  Labels name the *research act*: «Принять», «Отложить», «Отклонить»,
  «Проверить ветку», «Найти слабые места».
- **Tone:** quiet authority. "ИИ всегда предлагает, но пользователь подтверждает"
  — the system proposes, the user decides. Never imperative or hyped.
- **Casing:** Sentence case everywhere in UI. Overline eyebrows are UPPERCASE
  with wide tracking («ДОСЬЕ ЧЕЛОВЕКА», «СЛОЙ ОБНОВЛЕНИЙ ДЕРЕВА»). No Title Case.
- **Numbers are evidence.** Confidence is shown as a plain percentage in mono
  («76%»), never dressed up. Dates and lifespans are mono («1928–2009»).
- **Uncertainty is spoken plainly:** «Не подтверждено», «Конфликт: 1928 или
  1930», «Гипотеза ИИ». State the doubt; offer the next step.
- **Names carry weight** — render people's full names in the serif, including
  patronymics and alternative spellings («Мария Ивановна Соколова (урожд.
  Громова)»).
- **No emoji.** No exclamation marks. The dagger «†» marks the deceased. Source
  types are named, not iconified-only («Документ», «Рассказ», «Подпись на
  обороте»).
- **Microcopy pattern** for any fact: *what it is → how sure → from where → what
  next.* See the dossier claim rows.

Example (from the spec, the canonical dossier voice):

> Мария Ивановна Соколова — Уверенность профиля: 76%
> Подтверждено: рождение, брак, 2 ребёнка. Не подтверждено: место смерти.
> Конфликты: дата рождения — 1928 или 1930.
> Следующий шаг: проверить метрические книги или эвакуационные списки.

---

## Visual foundations

**Palette & temperature.** Warm, low-chroma, aged-paper. Backgrounds are paper
tones, never pure white; text is warm near-black ink, never `#000`. Brand
evergreen and brass are used sparingly as anchors. Imagery (when present) leans
warm and slightly desaturated — family-archive, not glossy stock.

**Typography.**
- *Spectral* (serif) — display, headings, names, and Markdown story prose. The
  heritage/narrative voice.
- *IBM Plex Sans* — all working UI text. Precise, humanist, full Cyrillic.
- *IBM Plex Mono* — archival metadata: dates, lifespans, confidence figures,
  source refs, document text.
- All three ship Cyrillic + Latin (the product is Russian).

**Backgrounds.** Mostly flat paper. A *very* subtle dotted paper texture
(`.pg-paper`) is available for large canvases (tree, timeline, import) — never
loud. No purple/blue hero gradients. The map uses a warm parchment radial + a
faint graticule.

**Borders & cards.** Cards are warm white (`--card`) with a 1px warm hairline
(`--line`/`--line-strong`) and gentle radii (8–14px). A **3px left accent rail**
denotes branch membership (evergreen / brass / slate) or a conflict (terracotta)
— this is the system's one signature "colored edge," used semantically, not
decoratively.

**Elevation.** Soft, warm-tinted shadows (brown-based, low opacity), four steps
xs→lg. Resting cards use `xs`; raised/selected use `sm`/`md`; dialogs and the AI
panel use `lg`. Never hard or neon shadows.

**Radii.** xs 4 · sm 6 · md 10 · lg 14 · pill 999 (avatars, confidence pills,
chips-as-toggles).

**Confidence as a visual.** The `ConfidenceMeter` ring (and bar) is the brand's
hero element: a colored arc whose hue *derives from* the value (≥85 green, ≥60
brass, ≥35 ochre, else grey). Always paired with at least one `SourceChip`.

**Hover / press.** Hover darkens fills one step (evergreen 600→700) or tints
paper (transparent→`paper-2`); ghost buttons tint paper. Press darkens a further
step and nudges `translateY(0.5px)` — a small, grounded settle. No bounce, no
scale-up.

**Motion.** Restrained and archival. Standard easing
`cubic-bezier(0.22,0.61,0.36,1)`, 120–320ms. Confidence arcs and bars animate
their fill on mount; panels slide (AI panel) with `ease-out`. No infinite
loops, no springy overshoot. Respect `prefers-reduced-motion`.

**Transparency & blur.** Used rarely — only the modal scrim
(`--overlay-scrim`). Surfaces are opaque paper; the archive feels physical, not
glassy.

**Focus.** A brass focus halo (`--shadow-focus`, 3px) — visible, warm, on-brand.

**Layout rails.** Fixed mode rail 64px (evergreen-800) · filters sidebar 300px ·
dossier panel 400px · topbar 56px. Three equal modes (tree/timeline/map) plus
the import/AI surface.

---

## Iconography

PastGen uses **[Lucide](https://lucide.dev)** (MIT) — a consistent, light-stroke
icon set whose precision suits the "instrument" half of the brand. Loaded from
CDN (`unpkg.com/lucide`) and wrapped in the `Icon` primitive; stroke weight is
tuned to **1.75** (slightly lighter than Lucide's default) for an archival feel.
Icons inherit `currentColor`.

- **Why a substitution:** the product had no icon assets, so this is a chosen
  set, not a port. Flagged for the user — swap freely.
- **No emoji, no unicode-as-icon** — with one deliberate exception: the dagger
  «†» as the deceased marker on avatars.
- **Core vocabulary:** `git-fork` (tree), `calendar-clock` (timeline), `map`,
  `user`/`users`, `file-text` (document), `image` (photo), `mic` (voice note),
  `sparkles` (AI genealogist), `shield-check` (confirmed), `triangle-alert`
  (conflict), `map-pin`, `archive`, `git-merge`/`git-compare` (merge/alternate
  versions), `book-open` (story), plus `check`/`x`/`plus`/`search`/`chevron-right`.
- See the **Iconography · Icon** card for the full grid.

**Brand mark.** `assets/mark-pastgen.svg` (and the wordmark `logo-pastgen.svg`,
plus a dark variant) is an original placeholder: a family-tree node — one
ancestor branching to two descendants, the brass child hinting at "the next
generation / new data." **Flagged: replace with a real logo when available.**

---

## Index / manifest

**Root**
- `styles.css` — the single entry point consumers link (only `@import`s).
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `base.css`.
- `assets/` — `mark-pastgen.svg`, `logo-pastgen.svg`, `logo-pastgen-dark.svg`.
- `SKILL.md` — Agent-Skill front matter for Claude Code use.

**Components** (`components/<group>/` — React primitives, `window.PastGenDesignSystem_…`)
- `icon/` — **Icon**
- `buttons/` — **Button**, **IconButton**
- `forms/` — **Input**
- `data-display/` — **Badge**, **Avatar**
- `confidence/` — **ConfidenceMeter**, **SourceChip** *(signature)*
- `dossier/` — **ClaimRow**, **PersonCard**, **ProposalCard** *(domain composites)*

**Foundation cards** (`guidelines/*.card.html`) — Colors, Type, Spacing, Brand
specimens shown in the Design System tab.

**UI kit** (`ui_kits/app/`) — interactive desktop workspace: Tree, Dossier,
Timeline, Map, Import/Proposals, AI assistant. See `ui_kits/app/README.md`.

---

## Caveats / open questions (from the spec, §19)

- Visual style was an editorial choice — confirm the archival-instrument blend.
- Fonts load from Google Fonts CDN; provide self-hosted woff2 for offline use.
- Lucide is a chosen icon set; the logo is a placeholder.
- UI copy is Russian; an English variant would need a parallel pass.
