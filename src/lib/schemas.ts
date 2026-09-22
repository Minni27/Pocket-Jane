import { z } from "zod";
import { LIMITS } from "@/lib/limits";

// Request bodies. Parsed before anything touches the database or Gemini, so a
// malformed or hostile payload is rejected with a 400 rather than reaching
// Postgres and surfacing as a 500 with a constraint name in it.

export const analyzeRequest = z.object({
  image: z.string().max(12_000_000).optional(),
  text: z.string().max(LIMITS.TEXT_CHARS).optional(),
}).refine((v) => !!v.image || !!v.text?.trim(), {
  message: "Provide an image or description.",
});

export const ingestRequest = z.object({
  bookTitle: z.string().trim().min(1).max(LIMITS.TITLE_CHARS),
  author: z.string().trim().max(LIMITS.TITLE_CHARS).optional(),
  chunks: z.array(z.string().min(1).max(LIMITS.CHUNK_CHARS)).min(1).max(LIMITS.CHUNKS_PER_REQUEST),
  startIndex: z.number().int().min(0).max(LIMITS.CHUNKS_PER_BOOK).default(0),
});

export const createUserRequest = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  role: z.enum(["admin", "member"]).default("member"),
});

export const updateUserRequest = z.object({
  password: z.string().min(8).max(200).optional(),
  role: z.enum(["admin", "member"]).optional(),
}).refine((v) => v.password !== undefined || v.role !== undefined, {
  message: "Nothing to update.",
});

// Gemini's response. The model is instructed to return this shape, but an
// instruction is not a guarantee: a malformed field used to reach the insert
// and fail a NOT NULL constraint, which was only logged — the caller got a
// profile with a null id, so its outcome could never be logged and the
// calibration loop silently lost that reading. Validating here turns that
// into a retry against the next model instead.
export const profileSchema = z.object({
  archetype: z.string().trim().min(1).max(120),
  confidence: z.coerce.number().int().min(0).max(100),
  summary: z.string().trim().max(4000).default(""),
  dominantTraits: z.array(z.object({
    name: z.string().trim().min(1).max(120),
    strength: z.coerce.number().int().min(0).max(100),
  })).max(12).default([]),
  methodology: z.array(z.object({
    icon: z.string().max(8).default("◈"),
    framework: z.string().trim().max(300).default(""),
    observation: z.string().trim().max(2000).default(""),
    inference: z.string().trim().max(2000).default(""),
    cite: z.string().trim().max(300).default(""),
  })).max(8).default([]),
  persuasionAngles: z.array(z.object({
    label: z.string().trim().max(120).default(""),
    text: z.string().trim().max(2000).default(""),
  })).max(8).default([]),
});

export type ValidatedProfile = z.infer<typeof profileSchema>;

/** First JSON object in a model response, tolerating stray prose or fences. */
export function extractJson(raw: string): unknown {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object in model response");
  return JSON.parse(match[0]);
}
