import { requireServerEnv } from "@/lib/env";
import type { Logger } from "@/lib/log";
import { extractJson, profileSchema, type ValidatedProfile } from "@/lib/schemas";

// Tried in order — these models are intermittently overloaded, so fall
// through to the next rather than failing the whole request.
//
// gemini-2.5-flash was retired mid-flight: it answered 404 with "no longer
// available to new users. Please update your code to use models/
// gemini-3.6-flash". A retired model is not a fallback, so the chain was two
// deep, and on a day when both survivors were shedding load the whole reading
// failed. Check this list against the live ListModels output when a 404
// appears in the log, not against what worked at the time of writing.
//
// Ordered by capability, not by observed uptime. Probing the live API twice
// minutes apart returned 503 "high demand" from a different two of the three
// each time — free-tier load shedding rotates, and no model is dependably up.
// So ordering buys nothing and resilience comes from depth plus the second
// pass below. Try the strongest model first and fall back.
export const MODELS = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.1-flash-lite"];

// A model is walked twice before the reading is abandoned. 503 "experiencing
// high demand" is Google shedding load, not a broken request — the same model
// often answers seconds later, and a single pass turned a transient spike into
// a failed reading for the user.
const PASSES = 2;

// Long enough that the retry lands on the far side of a load spike, short
// enough to leave the rest of the chain a usable share of the budget.
const BACKOFF_MS = 1_500;

// Statuses that will fail identically on every pass: a retired model, a
// rejected key, a malformed body. Retrying these spends budget the models
// that might actually answer need.
//
// 429 is here despite being nominally retryable. Gemini returns it as
// RESOURCE_EXHAUSTED when the free-tier quota is gone, and that does not
// come back within the seconds a single request has — so the retry only
// delayed reaching a model that might still answer. A per-minute rate limit
// would recover, but not fast enough to be worth the budget either.
const PERMANENT = new Set([400, 401, 403, 404, 429]);

const modelUrl = (m: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Time left before the shared deadline. Three attempts at a fixed 45s each
 * could run to 135s against a 60s platform limit, so the function was killed
 * mid-request on the third model and the user saw a generic failure.
 */
export function attemptTimeout(deadline: number, now = Date.now()): number {
  return deadline - now;
}

/** Minimum time worth starting a Gemini call with. */
export const MIN_ATTEMPT_MS = 6_000;

/**
 * One attempt's share of the budget. attemptTimeout alone hands the first
 * attempt everything that is left, so a single hung connection consumed all
 * 52s and every later model was skipped with "out of time budget" — a chain
 * three deep that collapsed to one whenever the failure was a hang rather
 * than an error. Splitting by attempts still queued keeps the later models
 * reachable; the last one still gets the whole remainder.
 */
export function attemptBudget(deadline: number, attemptsLeft: number, now = Date.now()): number {
  const remaining = attemptTimeout(deadline, now);
  if (attemptsLeft <= 1) return remaining;
  return Math.min(remaining, Math.max(MIN_ATTEMPT_MS, Math.floor(remaining / attemptsLeft)));
}

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
  const dead = new Set<string>();
  const plan = Array.from({ length: PASSES }, () => MODELS).flat();

  for (let i = 0; i < plan.length; i++) {
    const model = plan[i];
    if (dead.has(model)) continue;

    // Retrying a model that just shed load only works if the spike has had a
    // moment to pass, so wait once on entering the second pass.
    if (i >= MODELS.length && i % MODELS.length === 0) await sleep(BACKOFF_MS);

    const remaining = attemptTimeout(deadline);
    if (remaining < MIN_ATTEMPT_MS) {
      log.warn("out of time budget", { model, remaining });
      break;
    }
    const queued = plan.slice(i).filter((m) => !dead.has(m)).length;
    const timeout = attemptBudget(deadline, queued);

    let res: Response;
    try {
      res = await fetch(modelUrl(model), {
        method: "POST",
        // Header rather than ?key= — query strings land in proxy and platform
        // access logs, and this key bills to a real account.
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body,
        signal: AbortSignal.timeout(timeout),
      });
    } catch (e) {
      lastErr = e instanceof Error && e.name === "TimeoutError" ? `${model} timed out` : `${model} unreachable`;
      log.warn("model unreachable", { model, err: lastErr, timeout });
      continue;
    }

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      const detail = String(json?.error?.message ?? "").slice(0, 200);
      lastErr = `${model} returned ${res.status}`;

      if (PERMANENT.has(res.status)) {
        // Logged at error, not warn: a retired model or a rejected key is a
        // deploy-level problem that stays broken until someone changes code
        // or config, and it should not hide among transient overload noise.
        dead.add(model);
        log.error("model permanently unavailable", { model, status: res.status, detail });
      } else {
        log.warn("model rejected request", { model, status: res.status, detail });
      }
      continue;
    }

    const json = await res.json().catch(() => null);
    const candidate = json?.candidates?.[0];
    const raw: string = candidate?.content?.parts?.[0]?.text ?? "";

    // A 200 carrying no text is a different failure from bad JSON, and the two
    // were indistinguishable in the log: a safety block and a response cut off
    // at maxOutputTokens both arrive as an empty string. Record why the model
    // stopped so the next failure names its own cause.
    const why = {
      finish: String(candidate?.finishReason ?? "none"),
      blocked: String(json?.promptFeedback?.blockReason ?? ""),
      chars: raw.length,
    };

    if (!raw.trim()) {
      lastErr = why.blocked ? `${model} blocked the prompt` : `${model} returned no text`;
      log.warn("model returned no text", { model, ...why });
      continue;
    }

    // A model that returns unparseable or off-shape JSON is a failed attempt,
    // not a failed request — fall through and let the next model try.
    try {
      const profile = profileSchema.parse(extractJson(raw));
      log.info("model succeeded", { model, ...why });
      return { ok: true, profile, model };
    } catch (e) {
      lastErr = `${model} returned an unusable profile`;
      log.warn("model output rejected", {
        model,
        ...why,
        err: e instanceof Error ? e.message.slice(0, 200) : "unknown",
        head: raw.slice(0, 120),
      });
    }
  }

  return { ok: false, error: lastErr };
}
