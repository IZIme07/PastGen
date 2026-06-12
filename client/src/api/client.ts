import type {
  AssistantResultDTO, AssistantTask, ClaimDTO, DossierDTO, EventDTO,
  HealthDTO, HistoryDTO, ImportResultDTO, PersonDTO, PlaceDTO,
  ProposalDTO, RelationshipDTO, RelationshipType, ResearchTaskDTO,
  SourceDTO, TreeDTO,
} from "@pastgen/shared";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });
  if (!res.ok) {
    let code = "http_error";
    let message = res.statusText;
    try {
      const body = await res.json();
      code = body?.error?.code ?? code;
      message = body?.error?.message ?? message;
    } catch { /* не-JSON ответ */ }
    throw new ApiError(res.status, code, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  health: () => req<HealthDTO>("/health"),
  tree: () => req<TreeDTO>("/tree"),

  persons: {
    list: () => req<PersonDTO[]>("/persons"),
    dossier: (id: string) => req<DossierDTO>(`/persons/${id}`),
    create: (body: Partial<PersonDTO> & { display_name: string }) =>
      req<PersonDTO>("/persons", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<PersonDTO>) =>
      req<PersonDTO>(`/persons/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    remove: (id: string) => req<void>(`/persons/${id}`, { method: "DELETE" }),
  },

  relationships: {
    create: (body: { a_id: string; b_id: string; type: RelationshipType }) =>
      req<RelationshipDTO>("/relationships", { method: "POST", body: JSON.stringify(body) }),
    remove: (id: string) => req<void>(`/relationships/${id}`, { method: "DELETE" }),
  },

  claims: {
    create: (body: {
      subject_id: string; claim_type: string; value: Record<string, unknown>;
      confidence: number; status?: string; parent_claim_id?: string;
    }) => req<ClaimDTO>("/claims", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Pick<ClaimDTO, "value" | "confidence" | "status" | "conflict" | "conflict_note">>) =>
      req<ClaimDTO>(`/claims/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    remove: (id: string) => req<void>(`/claims/${id}`, { method: "DELETE" }),
    linkSource: (id: string, source_id: string, note?: string) =>
      req<ClaimDTO>(`/claims/${id}/sources`, { method: "POST", body: JSON.stringify({ source_id, note }) }),
  },

  sources: {
    list: () => req<SourceDTO[]>("/sources"),
    create: (body: { type: string; title: string; url?: string; recognized_text?: string }) =>
      req<SourceDTO>("/sources", { method: "POST", body: JSON.stringify(body) }),
    fileUrl: (id: string) => `/api/sources/${id}/file`,
  },

  events: { list: () => req<EventDTO[]>("/events") },
  places: { list: () => req<PlaceDTO[]>("/places") },

  proposals: {
    list: (status?: string) => req<ProposalDTO[]>(`/proposals${status ? `?status=${status}` : ""}`),
    accept: (id: string) => req<ProposalDTO>(`/proposals/${id}/accept`, { method: "POST" }),
    defer: (id: string) => req<ProposalDTO>(`/proposals/${id}/defer`, { method: "POST" }),
    reject: (id: string) => req<ProposalDTO>(`/proposals/${id}/reject`, { method: "POST" }),
  },

  tasks: {
    list: (personId?: string) => req<ResearchTaskDTO[]>(`/tasks${personId ? `?person_id=${personId}` : ""}`),
    setStatus: (id: string, status: "open" | "done" | "dismissed") =>
      req<ResearchTaskDTO>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  },

  history: { list: () => req<HistoryDTO[]>("/history") },

  importFile: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return req<ImportResultDTO>("/import", { method: "POST", body: form });
  },
  importText: (text: string, title?: string) =>
    req<ImportResultDTO>("/import", { method: "POST", body: JSON.stringify({ text, title }) }),

  assistant: (task: AssistantTask, personId?: string | null) =>
    req<AssistantResultDTO>("/assistant", {
      method: "POST",
      body: JSON.stringify({ task, person_id: personId ?? null }),
    }),
};
