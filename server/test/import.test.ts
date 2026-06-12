import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApp } from "../src/app.js";
import { openMemoryDb, type DB } from "../src/db/index.js";
import { parseExtraction } from "../src/ai/extract.js";

let db: DB;
let dataDir: string;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  db = openMemoryDb();
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "pastgen-test-"));
  app = createApp({ db, dataDir });
});
afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
});

describe("parseExtraction", () => {
  it("parses clean JSON", () => {
    const result = parseExtraction(
      JSON.stringify({
        recognized_text: "Свидетельство о рождении",
        proposals: [
          { kind: "add_claim", title: "Дата рождения → 1928", confidence: 88, payload: { subject_id: "x" } },
        ],
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.proposals).toHaveLength(1);
  });

  it("parses JSON wrapped in markdown fences", () => {
    const result = parseExtraction('```json\n{"recognized_text": "т", "proposals": []}\n```');
    expect(result).not.toBeNull();
    expect(result!.recognized_text).toBe("т");
  });

  it("returns null for garbage", () => {
    expect(parseExtraction("Извините, не могу")).toBeNull();
    expect(parseExtraction('{"proposals": "не массив"}')).toBeNull();
  });
});

describe("POST /api/import", () => {
  it("stores text note as source even without AI key", async () => {
    const res = await request(app)
      .post("/api/import")
      .send({ text: "Бабушка рассказывала, что Мария родилась в Туле в 1928 году." });
    expect(res.status).toBe(200);
    expect(res.body.ai).toBe(false);
    expect(res.body.source.type).toBe("story");
    expect(res.body.proposals).toEqual([]);
  });

  it("stores uploaded text file under uploads/", async () => {
    const res = await request(app)
      .post("/api/import")
      .attach("file", Buffer.from("Письмо 1947 года: сестра Полина жива."), "letter.txt");
    expect(res.status).toBe(200);
    expect(res.body.source.file_path).toMatch(/^uploads[\\/]/);
    const abs = path.join(dataDir, res.body.source.file_path);
    expect(fs.existsSync(abs)).toBe(true);
  });

  it("rejects unsupported file types with 415", async () => {
    const res = await request(app)
      .post("/api/import")
      .attach("file", Buffer.from("MZ..."), "virus.exe");
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("unsupported_type");
  });

  it("serves the stored file back via /api/sources/:id/file", async () => {
    const up = await request(app)
      .post("/api/import")
      .attach("file", Buffer.from("содержимое"), "note.txt");
    const res = await request(app).get(`/api/sources/${up.body.source.id}/file`);
    expect(res.status).toBe(200);
  });
});

describe("POST /api/assistant", () => {
  it("returns 503 without API key", async () => {
    const res = await request(app).post("/api/assistant").send({ task: "weak_spots" });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("ai_not_configured");
  });

  it("validates task name", async () => {
    const res = await request(app).post("/api/assistant").send({ task: "hack_the_planet" });
    expect(res.status).toBe(400);
  });
});
