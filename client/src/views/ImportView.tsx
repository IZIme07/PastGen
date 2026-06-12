// ImportView — слой обновлений: импортированный хаос слева, предложения ИИ справа.
// Новые данные никогда не меняют дерево сами — только через Принять/Отложить/Отклонить.
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import type { SourceDTO } from "@pastgen/shared";
import { Badge } from "../design/Badge";
import { Button } from "../design/Button";
import { Icon } from "../design/Icon";
import { Input } from "../design/Input";
import { ProposalCard } from "../design/ProposalCard";
import { SourceChip } from "../design/SourceChip";
import { api } from "../api/client";
import { useStore } from "../state/store";

export function ImportView() {
  const { proposals, refresh, refreshDossier, aiAvailable, setAssistantOpen } = useStore();
  const [sources, setSources] = useState<SourceDTO[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadSources = useCallback(async () => setSources(await api.sources.list()), []);
  useEffect(() => { loadSources().catch(() => {}); }, [loadSources]);

  const pending = proposals.filter((p) => p.status === "pending");

  const afterImport = async (result: { ai_error?: string }) => {
    setAiError(result.ai_error ?? null);
    await Promise.all([refresh(), loadSources()]);
  };

  const uploadFiles = async (files: FileList | File[]) => {
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const result = await api.importFile(file);
        await afterImport(result);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setBusy(false);
    }
  };

  const submitNote = async () => {
    if (!note.trim() || busy) return;
    setBusy(true);
    try {
      const result = await api.importText(note.trim());
      setNote("");
      await afterImport(result);
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) void uploadFiles(e.dataTransfer.files);
  };

  const decide = async (id: string, action: "accept" | "defer" | "reject") => {
    await api.proposals[action](id);
    await Promise.all([refresh(), refreshDossier()]);
  };

  const sourcesById = new Map(sources.map((s) => [s.id, s]));

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* рельса импортированных материалов */}
      <div style={{
        width: 280, flex: "0 0 280px", borderRight: "1px solid var(--line-strong)",
        background: "var(--bg-panel)", padding: 16, overflow: "auto",
        display: "flex", flexDirection: "column",
      }}>
        <span className="pg-overline">Импорт хаоса</span>

        <div
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{
            marginTop: 12, padding: "20px 14px", cursor: "pointer",
            border: `1.5px dashed ${dragOver ? "var(--brand)" : "var(--line-ink)"}`,
            borderRadius: "var(--radius-md)",
            background: dragOver ? "var(--brand-tint)" : "var(--paper-0)", textAlign: "center",
            transition: "background var(--dur-fast), border-color var(--dur-fast)",
          }}>
          <Icon name={busy ? "loader" : "upload-cloud"} size={26}
            style={{ color: "var(--brass-600)", margin: "0 auto 8px" }} />
          <div style={{ font: "var(--w-medium) 13px/1.4 var(--font-sans)", color: "var(--text-body)" }}>
            {busy ? "Обрабатываем…" : "Перетащите фото, документы, PDF или аудио"}
          </div>
          <div style={{ font: "12px/1.4 var(--font-sans)", color: "var(--text-faint)", marginTop: 3 }}>
            {aiAvailable ? "ИИ извлечёт имена, даты, места и связи" : "Файлы сохранятся как источники"}
          </div>
          <input ref={fileInput} type="file" multiple hidden
            accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.md,.mp3,.m4a,.ogg"
            onChange={(e) => { if (e.target.files?.length) void uploadFiles(e.target.files); e.target.value = ""; }} />
        </div>

        <div style={{ marginTop: 12 }}>
          <Input multiline rows={3} placeholder="Или вставьте текст: рассказ, письмо, заметку…"
            value={note} onChange={(e) => setNote(e.target.value)} />
          <Button size="sm" variant="secondary" icon="arrow-up" fullWidth style={{ marginTop: 6 }}
            onClick={submitNote} disabled={!note.trim() || busy}>
            Отправить текст
          </Button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 14 }}>
          {sources.map((s) => (
            <div key={s.id} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
              background: "var(--surface-card)", border: "1px solid var(--line)",
              borderRadius: "var(--radius-sm)",
            }}>
              <SourceChip type={s.type} label={s.title} style={{ border: "none", padding: 0, height: "auto" }} />
              {s.recognized_text && (
                <Badge tone="confirmed" size="sm" style={{ marginLeft: "auto" }}>OCR</Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* поток предложений */}
      <div style={{ flex: 1, overflow: "auto", padding: "22px 26px" }} className="pg-paper">
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 4 }}>
            <div>
              <span className="pg-overline">Слой обновлений дерева</span>
              <h2 style={{ font: "var(--w-semibold) 24px/1.15 var(--font-serif)", color: "var(--text-strong)", marginTop: 4 }}>
                {pending.length === 0
                  ? "Все предложения разобраны"
                  : `${pending.length} ${plural(pending.length, "предложение", "предложения", "предложений")} к проверке`}
              </h2>
            </div>
            <Button size="sm" variant="accent" icon="sparkles" onClick={() => setAssistantOpen(true)}>
              Проверить ветку
            </Button>
          </div>
          <p style={{ font: "var(--text-ui-small)", color: "var(--text-muted)", margin: "6px 0 18px", maxWidth: 460 }}>
            Новые данные не меняют дерево автоматически. Просмотрите источники и уверенность,
            затем примите, отложите или отклоните.
          </p>

          {!aiAvailable && (
            <div style={{
              display: "flex", gap: 9, padding: "10px 13px", marginBottom: 14,
              background: "var(--paper-1)", border: "1px solid var(--line-strong)",
              borderRadius: "var(--radius-md)", font: "var(--text-ui-small)", color: "var(--ink-700)",
            }}>
              <Icon name="sparkles" size={16} style={{ color: "var(--text-faint)", marginTop: 1 }} />
              <span>
                ИИ не настроен. Задайте <code>ANTHROPIC_API_KEY</code> на сервере, чтобы импорт
                извлекал факты и создавал предложения автоматически.
              </span>
            </div>
          )}
          {aiError && (
            <div style={{
              display: "flex", gap: 9, padding: "10px 13px", marginBottom: 14,
              background: "var(--conflict-050)", border: "1px solid var(--conflict-100)",
              borderRadius: "var(--radius-md)", font: "var(--text-ui-small)", color: "var(--conflict-600)",
            }}>
              <Icon name="triangle-alert" size={16} style={{ marginTop: 1 }} />
              <span>Источник сохранён, но ИИ-разбор не удался: {aiError}</span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {pending.map((p) => (
              <ProposalCard key={p.id}
                kind={p.kind} title={p.title} detail={p.detail}
                confidence={p.confidence}
                conflict={p.conflict_note}
                sources={p.source_ids
                  .map((id) => sourcesById.get(id))
                  .filter((s): s is SourceDTO => !!s)
                  .map((s) => ({ type: s.type, label: s.title }))}
                onAccept={() => void decide(p.id, "accept")}
                onDefer={() => void decide(p.id, "defer")}
                onReject={() => void decide(p.id, "reject")} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
