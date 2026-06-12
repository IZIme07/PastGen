// TreeView — панорамируемый/масштабируемый холст семьи, два вида:
//   "tree"  — классическое генеалогическое дерево (ортогональные связи)
//   "graph" — граф связей (рёбра окрашены по типу отношения)
// Перетаскивание пустого места — панорама · колесо — зум к курсору ·
// перетаскивание узла — перемещение · «показать всё» — сброс. (Порт из design/ui_kits/app.)
import {
  useCallback, useEffect, useMemo, useRef, useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Avatar } from "../design/Avatar";
import { Icon } from "../design/Icon";
import { IconButton } from "../design/IconButton";
import { Button } from "../design/Button";
import { Input } from "../design/Input";
import { api } from "../api/client";
import { useStore, type TreeLayout } from "../state/store";
import { BRANCH_COLORS, branchOf, generations, lifespanOf, type TreePerson } from "./helpers";
import type { BranchFilters } from "./AppShell";

const NODE_W = 190, NODE_H = 58;
const clampK = (k: number) => Math.max(0.45, Math.min(2.4, k));

type Pos = { x: number; y: number };
type PosMap = Record<string, Pos>;

/** Раскладка из данных: поколения по вертикали, внутри поколения — по году рождения. */
function computeLayout(
  persons: TreePerson[],
  genMap: Map<string, number>,
  mode: TreeLayout,
): PosMap {
  const byGen = new Map<number, TreePerson[]>();
  for (const p of persons) {
    const g = genMap.get(p.id) ?? 0;
    byGen.set(g, [...(byGen.get(g) ?? []), p]);
  }
  const pos: PosMap = {};
  const GAP_X = 50, GAP_Y = mode === "graph" ? 160 : 210;
  for (const [g, group] of byGen) {
    group.sort((a, b) => (a.birth_year ?? 9999) - (b.birth_year ?? 9999));
    const rowW = group.length * NODE_W + (group.length - 1) * GAP_X;
    group.forEach((p, i) => {
      const jitter = mode === "graph" ? ((i % 2) * 2 - 1) * 34 : 0;
      pos[p.id] = {
        x: -rowW / 2 + i * (NODE_W + GAP_X),
        y: g * GAP_Y + jitter + 40,
      };
    });
  }
  return pos;
}

const copyPos = (src: PosMap): PosMap => {
  const o: PosMap = {};
  for (const k in src) o[k] = { ...src[k] };
  return o;
};

function TreeNode({
  p, pos, scale, selected, branch, onClick, onDragMove,
}: {
  p: TreePerson; pos: Pos; scale: number; selected: boolean; branch: string;
  onClick: (id: string) => void; onDragMove: (id: string, dx: number, dy: number) => void;
}) {
  const st = useRef({ on: false, x: 0, y: 0, moved: false });

  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.stopPropagation(); // не начинаем панораму холста
    st.current = { on: true, x: e.clientX, y: e.clientY, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!st.current.on) return;
    const dx = (e.clientX - st.current.x) / scale;
    const dy = (e.clientY - st.current.y) / scale;
    if (Math.abs(e.clientX - st.current.x) + Math.abs(e.clientY - st.current.y) > 3) st.current.moved = true;
    st.current.x = e.clientX; st.current.y = e.clientY;
    onDragMove(p.id, dx, dy);
  };
  const up = (e: ReactPointerEvent<HTMLDivElement>) => {
    const wasMoved = st.current.moved;
    st.current.on = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (!wasMoved) onClick(p.id); // тап, не перетаскивание → выбор
  };

  return (
    <div
      data-node
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      style={{
        position: "absolute", left: pos.x, top: pos.y, width: NODE_W,
        display: "flex", alignItems: "center", gap: 10, padding: "9px 11px",
        background: "var(--surface-card)",
        border: `1px solid ${selected ? "var(--brand)" : "var(--line-strong)"}`,
        borderLeft: `3px solid ${branch}`,
        borderRadius: "var(--radius-md)",
        boxShadow: selected ? "var(--shadow-md)" : "var(--shadow-xs)",
        outline: selected ? "2px solid var(--brand-tint)" : "none",
        cursor: "grab", zIndex: 2, userSelect: "none", touchAction: "none",
        transition: "box-shadow var(--dur-fast), border-color var(--dur-fast)",
      }}
    >
      <Avatar name={p.display_name} size={38} deceased={p.deceased}
        ring={p.profile_confidence >= 85 ? "var(--conf-confirmed)" : undefined} />
      <div style={{ minWidth: 0, flex: 1, pointerEvents: "none" }}>
        <div style={{
          font: "var(--w-semibold) 14px/1.2 var(--font-serif)", color: "var(--text-strong)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{p.display_name}</div>
        <div style={{ font: "11px/1.3 var(--font-mono)", color: "var(--text-muted)", marginTop: 1 }}>
          {lifespanOf(p)}
        </div>
      </div>
      {p.has_conflict && (
        <span style={{
          position: "absolute", top: -7, right: -7, width: 18, height: 18, borderRadius: 999,
          background: "var(--conflict-500)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 0 2px var(--paper-0)", pointerEvents: "none",
        }}><Icon name="triangle-alert" size={11} stroke={2.4} /></span>
      )}
    </div>
  );
}

function AddPersonDialog({ onClose }: { onClose: () => void }) {
  const { refresh, select } = useStore();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const created = await api.persons.create({ display_name: name.trim() });
      await refresh();
      select(created.id);
      onClose();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 60, display: "flex",
      alignItems: "center", justifyContent: "center", background: "var(--overlay-scrim)",
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 380, padding: 20, background: "var(--paper-0)",
        border: "1px solid var(--line-strong)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)",
      }}>
        <h3 style={{ marginBottom: 14 }}>Добавить человека</h3>
        <Input label="Полное имя" placeholder="Фамилия Имя Отчество" icon="user"
          value={name} onChange={(e) => setName(e.target.value)} />
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="primary" icon="plus" onClick={submit} disabled={!name.trim() || busy}>
            Добавить
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TreeView({ filters, onOpenDossier }: { filters: BranchFilters; onOpenDossier: () => void }) {
  const { tree, selectedId, select, layout, setLayout } = useStore();

  const persons = useMemo(
    () => tree.persons.filter((p) => {
      if (!filters.branches[branchOf(p)]) return false;
      if (filters.onlyConflicts && !p.has_conflict) return false;
      return true;
    }),
    [tree.persons, filters],
  );
  const visibleIds = useMemo(() => new Set(persons.map((p) => p.id)), [persons]);
  const relationships = useMemo(
    () => tree.relationships.filter((r) => visibleIds.has(r.a_id) && visibleIds.has(r.b_id)),
    [tree.relationships, visibleIds],
  );
  const genMap = useMemo(() => generations(persons, relationships), [persons, relationships]);
  const baseLayout = useMemo(() => computeLayout(persons, genMap, layout), [persons, genMap, layout]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ on: false, x: 0, y: 0 });
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [grabbing, setGrabbing] = useState(false);
  const [nodePos, setNodePos] = useState<PosMap>(() => copyPos(baseLayout));
  const [adding, setAdding] = useState(false);
  const posRef = useRef(nodePos);
  useEffect(() => { posRef.current = nodePos; }, [nodePos]);

  const boundsOf = useCallback((pm: PosMap) => {
    const entries = Object.values(pm);
    if (entries.length === 0) return { minX: 0, minY: 0, w: NODE_W, h: NODE_H };
    const xs = entries.map((p) => p.x), ys = entries.map((p) => p.y);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    return { minX, minY, w: Math.max(...xs) + NODE_W - minX, h: Math.max(...ys) + NODE_H - minY };
  }, []);

  const fit = useCallback((pm?: PosMap) => {
    const map = pm || posRef.current;
    const vp = viewportRef.current;
    if (!vp) return;
    const b = boundsOf(map), pad = 56;
    const k = clampK(Math.min((vp.clientWidth - pad * 2) / b.w, (vp.clientHeight - pad * 2) / b.h, 1.25));
    setView({
      x: (vp.clientWidth - b.w * k) / 2 - b.minX * k,
      y: (vp.clientHeight - b.h * k) / 2 - b.minY * k,
      k,
    });
  }, [boundsOf]);

  // Сброс позиций + вписывание при смене раскладки/данных.
  useEffect(() => {
    const base = copyPos(baseLayout);
    setNodePos(base);
    posRef.current = base;
    fit(base);
  }, [baseLayout, fit]);

  const onDragMove = (id: string, dx: number, dy: number) => {
    setNodePos((prev) => ({ ...prev, [id]: { x: prev[id].x + dx, y: prev[id].y + dy } }));
  };

  const zoomBy = (factor: number) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const cxp = vp.clientWidth / 2, cyp = vp.clientHeight / 2;
    setView((v) => {
      const k = clampK(v.k * factor);
      return { k, x: cxp - ((cxp - v.x) / v.k) * k, y: cyp - ((cyp - v.y) / v.k) * k };
    });
  };

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = vp.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      setView((v) => {
        const k = clampK(v.k * Math.exp(-e.deltaY * 0.0014));
        return { k, x: mx - ((mx - v.x) / v.k) * k, y: my - ((my - v.y) / v.k) * k };
      });
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    drag.current = { on: true, x: e.clientX, y: e.clientY };
    setGrabbing(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.on) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    drag.current.x = e.clientX; drag.current.y = e.clientY;
    setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
  };
  const endPan = () => { drag.current.on = false; setGrabbing(false); };

  const cx = (id: string) => (nodePos[id]?.x ?? 0) + NODE_W / 2;
  const cy = (id: string) => (nodePos[id]?.y ?? 0) + NODE_H / 2;

  // ---- рёбра ----
  const treeLine = { stroke: "var(--line-ink)", strokeWidth: 1.6, fill: "none" } as const;

  /** Дерево: для каждого ребёнка — шина от середины родителей; супруги — горизонталь. */
  function TreeConnectors() {
    const parentEdges = relationships.filter((r) => r.type === "parent" || r.type === "adoption");
    const spouseEdges = relationships.filter((r) => r.type === "spouse" || r.type === "ex_spouse");
    const childrenByParents = new Map<string, { parents: string[]; kids: string[] }>();
    for (const child of persons) {
      const parents = parentEdges.filter((r) => r.b_id === child.id).map((r) => r.a_id).sort();
      if (parents.length === 0) continue;
      const key = parents.join("|");
      const entry = childrenByParents.get(key) ?? { parents, kids: [] };
      entry.kids.push(child.id);
      childrenByParents.set(key, entry);
    }
    return (
      <svg style={{ position: "absolute", inset: 0, overflow: "visible", zIndex: 1 }}>
        {spouseEdges.map((r, i) => nodePos[r.a_id] && nodePos[r.b_id] && (
          <path key={`s${i}`} d={`M ${cx(r.a_id)} ${cy(r.a_id)} H ${cx(r.b_id)}`} {...treeLine}
            strokeDasharray={r.type === "ex_spouse" ? "5 4" : undefined} />
        ))}
        {[...childrenByParents.values()].map(({ parents, kids }, i) => {
          const known = parents.filter((p) => nodePos[p]);
          if (known.length === 0) return null;
          const midX = known.reduce((s, p) => s + cx(p), 0) / known.length;
          const parentY = Math.max(...known.map((p) => cy(p)));
          const kidTops = kids.filter((k) => nodePos[k]).map((k) => nodePos[k].y);
          if (kidTops.length === 0) return null;
          const busY = (parentY + Math.min(...kidTops)) / 2;
          return (
            <g key={`b${i}`}>
              <path d={`M ${midX} ${parentY} V ${busY}`} {...treeLine} />
              {kids.filter((k) => nodePos[k]).map((k) => (
                <path key={k} d={`M ${midX} ${busY} H ${cx(k)} V ${nodePos[k].y}`} {...treeLine} />
              ))}
            </g>
          );
        })}
      </svg>
    );
  }

  function GraphConnectors() {
    const relTint: Record<string, string> = {
      spouse: "var(--brass-600)", ex_spouse: "var(--brass-600)",
      parent: "var(--evergreen-500)", adoption: "var(--evergreen-500)",
      sibling: "var(--assist-500)",
    };
    return (
      <svg style={{ position: "absolute", inset: 0, overflow: "visible", zIndex: 1 }}>
        {relationships.map((r, i) => nodePos[r.a_id] && nodePos[r.b_id] && (
          <line key={i} x1={cx(r.a_id)} y1={cy(r.a_id)} x2={cx(r.b_id)} y2={cy(r.b_id)}
            stroke={relTint[r.type] ?? "var(--ink-300)"}
            strokeWidth={r.type === "spouse" ? 2.4 : 1.8}
            strokeDasharray={r.type === "sibling" || r.type === "ex_spouse" ? "4 4" : undefined}
            strokeLinecap="round" opacity={0.85} />
        ))}
      </svg>
    );
  }

  return (
    <div style={{ position: "relative", flex: 1, overflow: "hidden", background: "var(--bg-app)" }}>
      <div
        ref={viewportRef}
        className="pg-paper"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerLeave={endPan}
        style={{
          position: "absolute", inset: 0, overflow: "hidden",
          cursor: grabbing ? "grabbing" : "grab", touchAction: "none",
        }}
      >
        <div style={{
          position: "absolute", top: 0, left: 0, transformOrigin: "0 0",
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
        }}>
          {layout === "graph" ? <GraphConnectors /> : <TreeConnectors />}
          {persons.map((p) => nodePos[p.id] && (
            <TreeNode key={p.id} p={p} pos={nodePos[p.id]} scale={view.k}
              branch={BRANCH_COLORS[branchOf(p)]}
              selected={selectedId === p.id}
              onClick={(id) => { select(id); onOpenDossier(); }}
              onDragMove={onDragMove} />
          ))}
        </div>
      </div>

      <LayoutToggle layout={layout} setLayout={setLayout} />
      {layout === "graph" && <GraphLegend />}
      <ZoomControls k={view.k} onIn={() => zoomBy(1.2)} onOut={() => zoomBy(1 / 1.2)} onFit={() => fit()} />

      <div style={{ position: "absolute", bottom: 16, left: 16, zIndex: 5 }}>
        <Button variant="primary" icon="user-plus" onClick={() => setAdding(true)}>
          Добавить человека
        </Button>
      </div>

      {persons.length === 0 && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 10, pointerEvents: "none",
          color: "var(--text-muted)", font: "var(--text-ui-body)",
        }}>
          <Icon name="git-fork" size={32} style={{ color: "var(--ink-300)" }} />
          Дерево пока пустое. Добавьте человека или импортируйте материалы.
        </div>
      )}

      {adding && <AddPersonDialog onClose={() => setAdding(false)} />}
    </div>
  );
}

function LayoutToggle({ layout, setLayout }: { layout: TreeLayout; setLayout: (l: TreeLayout) => void }) {
  const opts = [
    { id: "tree" as const, icon: "git-fork", label: "Дерево" },
    { id: "graph" as const, icon: "share-2", label: "Граф" },
  ];
  return (
    <div style={{
      position: "absolute", top: 14, left: 14, zIndex: 5, display: "flex", gap: 2, padding: 3,
      background: "var(--surface-card)", border: "1px solid var(--line-strong)",
      borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)",
    }}>
      {opts.map((o) => {
        const on = layout === o.id;
        return (
          <button key={o.id} onClick={() => setLayout(o.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
              border: "none", cursor: "pointer",
              borderRadius: "var(--radius-sm)", background: on ? "var(--brand)" : "transparent",
              color: on ? "var(--text-on-brand)" : "var(--text-muted)",
              font: "var(--w-semibold) 12.5px/1 var(--font-sans)", transition: "background var(--dur-fast)",
            }}>
            <Icon name={o.icon} size={15} stroke={2} /> {o.label}
          </button>
        );
      })}
    </div>
  );
}

function GraphLegend() {
  const rows = [
    { c: "var(--brass-600)", t: "Супруги", dash: false },
    { c: "var(--evergreen-500)", t: "Родитель — ребёнок", dash: false },
    { c: "var(--assist-500)", t: "Братья / сёстры", dash: true },
  ];
  return (
    <div style={{
      position: "absolute", top: 14, right: 14, zIndex: 5, padding: "10px 12px",
      background: "var(--surface-card)", border: "1px solid var(--line-strong)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: 7,
    }}>
      <span className="pg-overline">Связи</span>
      {rows.map((r) => (
        <div key={r.t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="22" height="6">
            <line x1="0" y1="3" x2="22" y2="3" stroke={r.c} strokeWidth="2.4"
              strokeDasharray={r.dash ? "4 3" : undefined} strokeLinecap="round" />
          </svg>
          <span style={{ font: "var(--text-ui-small)", color: "var(--ink-700)", whiteSpace: "nowrap" }}>{r.t}</span>
        </div>
      ))}
    </div>
  );
}

function ZoomControls({ k, onIn, onOut, onFit }: { k: number; onIn: () => void; onOut: () => void; onFit: () => void }) {
  return (
    <div style={{
      position: "absolute", bottom: 16, right: 16, zIndex: 5, display: "flex", flexDirection: "column",
      gap: 4, padding: 4, background: "var(--surface-card)", border: "1px solid var(--line-strong)",
      borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)",
    }}>
      <IconButton icon="plus" label="Приблизить" size="sm" onClick={onIn} />
      <div style={{
        font: "var(--w-semibold) 11px/1 var(--font-mono)", color: "var(--text-muted)",
        textAlign: "center", padding: "2px 0",
      }}>{Math.round(k * 100)}%</div>
      <IconButton icon="minus" label="Отдалить" size="sm" onClick={onOut} />
      <div style={{ height: 1, background: "var(--line)", margin: "1px 3px" }} />
      <IconButton icon="scan" label="Показать всё" size="sm" onClick={onFit} />
    </div>
  );
}
