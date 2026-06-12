// DossierPanel — досье человека справа от рабочей области (порт из design/ui_kits/app).
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { ClaimDTO } from "@pastgen/shared";
import { Avatar } from "../design/Avatar";
import { Button } from "../design/Button";
import { ClaimRow } from "../design/ClaimRow";
import { ConfidenceMeter } from "../design/ConfidenceMeter";
import { Icon } from "../design/Icon";
import { IconButton } from "../design/IconButton";
import { Input } from "../design/Input";
import { api } from "../api/client";
import { useStore } from "../state/store";
import { claimLabel, claimValueText, lifespanOf } from "./helpers";

const panelShell: CSSProperties = {
  width: "var(--rail-dossier)", flex: "0 0 var(--rail-dossier)",
  display: "flex", flexDirection: "column",
  background: "var(--bg-panel)", borderLeft: "1px solid var(--line-strong)", height: "100%",
};

function SectionLabel({ icon, text, action }: { icon: string; text: string; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
      <Icon name={icon} size={15} style={{ color: "var(--evergreen-600)" }} />
      <span className="pg-overline">{text}</span>
      {action && <span style={{ marginLeft: "auto" }}>{action}</span>}
    </div>
  );
}

const RELATION_OPTIONS = [
  { value: "parent", label: "Родитель" },
  { value: "spouse", label: "Супруг(а)" },
  { value: "sibling", label: "Брат / сестра" },
  { value: "ex_spouse", label: "Бывший супруг(а)" },
  { value: "other", label: "Другая связь" },
];

const REL_RU: Record<string, { out: string; in: string }> = {
  parent: { out: "родитель", in: "ребёнок" },
  spouse: { out: "супруг(а)", in: "супруг(а)" },
  ex_spouse: { out: "бывш. супруг(а)", in: "бывш. супруг(а)" },
  sibling: { out: "брат/сестра", in: "брат/сестра" },
  adoption: { out: "усыновитель", in: "усыновлён(а)" },
  guardian: { out: "опекун", in: "под опекой" },
  witness: { out: "свидетель", in: "свидетель" },
  neighbor: { out: "сосед", in: "сосед" },
  colleague: { out: "сослуживец", in: "сослуживец" },
  other: { out: "связь", in: "связь" },
};

const CLAIM_TYPE_OPTIONS = [
  { value: "birth_date", label: "Рождение" },
  { value: "death_date", label: "Смерть" },
  { value: "marriage", label: "Брак" },
  { value: "residence", label: "Проживание" },
  { value: "occupation", label: "Занятие" },
  { value: "name_change", label: "Смена фамилии" },
  { value: "custom", label: "Другой факт" },
];

const selectStyle: CSSProperties = {
  height: 38, padding: "0 10px", width: "100%",
  font: "var(--text-ui-body)", color: "var(--text-strong)",
  background: "var(--surface-card)", border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-sm)", outline: "none",
};

function AddClaimForm({ personId, onDone }: { personId: string; onDone: () => void }) {
  const [type, setType] = useState("birth_date");
  const [text, setText] = useState("");
  const [confidence, setConfidence] = useState(70);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      // "1928, Тула" → {year, place}; иначе {text}
      const m = /^(\d{4})(?:\s*,\s*(.+))?$/.exec(text.trim());
      const value = m
        ? { year: parseInt(m[1], 10), ...(m[2] ? { place: m[2] } : {}) }
        : { text: text.trim() };
      await api.claims.create({ subject_id: personId, claim_type: type, value, confidence });
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      padding: 12, background: "var(--surface-card)", border: "1px solid var(--line)",
      borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: 10, marginBottom: 8,
    }}>
      <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
        {CLAIM_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <Input placeholder="Значение: «1928, Тула» или текст" value={text}
        onChange={(e) => setText(e.target.value)} />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ font: "var(--text-ui-small)", color: "var(--text-muted)", flex: "0 0 auto" }}>
          Уверенность
        </span>
        <input type="range" min={0} max={100} value={confidence}
          onChange={(e) => setConfidence(parseInt(e.target.value, 10))} style={{ flex: 1 }} />
        <span className="pg-mono" style={{ width: 38, textAlign: "right", color: "var(--text-strong)", fontSize: 13 }}>
          {confidence}%
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button size="sm" variant="ghost" onClick={onDone}>Отмена</Button>
        <Button size="sm" variant="primary" icon="check" onClick={submit} disabled={!text.trim() || busy}>
          Сохранить
        </Button>
      </div>
    </div>
  );
}

function AddRelationForm({ personId, onDone }: { personId: string; onDone: () => void }) {
  const { tree } = useStore();
  const [otherId, setOtherId] = useState("");
  const [type, setType] = useState("parent");
  const [busy, setBusy] = useState(false);
  const others = tree.persons.filter((p) => p.id !== personId);

  const submit = async () => {
    if (!otherId || busy) return;
    setBusy(true);
    try {
      // parent: a — родитель b. «Этот человек — родитель выбранного» → a=personId.
      await api.relationships.create({
        a_id: type === "parent" ? otherId : personId,
        b_id: type === "parent" ? personId : otherId,
        type: type as never,
      });
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      padding: 12, background: "var(--surface-card)", border: "1px solid var(--line)",
      borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: 10, marginBottom: 8,
    }}>
      <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
        {RELATION_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.value === "parent" ? "Родитель этого человека" : o.label}
          </option>
        ))}
      </select>
      <select value={otherId} onChange={(e) => setOtherId(e.target.value)} style={selectStyle}>
        <option value="">— выберите человека —</option>
        {others.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
      </select>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button size="sm" variant="ghost" onClick={onDone}>Отмена</Button>
        <Button size="sm" variant="primary" icon="check" onClick={submit} disabled={!otherId || busy}>
          Связать
        </Button>
      </div>
    </div>
  );
}

export function DossierPanel({ onClose }: { onClose: () => void }) {
  const { dossier, refreshDossier, refresh, setAssistantOpen, select } = useStore();
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [addingClaim, setAddingClaim] = useState(false);
  const [addingRel, setAddingRel] = useState(false);

  const primaryClaims = useMemo(
    () => (dossier?.claims ?? []).filter((c) => c.status === "primary"),
    [dossier],
  );
  const altCount = (claim: ClaimDTO) =>
    (dossier?.claims ?? []).filter((c) => c.parent_claim_id === claim.id && c.status === "alternative").length;

  if (!dossier) {
    return (
      <aside style={panelShell}>
        <div style={{ padding: 24, color: "var(--text-muted)", font: "var(--text-ui-small)", textAlign: "center", marginTop: 60 }}>
          <Icon name="user-search" size={28} style={{ color: "var(--ink-300)", margin: "0 auto 10px" }} />
          Выберите человека в дереве, чтобы открыть досье.
        </div>
      </aside>
    );
  }

  const { person, profile_confidence, tasks, relationships } = dossier;
  const confirmedCount = primaryClaims.filter((c) => c.confidence >= 85).length;

  const saveBio = async () => {
    await api.persons.update(person.id, { bio_md: bioDraft });
    setEditingBio(false);
    await refreshDossier();
  };

  const onDataChanged = async () => {
    setAddingClaim(false);
    setAddingRel(false);
    await Promise.all([refreshDossier(), refresh()]);
  };

  return (
    <aside style={panelShell}>
      <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)", background: "var(--paper-0)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span className="pg-overline">Досье человека</span>
          <IconButton icon="x" label="Закрыть" size="sm" onClick={onClose} />
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 12 }}>
          <Avatar name={person.display_name} size={64} deceased={person.deceased} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ font: "var(--w-semibold) 21px/1.18 var(--font-serif)", color: "var(--text-strong)" }}>
              {person.display_name}
            </h2>
            {person.alt_names.length > 0 && (
              <div style={{ font: "13px/1.4 var(--font-sans)", color: "var(--text-muted)", marginTop: 3 }}>
                {person.alt_names.join(" · ")}
              </div>
            )}
            <div style={{ font: "13px/1 var(--font-mono)", color: "var(--text-body)", marginTop: 6 }}>
              {lifespanOf(dossierPersonAsTree(dossier))}
            </div>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginTop: 14,
          padding: "10px 12px", background: "var(--surface-card)", border: "1px solid var(--line)",
          borderRadius: "var(--radius-md)",
        }}>
          <ConfidenceMeter value={profile_confidence} size={42} />
          <div style={{ flex: 1 }}>
            <div style={{ font: "var(--w-semibold) 13px/1.2 var(--font-sans)", color: "var(--text-strong)" }}>
              Уверенность профиля
            </div>
            <div style={{ font: "12px/1.4 var(--font-sans)", color: "var(--text-muted)" }}>
              Подтверждено {confirmedCount} из {primaryClaims.length} фактов
            </div>
          </div>
          <Button size="sm" variant="accent" icon="sparkles" onClick={() => setAssistantOpen(true)}>ИИ</Button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "16px 18px" }}>
        <SectionLabel icon="book-open" text="История"
          action={!editingBio && (
            <IconButton icon="pencil" label="Редактировать" size="sm"
              onClick={() => { setBioDraft(person.bio_md ?? ""); setEditingBio(true); }} />
          )} />
        {editingBio ? (
          <div style={{ marginBottom: 18 }}>
            <Input multiline rows={6} value={bioDraft}
              placeholder="Биография в Markdown…"
              onChange={(e) => setBioDraft(e.target.value)} />
            <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
              <Button size="sm" variant="ghost" onClick={() => setEditingBio(false)}>Отмена</Button>
              <Button size="sm" variant="primary" icon="save" onClick={saveBio}>Сохранить</Button>
            </div>
          </div>
        ) : person.bio_md ? (
          <div style={{ font: "var(--text-prose)", fontSize: 15, color: "var(--text-body)", margin: "0 0 18px" }}>
            <ReactMarkdown>{person.bio_md}</ReactMarkdown>
          </div>
        ) : (
          <p style={{ font: "var(--text-ui-small)", color: "var(--text-faint)", margin: "0 0 18px" }}>
            История пока не записана.
          </p>
        )}

        <SectionLabel icon="badge-check" text="Утверждения"
          action={!addingClaim && (
            <IconButton icon="plus" label="Добавить факт" size="sm" onClick={() => setAddingClaim(true)} />
          )} />
        {addingClaim && <AddClaimForm personId={person.id} onDone={onDataChanged} />}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {primaryClaims.length === 0 && !addingClaim && (
            <p style={{ font: "var(--text-ui-small)", color: "var(--text-faint)", margin: 0 }}>
              Фактов пока нет. Добавьте утверждение или импортируйте документ.
            </p>
          )}
          {primaryClaims.map((c) => (
            <ClaimRow key={c.id}
              label={claimLabel(c.claim_type)}
              value={claimValueText(c.value)}
              confidence={c.confidence}
              sources={c.sources.map((s) => ({ type: s.type, label: s.title }))}
              alternatives={altCount(c)}
              conflict={c.conflict ? (c.conflict_note ?? "Конфликт") : undefined} />
          ))}
        </div>

        <SectionLabel icon="users" text="Связи"
          action={!addingRel && (
            <IconButton icon="plus" label="Добавить связь" size="sm" onClick={() => setAddingRel(true)} />
          )} />
        {addingRel && <AddRelationForm personId={person.id} onDone={onDataChanged} />}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
          {relationships.map((r) => {
            const isOut = r.a_id === person.id;
            const label = REL_RU[r.type]?.[isOut ? "out" : "in"] ?? r.type;
            return (
              <button key={r.id} onClick={() => select(r.other.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 11px",
                  background: "var(--surface-card)", border: "1px solid var(--line)",
                  borderRadius: "var(--radius-sm)", cursor: "pointer", textAlign: "left",
                }}>
                <Avatar name={r.other.display_name} size={28} deceased={r.other.deceased} />
                <span style={{
                  flex: 1, font: "var(--w-medium) 13px/1.2 var(--font-serif)", color: "var(--text-strong)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{r.other.display_name}</span>
                <span style={{ font: "11px/1 var(--font-sans)", color: "var(--text-muted)" }}>{label}</span>
                <Icon name="chevron-right" size={13} style={{ color: "var(--text-faint)" }} />
              </button>
            );
          })}
        </div>

        <SectionLabel icon="list-checks" text="Следующие шаги" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {tasks.length === 0 && (
            <p style={{ font: "var(--text-ui-small)", color: "var(--text-faint)", margin: 0 }}>
              Открытых задач нет.
            </p>
          )}
          {tasks.map((t) => (
            <div key={t.id} style={{
              display: "flex", gap: 9, alignItems: "flex-start",
              padding: "9px 11px", background: "var(--brass-050)",
              border: "1px solid var(--brass-100)", borderRadius: "var(--radius-sm)",
            }}>
              <Icon name="circle-dot" size={15} style={{ color: "var(--brass-600)", marginTop: 1 }} />
              <span style={{ font: "var(--text-ui-small)", color: "var(--ink-700)", flex: 1 }}>{t.title}</span>
              <IconButton icon="check" label="Выполнено" size="sm"
                onClick={async () => { await api.tasks.setStatus(t.id, "done"); await refreshDossier(); }} />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

// Годы жизни для шапки досье берём из утверждений (как в /api/tree).
function dossierPersonAsTree(d: NonNullable<ReturnType<typeof useStore>["dossier"]>) {
  const year = (type: string) => {
    const c = d.claims.find((x) => x.claim_type === type && x.status === "primary");
    if (!c) return null;
    if (typeof c.value.year === "number") return c.value.year as number;
    const m = typeof c.value.date === "string" ? /^(\d{4})/.exec(c.value.date as string) : null;
    return m ? parseInt(m[1], 10) : null;
  };
  return { birth_year: year("birth_date"), death_year: year("death_date") };
}
