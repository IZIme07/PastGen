import { Router } from "express";
import { z } from "zod";
import type { DB } from "../db/index.js";
import * as relationships from "../db/repos/relationships.js";
import * as persons from "../db/repos/persons.js";
import * as history from "../db/repos/history.js";
import { runChecks } from "../consistency/engine.js";
import { HttpError } from "../middleware/errors.js";

const relBody = z.object({
  a_id: z.string(),
  b_id: z.string(),
  type: z.enum([
    "parent", "spouse", "ex_spouse", "sibling", "adoption",
    "guardian", "witness", "neighbor", "colleague", "other",
  ]),
  confidence: z.number().min(0).max(100).nullish(),
});

export function relationshipsRouter(db: DB): Router {
  const r = Router();

  r.get("/", (_req, res) => {
    res.json(relationships.list(db));
  });

  r.post("/", (req, res) => {
    const body = relBody.parse(req.body);
    if (!persons.get(db, body.a_id) || !persons.get(db, body.b_id))
      throw new HttpError(400, "bad_reference", "Человек не найден");
    const created = relationships.create(db, body);
    history.record(db, "create_relationship", "relationship", created.id, { type: body.type });
    runChecks(db, [body.a_id, body.b_id]);
    res.status(201).json(created);
  });

  r.delete("/:id", (req, res) => {
    relationships.remove(db, req.params.id);
    res.status(204).end();
  });

  return r;
}
