import type { DB } from "../db/index.js";
import * as personsRepo from "../db/repos/persons.js";
import * as claimsRepo from "../db/repos/claims.js";
import * as relationshipsRepo from "../db/repos/relationships.js";
import * as tasksRepo from "../db/repos/tasks.js";
import { profileConfidence } from "../domain/confidence.js";
import { modelId, textOf, type AiClient } from "./client.js";
import { ASSISTANT_SYSTEM, ASSISTANT_TASKS } from "./prompts.js";
import { personsContext } from "./extract.js";

function dossierContext(db: DB, personId: string): string {
  const person = personsRepo.get(db, personId);
  if (!person) return "Человек не выбран.";
  const claims = claimsRepo.listForSubject(db, "person", personId);
  const rels = relationshipsRepo.listForPerson(db, personId).map((r) => ({
    type: r.type,
    other: personsRepo.get(db, r.a_id === personId ? r.b_id : r.a_id)?.display_name,
    direction: r.a_id === personId ? "out" : "in",
  }));
  const tasks = tasksRepo.list(db, personId).filter((t) => t.status === "open");
  return JSON.stringify({
    person: {
      display_name: person.display_name,
      alt_names: person.alt_names,
      sex: person.sex,
      deceased: person.deceased,
      bio_md: person.bio_md,
      profile_confidence: profileConfidence(claims),
    },
    claims: claims.map((c) => ({
      type: c.claim_type,
      value: c.value,
      confidence: c.confidence,
      status: c.status,
      conflict: c.conflict,
      conflict_note: c.conflict_note,
      sources: c.sources.map((s) => `${s.type}: ${s.title}`),
    })),
    relationships: rels,
    open_tasks: tasks.map((t) => t.title),
  });
}

export async function runAssistantTask(
  client: AiClient,
  db: DB,
  task: string,
  personId: string | null,
): Promise<string> {
  const instruction = ASSISTANT_TASKS[task];
  if (!instruction) throw new Error(`Неизвестная задача: ${task}`);
  const context = personId
    ? `Досье выбранного человека (JSON):\n${dossierContext(db, personId)}`
    : `Всё дерево (JSON, кратко):\n${personsContext(db)}`;
  const response = await client.messages.create({
    model: modelId(),
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    system: ASSISTANT_SYSTEM,
    messages: [{ role: "user", content: `${context}\n\nЗадача: ${instruction}` }],
  });
  return textOf(response);
}
