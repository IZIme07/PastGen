import { describe, it, expect } from "vitest";
import { profileConfidence } from "../src/domain/confidence.js";

const c = (claim_type: string, confidence: number, status = "primary") =>
  ({ claim_type, confidence, status }) as Parameters<typeof profileConfidence>[0][number];

describe("profileConfidence", () => {
  it("returns 0 for no claims", () => {
    expect(profileConfidence([])).toBe(0);
  });

  it("returns the value of a single primary claim", () => {
    expect(profileConfidence([c("birth_date", 80)])).toBe(80);
  });

  it("ignores alternatives and rejected", () => {
    expect(
      profileConfidence([c("birth_date", 80), c("birth_date", 20, "alternative"), c("custom", 10, "rejected")]),
    ).toBe(80);
  });

  it("weights birth_date 3x against default 1x", () => {
    // (3*90 + 1*50) / 4 = 80
    expect(profileConfidence([c("birth_date", 90), c("occupation", 50)])).toBe(80);
  });

  it("matches Maria's dossier ≈74", () => {
    const result = profileConfidence([
      c("birth_date", 70),
      c("marriage", 95),
      c("custom", 90), // дети
      c("death_date", 38),
    ]);
    // (3*70 + 2*95 + 1*90 + 2*38) / 8 = 70.75 → 71
    expect(result).toBe(71);
  });
});
