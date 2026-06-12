import type { RelationshipDTO, TreeDTO } from "@pastgen/shared";

export type TreePerson = TreeDTO["persons"][number];

// Ветвь человека хранится в notes как "… · ветвь: paternal" (соглашение сида/импорта).
export type Branch = "paternal" | "maternal" | "married" | "other";

export const BRANCH_COLORS: Record<Branch, string> = {
  paternal: "var(--evergreen-500)",
  maternal: "var(--brass-500)",
  married: "var(--assist-500)",
  other: "var(--ink-300)",
};

export const BRANCH_LABELS: Record<Branch, string> = {
  paternal: "Отцовская линия",
  maternal: "Материнская линия",
  married: "По браку",
  other: "Прочие",
};

export function branchOf(p: { notes: string | null }): Branch {
  const m = /ветвь:\s*(paternal|maternal|married)/.exec(p.notes ?? "");
  return (m?.[1] as Branch) ?? "other";
}

/** Роль для подписи — notes без служебной части про ветвь. */
export function roleOf(p: { notes: string | null }): string {
  return (p.notes ?? "").replace(/\s*·?\s*ветвь:\s*\w+/, "").trim();
}

export function lifespanOf(p: { birth_year: number | null; death_year: number | null }): string {
  if (p.birth_year == null) return "";
  return p.death_year != null ? `${p.birth_year}–${p.death_year}` : `${p.birth_year}`;
}

/** Поколение каждого человека: 0 — без родителей, дети на 1 ниже max(родители). */
export function generations(persons: { id: string }[], relationships: RelationshipDTO[]): Map<string, number> {
  const parentsOf = new Map<string, string[]>();
  for (const r of relationships) {
    if (r.type !== "parent" && r.type !== "adoption") continue;
    parentsOf.set(r.b_id, [...(parentsOf.get(r.b_id) ?? []), r.a_id]);
  }
  const gen = new Map<string, number>();
  const visit = (id: string, stack: Set<string>): number => {
    const cached = gen.get(id);
    if (cached !== undefined) return cached;
    if (stack.has(id)) return 0; // цикл в данных — не падаем
    stack.add(id);
    const parents = parentsOf.get(id) ?? [];
    const g = parents.length === 0 ? 0 : Math.max(...parents.map((p) => visit(p, stack))) + 1;
    gen.set(id, g);
    return g;
  };
  for (const p of persons) visit(p.id, new Set());
  // Супруг без родителей наследует поколение партнёра (иначе оказался бы в gen 0).
  for (const r of relationships) {
    if (r.type !== "spouse" && r.type !== "ex_spouse") continue;
    const ga = gen.get(r.a_id) ?? 0;
    const gb = gen.get(r.b_id) ?? 0;
    const target = Math.max(ga, gb);
    const lift = (id: string, g: number) => {
      if ((parentsOf.get(id) ?? []).length === 0 && g < target) gen.set(id, target);
    };
    lift(r.a_id, ga);
    lift(r.b_id, gb);
  }
  return gen;
}

const CLAIM_LABELS: Record<string, string> = {
  birth_date: "Рождение",
  birth_place: "Место рождения",
  death_date: "Смерть",
  death_place: "Место смерти",
  marriage: "Брак",
  occupation: "Занятие",
  name_change: "Смена фамилии",
  residence: "Проживание",
  custom: "Факт",
};

export function claimLabel(type: string): string {
  return CLAIM_LABELS[type] ?? "Факт";
}

/** Человеко-читаемое значение утверждения из value JSON. */
export function claimValueText(value: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof value.year === "number") parts.push(String(value.year));
  else if (typeof value.date === "string") parts.push(value.date);
  if (typeof value.place === "string" && value.place) parts.push(value.place);
  if (typeof value.spouse === "string") parts.push(value.spouse);
  if (typeof value.text === "string") parts.push(value.text);
  return parts.join(", ") || "—";
}
