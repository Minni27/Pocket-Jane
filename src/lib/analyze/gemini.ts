import { requireServerEnv } from "@/lib/env";
import type { Logger } from "@/lib/log";
import { extractJson, profileSchema, type ValidatedProfile } from "@/lib/schemas";

// Tried in order — these models are intermittently overloaded, so fall
// through to the next rather than failing the whole request.
export const MODELS = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-3.1-flash-lite"];

const modelUrl = (m: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;

/**
 * Per-attempt timeout derived from the shared deadline. Three attempts at a
 * fixed 45s each could run to 135s against a 60s platform limit, so the
 * function was killed mid-request on the third model and the user saw a
 * generic failure. A shared budget means the last attempt gets whatever is
 * left, and we stop rather than start an attempt that cannot finish.
 */
export function attemptTimeout(deadline: number, now = Date.now()): number {
  return deadline - now;
}

/** Minimum time worth starting a Gemini call with. */
export const MIN_ATTEMPT_MS = 6_000;

export type GeminiResult =
  | { ok: true; profile: ValidatedProfile; model: string }
  | { ok: false; error: string };

export async function generateProfile(
  parts: unknown[],
  deadline: number,
  log: Logger
): Promise<GeminiResult> {
  const apiKey = requireServerEnv("GEMINI_API_KEY");

  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.95,       // committed prose, but reliable enough to parse as JSON
      topP: 0.95,
      maxOutputTokens: 4096,   // room for the longer observation/inference fields
      responseMimeType: "application/json",
    },
  });

  let lastErr = "no model attempted";

  for (const model of MODELS) {
    const remaining = attemptTimeout(deadline);
    if (remaining < MIN_ATTEMPT_MS) {
      log.warn("out of time budget", { model, remaining });
      break;
    }

    let res: Response;
    try {
      res = await fetch(modelUrl(model), {
        method: "POST",
        // Header rather than ?key= — query strings land in proxy and platform
        // access logs, and this key bills to a real account.
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body,
        signal: AbortSignal.timeout(remaining),
      });
    } catch (e) {
      lastErr = e instanceof Error && e.name === "TimeoutError" ? `${model} timed out` : `${model} unreachable`;
      log.warn("model unreachable", { model, err: lastErr });
      continue;
    }

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      lastErr = `${model} returned ${res.status}`;
      log.warn("model rejected request", { model, status: res.status, detail: String(json?.error?.message ?? "").slice(0, 200) });
      continue;
    }

    const json = await res.json().catch(() => null);
    const raw: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // A model that returns unparseable or off-shape JSON is a failed attempt,
    // not a failed request — fall through and let the next model try.
    try {
      const profile = profileSchema.parse(extractJson(raw));
      log.info("model succeeded", { model, chars: raw.length });
      return { ok: true, profile, model };
    } catch (e) {
      lastErr = `${model} returned an unusable profile`;
      log.warn("model output rejected", { model, err: e instanceof Error ? e.message.slice(0, 200) : "unknown" });
    }
  }

  return { ok: false, error: lastErr };
}
