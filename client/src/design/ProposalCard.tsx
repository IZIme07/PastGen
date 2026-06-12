import type { CSSProperties } from "react";
import { Button } from "./Button";
import { SourceChip } from "./SourceChip";
import { ConfidenceMeter } from "./ConfidenceMeter";
import { Icon } from "./Icon";

const KINDS: Record<string, { icon: string; ru: string }> = {
  add_person:       { icon: "user-plus",      ru: "Новый человек" },
  merge_persons:    { icon: "git-merge",      ru: "Объединить дубли" },
  add_claim:        { icon: "calendar-plus",  ru: "Добавить факт" },
  update_claim:     { icon: "calendar-plus",  ru: "Обновить факт" },
  add_alternative:  { icon: "git-compare",    ru: "Альтернативная версия" },
  add_relationship: { icon: "users",          ru: "Связь" },
  add_event:        { icon: "calendar-clock", ru: "Событие" },
  link_source:      { icon: "paperclip",      ru: "Добавить источник" },
};

export interface ProposalCardProps {
  kind?: string;
  title: string;
  detail?: string | null;
  confidence?: number;
  sources?: { type: string; label?: string }[];
  conflict?: string | null;
  /** Решённое состояние с сервера (status != pending). */
  resolvedState?: "accepted" | "deferred" | "rejected" | null;
  onAccept?: () => void;
  onDefer?: () => void;
  onReject?: () => void;
  style?: CSSProperties;
}

/**
 * ProposalCard — сердце «слоя обновлений»: ИИ предлагает изменение,
 * пользователь принимает / откладывает / отклоняет. Никогда не применяется само.
 */
export function ProposalCard({
  kind = "add_claim", title, detail, confidence = 0, sources = [],
  conflict, resolvedState = null, onAccept, onDefer, onReject, style = {},
}: ProposalCardProps) {
  const k = KINDS[kind] ?? KINDS.add_claim;

  const stateMeta = resolvedState
    ? {
        accepted: { ru: "Принято",   tone: "var(--conf-confirmed)", bg: "var(--conf-confirmed-bg)", icon: "check" },
        deferred: { ru: "Отложено",  tone: "var(--brass-700)",      bg: "var(--brass-050)",         icon: "clock" },
        rejected: { ru: "Отклонено", tone: "var(--ink-500)",        bg: "var(--paper-2)",           icon: "x" },
      }[resolvedState]
    : null;

  return (
    <div style={{
      background: "var(--surface-card)",
      border: "1px solid var(--line-strong)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-sm)",
      overflow: "hidden",
      opacity: stateMeta ? 0.75 : 1,
      transition: "opacity var(--dur-base)",
      ...style,
    }}>
      <div style={{ padding: "14px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 34, height: 34, borderRadius: "var(--radius-sm)", flex: "0 0 auto",
            background: "var(--evergreen-050)", color: "var(--evergreen-700)",
          }}>
            <Icon name={k.icon} size={18} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pg-overline" style={{ color: "var(--evergreen-600)" }}>
              Предложение · {k.ru}
            </div>
            <div style={{ font: "var(--w-semibold) 16px/1.3 var(--font-sans)", color: "var(--text-strong)", marginTop: 2 }}>
              {title}
            </div>
          </div>
          <ConfidenceMeter value={confidence} size={38} />
        </div>

        {detail && (
          <p style={{ margin: "10px 0 0", paddingLeft: 46, font: "var(--text-ui-small)", color: "var(--text-muted)" }}>
            {detail}
          </p>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12, paddingLeft: 46 }}>
          {sources.map((s, i) => <SourceChip key={i} type={s.type} label={s.label} />)}
        </div>

        {conflict && (
          <div style={{
            display: "flex", alignItems: "center", gap: 7, marginTop: 10, marginLeft: 46,
            padding: "7px 10px", borderRadius: "var(--radius-sm)",
            background: "var(--conflict-050)", color: "var(--conflict-600)",
            font: "var(--w-medium) 13px/1.35 var(--font-sans)",
          }}>
            <Icon name="triangle-alert" size={15} stroke={2} />
            {conflict}
          </div>
        )}
      </div>

      {stateMeta ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "10px 16px", background: stateMeta.bg, color: stateMeta.tone,
          font: "var(--w-semibold) 13px/1 var(--font-sans)",
          borderTop: "1px solid var(--line)",
        }}>
          <Icon name={stateMeta.icon} size={15} stroke={2.2} /> {stateMeta.ru}
        </div>
      ) : (
        <div style={{
          display: "flex", gap: 8, padding: "10px 16px",
          background: "var(--paper-1)", borderTop: "1px solid var(--line)",
        }}>
          <Button size="sm" variant="primary" icon="check" onClick={onAccept}>
            Принять
          </Button>
          <Button size="sm" variant="secondary" icon="clock" onClick={onDefer}>
            Отложить
          </Button>
          <Button size="sm" variant="ghost" icon="x" onClick={onReject} style={{ marginLeft: "auto" }}>
            Отклонить
          </Button>
        </div>
      )}
    </div>
  );
}
