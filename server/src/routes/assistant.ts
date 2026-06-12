import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import type { DB } from "../db/index.js";
import { getClient, isAiConfigured } from "../ai/client.js";
import { runAssistantTask } from "../ai/assistant.js";
import { HttpError } from "../middleware/errors.js";

const body = z.object({
  task: z.enum([
    "check_branch", "weak_spots", "next_steps", "archive_letter",
    "interview_questions", "explain_conflict", "summarize_branch",
  ]),
  person_id: z.string().nullish(),
});

export function assistantRouter(db: DB): Router {
  const r = Router();
  r.post("/", (req: Request, res: Response, next: NextFunction) => {
    (async () => {
      const parsed = body.parse(req.body);
      if (!isAiConfigured())
        throw new HttpError(503, "ai_not_configured", "ИИ не настроен: задайте ANTHROPIC_API_KEY");
      const text = await runAssistantTask(getClient(), db, parsed.task, parsed.person_id ?? null);
      res.json({ text, proposals: [] });
    })().catch(next);
  });
  return r;
}
