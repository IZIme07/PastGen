// ImportView — the update layer: imported chaos on the left, AI proposals to resolve.
function ImportView({ onAskAI }) {
  const { ProposalCard, SourceChip, Button, Icon, Badge } = window.PastGenDesignSystem_7468cb;
  const D = window.PG_DATA;
  const imported = [
    { type: "document", label: "Свидетельство о рождении.jpg" },
    { type: "letter",   label: "Письмо 1947.pdf" },
    { type: "photo",    label: "Групповой портрет.jpg" },
    { type: "audio",    label: "Рассказ бабушки.m4a" },
    { type: "archive",  label: "Архивная справка.pdf" },
  ];
  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* imported items rail */}
      <div style={{ width: 280, flex: "0 0 280px", borderRight: "1px solid var(--line-strong)", background: "var(--bg-panel)",
        padding: 16, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <span className="pg-overline">Импорт хаоса</span>
        <div style={{ marginTop: 12, padding: "20px 14px", border: "1.5px dashed var(--line-ink)", borderRadius: "var(--radius-md)",
          background: "var(--paper-0)", textAlign: "center" }}>
          <Icon name="upload-cloud" size={26} style={{ color: "var(--brass-600)", margin: "0 auto 8px" }} />
          <div style={{ font: "var(--w-medium) 13px/1.4 var(--font-sans)", color: "var(--text-body)" }}>
            Перетащите фото, документы, PDF или аудио
          </div>
          <div style={{ font: "12px/1.4 var(--font-sans)", color: "var(--text-faint)", marginTop: 3 }}>
            ИИ извлечёт имена, даты, места и связи
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 14 }}>
          {imported.map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
              background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)" }}>
              <SourceChip type={it.type} label={it.label} style={{ border: "none", padding: 0, height: "auto" }} />
              <Badge tone="confirmed" size="sm" style={{ marginLeft: "auto" }}>OCR</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* proposals stream */}
      <div style={{ flex: 1, overflow: "auto", padding: "22px 26px" }} className="pg-paper">
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 4 }}>
            <div>
              <span className="pg-overline">Слой обновлений дерева</span>
              <h2 style={{ font: "var(--w-semibold) 24px/1.15 var(--font-serif)", color: "var(--text-strong)", marginTop: 4 }}>
                4 предложения к проверке
              </h2>
            </div>
            <Button size="sm" variant="accent" icon="sparkles" onClick={onAskAI}>Проверить ветку</Button>
          </div>
          <p style={{ font: "var(--text-ui-small)", color: "var(--text-muted)", margin: "6px 0 18px", maxWidth: 460 }}>
            Новые данные не меняют дерево автоматически. Просмотрите источники и уверенность, затем примите, отложите или отклоните.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {D.proposals.map((p) => (
              <ProposalCard key={p.id} kind={p.kind} title={p.title} detail={p.detail}
                confidence={p.confidence} sources={p.sources} conflict={p.conflict} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { ImportView });
