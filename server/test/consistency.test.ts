import { describe, it, expect, beforeEach } from "vitest";
import { openMemoryDb, type DB } from "../src/db/index.js";
import * as persons from "../src/db/repos/persons.js";
import * as relationships from "../src/db/repos/relationships.js";
import * as claims from "../src/db/repos/claims.js";
import * as events from "../src/db/repos/events.js";
import * as tasks from "../src/db/repos/tasks.js";
import { runChecks } from "../src/consistency/engine.js";

let db: DB;
beforeEach(() => {
  db = openMemoryDb();
});

function person(name: string) {
  return persons.create(db, { display_name: name });
}
function setYears(personId: string, birth?: number, death?: number) {
  if (birth !== undefined)
    claims.create(db, {
      subject_type: "person",
      subject_id: personId,
      claim_type: "birth_date",
      value: { year: birth },
      confidence: 90,
    });
  if (death !== undefined)
    claims.create(db, {
      subject_type: "person",
      subject_id: personId,
      claim_type: "death_date",
      value: { year: death },
      confidence: 90,
    });
}

describe("consistency rules (spec §9)", () => {
  it("born_after_parent_death: child born after father's death", () => {
    const father = person("Отец");
    const child = person("Ребёнок");
    setYears(father.id, 1900, 1950);
    setYears(child.id, 1955);
    relationships.create(db, { a_id: father.id, b_id: child.id, type: "parent" });

    const violations = runChecks(db, [child.id]);
    expect(violations.some((v) => v.rule === "born_after_parent_death")).toBe(true);
  });

  it("allows child born within a year after father's death", () => {
    const father = person("Отец");
    const child = person("Ребёнок");
    setYears(father.id, 1900, 1950);
    setYears(child.id, 1950);
    relationships.create(db, { a_id: father.id, b_id: child.id, type: "parent" });
    expect(runChecks(db, [child.id]).filter((v) => v.rule === "born_after_parent_death")).toHaveLength(0);
  });

  it("parent_too_young: mother aged 10 at child's birth", () => {
    const mother = person("Мать");
    const child = person("Ребёнок");
    setYears(mother.id, 1940);
    setYears(child.id, 1950);
    relationships.create(db, { a_id: mother.id, b_id: child.id, type: "parent" });
    expect(runChecks(db, [child.id]).some((v) => v.rule === "parent_too_young")).toBe(true);
  });

  it("death_before_birth", () => {
    const p = person("Человек");
    setYears(p.id, 1950, 1940);
    expect(runChecks(db, [p.id]).some((v) => v.rule === "death_before_birth")).toBe(true);
  });

  it("event_before_birth", () => {
    const p = person("Человек");
    setYears(p.id, 1950);
    events.create(db, {
      type: "marriage",
      date_from: "1940",
      participants: [{ person_id: p.id }],
    });
    expect(runChecks(db, [p.id]).some((v) => v.rule === "event_before_birth")).toBe(true);
  });

  it("possible_duplicate: same name and birth year ±1", () => {
    const a = persons.create(db, { display_name: "Мария Соколова", surname: "Соколова", given_name: "Мария" });
    const b = persons.create(db, { display_name: "Мария Соколова", surname: "Соколова", given_name: "Мария" });
    setYears(a.id, 1928);
    setYears(b.id, 1929);
    expect(runChecks(db, [a.id]).some((v) => v.rule === "possible_duplicate")).toBe(true);
  });

  it("violations become research tasks without duplicates", () => {
    const p = person("Человек");
    setYears(p.id, 1950, 1940);
    runChecks(db, [p.id]);
    runChecks(db, [p.id]); // повторный запуск не плодит задачи
    const open = tasks.list(db, p.id).filter((t) => t.status === "open");
    expect(open).toHaveLength(1);
    expect(open[0].origin).toBe("death_before_birth");
  });
});
