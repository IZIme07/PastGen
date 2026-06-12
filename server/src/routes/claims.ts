import { Router } from "express";
import { z } from "zod";
import type { DB } from "../db/index.js";
import * as claims from "../db/repos/claims.js";
import * as history from "../db/repos/history.js";
import { runChecks } from "../consistency/engine.js";
import { notFound } from "../middleware/errors.js";

const claimBody = z.object({
  subject_type: z.enum(["person", "event", "relationship"]).default("person"),
  subject_id: z.string(),
  claim_type: z.string(),
  value: z.record(z.unknown()),
  confidence: z.number().min(0).max(100),
  status: z.enum(["primary", "alternative", "rejected"]).optional(),
  parent_claim_id: z.string().nullish(),
  conflict: z.boolean().optional(),
  conflict_note: z.string().nullish(),
});

export function claimsRouter(db: DB): Router {
  const r = Router();

  r.post("/", (req, res) => {
    const body = claimBody.parse(req.body);
    const created = claims.create(db, body as never);
    history.record(db, "create_claim", "claim", created.id, {
      subject_id: body.subject_id,
      claim_type: body.claim_type,
    });
    if (body.subject_type === "person") runChecks(db, [body.subject_id]);
    res.status(201).json(created);
  });

  r.patch("/:id", (req, res) => {
    const body = claimBody
      .pick({ value: true, confidence: true, status: true, conflict: true, conflict_note: true })
      .partial()
      .parse(req.body);
    const updated = claims.update(db, req.params.id, body);
    if (!updated) throw notFound(404, "Утверждение не найдено");
    history.record(db, "update_claim", "claim", updated.id, { fields: Object.keys(body) });
    if (updated.subject_type === "person") runChecks(db, [updated.subject_id]);
    res.json(updated);
  });

  r.delete("/:id", (req, res) => {
    if (!claims.get(db, req.params.id)) throw notFound(404, "Утверждение не найдено");
    claims.remove(db, req.params.id);
    res.status(204).end();
  });

  r.post("/:id/sources", (req, res) => {
    const body = z.object({ source_id: z.string(), note: z.string().nullish() }).parse(req.body);
    if (!claims.get(db, req.params.id)) throw notFound(404, "Утверждение не найдено");
    claims.linkSource(db, req.params.id, body.source_id, body.note ?? null);
    res.status(201).json(claims.get(db, req.params.id));
  });

  return r;
}
