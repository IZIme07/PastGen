import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { openMemoryDb, type DB } from "../src/db/index.js";

let db: DB;
let app: ReturnType<typeof createApp>;
beforeEach(() => {
  db = openMemoryDb();
  app = createApp({ db, dataDir: null });
});

describe("API", () => {
  it("GET /api/health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.ai).toBe("boolean");
  });

  it("person create → dossier fetch", async () => {
    const created = await request(app)
      .post("/api/persons")
      .send({ display_name: "Мария Ивановна Соколова", surname: "Соколова", given_name: "Мария", sex: "female" });
    expect(created.status).toBe(201);
    const id = created.body.id;

    await request(app)
      .post("/api/claims")
      .send({ subject_id: id, claim_type: "birth_date", value: { year: 1928, place: "Тула" }, confidence: 70 })
      .expect(201);

    const dossier = await request(app).get(`/api/persons/${id}`);
    expect(dossier.status).toBe(200);
    expect(dossier.body.person.display_name).toBe("Мария Ивановна Соколова");
    expect(dossier.body.claims).toHaveLength(1);
    expect(dossier.body.profile_confidence).toBe(70);
  });

  it("invalid person body → 400 with error envelope", async () => {
    const res = await request(app).post("/api/persons").send({ surname: "Без имени" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation");
  });

  it("404 for missing person", async () => {
    const res = await request(app).get("/api/persons/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
  });

  it("proposal accept flow end-to-end", async () => {
    const person = await request(app).post("/api/persons").send({ display_name: "Мария" });
    const proposal = await request(app)
      .post("/api/proposals")
      .send({
        kind: "add_claim",
        title: "Дата рождения → 1928",
        payload: { subject_id: person.body.id, claim_type: "birth_date", value: { year: 1928 }, confidence: 88 },
        confidence: 88,
      })
      .expect(201);

    const pendingList = await request(app).get("/api/proposals?status=pending");
    expect(pendingList.body).toHaveLength(1);

    await request(app).post(`/api/proposals/${proposal.body.id}/accept`).expect(200);

    const dossier = await request(app).get(`/api/persons/${person.body.id}`);
    expect(dossier.body.claims).toHaveLength(1);

    // повторный accept — 409
    await request(app).post(`/api/proposals/${proposal.body.id}/accept`).expect(409);
  });

  it("GET /api/tree returns persons with computed years", async () => {
    const p = await request(app).post("/api/persons").send({ display_name: "Иван Соколов" });
    await request(app)
      .post("/api/claims")
      .send({ subject_id: p.body.id, claim_type: "birth_date", value: { year: 1924 }, confidence: 92 });
    await request(app)
      .post("/api/claims")
      .send({ subject_id: p.body.id, claim_type: "death_date", value: { year: 1991 }, confidence: 90 });

    const tree = await request(app).get("/api/tree");
    expect(tree.status).toBe(200);
    expect(tree.body.persons).toHaveLength(1);
    expect(tree.body.persons[0].birth_year).toBe(1924);
    expect(tree.body.persons[0].death_year).toBe(1991);
    expect(tree.body.persons[0].profile_confidence).toBeGreaterThan(0);
  });

  it("relationships create + delete", async () => {
    const a = await request(app).post("/api/persons").send({ display_name: "A" });
    const b = await request(app).post("/api/persons").send({ display_name: "B" });
    const rel = await request(app)
      .post("/api/relationships")
      .send({ a_id: a.body.id, b_id: b.body.id, type: "spouse" })
      .expect(201);
    await request(app).delete(`/api/relationships/${rel.body.id}`).expect(204);
  });
});
