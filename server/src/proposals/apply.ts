import { z } from "zod";
import type { ProposalDTO } from "@pastgen/shared";
import type { DB } from "../db/index.js";
import * as personsRepo from "../db/repos/persons.js";
import * as relationshipsRepo from "../db/repos/relationships.js";
import * as claimsRepo from "../db/repos/claims.js";
import * as eventsRepo from "../db/repos/events.js";
import * as placesRepo from "../db/repos/places.js";
import * as proposalsRepo from "../db/repos/proposals.js";
import * as historyRepo from "../db/repos/history.js";
import { runChecks } from "../consistency/engine.js";

const relationshipType = z.enum([
  "parent", "spouse", "ex_spouse", "sibling", "adoption",
  "guardian", "witness", "neighbor", "colleague", "other",
]);

const payloadSchemas = {
  add_person: z.object({
    person: z.object({
      display_name: z.string().min(1),
      surname: z.string().nullish(),
      given_name: z.string().nullish(),
      patronymic: z.string().nullish(),
      maiden_name: z.string().nullish(),
      sex: z.enum(["male", "female", "unknown"]).optional(),
      notes: z.string().nullish(),
      deceased: z.boolean().optional(),
    }),
    relationship: z
      .object({ to_id: z.string(), type: relationshipType })
      .optional(),
  }),
  add_claim: z.object({
    subject_id: z.string(),
    claim_type: z.string(),
    value: z.record(z.unknown()),
    confidence: z.number().min(0).max(100),
  }),
  add_alternative: z.object({
    claim_id: z.string(),
    value: z.record(z.unknown()),
    confidence: z.number().min(0).max(100),
  }),
  update_claim: z.object({
    claim_id: z.string(),
    value: z.record(z.unknown()).optional(),
    confidence: z.number().min(0).max(100).optional(),
  }),
  link_source: z.object({
    claim_id: z.string(),
    source_id: z.string(),
    note: z.string().nullish(),
  }),
  add_relationship: z.object({
    a_id: z.string(),
    b_id: z.string(),
    type: relationshipType,
  }),
  add_event: z.object({
    event: z.object({
      type: z.string(),
      date_from: z.string().nullish(),
      date_to: z.string().nullish(),
      description: z.string().nullish(),
      confidence: z.number().min(0).max(100).nullish(),
      participants: z.array(z.object({ person_id: z.string(), role: z.string().nullish() })).optional(),
      place: z
        .object({ name: z.string(), lat: z.number().nullish(), lng: z.number().nullish() })
        .nullish(),
    }),
  }),
  merge_persons: z.object({ keep_id: z.string(), drop_id: z.string() }),
} as const;

export class ApplyError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Применяет принятое предложение: одна транзакция — мутация, статус,
 * запись в историю, перепроверка противоречий для затронутых людей.
 */
export function applyProposal(db: DB, proposalId: string): ProposalDTO {
  const proposal = proposalsRepo.get(db, proposalId);
  if (!proposal) throw new ApplyError("not_found", "Предложение не найдено");
  if (proposal.status !== "pending")
    throw new ApplyError("already_decided", `Предложение уже обработано (${proposal.status})`);

  const result = db.transaction(() => {
    const affected = applyMutation(db, proposal);
    proposalsRepo.setStatus(db, proposal.id, "accepted");
    historyRepo.record(db, `apply_${proposal.kind}`, "proposal", proposal.id, {
      title: proposal.title,
      affected,
    }, proposal.id);
    runChecks(db, affected);
    return proposalsRepo.get(db, proposal.id)!;
  })();
  return result;
}

/** Возвращает id затронутых людей. */
function applyMutation(db: DB, proposal: ProposalDTO): string[] {
  switch (proposal.kind) {
    case "add_person": {
      const p = payloadSchemas.add_person.parse(proposal.payload);
      const created = personsRepo.create(db, {
        display_name: p.person.display_name,
        surname: p.person.surname ?? null,
        given_name: p.person.given_name ?? null,
        patronymic: p.person.patronymic ?? null,
        maiden_name: p.person.maiden_name ?? null,
        sex: p.person.sex,
        notes: p.person.notes ?? null,
        deceased: p.person.deceased,
      });
      if (p.relationship) {
        if (!personsRepo.get(db, p.relationship.to_id))
          throw new ApplyError("bad_payload", "Человек для связи не найден");
        relationshipsRepo.create(db, {
          a_id: created.id,
          b_id: p.relationship.to_id,
          type: p.relationship.type,
        });
        return [created.id, p.relationship.to_id];
      }
      return [created.id];
    }
    case "add_claim": {
      const p = payloadSchemas.add_claim.parse(proposal.payload);
      if (!personsRepo.get(db, p.subject_id))
        throw new ApplyError("bad_payload", "Субъект утверждения не найден");
      const existing = claimsRepo
        .listForSubject(db, "person", p.subject_id)
        .find((c) => c.claim_type === p.claim_type && c.status === "primary");
      if (existing && JSON.stringify(existing.value) !== JSON.stringify(p.value)) {
        // Конфликт: новое значение сохраняем как альтернативу, не теряя версий.
        const alt = claimsRepo.create(db, {
          subject_type: "person",
          subject_id: p.subject_id,
          claim_type: p.claim_type as never,
          value: p.value,
          confidence: p.confidence,
          status: "alternative",
          parent_claim_id: existing.id,
        });
        claimsRepo.update(db, existing.id, {
          conflict: true,
          conflict_note: `Альтернативная версия от ${proposal.created_from ?? "импорта"}`,
        });
        linkProposalSources(db, proposal, alt.id);
      } else if (!existing) {
        const created = claimsRepo.create(db, {
          subject_type: "person",
          subject_id: p.subject_id,
          claim_type: p.claim_type as never,
          value: p.value,
          confidence: p.confidence,
        });
        linkProposalSources(db, proposal, created.id);
      }
      return [p.subject_id];
    }
    case "add_alternative": {
      const p = payloadSchemas.add_alternative.parse(proposal.payload);
      const parent = claimsRepo.get(db, p.claim_id);
      if (!parent) throw new ApplyError("bad_payload", "Утверждение не найдено");
      const alt = claimsRepo.create(db, {
        subject_type: parent.subject_type,
        subject_id: parent.subject_id,
        claim_type: parent.claim_type,
        value: p.value,
        confidence: p.confidence,
        status: "alternative",
        parent_claim_id: parent.id,
      });
      claimsRepo.update(db, parent.id, { conflict: true });
      linkProposalSources(db, proposal, alt.id);
      return parent.subject_type === "person" ? [parent.subject_id] : [];
    }
    case "update_claim": {
      const p = payloadSchemas.update_claim.parse(proposal.payload);
      const claim = claimsRepo.get(db, p.claim_id);
      if (!claim) throw new ApplyError("bad_payload", "Утверждение не найдено");
      claimsRepo.update(db, p.claim_id, { value: p.value, confidence: p.confidence });
      linkProposalSources(db, proposal, p.claim_id);
      return claim.subject_type === "person" ? [claim.subject_id] : [];
    }
    case "link_source": {
      const p = payloadSchemas.link_source.parse(proposal.payload);
      const claim = claimsRepo.get(db, p.claim_id);
      if (!claim) throw new ApplyError("bad_payload", "Утверждение не найдено");
      claimsRepo.linkSource(db, p.claim_id, p.source_id, p.note ?? null);
      return claim.subject_type === "person" ? [claim.subject_id] : [];
    }
    case "add_relationship": {
      const p = payloadSchemas.add_relationship.parse(proposal.payload);
      if (!personsRepo.get(db, p.a_id) || !personsRepo.get(db, p.b_id))
        throw new ApplyError("bad_payload", "Человек не найден");
      relationshipsRepo.create(db, p);
      return [p.a_id, p.b_id];
    }
    case "add_event": {
      const p = payloadSchemas.add_event.parse(proposal.payload);
      let placeId: string | null = null;
      if (p.event.place) {
        const existing = placesRepo.findByName(db, p.event.place.name);
        placeId = existing
          ? existing.id
          : placesRepo.create(db, {
              name: p.event.place.name,
              lat: p.event.place.lat ?? null,
              lng: p.event.place.lng ?? null,
            }).id;
      }
      eventsRepo.create(db, {
        type: p.event.type as never,
        date_from: p.event.date_from ?? null,
        date_to: p.event.date_to ?? null,
        description: p.event.description ?? null,
        confidence: p.event.confidence ?? null,
        place_id: placeId,
        participants: (p.event.participants ?? []).map((x) => ({
          person_id: x.person_id,
          role: x.role ?? null,
        })),
      });
      return (p.event.participants ?? []).map((x) => x.person_id);
    }
    case "merge_persons": {
      const p = payloadSchemas.merge_persons.parse(proposal.payload);
      const keep = personsRepo.get(db, p.keep_id);
      const drop = personsRepo.get(db, p.drop_id);
      if (!keep || !drop) throw new ApplyError("bad_payload", "Человек не найден");
      claimsRepo.reassignSubject(db, drop.id, keep.id);
      relationshipsRepo.reassign(db, drop.id, keep.id);
      eventsRepo.reassignParticipant(db, drop.id, keep.id);
      const altNames = Array.from(new Set([...keep.alt_names, drop.display_name, ...drop.alt_names]));
      personsRepo.update(db, keep.id, { alt_names: altNames });
      personsRepo.remove(db, drop.id);
      return [keep.id];
    }
    default:
      throw new ApplyError("bad_kind", `Неизвестный тип предложения: ${proposal.kind}`);
  }
}

function linkProposalSources(db: DB, proposal: ProposalDTO, claimId: string): void {
  for (const sourceId of proposal.source_ids) {
    claimsRepo.linkSource(db, claimId, sourceId, null);
  }
}
