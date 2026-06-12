import { z } from "zod";
import type { DB } from "../db/index.js";
import * as personsRepo from "../db/repos/persons.js";
import * as claimsRepo from "../db/repos/claims.js";
import { yearOf } from "../consistency/engine.js";
import { modelId, textOf, type AiClient } from "./client.js";
import { EXTRACT_SYSTEM } from "./prompts.js";

const extractionSchema = z.object({
  recognized_text: z.string().default(""),
  proposals: z
    .array(
      z.object({
        kind: z.enum(["add_person", "add_claim", "add_alternative", "add_relationship", "add_event", "merge_persons"]),
        title: z.string().min(1),
        detail: z.string().nullish(),
        confidence: z.number().min(0).max(100),
        conflict_note: z.string().nullish(),
        payload: z.record(z.unknown()),
      }),
    )
    .default([]),
});

export type Extraction = z.infer<typeof extractionSchema>;

/** Парсит JSON-ответ модели; терпим к обёрткам ```json … ```. */
export function parseExtraction(text: string): Extraction | null {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return extractionSchema.parse(parsed);
  } catch {
    return null;
  }
}

/** Контекст существующих людей — чтобы модель сопоставляла, а не плодила дубли. */
export function personsContext(db: DB): string {
  const all = personsRepo.list(db).map((p) => {
    const cl = claimsRepo.listForSubject(db, "person", p.id);
    const birth = cl.find((c) => c.claim_type === "birth_date" && c.status === "primary");
    const death = cl.find((c) => c.claim_type === "death_date" && c.status === "primary");
    return {
      id: p.id,
      name: p.display_name,
      alt: p.alt_names,
      born: birth ? yearOf(birth.value) : null,
      died: death ? yearOf(death.value) : null,
    };
  });
  return JSON.stringify(all);
}

export type ExtractInput =
  | { kind: "text"; text: string }
  | { kind: "image"; mediaType: string; base64: string }
  | { kind: "pdf"; base64: string };

export async function extractFromMaterial(
  client: AiClient,
  db: DB,
  input: ExtractInput,
): Promise<Extraction | null> {
  const contextText = `Существующие люди в дереве (JSON): ${personsContext(db)}`;
  const content: unknown[] = [];
  if (input.kind === "image") {
    content.push({
      type: "image",
      source: { type: "base64", media_type: input.mediaType, data: input.base64 },
    });
  } else if (input.kind === "pdf") {
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: input.base64 },
    });
  }
  content.push({
    type: "text",
    text: `${contextText}\n\n${input.kind === "text" ? `Материал (текст):\n${input.text}` : "Извлеки факты из приложенного материала."}`,
  });

  const response = await client.messages.create({
    model: modelId(),
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    system: EXTRACT_SYSTEM,
    messages: [{ role: "user", content }],
  });
  if (response.stop_reason === "refusal") return null;
  return parseExtraction(textOf(response));
}
