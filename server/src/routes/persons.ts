import { Router } from "express";
import { z } from "zod";
import type { DB } from "../db/index.js";
import * as persons from "../db/repos/persons.js";
import * as relationships from "../db/repos/relationships.js";
import * as claims from "../db/repos/claims.js";
import * as tasks from "../db/repos/tasks.js";
import * as history from "../db/repos/history.js";
import { profileConfidence } from "../domain/confidence.js";
import { runChecks } from "../consistency/engine.js";
import { notFound } from "../middleware/errors.js";

const personBody = z.object({
  display_name: z.string().min(1),
  surname: z.string().nullish(),
  given_name: z.string().nullish(),
  patronymic: z.string().nullish(),
  maiden_name: z.string().nullish(),
  alt_names: z.array(z.string()).optional(),
  sex: z.enum(["male", "female", "unknown"]).optional(),
  bio_md: z.string().nullish(),
  notes: z.string().nullish(),
  deceased: z.boolean().optional(),
});

export function personsRouter(db: DB): Router {
  const r = Router();

  r.get("/", (_req, res) => {
    res.json(persons.list(db));
  });

  r.post("/", (req, res) => {
    const body = personBody.parse(req.body);
    const created = persons.create(db, body);
    history.record(db, "create_person", "person", created.id, { display_name: created.display_name });
    res.status(201).json(created);
  });

  r.get("/:id", (req, res) => {
    const person = persons.get(db, req.params.id);
    if (!person) throw notFound(404, "Человек не найден");
    const personClaims = claims.listForSubject(db, "person", person.id);
    const rels = relationships.listForPerson(db, person.id).map((rel) => ({
      ...rel,
      other: persons.get(db, rel.a_id === person.id ? rel.b_id : rel.a_id)!,
    }));
    res.json({
      person,
      profile_confidence: profileConfidence(personClaims),
      claims: personClaims,
      relationships: rels.filter((x) => x.other),
      tasks: tasks.list(db, person.id).filter((t) => t.status === "open"),
    });
  });

  r.patch("/:id", (req, res) => {
    const body = personBody.partial().parse(req.body);
    const updated = persons.update(db, req.params.id, body);
    if (!updated) throw notFound(404, "Человек не найден");
    history.record(db, "update_person", "person", updated.id, { fields: Object.keys(body) });
    runChecks(db, [updated.id]);
    res.json(updated);
  });

  r.delete("/:id", (req, res) => {
    if (!persons.get(db, req.params.id)) throw notFound(404, "Человек не найден");
    persons.remove(db, req.params.id);
    history.record(db, "delete_person", "person", req.params.id, {});
    res.status(204).end();
  });

  return r;
}
