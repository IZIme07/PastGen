// Доменные типы PastGen, общие для клиента и сервера.
// Только типы (никакого рантайма) — обе стороны импортируют через `import type`.

export type Sex = "male" | "female" | "unknown";

export type RelationshipType =
  | "parent" // a — родитель b
  | "spouse"
  | "ex_spouse"
  | "sibling"
  | "adoption" // a усыновил(а) b
  | "guardian"
  | "witness"
  | "neighbor"
  | "colleague"
  | "other";

export type SourceType =
  | "document"
  | "photo"
  | "story"
  | "letter"
  | "archive"
  | "comment"
  | "link"
  | "audio";

export type ClaimType =
  | "birth_date"
  | "birth_place"
  | "death_date"
  | "death_place"
  | "marriage"
  | "occupation"
  | "name_change"
  | "residence"
  | "custom";

export type ClaimStatus = "primary" | "alternative" | "rejected";

export type ProposalKind =
  | "add_person"
  | "add_claim"
  | "add_alternative"
  | "update_claim"
  | "link_source"
  | "add_relationship"
  | "add_event"
  | "merge_persons";

export type ProposalStatus = "pending" | "accepted" | "deferred" | "rejected";

export type EventType =
  | "birth"
  | "death"
  | "marriage"
  | "divorce"
  | "move"
  | "emigration"
  | "name_change"
  | "war"
  | "document"
  | "photo"
  | "story"
  | "other";

export type AssistantTask =
  | "check_branch"
  | "weak_spots"
  | "next_steps"
  | "archive_letter"
  | "interview_questions"
  | "explain_conflict"
  | "summarize_branch";

export interface PersonDTO {
  id: string;
  surname: string | null;
  given_name: string | null;
  patronymic: string | null;
  display_name: string;
  maiden_name: string | null;
  alt_names: string[];
  sex: Sex;
  bio_md: string | null;
  notes: string | null;
  deceased: boolean;
  created_at: string;
  updated_at: string;
}

export interface RelationshipDTO {
  id: string;
  a_id: string;
  b_id: string;
  type: RelationshipType;
  confidence: number | null;
}

export interface SourceRef {
  source_id: string;
  type: SourceType;
  title: string;
  note: string | null;
}

export interface ClaimDTO {
  id: string;
  subject_type: "person" | "event" | "relationship";
  subject_id: string;
  claim_type: ClaimType;
  value: Record<string, unknown>;
  confidence: number;
  status: ClaimStatus;
  parent_claim_id: string | null;
  conflict: boolean;
  conflict_note: string | null;
  sources: SourceRef[];
  alternatives?: ClaimDTO[];
  created_at: string;
  updated_at: string;
}

export interface SourceDTO {
  id: string;
  type: SourceType;
  title: string;
  file_path: string | null;
  url: string | null;
  recognized_text: string | null;
  metadata: Record<string, unknown>;
  quality: number | null;
  added_at: string;
}

export interface EventDTO {
  id: string;
  type: EventType;
  date_from: string | null;
  date_to: string | null;
  place_id: string | null;
  description: string | null;
  confidence: number | null;
  participants: { person_id: string; role: string | null }[];
}

export interface PlaceDTO {
  id: string;
  name: string;
  alt_names: string[];
  lat: number | null;
  lng: number | null;
  period: string | null;
}

export interface ProposalDTO {
  id: string;
  kind: ProposalKind;
  title: string;
  detail: string | null;
  payload: Record<string, unknown>;
  confidence: number;
  conflict_note: string | null;
  source_ids: string[];
  status: ProposalStatus;
  created_from: string | null;
  created_at: string;
  decided_at: string | null;
}

export interface ResearchTaskDTO {
  id: string;
  title: string;
  person_id: string | null;
  status: "open" | "done" | "dismissed";
  origin: string;
  created_at: string;
}

export interface HistoryDTO {
  id: string;
  ts: string;
  action: string;
  entity_type: string;
  entity_id: string;
  detail: Record<string, unknown>;
  proposal_id: string | null;
}

/** Ответ GET /api/persons/:id — полное досье. */
export interface DossierDTO {
  person: PersonDTO;
  profile_confidence: number;
  claims: ClaimDTO[];
  relationships: (RelationshipDTO & { other: PersonDTO })[];
  tasks: ResearchTaskDTO[];
}

/** Ответ GET /api/tree — данные для дерева/таймлайна/карты. */
export interface TreeDTO {
  persons: (PersonDTO & {
    profile_confidence: number;
    birth_year: number | null;
    death_year: number | null;
    birth_year_alt: number | null;
    birth_year_disputed: boolean;
    has_conflict: boolean;
  })[];
  relationships: RelationshipDTO[];
}

export interface HealthDTO {
  ok: boolean;
  ai: boolean;
}

export interface ImportResultDTO {
  source: SourceDTO;
  proposals: ProposalDTO[];
  ai: boolean;
  ai_error?: string;
}

export interface AssistantResultDTO {
  text: string;
  proposals: ProposalDTO[];
}

export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}
