// TimelineView — lifespan timeline: each person a bar from birth → death (or
// → present, if living), laid on a shared year axis, grouped by generation.
// Era guides (evacuation, marriage) and a "today" line cross the whole chart.
const START = 1915, END = 2030, SPAN = END - START, GUTTER = 208;
const pct = (y) => ((y - START) / SPAN) * 100;
const DECADES = [1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];
const ROMAN = { 0: "I — прародители", 1: "II", 2: "III" };

function LifeBar({ p, years, branch, onSelect, selected }) {
  const { Avatar, ConfidenceMeter, Icon } = window.PastGenDesignSystem_7468cb;
  const y = years[p.id];
  const end = y.d || window.PG_DATA.PRESENT;
  const left = pct(y.b), width = pct(end) - left;
  const living = !y.d;
  return (
    <div onClick={() => onSelect(p.id)}
      style={{ display: "grid", gridTemplateColumns: `${GUTTER}px 1fr`, alignItems: "center",
        height: 52, cursor: "pointer", borderRadius: "var(--radius-sm)",
        background: selected ? "var(--brand-tint)" : "transparent",
        transition: "background var(--dur-fast)" }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = "var(--paper-0)"; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = "transparent"; }}>
      {/* gutter: avatar + name + confidence */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 8, minWidth: 0 }}>
        <Avatar name={p.name} size={32} deceased={p.deceased}
          ring={p.confidence >= 85 ? "var(--conf-confirmed)" : undefined} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ font: "var(--w-semibold) 13.5px/1.2 var(--font-serif)", color: "var(--text-strong)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
          <div style={{ font: "11px/1.2 var(--font-mono)", color: "var(--text-muted)" }}>{p.lifespan}</div>
        </div>
        <ConfidenceMeter value={p.confidence} size={24} showValue={false} />
      </div>
      {/* track */}
      <div style={{ position: "relative", height: "100%" }}>
        <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)",
          left: `${left}%`, width: `${width}%`, height: 24, borderRadius: "var(--radius-pill)",
          background: branch, boxShadow: "var(--shadow-xs)",
          border: selected ? "1.5px solid var(--brand)" : "1px solid rgba(33,28,18,0.10)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 9px", overflow: "hidden",
          opacity: living ? 0.92 : 1,
          ...(living ? { borderRight: "2px dashed rgba(246,241,231,0.7)" } : {}) }}>
          <span style={{ font: "var(--w-semibold) 11px/1 var(--font-mono)", color: "#F6F1E6" }}>{y.b}</span>
          <span style={{ font: "var(--w-semibold) 11px/1 var(--font-mono)", color: "#F6F1E6",
            display: "inline-flex", alignItems: "center", gap: 3 }}>
            {living ? <Icon name="arrow-right" size={11} stroke={2.4} /> : <>† {y.d}</>}
          </span>
        </div>
        {/* disputed birth year bracket */}
        {y.altB && (
          <span title={`Спорная дата: ${y.b} / ${y.altB}`}
            style={{ position: "absolute", top: "50%", transform: "translate(-50%,-50%)",
              left: `${pct(y.altB)}%`, width: 16, height: 16, borderRadius: 999, zIndex: 3,
              background: "var(--conflict-500)", color: "#fff", display: "flex", alignItems: "center",
              justifyContent: "center", boxShadow: "0 0 0 2px var(--paper-1)",
              font: "var(--w-bold) 10px/1 var(--font-sans)" }}>?</span>
        )}
      </div>
    </div>
  );
}

function TimelineView({ onSelect, selectedId }) {
  const { Icon } = window.PastGenDesignSystem_7468cb;
  const D = window.PG_DATA;
  const groups = { 0: [], 1: [], 2: [] };
  Object.values(D.people).forEach((p) => groups[p.gen].push(p));

  return (
    <div style={{ flex: 1, overflow: "auto", background: "var(--bg-app)" }} className="pg-paper">
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "26px 28px 48px" }}>
        <div style={{ marginBottom: 18 }}>
          <span className="pg-overline">Лента времени · продолжительность жизни</span>
          <h2 style={{ font: "var(--w-semibold) 26px/1.15 var(--font-serif)", color: "var(--text-strong)", marginTop: 4 }}>
            Соколовы · 1924 — настоящее время
          </h2>
        </div>

        {/* chart */}
        <div style={{ position: "relative" }}>
          {/* overlay: gridlines, axis labels, era guides, today line */}
          <div style={{ position: "absolute", left: GUTTER, right: 0, top: 0, bottom: 0, pointerEvents: "none", zIndex: 1 }}>
            {DECADES.map((d) => (
              <div key={d} style={{ position: "absolute", left: `${pct(d)}%`, top: 30, bottom: 0, width: 1,
                background: "var(--line)" }}>
                <span style={{ position: "absolute", top: -22, left: 0, transform: "translateX(-50%)",
                  font: "11px/1 var(--font-mono)", color: "var(--text-faint)" }}>{d}</span>
              </div>
            ))}
            {/* era guides */}
            {D.eras.map((e, i) => (
              <div key={e.year} style={{ position: "absolute", left: `${pct(e.year)}%`, top: 30, bottom: 0, width: 0 }}>
                <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 1.5,
                  background: e.tint, opacity: 0.5, borderLeft: `1.5px dashed ${e.tint}` }} />
                <span style={{ position: "absolute", top: 6 + (i % 2) * 24, left: 6, display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 8px", background: "var(--surface-card)", border: `1px solid ${e.tint}`,
                  borderRadius: "var(--radius-pill)", color: e.tint, whiteSpace: "nowrap",
                  font: "var(--w-semibold) 11px/1 var(--font-sans)", boxShadow: "var(--shadow-xs)" }}>
                  <Icon name={e.icon} size={12} stroke={2.2} /> {e.label} · {e.year}
                </span>
              </div>
            ))}
            {/* today */}
            <div style={{ position: "absolute", left: `${pct(D.PRESENT)}%`, top: 30, bottom: 0, width: 2,
              background: "var(--evergreen-400)" }}>
              <span style={{ position: "absolute", bottom: -2, left: 6, font: "var(--w-semibold) 10px/1 var(--font-sans)",
                color: "var(--evergreen-600)", letterSpacing: ".08em", textTransform: "uppercase" }}>сегодня</span>
            </div>
          </div>

          {/* rows */}
          <div style={{ position: "relative", zIndex: 2, paddingTop: 38 }}>
            {[0, 1, 2].map((g) => (
              <div key={g} style={{ marginBottom: 6 }}>
                <div style={{ display: "grid", gridTemplateColumns: `${GUTTER}px 1fr`, marginTop: g ? 10 : 0 }}>
                  <span className="pg-overline" style={{ paddingLeft: 8, color: "var(--brass-700)" }}>Поколение {ROMAN[g]}</span>
                  <span style={{ borderBottom: "1px solid var(--line)", alignSelf: "center", height: 0 }} />
                </div>
                {groups[g].map((p) => (
                  <LifeBar key={p.id} p={p} years={D.years} branch={D.branchColors[D.branchOf[p.id]]}
                    onSelect={onSelect} selected={selectedId === p.id} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* legend */}
        <div style={{ display: "flex", gap: 18, marginTop: 22, flexWrap: "wrap", alignItems: "center" }}>
          <Legend swatch="var(--evergreen-500)" label="Отцовская линия" />
          <Legend swatch="var(--brass-500)" label="Материнская линия" />
          <Legend swatch="var(--assist-500)" label="По браку" />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "var(--text-ui-small)", color: "var(--text-muted)" }}>
            <span style={{ width: 22, height: 12, borderRadius: 99, background: "var(--ink-300)", borderRight: "2px dashed #F6F1E6" }} /> жив · продолжается
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, font: "var(--text-ui-small)", color: "var(--conflict-600)" }}>
            <span style={{ width: 15, height: 15, borderRadius: 99, background: "var(--conflict-500)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", font: "var(--w-bold) 9px/1 var(--font-sans)" }}>?</span> спорная дата
          </span>
        </div>
      </div>
    </div>
  );
}

function Legend({ swatch, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, font: "var(--text-ui-small)", color: "var(--ink-700)" }}>
      <span style={{ width: 22, height: 12, borderRadius: 99, background: swatch }} /> {label}
    </span>
  );
}

Object.assign(window, { TimelineView });
