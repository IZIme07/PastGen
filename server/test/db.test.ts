import { describe, it, expect, beforeEach } from "vitest";
import { openMemoryDb, type DB } from "../src/db/index.js";
import * as persons from "../src/db/repos/persons.js";
import * as relationships from "../src/db/repos/relationships.js";
import * as claims from "../src/db/repos/claims.js";
import * as sources from "../src/db/repos/sources.js";

let db: DB;
beforeEach(() => {
  db = openMemoryDb();
});

describe("persons repo", () => {
  it("creates and reads a person", () => {
    const p = persons.create(db, {
      surname: "Соколова",
      given_name: "Мария",
      patronymic: "Ивановна",
      display_name: "Мария Ивановна Соколова",
      maiden_name: "Громова",
      alt_names: ["Мария Громова"],
      sex: "female",
      deceased: true,
    });
    const got = persons.get(db, p.id)!;
    expect(got.display_name).toBe("Мария Ивановна Соколова");
    expect(got.alt_names).toEqual(["Мария Громова"]);
    expect(got.deceased).toBe(true);
  });

  it("updates a person", () => {
    const p = persons.create(db, { display_name: "Иван Соколов" });
    persons.update(db, p.id, { bio_md: "# Биография", notes: "прадед" });
    const got = persons.get(db, p.id)!;
    expect(got.bio_md).toBe("# Биография");
    expect(got.display_name).toBe("Иван Соколов");
  });

  it("delete cascades to relationships and tasks", () => {
    const a = persons.create(db, { display_name: "A" });
    const b = persons.create(db, { display_name: "B" });
    relationships.create(db, { a_id: a.id, b_id: b.id, type: "spouse" });
    persons.remove(db, a.id);
    expect(relationships.listForPerson(db, b.id)).toHaveLength(0);
  });
});

describe("claims repo", () => {
  it("stores a claim with alternative chain and conflict", () => {
    const p = persons.create(db, { display_name: "Мария" });
    const main = claims.create(db, {
      subject_type: "person",
      subject_id: p.id,
      claim_type: "birth_date",
      value: { year: 1928, place: "Тула" },
      confidence: 70,
    });
    const alt = claims.create(db, {
      subject_type: "person",
      subject_id: p.id,
      claim_type: "birth_date",
      value: { year: 1930 },
      confidence: 40,
      status: "alternative",
      parent_claim_id: main.id,
    });
    claims.update(db, main.id, { conflict: true, conflict_note: "1928 / 1930" });

    const list = claims.listForSubject(db, "person", p.id);
    expect(list).toHaveLength(2);
    const got = list.find((c) => c.id === main.id)!;
    expect(got.conflict).toBe(true);
    expect(got.value).toEqual({ year: 1928, place: "Тула" });
    expect(list.find((c) => c.id === alt.id)!.parent_claim_id).toBe(main.id);
  });

  it("links sources to claims", () => {
    const p = persons.create(db, { display_name: "Мария" });
    const c = claims.create(db, {
      subject_type: "person",
      subject_id: p.id,
      claim_type: "marriage",
      value: { year: 1949 },
      confidence: 95,
    });
    const s = sources.create(db, { type: "document", title: "Свид. о браке" });
    claims.linkSource(db, c.id, s.id, null);
    const got = claims.listForSubject(db, "person", p.id)[0];
    expect(got.sources).toHaveLength(1);
    expect(got.sources[0].title).toBe("Свид. о браке");
    expect(got.sources[0].type).toBe("document");
  });
});
