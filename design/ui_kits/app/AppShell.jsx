// AppShell — mode rail, topbar, filters, and the switching workspace.
const { useState } = React;

function ModeRail({ mode, setMode }) {
  const { IconButton } = window.PastGenDesignSystem_7468cb;
  const modes = [
    { id: "tree",     icon: "git-fork",       label: "Дерево" },
    { id: "timeline", icon: "calendar-clock", label: "Таймлайн" },
    { id: "map",      icon: "map",            label: "Карта" },
    { id: "import",   icon: "sparkles",       label: "Импорт · ИИ" },
  ];
  return (
    <nav style={{ width: "var(--rail-nav)", flex: "0 0 var(--rail-nav)", background: "var(--evergreen-800)",
      display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 0", gap: 6 }}>
      <img src="../../assets/mark-pastgen.svg" alt="PastGen" width="30" height="30"
        style={{ marginBottom: 14, filter: "saturate(0.6) brightness(1.6)" }} />
      {modes.map((m) => {
        const active = mode === m.id;
        return (
          <button key={m.id} onClick={() => setMode(m.id)} title={m.label}
            style={{ position: "relative", width: 44, height: 44, borderRadius: "var(--radius-md)", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: active ? "rgba(246,241,231,0.14)" : "transparent",
              color: active ? "#fff" : "rgba(246,241,231,0.6)", transition: "background var(--dur-fast)" }}>
            <ModeIcon name={m.icon} />
            {active && <span style={{ position: "absolute", left: -14, top: 11, width: 3, height: 22, borderRadius: 999, background: "var(--brass-500)" }} />}
          </button>
        );
      })}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
        <ModeBtn icon="settings" />
        <div style={{ width: 32, height: 32, borderRadius: 999, background: "var(--brass-500)", color: "#2A1E0C",
          display: "flex", alignItems: "center", justifyContent: "center", font: "var(--w-semibold) 13px/1 var(--font-serif)" }}>ДС</div>
      </div>
    </nav>
  );
}
function ModeIcon({ name }) {
  const { Icon } = window.PastGenDesignSystem_7468cb;
  return <Icon name={name} size={22} />;
}
function ModeBtn({ icon }) {
  const { Icon } = window.PastGenDesignSystem_7468cb;
  return <button style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", border: "none", background: "transparent",
    color: "rgba(246,241,231,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Icon name={icon} size={19} /></button>;
}

function TopBar({ mode, onAskAI }) {
  const { Button, Icon, IconButton } = window.PastGenDesignSystem_7468cb;
  const titles = { tree: "Семейное дерево", timeline: "Лента времени", map: "Карта семьи", import: "Импорт и предложения" };
  return (
    <header style={{ height: "var(--topbar-h)", flex: "0 0 var(--topbar-h)", display: "flex", alignItems: "center",
      gap: 12, padding: "0 16px", background: "var(--paper-0)", borderBottom: "1px solid var(--line-strong)" }}>
      <img src="../../assets/logo-pastgen.svg" alt="PastGen" height="26" />
      <div style={{ width: 1, height: 22, background: "var(--line)" }} />
      <span style={{ font: "var(--w-semibold) 15px/1 var(--font-sans)", color: "var(--text-strong)" }}>{titles[mode]}</span>
      <div style={{ flex: 1, maxWidth: 340, marginLeft: 8, display: "flex", alignItems: "center", gap: 8,
        background: "var(--surface-card)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)", padding: "0 10px", height: 34 }}>
        <Icon name="search" size={16} style={{ color: "var(--text-faint)" }} />
        <input placeholder="Поиск по людям, местам, источникам…" style={{ flex: 1, border: "none", outline: "none",
          background: "transparent", font: "var(--text-ui-small)", color: "var(--text-strong)" }} />
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <Button size="sm" variant="accent" icon="sparkles" onClick={onAskAI}>ИИ-генеалог</Button>
        <Button size="sm" variant="secondary" icon="book-marked">Семейная книга</Button>
      </div>
    </header>
  );
}

function FiltersSidebar({ layout, setLayout }) {
  const { Badge, Icon } = window.PastGenDesignSystem_7468cb;
  const C = window.PG_DATA.branchColors;
  const filters = [
    { label: "Отцовская линия", color: C.paternal, on: true },
    { label: "Материнская линия", color: C.maternal, on: true },
    { label: "По браку", color: C.married, on: true },
  ];
  const toggles = [
    { icon: "triangle-alert", label: "Неподтверждённые факты", count: 2, tone: "conflict" },
    { icon: "footprints", label: "Миграции", count: 1, tone: "accent" },
    { icon: "users", label: "Ближайшие родственники", count: 5, tone: "brand" },
  ];
  return (
    <aside style={{ width: "var(--rail-side)", flex: "0 0 var(--rail-side)", background: "var(--bg-panel)",
      borderRight: "1px solid var(--line-strong)", padding: 16, overflow: "auto" }}>
      <span className="pg-overline">Ветви</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, margin: "10px 0 20px" }}>
        {filters.map((f) => (
          <label key={f.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
            background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: f.color }} />
            <span style={{ flex: 1, font: "var(--text-ui-small)", color: "var(--ink-700)" }}>{f.label}</span>
            <span style={{ width: 32, height: 18, borderRadius: 999, background: "var(--evergreen-500)", position: "relative" }}>
              <span style={{ position: "absolute", top: 2, right: 2, width: 14, height: 14, borderRadius: 999, background: "#fff" }} />
            </span>
          </label>
        ))}
      </div>
      <span className="pg-overline">Фильтры исследования</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 10 }}>
        {toggles.map((t) => (
          <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px",
            background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)" }}>
            <Icon name={t.icon} size={16} style={{ color: "var(--text-muted)" }} />
            <span style={{ flex: 1, font: "var(--text-ui-small)", color: "var(--ink-700)" }}>{t.label}</span>
            <Badge tone={t.tone} size="sm">{t.count}</Badge>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 22, padding: "12px 13px", background: "var(--evergreen-050)", border: "1px solid var(--evergreen-100)",
        borderRadius: "var(--radius-md)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
          <Icon name="git-compare" size={15} style={{ color: "var(--evergreen-600)" }} />
          <span style={{ font: "var(--w-semibold) 12px/1 var(--font-sans)", color: "var(--evergreen-700)", letterSpacing: ".04em", textTransform: "uppercase" }}>Вид</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setLayout("tree")} style={{ flex: 1, padding: "7px 0", borderRadius: "var(--radius-xs)",
            border: `1px solid ${layout === "tree" ? "var(--evergreen-600)" : "var(--line-strong)"}`,
            background: layout === "tree" ? "var(--evergreen-600)" : "var(--surface-card)",
            color: layout === "tree" ? "#fff" : "var(--ink-700)", font: "var(--w-medium) 12px/1 var(--font-sans)", cursor: "pointer" }}>Дерево</button>
          <button onClick={() => setLayout("graph")} style={{ flex: 1, padding: "7px 0", borderRadius: "var(--radius-xs)",
            border: `1px solid ${layout === "graph" ? "var(--evergreen-600)" : "var(--line-strong)"}`,
            background: layout === "graph" ? "var(--evergreen-600)" : "var(--surface-card)",
            color: layout === "graph" ? "#fff" : "var(--ink-700)", font: "var(--w-medium) 12px/1 var(--font-sans)", cursor: "pointer" }}>Граф</button>
        </div>
      </div>
    </aside>
  );
}

function App() {
  const [mode, setMode] = useState("tree");
  const [selectedId, setSelectedId] = useState("maria");
  const [dossierOpen, setDossierOpen] = useState(true);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [treeLayout, setTreeLayout] = useState("tree");

  const select = (id) => { setSelectedId(id); setDossierOpen(true); };
  const askAI = () => setAssistantOpen(true);

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", overflow: "hidden", background: "var(--bg-app)" }}>
      <ModeRail mode={mode} setMode={setMode} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        <TopBar mode={mode} onAskAI={askAI} />
        <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
          {mode === "tree" && <>
            <FiltersSidebar layout={treeLayout} setLayout={setTreeLayout} />
            <TreeView selectedId={selectedId} onSelect={select} layout={treeLayout} setLayout={setTreeLayout} />
            {dossierOpen && <DossierPanel personId={selectedId} onClose={() => setDossierOpen(false)} onAskAI={askAI} />}
          </>}
          {mode === "timeline" && <TimelineView onSelect={select} selectedId={selectedId} />}
          {mode === "map" && <MapView />}
          {mode === "import" && <ImportView onAskAI={askAI} />}
          <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)}
            context={mode === "tree" ? "Мария Соколова" : "ветвь Соколовых"} />
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { App });
