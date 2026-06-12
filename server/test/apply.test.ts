import { describe, it, expect, beforeEach } from "vitest";
import { openMemoryDb, type DB } from "../src/db/index.js";
import * as persons from "../src/db/repos/persons.js";
import * as claims from "../src/db/repos/claims.js";
import * as sources from "../src/db/repos/sources.js";
import * as proposals from "../src/db/repos/proposals.js";
import * as relationships from "../src/db/repos/relationships.js";
import * as history from "../src/db/repos/history.js";
import { applyProposal } from "../src/proposals/apply.js";

let db: DB;
beforeEach(() => {
  db = openMemoryDb();
});

function pending(kind: string, payload: Record<string, unknown>, title = "t") {
  return proposals.create(db, { kind: kind as never, title, payload, confidence: 80 });
}

describe("applyProposal", () => {
  it("add_person creates a person and optional relationship", () => {
    const anchor = persons.create(db, { display_name: "Мария" });
    const p = pending("add_person", {
      person: { display_name: "Полина Громова", surname: "Громова", given_name: "Полина" },
      relationship: { to_id: anchor.id, type: "sibling" },
    });
    applyProposal(db, p.id);
    const all = persons.list(db);
    expect(all.map((x) => x.display_name)).toContain("Полина Громова");
    expect(relationships.listForPerson(db, anchor.id)).toHaveLength(1);
    expect(proposals.get(db, p.id)!.status).toBe("accepted");
    expect(history.list(db)).toHaveLength(1);
  });

  it("add_claim creates a primary claim", () => {
    const person = persons.create(db, { display_name: "Мария" });
    const p = pending("add_claim", {
      subject_id: person.id,
      claim_type: "birth_date",
      value: { year: 1928 },
      confidence: 88,
    });
    applyProposal(db, p.id);
    const list = claims.listForSubject(db, "person", person.id);
    expect(list).toHaveLength(1);
    expect(list[0].status).toBe("primary");
  });

  it("add_claim with conflicting existing primary becomes alternative + conflict", () => {
    const person = persons.create(db, { display_name: "Мария" });
    const existing = claims.create(db, {
      subject_type: "person",
      subject_id: person.id,
      claim_type: "birth_date",
      value: { year: 1930 },
      confidence: 60,
    });
    const p = pending("add_claim", {
      subject_id: person.id,
      claim_type: "birth_date",
      value: { year: 1928 },
      confidence: 88,
    });
    applyProposal(db, p.id);
    const list = claims.listForSubject(db, "person", person.id);
    expect(list).toHaveLength(2);
    const added = list.find((c) => c.id !== existing.id)!;
    expect(added.status).toBe("alternative");
    expect(added.parent_claim_id).toBe(existing.id);
    expect(claims.get(db, existing.id)!.conflict).toBe(true);
  });

  it("link_source attaches a source to a claim", () => {
    const person = persons.create(db, { display_name: "Мария" });
    const c = claims.create(db, {
      subject_type: "person",
      subject_id: person.id,
      claim_type: "marriage",
      value: { year: 1949 },
      confidence: 95,
    });
    const s = sources.create(db, { type: "document", title: "Свид. о браке" });
    const p = pending("link_source", { claim_id: c.id, source_id: s.id });
    applyProposal(db, p.id);
    expect(claims.get(db, c.id)!.sources).toHaveLength(1);
  });

  it("merge_persons moves claims and relationships, drops duplicate", () => {
    const keep = persons.create(db, { display_name: "Мария Соколова" });
    const drop = persons.create(db, { display_name: "Мария Громова" });
    const other = persons.create(db, { display_name: "Иван" });
    claims.create(db, {
      subject_type: "person",
      subject_id: drop.id,
      claim_type: "birth_date",
      value: { year: 1928 },
      confidence: 70,
    });
    relationships.create(db, { a_id: other.id, b_id: drop.id, type: "spouse" });
    const p = pending("merge_persons", { keep_id: keep.id, drop_id: drop.id });
    applyProposal(db, p.id);
    expect(persons.get(db, drop.id)).toBeNull();
    expect(claims.listForSubject(db, "person", keep.id)).toHaveLength(1);
    expect(relationships.listForPerson(db, keep.id)).toHaveLength(1);
    expect(persons.get(db, keep.id)!.alt_names).toContain("Мария Громова");
  });

  it("rejects non-pending proposals (idempotency)", () => {
    const person = persons.create(db, { display_name: "Мария" });
    const p = pending("add_claim", {
      subject_id: person.id,
      claim_type: "birth_date",
      value: { year: 1928 },
      confidence: 88,
    });
    applyProposal(db, p.id);
    expect(() => applyProposal(db, p.id)).toThrow();
    expect(claims.listForSubject(db, "person", person.id)).toHaveLength(1);
  });

  it("rolls back on invalid payload", () => {
    const p = pending("add_claim", { subject_id: "missing", claim_type: "birth_date" }); // нет value/confidence
    expect(() => applyProposal(db, p.id)).toThrow();
    expect(proposals.get(db, p.id)!.status).toBe("pending");
    expect(history.list(db)).toHaveLength(0);
  });
});
