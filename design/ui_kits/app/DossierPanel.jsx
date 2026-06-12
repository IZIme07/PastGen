// DossierPanel — the person dossier shown at the right of the workspace.
function DossierPanel({ personId, onClose, onAskAI }) {
  const { Avatar, Badge, ClaimRow, ConfidenceMeter, Button, IconButton, Icon } = window.PastGenDesignSystem_7468cb;
  const D = window.PG_DATA;
  const d = D.dossier[personId];
  const p = D.people[personId];

  if (!d) {
    return (
      <aside style={panelShell}>
        <div style={{ padding: 24, color: "var(--text-muted)", font: "var(--text-ui-small)", textAlign: "center", marginTop: 60 }}>
          <Icon name="user-search" size={28} style={{ color: "var(--ink-300)", margin: "0 auto 10px" }} />
          Выберите человека в дереве, чтобы открыть досье.
        </div>
      </aside>
    );
  }

  return (
    <aside style={panelShell}>
      {/* header */}
      <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)", background: "var(--paper-0)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span className="pg-overline">Досье человека</span>
          <IconButton icon="x" label="Закрыть" size="sm" onClick={onClose} />
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 12 }}>
          <Avatar name={p.name} size={64} deceased={p.deceased} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ font: "var(--w-semibold) 21px/1.18 var(--font-serif)", color: "var(--text-strong)" }}>{d.name}</h2>
            <div style={{ font: "13px/1.4 var(--font-sans)", color: "var(--text-muted)", marginTop: 3 }}>{d.altNames}</div>
            <div style={{ font: "13px/1 var(--font-mono)", color: "var(--text-body)", marginTop: 6 }}>{d.lifespan}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14,
          padding: "10px 12px", background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)" }}>
          <ConfidenceMeter value={d.confidence} size={42} />
          <div style={{ flex: 1 }}>
            <div style={{ font: "var(--w-semibold) 13px/1.2 var(--font-sans)", color: "var(--text-strong)" }}>Уверенность профиля</div>
            <div style={{ font: "12px/1.4 var(--font-sans)", color: "var(--text-muted)" }}>Подтверждено 2 из 4 ключевых фактов</div>
          </div>
          <Button size="sm" variant="accent" icon="sparkles" onClick={onAskAI}>ИИ</Button>
        </div>
      </div>

      {/* scroll body */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 18px" }}>
        <SectionLabel icon="book-open" text="История" />
        <p style={{ font: "var(--text-prose)", fontSize: 15, color: "var(--text-body)", margin: "0 0 18px" }}>{d.summary}</p>

        <SectionLabel icon="badge-check" text="Утверждения" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {d.claims.map((c, i) => <ClaimRow key={i} {...c} />)}
        </div>

        <SectionLabel icon="list-checks" text="Следующие шаги" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {d.tasks.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start",
              padding: "9px 11px", background: "var(--brass-050)", border: "1px solid var(--brass-100)", borderRadius: "var(--radius-sm)" }}>
              <Icon name="circle-dot" size={15} style={{ color: "var(--brass-600)", marginTop: 1 }} />
              <span style={{ font: "var(--text-ui-small)", color: "var(--ink-700)" }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function SectionLabel({ icon, text }) {
  const { Icon } = window.PastGenDesignSystem_7468cb;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
      <Icon name={icon} size={15} style={{ color: "var(--evergreen-600)" }} />
      <span className="pg-overline">{text}</span>
    </div>
  );
}

const panelShell = {
  width: "var(--rail-dossier)", flex: "0 0 var(--rail-dossier)",
  display: "flex", flexDirection: "column",
  background: "var(--bg-panel)", borderLeft: "1px solid var(--line-strong)", height: "100%",
};

Object.assign(window, { DossierPanel });
