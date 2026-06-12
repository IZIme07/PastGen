// AssistantPanel — the AI genealogist: a task-driven research assistant, not a generic chat.
function AssistantPanel({ open, onClose, context }) {
  const { Button, IconButton, Icon, SourceChip, Badge } = window.PastGenDesignSystem_7468cb;
  const tasks = [
    "Проверь эту ветку",
    "Найди слабые места",
    "Предложи следующие 5 шагов",
    "Найди возможные дубли",
    "Составь вопросы для интервью",
    "Письмо в архив",
  ];
  return (
    <aside style={{
      position: "absolute", top: 0, right: 0, bottom: 0, width: 360,
      transform: open ? "translateX(0)" : "translateX(100%)",
      transition: "transform var(--dur-slow) var(--ease-out)",
      background: "var(--paper-0)", borderLeft: "1px solid var(--line-strong)",
      boxShadow: open ? "var(--shadow-lg)" : "none", zIndex: 40,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10,
        background: "var(--evergreen-700)", color: "var(--on-dark)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30,
          borderRadius: "var(--radius-sm)", background: "rgba(255,255,255,0.14)" }}>
          <Icon name="sparkles" size={17} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ font: "var(--w-semibold) 14px/1.2 var(--font-sans)" }}>ИИ-генеалог</div>
          <div style={{ font: "11px/1.3 var(--font-mono)", opacity: 0.75 }}>контекст: {context}</div>
        </div>
        <IconButton icon="x" label="Закрыть" size="sm" onClick={onClose}
          style={{ color: "var(--on-dark)" }} />
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* AI message */}
        <div style={{ background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "12px 13px" }}>
          <div style={{ font: "var(--text-ui-small)", color: "var(--ink-700)", lineHeight: 1.55 }}>
            В ветке Соколовых я вижу <b>2 слабых места</b>: спорная дата рождения Марии (1928/1930) и неподтверждённое место смерти.
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            <SourceChip type="archive" label="Метрическая книга" />
            <SourceChip type="story" label="Рассказ дочери" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
            <Badge tone="conflict" size="sm" icon="triangle-alert">1 конфликт</Badge>
            <Badge tone="hypothesis" size="sm" dot>1 гипотеза</Badge>
          </div>
        </div>
        {/* suggested next steps */}
        <div>
          <span className="pg-overline">Предлагаемые шаги</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {["Проверить метрические книги Тулы (1928–1930)", "Найти эвакуационные списки 1941 года", "Запросить архивную справку о смерти"].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "9px 11px",
                background: "var(--paper-1)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ font: "var(--w-semibold) 11px/1 var(--font-mono)", color: "var(--brass-600)" }}>{i + 1}</span>
                <span style={{ font: "var(--text-ui-small)", color: "var(--ink-700)", flex: 1 }}>{s}</span>
                <Icon name="arrow-right" size={14} style={{ color: "var(--text-faint)" }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* task chips + composer */}
      <div style={{ borderTop: "1px solid var(--line)", padding: 14, background: "var(--paper-1)" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {tasks.map((t) => (
            <button key={t} style={{ font: "var(--w-medium) 12px/1 var(--font-sans)", color: "var(--evergreen-700)",
              background: "var(--evergreen-050)", border: "1px solid var(--evergreen-200)", borderRadius: "var(--radius-pill)",
              padding: "6px 11px", cursor: "pointer" }}>{t}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: "var(--surface-card)",
          border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)", padding: "4px 4px 4px 12px" }}>
          <input placeholder="Спросите о ветке или человеке…" style={{ flex: 1, border: "none", outline: "none",
            background: "transparent", font: "var(--text-ui-body)", color: "var(--text-strong)" }} />
          <Button size="sm" variant="primary" icon="arrow-up" iconOnly aria-label="Отправить" />
        </div>
      </div>
    </aside>
  );
}
Object.assign(window, { AssistantPanel });
