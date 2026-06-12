import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { SourceType } from "@pastgen/shared";
import { type DB, uid } from "../db/index.js";
import * as sourcesRepo from "../db/repos/sources.js";
import * as proposalsRepo from "../db/repos/proposals.js";
import * as historyRepo from "../db/repos/history.js";
import { getClient, isAiConfigured } from "../ai/client.js";
import { extractFromMaterial, type ExtractInput } from "../ai/extract.js";
import { HttpError } from "../middleware/errors.js";

const MAX_SIZE = 25 * 1024 * 1024;

const EXT_INFO: Record<string, { media: string; kind: "image" | "pdf" | "text" | "audio"; sourceType: SourceType }> = {
  ".jpg": { media: "image/jpeg", kind: "image", sourceType: "photo" },
  ".jpeg": { media: "image/jpeg", kind: "image", sourceType: "photo" },
  ".png": { media: "image/png", kind: "image", sourceType: "photo" },
  ".webp": { media: "image/webp", kind: "image", sourceType: "photo" },
  ".pdf": { media: "application/pdf", kind: "pdf", sourceType: "document" },
  ".txt": { media: "text/plain", kind: "text", sourceType: "document" },
  ".md": { media: "text/markdown", kind: "text", sourceType: "document" },
  ".mp3": { media: "audio/mpeg", kind: "audio", sourceType: "audio" },
  ".m4a": { media: "audio/mp4", kind: "audio", sourceType: "audio" },
  ".ogg": { media: "audio/ogg", kind: "audio", sourceType: "audio" },
};

const asyncH =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

export function importRouter(db: DB, dataDir: string | null): Router {
  const r = Router();

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        const dir = dataDir ? path.join(dataDir, "uploads") : path.join(process.cwd(), "uploads");
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => {
        cb(null, uid() + path.extname(file.originalname).toLowerCase());
      },
    }),
    limits: { fileSize: MAX_SIZE },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (EXT_INFO[ext]) cb(null, true);
      else cb(new HttpError(415, "unsupported_type", `Неподдерживаемый тип файла: ${ext || "без расширения"}`));
    },
  });

  // multipart: file=<файл>  |  JSON: {text, title?, source_type?}
  r.post(
    "/",
    upload.single("file"),
    asyncH(async (req, res) => {
      let material: ExtractInput | null = null;
      let source: import("@pastgen/shared").SourceDTO;

      if (req.file) {
        const ext = path.extname(req.file.filename).toLowerCase();
        const info = EXT_INFO[ext]!;
        const relPath = path.relative(dataDir ?? process.cwd(), req.file.path);
        source = sourcesRepo.create(db, {
          type: info.sourceType,
          title: req.file.originalname,
          file_path: relPath,
          metadata: { size: req.file.size, media_type: info.media },
        });
        if (info.kind === "image")
          material = { kind: "image", mediaType: info.media, base64: fs.readFileSync(req.file.path).toString("base64") };
        else if (info.kind === "pdf")
          material = { kind: "pdf", base64: fs.readFileSync(req.file.path).toString("base64") };
        else if (info.kind === "text")
          material = { kind: "text", text: fs.readFileSync(req.file.path, "utf-8") };
        // audio: сохраняем как источник; транскрипция — вручную (см. README, ограничение v1)
      } else {
        const body = z
          .object({
            text: z.string().min(1),
            title: z.string().optional(),
            source_type: z.enum(["document", "photo", "story", "letter", "archive", "comment", "link", "audio"]).optional(),
          })
          .parse(req.body);
        source = sourcesRepo.create(db, {
          type: body.source_type ?? "story",
          title: body.title ?? "Текстовая заметка",
          recognized_text: body.text,
        });
        material = { kind: "text", text: body.text };
      }

      historyRepo.record(db, "import_source", "source", source.id, { title: source.title });

      if (!material || !isAiConfigured()) {
        res.json({ source, proposals: [], ai: false });
        return;
      }

      try {
        const extraction = await extractFromMaterial(getClient(), db, material);
        if (!extraction) {
          res.json({ source, proposals: [], ai: true, ai_error: "Не удалось разобрать ответ ИИ" });
          return;
        }
        if (extraction.recognized_text && !source.recognized_text) {
          source = sourcesRepo.update(db, source.id, { recognized_text: extraction.recognized_text })!;
        }
        const created = extraction.proposals.map((p) =>
          proposalsRepo.create(db, {
            kind: p.kind as never,
            title: p.title,
            detail: p.detail ?? null,
            payload: p.payload,
            confidence: Math.round(p.confidence),
            conflict_note: p.conflict_note ?? null,
            source_ids: [source.id],
            created_from: `import:${source.id}`,
          }),
        );
        res.json({ source, proposals: created, ai: true });
      } catch (err) {
        // Файл и источник уже сохранены — ИИ-ошибка не теряет данные.
        res.json({
          source,
          proposals: [],
          ai: true,
          ai_error: err instanceof Error ? err.message : "Ошибка ИИ",
        });
      }
    }),
  );

  return r;
}
