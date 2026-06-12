// TimelineView — таймлайн по годам жизни: каждому человеку — полоса
// рождение → смерть (или → настоящее), общая ось лет, группировка по поколениям.
// Направляющие эпох (из событий) и линия «сегодня». (Порт из design/ui_kits/app.)
import { useMemo } from "react";
import { Avatar } from "../design/Avatar";
import { ConfidenceMeter } from "../design/ConfidenceMeter";
import { Icon } from "../design/Icon";
import { useStore } from "../state/store";
import { BRANCH_COLORS, branchOf, generations, lifespanOf, type TreePerson } from "./helpers";

const GUTTER = 208;
const PRESENT = new Date().getFullYear();

const ERA_ICONS: Record<string, string> = {
  move: "footprints", emigration: "footprints", marriage: "heart",
  war: "shield-check", birth: "baby", death: "cross",
};
const ERA_TINTS: Record<string, string> = {
  move: "var(--brass-600)", emigration: "var(--brass-600)",
  marriage: "var(--conflict-500)", war: "var(--ink-500)",
};

function roman(n: number): string {
  const numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  return numerals[n] ?? String(n + 1);
}

function LifeBar({
  p, branch, pct, selected, onSelect,
}: {
  p: TreePerson; branch: string; pct: (y: number) => number;
  selected: boolean; onSelect: (id: string) => void;
}) {
  if (p.birth_year == null) return null;
  const end = p.death_year ?? PRESENT;
  const left = pct(p.birth_year), width = Math.max(pct(end) - left, 0.5);
  const living = p.death_year == null;
  return (
    <div onClick={() => onSelect(p.id)}
      style={{
        display: "grid", gridTemplateColumns: `${GUTTER}px 1fr`, alignItems: "center",
        height: 52, cursor: "pointer", borderRadius: "var(--radius-sm)",
        background: selected ? "var(--brand-tint)" : "transparent",
        transition: "background var(--dur-fast)",
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = "var(--paper-0)"; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = "transparent"; }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 8, minWidth: 0 }}>
        <Avatar name={p.display_name} size={32} deceased={p.deceased}
          ring={p.profile_confidence >= 85 ? "var(--conf-confirmed)" : undefined} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            font: "var(--w-semibold) 13.5px/1.2 var(--font-serif)", color: "var(--text-strong)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{p.display_name}</div>
          <div style={{ font: "11px/1.2 var(--font-mono)", color: "var(--text-muted)" }}>{lifespanOf(p)}</div>
        </div>
        <ConfidenceMeter value={p.profile_confidence} size={24} showValue={false} />
      </div>
      <div style={{ position: "relative", height: "100%" }}>
        <div style={{
          position: "absolute", top: "50%", transform: "translateY(-50%)",
          left: `${left}%`, width: `${width}%`, height: 24, borderRadius: "var(--radius-pill)",
          background: branch, boxShadow: "var(--shadow-xs)",
          border: selected ? "1.5px solid var(--brand)" : "1px solid rgba(33,28,18,0.10)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 9px", overflow: "hidden",
          opacity: living ? 0.92 : 1,
          ...(living ? { borderRight: "2px dashed rgba(246,241,231,0.7)" } : {}),
        }}>
          <span style={{ font: "var(--w-semibold) 11px/1 var(--font-mono)", color: "#F6F1E6" }}>{p.birth_year}</span>
          <span style={{
            font: "var(--w-semibold) 11px/1 var(--font-mono)", color: "#F6F1E6",
            display: "inline-flex", alignItems: "center", gap: 3,
          }}>
            {living ? <Icon name="arrow-right" size={11} stroke={2.4} /> : <>† {p.death_year}</>}
          </span>
        </div>
        {p.birth_year_disputed && (
          <span title={`Спорная дата: ${p.birth_year}${p.birth_year_alt ? ` / ${p.birth_year_alt}` : ""}`}
            style={{
              position: "absolute", top: "50%", transform: "translate(-50%,-50%)",
              left: `${pct(p.birth_year_alt ?? p.birth_year)}%`, width: 16, height: 16,
              borderRadius: 999, zIndex: 3,
              background: "var(--conflict-500)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 0 2px var(--paper-1)",
              font: "var(--w-bold) 10px/1 var(--font-sans)",
            }}>?</span>
        )}
      </div>
    </div>
  );
}

export function TimelineView() {
  const { tree, events, selectedId, select, setView } = useStore();

  const persons = useMemo(() => tree.persons.filter((p) => p.birth_year != null), [tree.persons]);
  const genMap = useMemo(() => generations(persons, tree.relationships), [persons, tree.relationships]);

  const { start, end, decades } = useMemo(() => {
    const years = persons.flatMap((p) => [p.birth_year!, p.death_year ?? PRESENT]);
    const min = years.length ? Math.min(...years) : PRESENT - 100;
    const s = Math.floor((min - 8) / 10) * 10 + 5;
    const e = PRESENT + 5;
    const ds: number[] = [];
    for (let d = Math.ceil(s / 10) * 10; d <= e; d += 10) ds.push(d);
    return { start: s, end: e, decades: ds };
  }, [persons]);
  const pct = (y: number) => ((y - start) / (end - start)) * 100;

  const eras = useMemo(
    () => events
      .filter((e) => ["move", "emigration", "marriage", "war"].includes(e.type) && e.date_from)
      .map((e) => ({
        year: parseInt(e.date_from!.slice(0, 4), 10),
        label: e.description?.split("·")[0]?.trim() ?? e.type,
        icon: ERA_ICONS[e.type] ?? "calendar-clock",
        tint: ERA_TINTS[e.type] ?? "var(--brass-600)",
      }))
      .filter((e) => !Number.isNaN(e.year)),
    [events],
  );

  const groups = useMemo(() => {
    const byGen = new Map<number, TreePerson[]>();
    for (const p of persons) {
      const g = genMap.get(p.id) ?? 0;
      byGen.set(g, [...(byGen.get(g) ?? []), p]);
    }
    for (const group of byGen.values()) group.sort((a, b) => a.birth_year! - b.birth_year!);
    return [...byGen.entries()].sort((a, b) => a[0] - b[0]);
  }, [persons, genMap]);

  const familyName = persons[0]?.display_name.split(" ").pop() ?? "Семья";
  const firstYear = persons.length ? Math.min(...persons.map((p) => p.birth_year!)) : null;

  return (
    <div style={{ flex: 1, overflow: "auto", background: "var(--bg-app)" }} className="pg-paper">
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "26px 28px 48px" }}>
        <div style={{ marginBottom: 18 }}>
          <span className="pg-overline">Лента времени · продолжительность жизни</span>
          <h2 style={{ font: "var(--w-semibold) 26px/1.15 var(--font-serif)", color: "var(--text-strong)", marginTop: 4 }}>
            {familyName} · {firstYear ?? "—"} — настоящее время
          </h2>
        </div>

        {persons.length === 0 && (
          <p style={{ color: "var(--text-muted)", font: "var(--text-ui-body)" }}>
            Пока нет людей с датами рождения. Добавьте факты в досье или импортируйте документы.
          </p>
        )}

        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: GUTTER, right: 0, top: 0, bottom: 0, pointerEvents: "none", zIndex: 1 }}>
            {decades.map((d) => (
              <div key={d} style={{
                position: "absolute", left: `${pct(d)}%`, top: 30, bottom: 0, width: 1,
                background: "var(--line)",
              }}>
                <span style={{
                  position: "absolute", top: -22, left: 0, transform: "translateX(-50%)",
                  font: "11px/1 var(--font-mono)", color: "var(--text-faint)",
                }}>{d}</span>
              </div>
            ))}
            {eras.map((e, i) => (
              <div key={`${e.year}-${i}`} style={{ position: "absolute", left: `${pct(e.year)}%`, top: 30, bottom: 0, width: 0 }}>
                <div style={{
                  position: "absolute", top: 0, bottom: 0, left: 0, width: 1.5,
                  opacity: 0.5, borderLeft: `1.5px dashed ${e.tint}`,
                }} />
                <span style={{
                  position: "absolute", top: 6 + (i % 2) * 24, left: 6,
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 8px", background: "var(--surface-card)", border: `1px solid ${e.tint}`,
                  borderRadius: "var(--radius-pill)", color: e.tint, whiteSpace: "nowrap",
                  font: "var(--w-semibold) 11px/1 var(--font-sans)", boxShadow: "var(--shadow-xs)",
                }}>
                  <Icon name={e.icon} size={12} stroke={2.2} /> {e.label} · {e.year}
                </span>
              </div>
            ))}
            <div style={{
              position: "absolute", left: `${pct(PRESENT)}%`, top: 30, bottom: 0, width: 2,
              background: "var(--evergreen-400)",
            }}>
              <span style={{
                position: "absolute", bottom: -2, left: 6,
                font: "var(--w-semibold) 10px/1 var(--font-sans)",
                color: "var(--evergreen-600)", letterSpacing: ".08em", textTransform: "uppercase",
              }}>сегодня</span>
            </div>
          </div>

          <div style={{ position: "relative", zIndex: 2, paddingTop: 38 }}>
            {groups.map(([g, group]) => (
              <div key={g} style={{ marginBottom: 6 }}>
                <div style={{ display: "grid", gridTemplateColumns: `${GUTTER}px 1fr`, marginTop: g ? 10 : 0 }}>
                  <span className="pg-overline" style={{ paddingLeft: 8, color: "var(--brass-700)" }}>
                    Поколение {roman(g)}{g === 0 ? " — прародители" : ""}
                  </span>
                  <span style={{ borderBottom: "1px solid var(--line)", alignSelf: "center", height: 0 }} />
                </div>
                {group.map((p) => (
                  <LifeBar key={p.id} p={p} pct={pct}
                    branch={BRANCH_COLORS[branchOf(p)]}
                    selected={selectedId === p.id}
                    onSelect={(id) => { select(id); setView("tree"); }} />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 18, marginTop: 22, flexWrap: "wrap", alignItems: "center" }}>
          <Legend swatch="var(--evergreen-500)" label="Отцовская линия" />
          <Legend swatch="var(--brass-500)" label="Материнская линия" />
          <Legend swatch="var(--assist-500)" label="По браку" />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "var(--text-ui-small)", color: "var(--text-muted)" }}>
            <span style={{ width: 22, height: 12, borderRadius: 99, background: "var(--ink-300)", borderRight: "2px dashed #F6F1E6" }} />
            жив · продолжается
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, font: "var(--text-ui-small)", color: "var(--conflict-600)" }}>
            <span style={{
              width: 15, height: 15, borderRadius: 99, background: "var(--conflict-500)", color: "#fff",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              font: "var(--w-bold) 9px/1 var(--font-sans)",
            }}>?</span>
            спорная дата
          </span>
        </div>
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, font: "var(--text-ui-small)", color: "var(--ink-700)" }}>
      <span style={{ width: 22, height: 12, borderRadius: 99, background: swatch }} /> {label}
    </span>
  );
}
