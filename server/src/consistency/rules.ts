import type { ClaimDTO, EventDTO, PersonDTO } from "@pastgen/shared";
import type { DB } from "../db/index.js";

export interface Violation {
  rule: string;
  personIds: string[];
  message: string;
}

export interface RuleContext {
  db: DB;
  birthYear(personId: string): number | null;
  deathYear(personId: string): number | null;
  parentsOf(personId: string): string[];
  marriagesOf(personId: string): ClaimDTO[];
  eventsOf(personId: string): EventDTO[];
  person(personId: string): PersonDTO | null;
  allPersons(): PersonDTO[];
  yearOf(value: Record<string, unknown>): number | null;
}

export interface Rule {
  id: string;
  check(ctx: RuleContext, personId: string): Violation[];
}

const name = (ctx: RuleContext, id: string) => ctx.person(id)?.display_name ?? "—";

export const rules: Rule[] = [
  {
    id: "death_before_birth",
    check(ctx, personId) {
      const b = ctx.birthYear(personId);
      const d = ctx.deathYear(personId);
      if (b !== null && d !== null && d < b) {
        return [
          {
            rule: "death_before_birth",
            personIds: [personId],
            message: `Проверить даты жизни: смерть (${d}) раньше рождения (${b}) — ${name(ctx, personId)}`,
          },
        ];
      }
      return [];
    },
  },
  {
    id: "born_after_parent_death",
    check(ctx, personId) {
      const b = ctx.birthYear(personId);
      if (b === null) return [];
      const out: Violation[] = [];
      for (const parentId of ctx.parentsOf(personId)) {
        const pd = ctx.deathYear(parentId);
        // +1 год: ребёнок мог родиться после смерти отца в пределах беременности.
        if (pd !== null && b > pd + 1) {
          out.push({
            rule: "born_after_parent_death",
            personIds: [personId, parentId],
            message: `Проверить связь: ${name(ctx, personId)} родился(ась) в ${b}, после смерти родителя ${name(ctx, parentId)} (${pd})`,
          });
        }
      }
      return out;
    },
  },
  {
    id: "parent_too_young",
    check(ctx, personId) {
      const b = ctx.birthYear(personId);
      if (b === null) return [];
      const out: Violation[] = [];
      for (const parentId of ctx.parentsOf(personId)) {
        const pb = ctx.birthYear(parentId);
        if (pb !== null && b - pb < 13) {
          out.push({
            rule: "parent_too_young",
            personIds: [personId, parentId],
            message: `Проверить даты: родителю ${name(ctx, parentId)} было ${b - pb} лет при рождении ${name(ctx, personId)} (${b})`,
          });
        }
      }
      return out;
    },
  },
  {
    id: "parent_too_old",
    check(ctx, personId) {
      const b = ctx.birthYear(personId);
      if (b === null) return [];
      const out: Violation[] = [];
      for (const parentId of ctx.parentsOf(personId)) {
        const parent = ctx.person(parentId);
        const pb = ctx.birthYear(parentId);
        if (parent?.sex === "female" && pb !== null && b - pb > 55) {
          out.push({
            rule: "parent_too_old",
            personIds: [personId, parentId],
            message: `Проверить даты: матери ${name(ctx, parentId)} было ${b - pb} лет при рождении ${name(ctx, personId)} (${b})`,
          });
        }
      }
      return out;
    },
  },
  {
    id: "overlapping_marriages",
    check(ctx, personId) {
      const marriages = ctx.marriagesOf(personId);
      if (marriages.length < 2) return [];
      const spans = marriages
        .map((m) => ({
          from: ctx.yearOf(m.value),
          to: typeof m.value.end_year === "number" ? (m.value.end_year as number) : null,
        }))
        .filter((s) => s.from !== null)
        .sort((a, b) => a.from! - b.from!);
      for (let i = 1; i < spans.length; i++) {
        const prev = spans[i - 1];
        if (prev.to === null || spans[i].from! < prev.to) {
          return [
            {
              rule: "overlapping_marriages",
              personIds: [personId],
              message: `Проверить браки ${name(ctx, personId)}: периоды пересекаются (${prev.from}–${prev.to ?? "…"} и ${spans[i].from})`,
            },
          ];
        }
      }
      return [];
    },
  },
  {
    id: "event_before_birth",
    check(ctx, personId) {
      const b = ctx.birthYear(personId);
      if (b === null) return [];
      const out: Violation[] = [];
      for (const e of ctx.eventsOf(personId)) {
        if (e.type === "birth") continue;
        const ey = e.date_from ? parseInt(e.date_from.slice(0, 4), 10) : NaN;
        if (!Number.isNaN(ey) && ey < b) {
          out.push({
            rule: "event_before_birth",
            personIds: [personId],
            message: `Проверить событие «${e.description ?? e.type}» (${ey}): раньше рождения ${name(ctx, personId)} (${b})`,
          });
        }
      }
      return out;
    },
  },
  {
    id: "possible_duplicate",
    check(ctx, personId) {
      const me = ctx.person(personId);
      if (!me?.surname || !me.given_name) return [];
      const myBirth = ctx.birthYear(personId);
      const out: Violation[] = [];
      for (const other of ctx.allPersons()) {
        if (other.id === personId) continue;
        if (other.surname !== me.surname || other.given_name !== me.given_name) continue;
        const ob = ctx.birthYear(other.id);
        if (myBirth !== null && ob !== null && Math.abs(myBirth - ob) <= 1) {
          out.push({
            rule: "possible_duplicate",
            personIds: [personId, other.id],
            message: `Возможный дубль: «${me.display_name}» и «${other.display_name}» — совпадают имя и год рождения (${myBirth}/${ob})`,
          });
        }
      }
      return out;
    },
  },
];
