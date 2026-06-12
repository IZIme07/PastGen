// Небольшие роутеры: events, places, proposals, tasks, history, tree, health.
import { Router } from "express";
import { z } from "zod";
import type { DB } from "../db/index.js";
import * as events from "../db/repos/events.js";
import * as places from "../db/repos/places.js";
import * as proposals from "../db/repos/proposals.js";
import * as tasks from "../db/repos/tasks.js";
import * as history from "../db/repos/history.js";
import * as persons from "../db/repos/persons.js";
import * as relationships from "../db/repos/relationships.js";
import * as claims from "../db/repos/claims.js";
import { profileConfidence } from "../domain/confidence.js";
import { yearOf } from "../consistency/engine.js";
import { applyProposal } from "../proposals/apply.js";
import { notFound } from "../middleware/errors.js";

export function eventsRouter(db: DB): Router {
  const r = Router();
  r.get("/", (_req, res) => res.json(events.list(db)));
  r.post("/", (req, res) => {
    const body = z
      .object({
        type: z.string(),
        date_from: z.string().nullish(),
        date_to: z.string().nullish(),
        place_id: z.string().nullish(),
        description: z.string().nullish(),
        confidence: z.number().min(0).max(100).nullish(),
        participants: z.array(z.object({ person_id: z.string(), role: z.string().nullish() })).optional(),
      })
      .parse(req.body);
    res.status(201).json(events.create(db, body as never));
  });
  return r;
}

export function placesRouter(db: DB): Router {
  const r = Router();
  r.get("/", (_req, res) => res.json(places.list(db)));
  r.post("/", (req, res) => {
    const body = z
      .object({
        name: z.string().min(1),
        alt_names: z.array(z.string()).optional(),
        lat: z.number().nullish(),
        lng: z.number().nullish(),
        period: z.string().nullish(),
      })
      .parse(req.body);
    res.status(201).json(places.create(db, body));
  });
  return r;
}

export function proposalsRouter(db: DB): Router {
  const r = Router();
  r.get("/", (req, res) => {
    const status = req.query.status as never | undefined;
    res.json(proposals.list(db, status));
  });
  r.post("/", (req, res) => {
    const body = z
      .object({
        kind: z.enum([
          "add_person", "add_claim", "add_alternative", "update_claim",
          "link_source", "add_relationship", "add_event", "merge_persons",
        ]),
        title: z.string().min(1),
        detail: z.string().nullish(),
        payload: z.record(z.unknown()),
        confidence: z.number().min(0).max(100),
        conflict_note: z.string().nullish(),
        source_ids: z.array(z.string()).optional(),
        created_from: z.string().nullish(),
      })
      .parse(req.body);
    res.status(201).json(proposals.create(db, body));
  });
  r.post("/:id/accept", (req, res) => {
    res.json(applyProposal(db, req.params.id));
  });
  r.post("/:id/defer", (req, res) => {
    const p = proposals.get(db, req.params.id);
    if (!p) throw notFound(404, "Предложение не найдено");
    res.json(proposals.setStatus(db, req.params.id, "deferred"));
  });
  r.post("/:id/reject", (req, res) => {
    const p = proposals.get(db, req.params.id);
    if (!p) throw notFound(404, "Предложение не найдено");
    res.json(proposals.setStatus(db, req.params.id, "rejected"));
  });
  return r;
}

export function tasksRouter(db: DB): Router {
  const r = Router();
  r.get("/", (req, res) => res.json(tasks.list(db, req.query.person_id as string | undefined)));
  r.post("/", (req, res) => {
    const body = z
      .object({ title: z.string().min(1), person_id: z.string().nullish(), origin: z.string().optional() })
      .parse(req.body);
    res.status(201).json(tasks.create(db, body));
  });
  r.patch("/:id", (req, res) => {
    const body = z.object({ status: z.enum(["open", "done", "dismissed"]) }).parse(req.body);
    const updated = tasks.setStatus(db, req.params.id, body.status);
    if (!updated) throw notFound(404, "Задача не найдена");
    res.json(updated);
  });
  return r;
}

export function historyRouter(db: DB): Router {
  const r = Router();
  r.get("/", (_req, res) => res.json(history.list(db)));
  return r;
}

export function treeRouter(db: DB): Router {
  const r = Router();
  r.get("/", (_req, res) => {
    const all = persons.list(db).map((p) => {
      const personClaims = claims.listForSubject(db, "person", p.id);
      const birth = personClaims.find((c) => c.claim_type === "birth_date" && c.status === "primary");
      const death = personClaims.find((c) => c.claim_type === "death_date" && c.status === "primary");
      const birthAlt = birth
        ? personClaims.find((c) => c.claim_type === "birth_date" && c.status === "alternative" && c.parent_claim_id === birth.id)
        : undefined;
      return {
        ...p,
        profile_confidence: profileConfidence(personClaims),
        birth_year: birth ? yearOf(birth.value) : null,
        death_year: death ? yearOf(death.value) : null,
        birth_year_alt: birthAlt ? yearOf(birthAlt.value) : null,
        birth_year_disputed: !!birth?.conflict,
        has_conflict: personClaims.some((c) => c.conflict),
      };
    });
    res.json({ persons: all, relationships: relationships.list(db) });
  });
  return r;
}

export function healthRouter(aiConfigured: () => boolean): Router {
  const r = Router();
  r.get("/", (_req, res) => res.json({ ok: true, ai: aiConfigured() }));
  return r;
}
