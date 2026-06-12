import { Router } from "express";
import path from "node:path";
import { z } from "zod";
import type { DB } from "../db/index.js";
import * as sources from "../db/repos/sources.js";
import { notFound, HttpError } from "../middleware/errors.js";

const sourceBody = z.object({
  type: z.enum(["document", "photo", "story", "letter", "archive", "comment", "link", "audio"]),
  title: z.string().min(1),
  url: z.string().nullish(),
  recognized_text: z.string().nullish(),
  metadata: z.record(z.unknown()).optional(),
  quality: z.number().min(0).max(100).nullish(),
});

export function sourcesRouter(db: DB, dataDir: string | null): Router {
  const r = Router();

  r.get("/", (_req, res) => {
    res.json(sources.list(db));
  });

  r.post("/", (req, res) => {
    const body = sourceBody.parse(req.body);
    res.status(201).json(sources.create(db, body));
  });

  r.get("/:id", (req, res) => {
    const s = sources.get(db, req.params.id);
    if (!s) throw notFound(404, "Источник не найден");
    res.json(s);
  });

  r.patch("/:id", (req, res) => {
    const body = sourceBody.pick({ title: true, recognized_text: true, quality: true }).partial().parse(req.body);
    const updated = sources.update(db, req.params.id, body);
    if (!updated) throw notFound(404, "Источник не найден");
    res.json(updated);
  });

  r.get("/:id/file", (req, res) => {
    const s = sources.get(db, req.params.id);
    if (!s || !s.file_path) throw notFound(404, "Файл не найден");
    if (!dataDir) throw new HttpError(503, "no_storage", "Файловое хранилище не настроено");
    // file_path хранится относительно dataDir — защита от выхода из каталога.
    const abs = path.resolve(dataDir, s.file_path);
    if (!abs.startsWith(path.resolve(dataDir))) throw notFound(404, "Файл не найден");
    res.sendFile(abs);
  });

  return r;
}
