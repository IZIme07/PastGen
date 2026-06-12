import type { DB } from "../db/index.js";
import * as claimsRepo from "../db/repos/claims.js";
import * as relationshipsRepo from "../db/repos/relationships.js";
import * as personsRepo from "../db/repos/persons.js";
import * as eventsRepo from "../db/repos/events.js";
import * as tasksRepo from "../db/repos/tasks.js";
import { rules, type RuleContext, type Violation } from "./rules.js";

export type { Violation } from "./rules.js";

/** Год из значения утверждения: {year} или {date:"1928-05-01"} / "1928". */
export function yearOf(value: Record<string, unknown>): number | null {
  if (typeof value.year === "number") return value.year;
  const raw = typeof value.date === "string" ? value.date : null;
  if (raw) {
    const m = /^(\d{4})/.exec(raw);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

function buildContext(db: DB): RuleContext {
  return {
    db,
    birthYear(personId: string) {
      const c = claimsRepo
        .listForSubject(db, "person", personId)
        .find((x) => x.claim_type === "birth_date" && x.status === "primary");
      return c ? yearOf(c.value) : null;
    },
    deathYear(personId: string) {
      const c = claimsRepo
        .listForSubject(db, "person", personId)
        .find((x) => x.claim_type === "death_date" && x.status === "primary");
      return c ? yearOf(c.value) : null;
    },
    parentsOf(personId: string) {
      return relationshipsRepo
        .listForPerson(db, personId)
        .filter((r) => (r.type === "parent" || r.type === "adoption") && r.b_id === personId)
        .map((r) => r.a_id);
    },
    marriagesOf(personId: string) {
      return claimsRepo
        .listForSubject(db, "person", personId)
        .filter((c) => c.claim_type === "marriage" && c.status === "primary");
    },
    eventsOf(personId: string) {
      return eventsRepo.listForPerson(db, personId);
    },
    person(personId: string) {
      return personsRepo.get(db, personId);
    },
    allPersons() {
      return personsRepo.list(db);
    },
    yearOf,
  };
}

/**
 * Прогоняет все правила для указанных людей; нарушения становятся
 * исследовательскими задачами (без дублей). Возвращает найденные нарушения.
 */
export function runChecks(db: DB, personIds: string[]): Violation[] {
  const ctx = buildContext(db);
  const violations: Violation[] = [];
  for (const personId of personIds) {
    for (const rule of rules) {
      violations.push(...rule.check(ctx, personId));
    }
  }
  for (const v of violations) {
    tasksRepo.upsertByOrigin(db, {
      title: v.message,
      origin: v.rule,
      person_id: v.personIds[0] ?? null,
    });
  }
  return violations;
}
