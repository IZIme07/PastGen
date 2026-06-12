# PastGen — App UI kit

An interactive, high-fidelity recreation of the PastGen desktop workspace: the
family-research surface where a chaotic archive becomes a verifiable tree.

> PastGen has **no existing UI codebase** — only a Russian functional spec
> (`IZIme07/PastGen`, `docs/01-functional-system-overview.md`). These screens
> are an original design built from that spec and the PastGen design system, not
> a copy of a shipped product.

## Run it
Open `index.html`. It loads the compiled design-system bundle
(`../../_ds_bundle.js`), Lucide (icons) and the JSX views below.

## Surfaces
| Mode | File | What it shows |
|------|------|---------------|
| **Дерево** (Tree) | `TreeView.jsx` | 3-generation Sokolov tree with orthogonal connectors, branch colors, confidence rings, conflict flags. Click a node → dossier. |
| **Досье** (Dossier) | `DossierPanel.jsx` | Person dossier: story, verifiable `ClaimRow`s with sources & confidence, next research steps. |
| **Таймлайн** (Timeline) | `TimelineView.jsx` | The family history as a chronological river — births, marriages, migrations, deaths, each with confidence. |
| **Карта** (Map) | `MapView.jsx` | Stylized archival map: place markers, migration route (Тула → Москва), places rail. |
| **Импорт · ИИ** (Import) | `ImportView.jsx` | The update layer — imported chaos on the left, AI `ProposalCard`s to accept / defer / reject. |
| **ИИ-генеалог** | `AssistantPanel.jsx` | Task-driven research assistant (not a generic chat): weak spots, next steps, sources. |
| Shell | `AppShell.jsx` | Mode rail, topbar, tree filters sidebar, panel orchestration. |
| Data | `data.js` | Sample Sokolov family archive (`window.PG_DATA`). |

## Composition
Every screen is assembled from the published primitives
(`window.PastGenDesignSystem_…`): `Avatar`, `Badge`, `Button`, `IconButton`,
`Input`, `Icon`, `ConfidenceMeter`, `SourceChip`, `ClaimRow`, `PersonCard`,
`ProposalCard`. The tree node and map are kit-local cosmetic compositions.

## Known shortcuts
- The map is a stylized CSS/SVG representation, not real geographic tiles —
  swap in a map provider for production.
- Tree layout uses fixed positions for a believable demo, not a real graph
  layout engine.
- Photos use generated initial-avatars; drop in real portraits for production.
