import type { CSSProperties } from "react";
import { Icon } from "./Icon";

const SOURCE_TYPES: Record<string, { icon: string; ru: string; tint: string; fg: string }> = {
  document: { icon: "file-text",      ru: "Документ",    tint: "var(--assist-100)",    fg: "var(--assist-600)" },
  archive:  { icon: "archive",        ru: "Архив",       tint: "var(--evergreen-050)", fg: "var(--evergreen-700)" },
  photo:    { icon: "image",          ru: "Фото",        tint: "var(--brass-050)",     fg: "var(--brass-700)" },
  caption:  { icon: "pen-line",       ru: "Подпись",     tint: "var(--brass-050)",     fg: "var(--brass-700)" },
  audio:    { icon: "mic",            ru: "Аудио",       tint: "var(--conflict-050)",  fg: "var(--conflict-600)" },
  story:    { icon: "book-open",      ru: "Рассказ",     tint: "var(--paper-2)",       fg: "var(--ink-700)" },
  letter:   { icon: "mail",           ru: "Письмо",      tint: "var(--paper-2)",       fg: "var(--ink-700)" },
  pdf:      { icon: "file-type-2",    ru: "PDF",         tint: "var(--assist-100)",    fg: "var(--assist-600)" },
  link:     { icon: "link",           ru: "Ссылка",      tint: "var(--assist-100)",    fg: "var(--assist-600)" },
  comment:  { icon: "message-circle", ru: "Комментарий", tint: "var(--paper-2)",       fg: "var(--ink-700)" },
};

export interface SourceChipProps {
  type?: string;
  label?: string;
  quality?: number;
  onClick?: () => void;
  removable?: boolean;
  onRemove?: () => void;
  style?: CSSProperties;
}

/** SourceChip — маркер происхождения: тип источника с иконкой и подписью. */
export function SourceChip({
  type = "document", label, quality, onClick, removable = false, onRemove, style = {},
}: SourceChipProps) {
  const t = SOURCE_TYPES[type] ?? SOURCE_TYPES.document;
  const text = label || t.ru;

  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        height: 26, padding: "0 9px",
        background: "var(--surface-card)",
        border: "1px solid var(--line-strong)",
        borderRadius: "var(--radius-xs)",
        font: "var(--w-medium) 12px/1 var(--font-sans)",
        color: "var(--text-body)",
        cursor: onClick ? "pointer" : "default",
        maxWidth: 240,
        ...style,
      }}
    >
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 18, height: 18, borderRadius: 4, background: t.tint, color: t.fg, flex: "0 0 auto",
      }}>
        <Icon name={t.icon} size={12} stroke={2} />
      </span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text}</span>
      {typeof quality === "number" && (
        <span title={`Качество источника ${quality}%`} style={{ display: "inline-flex", gap: 2, marginLeft: 1 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{
              width: 4, height: 4, borderRadius: 999,
              background: quality > i * 33 + 16 ? t.fg : "var(--line-strong)",
            }} />
          ))}
        </span>
      )}
      {removable && (
        <span
          onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
          style={{ display: "inline-flex", color: "var(--text-faint)", cursor: "pointer", marginLeft: 1 }}
        >
          <Icon name="x" size={13} stroke={2} />
        </span>
      )}
    </span>
  );
}
