---
name: pastgen-design
description: Use this skill to generate well-branded interfaces and assets for PastGen — the AI-assisted family-history app — for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, the Lucide icon vocabulary, brand mark, reusable React components (including the signature ConfidenceMeter, SourceChip and ProposalCard) and a full desktop UI kit.
user-invocable: true
---

Read the `README.md` file within this skill first — it carries the product
context, content voice (Russian, calm-archivist), visual foundations,
iconography and a full file manifest. Then explore the other files as needed.

Key facts:
- **Brand:** "a research instrument with an archival soul." Warm paper surfaces,
  heritage evergreen `#2F5043` + heirloom brass `#B68A4B`, Spectral (serif) +
  IBM Plex Sans/Mono. Uncertainty is visible but calm; confidence + provenance
  are first-class.
- **Tokens & global CSS:** link `styles.css` (it `@import`s everything in
  `tokens/`). Use the semantic aliases (`--brand`, `--surface-card`,
  `--text-strong`, `--conf-confirmed`, `--conflict-500`, …).
- **Components:** compiled into `_ds_bundle.js`, exposed on
  `window.PastGenDesignSystem_…`. Read each component's `.prompt.md` for usage.
  The signature trio is `ConfidenceMeter`, `SourceChip`, `ProposalCard`.
- **Icons:** Lucide (CDN) via the `Icon` primitive. No emoji (except the «†»
  deceased marker).
- **UI kit:** `ui_kits/app/` is an interactive recreation of the workspace
  (tree / timeline / map / import / AI assistant) — a reference for full screens.

If creating visual artifacts (slides, mocks, throwaway prototypes), copy the
assets you need out and produce static HTML files for the user to view. If
working on production code, copy the tokens/components and follow the rules here
to design as an expert in this brand.

If the user invokes this skill without other guidance, ask what they want to
build, ask a few focused questions (surface, Russian vs English, which views),
and act as an expert PastGen designer who outputs HTML artifacts **or**
production code, depending on the need.
