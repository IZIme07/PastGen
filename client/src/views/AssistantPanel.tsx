// AssistantPanel — ИИ-генеалог: исследовательский помощник с задачами, не «чат обо всём».
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { AssistantTask } from "@pastgen/shared";
import { Icon } from "../design/Icon";
import { IconButton } from "../design/IconButton";
import { api, ApiError } from "../api/client";
import { useStore } from "../state/store";

const TASKS: { id: AssistantTask; label: string }[] = [
  { id: "check_branch", label: "Проверь эту ветку" },
  { id: "weak_spots", label: "Найди слабые места" },
  { id: "next_steps", label: "Предложи следующие 5 шагов" },
  { id: "explain_conflict", label: "Объясни конфликт" },
  { id: "interview_questions", label: "Вопросы для интервью" },
  { id: "archive_letter", label: "Письмо в архив" },
  { id: "summarize_branch", label: "История ветви" },
];

export function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dossier, selectedId, aiAvailable, refresh } = useStore();
  const [answer, setAnswer] = useState<string | null>(null);
  const [runningTask, setRunningTask] = useState<AssistantTask | null>(null);
  const [error, setError] = useState<string | null>(null);

  const context = dossier?.person.display_name ?? "всё дерево";

  const run = async (task: AssistantTask) => {
    if (runningTask) return;
    setRunningTask(task);
    setError(null);
    try {
      const result = await api.assistant(task, selectedId);
      setAnswer(result.text);
      if (result.proposals.length > 0) await refresh();
    } catch (err) {
      setError(err instanceof ApiError && err.code === "ai_not_configured"
        ? "ИИ не настроен: задайте ANTHROPIC_API_KEY на сервере."
        : err instanceof Error ? err.message : "Не удалось получить ответ");
    } finally {
      setRunningTask(null);
    }
  };

  return (
    <aside style={{
      position: "absolute", top: 0, right: 0, bottom: 0, width: 360,
      transform: open ? "translateX(0)" : "translateX(100%)",
      transition: "transform var(--dur-slow) var(--ease-out)",
      background: "var(--paper-0)", borderLeft: "1px solid var(--line-strong)",
      boxShadow: open ? "var(--shadow-lg)" : "none", zIndex: 40,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        padding: "14px 16px", borderBottom: "1px solid var(--line)",
        display: "flex", alignItems: "center", gap: 10,
        background: "var(--evergreen-700)", color: "var(--on-dark)",
      }}>
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30,
          borderRadius: "var(--radius-sm)", background: "rgba(255,255,255,0.14)",
        }}>
          <Icon name="sparkles" size={17} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ font: "var(--w-semibold) 14px/1.2 var(--font-sans)" }}>ИИ-генеалог</div>
          <div style={{ font: "11px/1.3 var(--font-mono)", opacity: 0.75 }}>контекст: {context}</div>
        </div>
        <IconButton icon="x" label="Закрыть" size="sm" onClick={onClose} style={{ color: "var(--on-dark)" }} />
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {!aiAvailable && (
          <div style={{
            background: "var(--paper-1)", border: "1px solid var(--line-strong)",
            borderRadius: "var(--radius-md)", padding: "12px 13px",
            font: "var(--text-ui-small)", color: "var(--ink-700)", lineHeight: 1.55,
          }}>
            ИИ не настроен. Задайте <code>ANTHROPIC_API_KEY</code> в окружении сервера —
            и генеалог сможет проверять ветки, искать слабые места и готовить письма в архив.
          </div>
        )}

        {error && (
          <div style={{
            background: "var(--conflict-050)", border: "1px solid var(--conflict-100)",
            borderRadius: "var(--radius-md)", padding: "12px 13px",
            font: "var(--text-ui-small)", color: "var(--conflict-600)",
          }}>
            {error}
          </div>
        )}

        {runningTask && (
          <div style={{
            display: "flex", alignItems: "center", gap: 9,
            background: "var(--surface-card)", border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)", padding: "12px 13px",
            font: "var(--text-ui-small)", color: "var(--text-muted)",
          }}>
            <Icon name="loader" size={15} />
            Изучаю источники и утверждения…
          </div>
        )}

        {answer && !runningTask && (
          <div style={{
            background: "var(--surface-card)", border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)", padding: "12px 13px",
          }}>
            <div style={{ font: "var(--text-ui-small)", color: "var(--ink-700)", lineHeight: 1.55 }}>
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
          </div>
        )}

        {!answer && !runningTask && aiAvailable && (
          <div style={{
            font: "var(--text-ui-small)", color: "var(--text-muted)", lineHeight: 1.55,
            padding: "4px 2px",
          }}>
            Выберите исследовательскую задачу ниже. Генеалог работает с контекстом:
            выбранный человек, его утверждения, источники и открытые задачи.
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid var(--line)", padding: 14, background: "var(--paper-1)" }}>
        <span className="pg-overline" style={{ display: "block", marginBottom: 8 }}>Задачи генеалога</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {TASKS.map((t) => (
            <button key={t.id}
              onClick={() => void run(t.id)}
              disabled={!aiAvailable || runningTask !== null}
              style={{
                font: "var(--w-medium) 12px/1 var(--font-sans)", color: "var(--evergreen-700)",
                background: runningTask === t.id ? "var(--evergreen-100)" : "var(--evergreen-050)",
                border: "1px solid var(--evergreen-200)", borderRadius: "var(--radius-pill)",
                padding: "6px 11px",
                cursor: !aiAvailable || runningTask ? "not-allowed" : "pointer",
                opacity: !aiAvailable ? 0.5 : 1,
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
