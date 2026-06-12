import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "../App";

const person = {
  id: "p1", surname: "Соколова", given_name: "Мария", patronymic: "Ивановна",
  display_name: "Мария Ивановна Соколова", maiden_name: "Громова",
  alt_names: ["Мария Громова"], sex: "female", bio_md: "История Марии.",
  notes: "Прабабушка · ветвь: maternal", deceased: true,
  created_at: "2026-01-01", updated_at: "2026-01-01",
};

const routes: Record<string, unknown> = {
  "/api/health": { ok: true, ai: false },
  "/api/tree": {
    persons: [{
      ...person, profile_confidence: 71, birth_year: 1928, death_year: 2009,
      birth_year_alt: 1930, birth_year_disputed: true, has_conflict: true,
    }],
    relationships: [],
  },
  "/api/events": [],
  "/api/places": [],
  "/api/proposals": [],
  "/api/persons/p1": {
    person, profile_confidence: 71,
    claims: [{
      id: "c1", subject_type: "person", subject_id: "p1", claim_type: "birth_date",
      value: { year: 1928, place: "Тула" }, confidence: 70, status: "primary",
      parent_claim_id: null, conflict: true, conflict_note: "1928 / 1930",
      sources: [{ source_id: "s1", type: "story", title: "Рассказ дочери", note: null }],
      created_at: "2026-01-01", updated_at: "2026-01-01",
    }],
    relationships: [], tasks: [],
  },
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input).split("?")[0];
    const body = routes[url];
    if (body === undefined) return new Response("{}", { status: 404 });
    return new Response(JSON.stringify(body), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }));
});

describe("AppShell", () => {
  it("renders the workspace with tree node from API data", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Семейное дерево")).toBeTruthy();
    });
    // узел дерева с именем из /api/tree
    expect(await screen.findByText("Мария Ивановна Соколова")).toBeTruthy();
    // переключатель Дерево ↔ Граф
    expect(screen.getAllByText("Граф").length).toBeGreaterThan(0);
  });
});
