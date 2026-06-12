// TreeView — pannable / zoomable family canvas with two layouts:
//   "tree"  — classic genealogical chart (orthogonal connectors)
//   "graph" — relationship graph (edges coloured by relation type)
// Drag empty space to pan · scroll to zoom · drag a node to move it · fit to reset.
const { useState: useTV, useRef: useTVRef, useEffect: useTVEffect, useCallback: useTVCb } = React;

const NODE_W = 190, NODE_H = 58;
const clampK = (k) => Math.max(0.45, Math.min(2.4, k));

const TREE_POS = {
  ivan:    { x: 230, y: 40 },  maria: { x: 470, y: 40 },
  nikolay: { x: 90,  y: 250 }, lidia: { x: 330, y: 250 }, anna: { x: 610, y: 250 },
  dmitry:  { x: 170, y: 470 }, elena: { x: 410, y: 470 },
};
const GRAPH_POS = {
  ivan:    { x: 300, y: 50 },  maria: { x: 540, y: 110 },
  nikolay: { x: 150, y: 290 }, lidia: { x: 40, y: 470 },  anna: { x: 600, y: 340 },
  dmitry:  { x: 300, y: 520 }, elena: { x: 480, y: 560 },
};
const copyPos = (src) => { const o = {}; for (const k in src) o[k] = { ...src[k] }; return o; };

function TreeNode({ p, pos, scale, selected, onClick, onDragMove, branch }) {
  const { Avatar, Icon } = window.PastGenDesignSystem_7468cb;
  const st = useTVRef({ on: false, x: 0, y: 0, moved: false });

  const down = (e) => {
    e.stopPropagation();               // don't start a canvas pan
    st.current = { on: true, x: e.clientX, y: e.clientY, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (!st.current.on) return;
    const dx = (e.clientX - st.current.x) / scale;
    const dy = (e.clientY - st.current.y) / scale;
    if (Math.abs(e.clientX - st.current.x) + Math.abs(e.clientY - st.current.y) > 3) st.current.moved = true;
    st.current.x = e.clientX; st.current.y = e.clientY;
    onDragMove(p.id, dx, dy);
  };
  const up = (e) => {
    const wasMoved = st.current.moved;
    st.current.on = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (!wasMoved) onClick(p.id);       // a tap, not a drag → select
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
      <Avatar name={p.name} size={38} deceased={p.deceased}
        ring={p.confidence >= 85 ? "var(--conf-confirmed)" : undefined} />
      <div style={{ minWidth: 0, flex: 1, pointerEvents: "none" }}>
        <div style={{ font: "var(--w-semibold) 14px/1.2 var(--font-serif)", color: "var(--text-strong)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
        <div style={{ font: "11px/1.3 var(--font-mono)", color: "var(--text-muted)", marginTop: 1 }}>{p.lifespan}</div>
      </div>
      {p.conflict && <span style={{ position: "absolute", top: -7, right: -7, width: 18, height: 18, borderRadius: 999,
        background: "var(--conflict-500)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 0 2px var(--paper-0)", pointerEvents: "none" }}><Icon name="triangle-alert" size={11} stroke={2.4} /></span>}
    </div>
  );
}

function TreeView({ selectedId, onSelect, layout = "tree", setLayout }) {
  const D = window.PG_DATA;
  const C = D.branchColors;
  const people = Object.values(D.people);

  const viewportRef = useTVRef(null);
  const drag = useTVRef({ on: false, x: 0, y: 0 });
  const [view, setView] = useTV({ x: 0, y: 0, k: 1 });
  const [grabbing, setGrabbing] = useTV(false);
  const [nodePos, setNodePos] = useTV(() => copyPos(TREE_POS));
  const posRef = useTVRef(nodePos);
  useTVEffect(() => { posRef.current = nodePos; }, [nodePos]);

  const cx = (id) => nodePos[id].x + NODE_W / 2;
  const cy = (id) => nodePos[id].y + NODE_H / 2;

  const boundsOf = (pm) => {
    const xs = people.map((p) => pm[p.id].x), ys = people.map((p) => pm[p.id].y);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    return { minX, minY, w: Math.max(...xs) + NODE_W - minX, h: Math.max(...ys) + NODE_H - minY };
  };

  const fit = useTVCb((pm) => {
    const map = pm || posRef.current;
    const vp = viewportRef.current; if (!vp) return;
    const b = boundsOf(map), pad = 56;
    const k = clampK(Math.min((vp.clientWidth - pad * 2) / b.w, (vp.clientHeight - pad * 2) / b.h, 1.25));
    setView({ x: (vp.clientWidth - b.w * k) / 2 - b.minX * k, y: (vp.clientHeight - b.h * k) / 2 - b.minY * k, k });
  }, []);

  // reset positions + fit whenever the layout changes (and on mount)
  useTVEffect(() => {
    const base = copyPos(layout === "graph" ? GRAPH_POS : TREE_POS);
    setNodePos(base); posRef.current = base;
    fit(base);
  }, [layout]);

  const onDragMove = (id, dx, dy) => {
    setNodePos((prev) => ({ ...prev, [id]: { x: prev[id].x + dx, y: prev[id].y + dy } }));
  };

  const zoomBy = (factor) => {
    const vp = viewportRef.current; if (!vp) return;
    const cxp = vp.clientWidth / 2, cyp = vp.clientHeight / 2;
    setView((v) => {
      const k = clampK(v.k * factor);
      return { k, x: cxp - ((cxp - v.x) / v.k) * k, y: cyp - ((cyp - v.y) / v.k) * k };
    });
  };

  useTVEffect(() => {
    const vp = viewportRef.current; if (!vp) return;
    const onWheel = (e) => {
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

  const onPointerDown = (e) => {
    if (e.target.closest("[data-node]")) return;
    drag.current = { on: true, x: e.clientX, y: e.clientY };
    setGrabbing(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current.on) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    drag.current.x = e.clientX; drag.current.y = e.clientY;
    setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
  };
  const endPan = () => { drag.current.on = false; setGrabbing(false); };

  // ---- edges ----
  const treeLine = { stroke: "var(--line-ink)", strokeWidth: 1.6, fill: "none" };
  function TreeConnectors() {
    const mY = (id) => nodePos[id].y + NODE_H / 2;
    const couple = (a, b, busY, kids) => {
      const midX = (cx(a) + cx(b)) / 2;
      return (
        <g key={a + b}>
          <path d={`M ${cx(a)} ${mY(a)} H ${cx(b)}`} {...treeLine} />
          <path d={`M ${midX} ${mY(a)} V ${busY}`} {...treeLine} />
          {kids.map((c) => <path key={c} d={`M ${midX} ${busY} H ${cx(c)} V ${nodePos[c].y}`} {...treeLine} />)}
        </g>
      );
    };
    // bus sits midway between the couple and their lowest child
    const busA = (Math.max(mY("ivan"), mY("maria")) + Math.min(nodePos.nikolay.y, nodePos.anna.y)) / 2;
    const busB = (Math.max(mY("nikolay"), mY("lidia")) + Math.min(nodePos.dmitry.y, nodePos.elena.y)) / 2;
    return (
      <svg style={{ position: "absolute", inset: 0, overflow: "visible", zIndex: 1 }}>
        {couple("ivan", "maria", busA, ["nikolay", "anna"])}
        {couple("nikolay", "lidia", busB, ["dmitry", "elena"])}
      </svg>
    );
  }
  function GraphConnectors() {
    const relTint = { spouse: "var(--brass-600)", parent: "var(--evergreen-500)", sibling: "var(--assist-500)" };
    return (
      <svg style={{ position: "absolute", inset: 0, overflow: "visible", zIndex: 1 }}>
        {D.relationships.map((r, i) => (
          <line key={i} x1={cx(r.a)} y1={cy(r.a)} x2={cx(r.b)} y2={cy(r.b)}
            stroke={relTint[r.type]} strokeWidth={r.type === "spouse" ? 2.4 : 1.8}
            strokeDasharray={r.type === "sibling" ? "4 4" : "none"} strokeLinecap="round" opacity={0.85} />
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
        style={{ position: "absolute", inset: 0, overflow: "hidden",
          cursor: grabbing ? "grabbing" : "grab", touchAction: "none" }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, transformOrigin: "0 0",
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
          {layout === "graph" ? <GraphConnectors /> : <TreeConnectors />}
          {people.map((p) => (
            <TreeNode key={p.id} p={p} pos={nodePos[p.id]} scale={view.k} branch={C[D.branchOf[p.id]]}
              selected={selectedId === p.id} onClick={onSelect} onDragMove={onDragMove} />
          ))}
        </div>
      </div>

      <LayoutToggle layout={layout} setLayout={setLayout} />
      {layout === "graph" && <GraphLegend />}
      <ZoomControls k={view.k} onIn={() => zoomBy(1.2)} onOut={() => zoomBy(1 / 1.2)} onFit={() => fit()} />
    </div>
  );
}

function LayoutToggle({ layout, setLayout }) {
  const { Icon } = window.PastGenDesignSystem_7468cb;
  const opts = [{ id: "tree", icon: "git-fork", label: "Дерево" }, { id: "graph", icon: "share-2", label: "Граф" }];
  return (
    <div style={{ position: "absolute", top: 14, left: 14, zIndex: 5, display: "flex", gap: 2, padding: 3,
      background: "var(--surface-card)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-sm)" }}>
      {opts.map((o) => {
        const on = layout === o.id;
        return (
          <button key={o.id} onClick={() => setLayout && setLayout(o.id)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", border: "none", cursor: "pointer",
              borderRadius: "var(--radius-sm)", background: on ? "var(--brand)" : "transparent",
              color: on ? "var(--text-on-brand)" : "var(--text-muted)",
              font: "var(--w-semibold) 12.5px/1 var(--font-sans)", transition: "background var(--dur-fast)" }}>
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
    <div style={{ position: "absolute", top: 14, right: 14, zIndex: 5, padding: "10px 12px",
      background: "var(--surface-card)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: 7 }}>
      <span className="pg-overline">Связи</span>
      {rows.map((r) => (
        <div key={r.t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke={r.c} strokeWidth="2.4"
            strokeDasharray={r.dash ? "4 3" : "none"} strokeLinecap="round" /></svg>
          <span style={{ font: "var(--text-ui-small)", color: "var(--ink-700)", whiteSpace: "nowrap" }}>{r.t}</span>
        </div>
      ))}
    </div>
  );
}

function ZoomControls({ k, onIn, onOut, onFit }) {
  const { IconButton } = window.PastGenDesignSystem_7468cb;
  return (
    <div style={{ position: "absolute", bottom: 16, right: 16, zIndex: 5, display: "flex", flexDirection: "column",
      gap: 4, padding: 4, background: "var(--surface-card)", border: "1px solid var(--line-strong)",
      borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)" }}>
      <IconButton icon="plus" label="Приблизить" size="sm" onClick={onIn} />
      <div style={{ font: "var(--w-semibold) 11px/1 var(--font-mono)", color: "var(--text-muted)", textAlign: "center",
        padding: "2px 0" }}>{Math.round(k * 100)}%</div>
      <IconButton icon="minus" label="Отдалить" size="sm" onClick={onOut} />
      <div style={{ height: 1, background: "var(--line)", margin: "1px 3px" }} />
      <IconButton icon="scan" label="Показать всё" size="sm" onClick={onFit} />
    </div>
  );
}

Object.assign(window, { TreeView });
