import { useMemo, useState } from "react";
import { Badge } from "../design/Badge";
import { Button } from "../design/Button";
import { Icon } from "../design/Icon";
import { IconButton } from "../design/IconButton";
import { useStore, type TreeLayout, type ViewMode } from "../state/store";
import { BRANCH_COLORS, BRANCH_LABELS, branchOf, type Branch } from "./helpers";
import { TreeView } from "./TreeView";
import { TimelineView } from "./TimelineView";
import { MapView } from "./MapView";
import { ImportView } from "./ImportView";
import { DossierPanel } from "./DossierPanel";
import { AssistantPanel } from "./AssistantPanel";

function ModeRail() {
  const { view, setView, pendingCount } = useStore();
  const modes: { id: ViewMode; icon: string; label: string }[] = [
    { id: "tree", icon: "git-fork", label: "Дерево" },
    { id: "timeline", icon: "calendar-clock", label: "Таймлайн" },
    { id: "map", icon: "map", label: "Карта" },
    { id: "import", icon: "sparkles", label: "Импорт · ИИ" },
  ];
  return (
    <nav style={{
      width: "var(--rail-nav)", flex: "0 0 var(--rail-nav)", background: "var(--evergreen-800)",
      display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 0", gap: 6,
    }}>
      <img src="/mark-pastgen.svg" alt="PastGen" width="30" height="30"
        style={{ marginBottom: 14, filter: "saturate(0.6) brightness(1.6)" }} />
      {modes.map((m) => {
        const active = view === m.id;
        return (
          <button key={m.id} onClick={() => setView(m.id)} title={m.label}
            style={{
              position: "relative", width: 44, height: 44, borderRadius: "var(--radius-md)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: active ? "rgba(246,241,231,0.14)" : "transparent",
              color: active ? "#fff" : "rgba(246,241,231,0.6)", transition: "background var(--dur-fast)",
            }}>
            <Icon name={m.icon} size={22} />
            {active && <span style={{
              position: "absolute", left: -14, top: 11, width: 3, height: 22,
              borderRadius: 999, background: "var(--brass-500)",
            }} />}
            {m.id === "import" && pendingCount > 0 && (
              <span style={{
                position: "absolute", top: 4, right: 4, minWidth: 16, height: 16, padding: "0 4px",
                borderRadius: 999, background: "var(--brass-500)", color: "#2A1E0C",
                font: "var(--w-bold) 10px/16px var(--font-sans)",
              }}>{pendingCount}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function TopBar() {
  const { view, setAssistantOpen, tree, select, setView } = useStore();
  const [query, setQuery] = useState("");
  const titles: Record<ViewMode, string> = {
    tree: "Семейное дерево", timeline: "Лента времени",
    map: "Карта семьи", import: "Импорт и предложения",
  };
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return tree.persons
      .filter((p) => p.display_name.toLowerCase().includes(q) || p.alt_names.some((n) => n.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [query, tree.persons]);

  return (
    <header style={{
      height: "var(--topbar-h)", flex: "0 0 var(--topbar-h)", display: "flex", alignItems: "center",
      gap: 12, padding: "0 16px", background: "var(--paper-0)", borderBottom: "1px solid var(--line-strong)",
      position: "relative", zIndex: 30,
    }}>
      <img src="/logo-pastgen.svg" alt="PastGen" height="26" />
      <div style={{ width: 1, height: 22, background: "var(--line)" }} />
      <span style={{ font: "var(--w-semibold) 15px/1 var(--font-sans)", color: "var(--text-strong)" }}>
        {titles[view]}
      </span>
      <div style={{ flex: 1, maxWidth: 340, marginLeft: 8, position: "relative" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--surface-card)", border: "1px solid var(--line-strong)",
          borderRadius: "var(--radius-sm)", padding: "0 10px", height: 34,
        }}>
          <Icon name="search" size={16} style={{ color: "var(--text-faint)" }} />
          <input
            placeholder="Поиск по людям…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1, border: "none", outline: "none",
              background: "transparent", font: "var(--text-ui-small)", color: "var(--text-strong)",
            }} />
        </div>
        {matches.length > 0 && (
          <div style={{
            position: "absolute", top: 38, left: 0, right: 0, zIndex: 50,
            background: "var(--surface-card)", border: "1px solid var(--line-strong)",
            borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)", overflow: "hidden",
          }}>
            {matches.map((p) => (
              <button key={p.id}
                onClick={() => { select(p.id); setQuery(""); if (view === "import") setView("tree"); }}
                style={{
                  display: "block", width: "100%", textAlign: "left", padding: "9px 12px",
                  border: "none", borderBottom: "1px solid var(--line)", background: "transparent",
                  cursor: "pointer", font: "var(--w-medium) 13px/1.3 var(--font-serif)", color: "var(--text-strong)",
                }}>
                {p.display_name}
                {p.birth_year && (
                  <span style={{ font: "11px/1 var(--font-mono)", color: "var(--text-muted)", marginLeft: 8 }}>
                    {p.birth_year}{p.death_year ? `–${p.death_year}` : ""}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <Button size="sm" variant="accent" icon="sparkles" onClick={() => setAssistantOpen(true)}>
          ИИ-генеалог
        </Button>
      </div>
    </header>
  );
}

export interface BranchFilters {
  branches: Record<Branch, boolean>;
  onlyConflicts: boolean;
}

function FiltersSidebar({
  filters, setFilters,
}: {
  filters: BranchFilters;
  setFilters: (f: BranchFilters) => void;
}) {
  const { tree, events, layout, setLayout } = useStore();
  const branchRows = (Object.keys(BRANCH_LABELS) as Branch[])
    .filter((b) => b !== "other" || tree.persons.some((p) => branchOf(p) === "other"))
    .map((b) => ({ id: b, label: BRANCH_LABELS[b], color: BRANCH_COLORS[b], on: filters.branches[b] }));

  const conflictCount = tree.persons.filter((p) => p.has_conflict).length;
  const migrationCount = events.filter((e) => e.type === "move" || e.type === "emigration").length;

  const toggleBranch = (b: Branch) =>
    setFilters({ ...filters, branches: { ...filters.branches, [b]: !filters.branches[b] } });

  return (
    <aside style={{
      width: "var(--rail-side)", flex: "0 0 var(--rail-side)", background: "var(--bg-panel)",
      borderRight: "1px solid var(--line-strong)", padding: 16, overflow: "auto",
    }}>
      <span className="pg-overline">Ветви</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, margin: "10px 0 20px" }}>
        {branchRows.map((f) => (
          <label key={f.id} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
            background: "var(--surface-card)", border: "1px solid var(--line)",
            borderRadius: "var(--radius-sm)", cursor: "pointer",
          }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: f.color }} />
            <span style={{ flex: 1, font: "var(--text-ui-small)", color: "var(--ink-700)" }}>{f.label}</span>
            <span onClick={(e) => { e.preventDefault(); toggleBranch(f.id); }}
              style={{
                width: 32, height: 18, borderRadius: 999, position: "relative", cursor: "pointer",
                background: f.on ? "var(--evergreen-500)" : "var(--ink-300)",
                transition: "background var(--dur-fast)",
              }}>
              <span style={{
                position: "absolute", top: 2, width: 14, height: 14, borderRadius: 999, background: "#fff",
                right: f.on ? 2 : 16, transition: "right var(--dur-fast)",
              }} />
            </span>
          </label>
        ))}
      </div>
      <span className="pg-overline">Фильтры исследования</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 10 }}>
        <label style={{
          display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", cursor: "pointer",
          background: "var(--surface-card)",
          border: `1px solid ${filters.onlyConflicts ? "var(--conflict-500)" : "var(--line)"}`,
          borderRadius: "var(--radius-sm)",
        }}
          onClick={() => setFilters({ ...filters, onlyConflicts: !filters.onlyConflicts })}>
          <Icon name="triangle-alert" size={16} style={{ color: "var(--text-muted)" }} />
          <span style={{ flex: 1, font: "var(--text-ui-small)", color: "var(--ink-700)" }}>
            Неподтверждённые факты
          </span>
          <Badge tone="conflict" size="sm">{conflictCount}</Badge>
        </label>
        <div style={{
          display: "flex", alignItems: "center", gap: 9, padding: "9px 10px",
          background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)",
        }}>
          <Icon name="footprints" size={16} style={{ color: "var(--text-muted)" }} />
          <span style={{ flex: 1, font: "var(--text-ui-small)", color: "var(--ink-700)" }}>Миграции</span>
          <Badge tone="accent" size="sm">{migrationCount}</Badge>
        </div>
      </div>
      <div style={{
        marginTop: 22, padding: "12px 13px", background: "var(--evergreen-050)",
        border: "1px solid var(--evergreen-100)", borderRadius: "var(--radius-md)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
          <Icon name="git-compare" size={15} style={{ color: "var(--evergreen-600)" }} />
          <span style={{
            font: "var(--w-semibold) 12px/1 var(--font-sans)", color: "var(--evergreen-700)",
            letterSpacing: ".04em", textTransform: "uppercase",
          }}>Вид</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["tree", "graph"] as TreeLayout[]).map((l) => (
            <button key={l} onClick={() => setLayout(l)} style={{
              flex: 1, padding: "7px 0", borderRadius: "var(--radius-xs)",
              border: `1px solid ${layout === l ? "var(--evergreen-600)" : "var(--line-strong)"}`,
              background: layout === l ? "var(--evergreen-600)" : "var(--surface-card)",
              color: layout === l ? "#fff" : "var(--ink-700)",
              font: "var(--w-medium) 12px/1 var(--font-sans)", cursor: "pointer",
            }}>
              {l === "tree" ? "Дерево" : "Граф"}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function AppShell() {
  const { view, selectedId, assistantOpen, setAssistantOpen, dossier, loading } = useStore();
  const [dossierOpen, setDossierOpen] = useState(true);
  const [filters, setFilters] = useState<BranchFilters>({
    branches: { paternal: true, maternal: true, married: true, other: true },
    onlyConflicts: false,
  });

  if (loading) {
    return (
      <div style={{
        position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-app)", color: "var(--text-muted)", font: "var(--text-ui-body)",
      }}>
        <Icon name="loader" size={18} style={{ marginRight: 8 }} /> Открываем архив…
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", overflow: "hidden", background: "var(--bg-app)" }}>
      <ModeRail />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        <TopBar />
        <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
          {view === "tree" && (
            <>
              <FiltersSidebar filters={filters} setFilters={setFilters} />
              <TreeView filters={filters} onOpenDossier={() => setDossierOpen(true)} />
              {dossierOpen && selectedId && dossier && (
                <DossierPanel onClose={() => setDossierOpen(false)} />
              )}
            </>
          )}
          {view === "timeline" && <TimelineView />}
          {view === "map" && <MapView />}
          {view === "import" && <ImportView />}
          <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
        </div>
      </div>
    </div>
  );
}
