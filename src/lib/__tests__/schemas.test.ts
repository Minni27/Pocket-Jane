import { describe, expect, it } from "vitest";
import { analyzeRequest, ingestRequest, createUserRequest, updateUserRequest, profileSchema, extractJson } from "@/lib/schemas";
import { LIMITS } from "@/lib/limits";

describe("analyzeRequest", () => {
  it("requires an image or non-blank text", () => {
    expect(analyzeRequest.safeParse({}).success).toBe(false);
    expect(analyzeRequest.safeParse({ text: "   " }).success).toBe(false);
    expect(analyzeRequest.safeParse({ text: "he squared the napkin" }).success).toBe(true);
    expect(analyzeRequest.safeParse({ image: "data:image/jpeg;base64,AAAA" }).success).toBe(true);
  });

  it("rejects over-long text", () => {
    expect(analyzeRequest.safeParse({ text: "x".repeat(LIMITS.TEXT_CHARS + 1) }).success).toBe(false);
  });
});

describe("ingestRequest", () => {
  const ok = { bookTitle: "Influence", author: "Cialdini", chunks: ["a passage"] };

  it("accepts a well-formed payload and defaults startIndex", () => {
    const r = ingestRequest.parse(ok);
    expect(r.startIndex).toBe(0);
  });

  it("rejects an empty title or no passages", () => {
    expect(ingestRequest.safeParse({ ...ok, bookTitle: "  " }).success).toBe(false);
    expect(ingestRequest.safeParse({ ...ok, chunks: [] }).success).toBe(false);
  });

  it("caps passages per request", () => {
    const chunks = Array(LIMITS.CHUNKS_PER_REQUEST + 1).fill("x");
    expect(ingestRequest.safeParse({ ...ok, chunks }).success).toBe(false);
  });

  it("rejects an oversized passage", () => {
    expect(ingestRequest.safeParse({ ...ok, chunks: ["x".repeat(LIMITS.CHUNK_CHARS + 1)] }).success).toBe(false);
  });

  it("rejects a non-string passage and a negative or fractional index", () => {
    expect(ingestRequest.safeParse({ ...ok, chunks: [{ evil: true }] }).success).toBe(false);
    expect(ingestRequest.safeParse({ ...ok, startIndex: -1 }).success).toBe(false);
    expect(ingestRequest.safeParse({ ...ok, startIndex: 1.5 }).success).toBe(false);
  });

  it("rejects an over-long title", () => {
    expect(ingestRequest.safeParse({ ...ok, bookTitle: "x".repeat(LIMITS.TITLE_CHARS + 1) }).success).toBe(false);
  });
});

describe("admin user schemas", () => {
  it("requires a valid email and an 8+ character password", () => {
    expect(createUserRequest.safeParse({ email: "nope", password: "abcdefgh" }).success).toBe(false);
    expect(createUserRequest.safeParse({ email: "a@b.co", password: "short" }).success).toBe(false);
    expect(createUserRequest.parse({ email: "a@b.co", password: "abcdefgh" }).role).toBe("member");
  });

  it("only allows known roles", () => {
    expect(createUserRequest.safeParse({ email: "a@b.co", password: "abcdefgh", role: "superuser" }).success).toBe(false);
  });

  it("rejects an empty update", () => {
    expect(updateUserRequest.safeParse({}).success).toBe(false);
    expect(updateUserRequest.safeParse({ role: "admin" }).success).toBe(true);
  });
});

describe("profileSchema", () => {
  const valid = {
    archetype: "The Rehearsed Charmer",
    confidence: 72,
    summary: "A specific read.",
    dominantTraits: [{ name: "Rehearsed", strength: 80 }],
    methodology: [{ icon: "⊕", framework: "Cialdini — Reciprocity", observation: "o", inference: "i", cite: "Influence" }],
    persuasionAngles: [{ label: "Lead with", text: "\"You've already decided.\"" }],
  };

  it("accepts a well-formed profile", () => {
    expect(profileSchema.parse(valid).confidence).toBe(72);
  });

  it("rejects a missing archetype rather than letting the insert fail", () => {
    const { archetype, ...rest } = valid;
    void archetype;
    expect(profileSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects a non-numeric confidence", () => {
    expect(profileSchema.safeParse({ ...valid, confidence: "high" }).success).toBe(false);
  });

  it("coerces a numeric string and clamps out-of-range values out", () => {
    expect(profileSchema.parse({ ...valid, confidence: "72" }).confidence).toBe(72);
    expect(profileSchema.safeParse({ ...valid, confidence: 150 }).success).toBe(false);
  });

  it("defaults the optional arrays", () => {
    const r = profileSchema.parse({ archetype: "A", confidence: 50 });
    expect(r.dominantTraits).toEqual([]);
    expect(r.summary).toBe("");
  });

  it("drops unknown keys so nothing extra reaches the client", () => {
    const r = profileSchema.parse({ ...valid, injected: "<script>" }) as Record<string, unknown>;
    expect(r.injected).toBeUndefined();
  });
});

describe("extractJson", () => {
  it("finds the object inside fences or prose", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('Here you go: {"a":1} — hope that helps')).toEqual({ a: 1 });
  });

  it("throws when there is no object", () => {
    expect(() => extractJson("I cannot do that")).toThrow();
  });
});
