import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient, hasServiceRole } from "@/lib/supabase-admin";
import { createLogger } from "@/lib/log";
import { internalError, jsonError, sameOrigin } from "@/lib/http";
import { LIMITS } from "@/lib/limits";
import { analyzeRequest } from "@/lib/schemas";
import { BASE_PROMPT, PROMPT_VERSION } from "@/lib/analyze/prompt";
import { fetchRelevantChunks } from "@/lib/analyze/retrieval";
import { fetchCalibration } from "@/lib/analyze/calibration";
import { generateProfile } from "@/lib/analyze/gemini";

// A reading takes ~30s once library passages and calibration are in the
// prompt. Without this the platform default (10s on Vercel Hobby) kills
// every request in production while everything looks fine locally.
export const maxDuration = 60;

// Leaves ~8s of the 60s budget for retrieval, validation and the insert, so
// the function returns a real error instead of being killed mid-response.
const GEMINI_BUDGET_MS = 52_000;

export async function POST(req: NextRequest) {
  const log = createLogger("analyze");

  try {
    if (!sameOrigin(req)) return jsonError(403, "Cross-origin request refused.");

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonError(401, "Not signed in.");

    const parsed = analyzeRequest.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Invalid request.");
    }
    const { image, text } = parsed.data;

    if (image) {
      // base64 inflates by ~4/3, so compare against the decoded size
      const b64 = image.includes(",") ? image.slice(image.indexOf(",") + 1) : image;
      if (Math.floor(b64.length * 0.75) > LIMITS.IMAGE_BYTES) {
        return jsonError(413, `That image is too large — keep it under ${LIMITS.IMAGE_BYTES / 1024 / 1024}MB.`);
      }
    }

    // Per-user rate limit, counted from this user's own readings. Every
    // successful analysis writes a row, so no separate counter table is
    // needed — and a Postgres count stays correct across serverless
    // instances, which an in-memory counter would not.
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recent } = await supabase
      .from("analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", since);

    if ((recent ?? 0) >= LIMITS.READINGS_PER_HOUR) {
      log.warn("per-user rate limit hit", { user: user.id, recent });
      return jsonError(429, `You've hit the limit of ${LIMITS.READINGS_PER_HOUR} readings an hour. Try again shortly.`);
    }

    // Global circuit breaker. The Gemini free tier is a shared, finite quota:
    // without this, one account looping requests exhausts the day for
    // everyone. Needs the service role to see across tenants, so it is
    // skipped (with a warning) when that key is not configured.
    if (hasServiceRole()) {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: globalCount } = await createSupabaseAdminClient()
        .from("analyses")
        .select("id", { count: "exact", head: true })
        .gte("created_at", dayAgo);

      if ((globalCount ?? 0) >= LIMITS.READINGS_PER_DAY_GLOBAL) {
        log.error("global daily cap hit", { globalCount });
        return jsonError(429, "Pocket Jane has hit its daily limit across all accounts. Try again tomorrow.");
      }
    }

    const queryText = text?.trim()
      || "personality traits behavior patterns psychology persuasion body language";

    // Both are best-effort: a failure returns an empty string, and the
    // reading proceeds without that context rather than failing.
    const [bookContext, calibration] = await Promise.all([
      fetchRelevantChunks(supabase, queryText, log),
      fetchCalibration(supabase, log),
    ]);

    const parts: unknown[] = [];
    if (image) {
      const base64Data = image.includes(",") ? image.split(",")[1] : image;
      parts.push({ inline_data: { mime_type: "image/jpeg", data: base64Data } });
    }
    const userContext = text?.trim() ? `\n\nAdditional context: ${text.trim()}` : "";
    parts.push({ text: BASE_PROMPT + bookContext + calibration + userContext });

    const result = await generateProfile(parts, Date.now() + GEMINI_BUDGET_MS, log);
    if (!result.ok) {
      log.error("every model failed", { lastErr: result.error });
      return jsonError(503, "Jane couldn't reach a model that would answer. Try again in a moment.");
    }
    const profile = result.profile;

    const { data: saved, error: saveErr } = await supabase.from("analyses").insert({
      input_type: image ? "camera" : "text",
      input_text: text?.trim() ?? null,
      archetype: profile.archetype,
      confidence: profile.confidence,
      summary: profile.summary,
      dominant_traits: profile.dominantTraits,
      methodology: profile.methodology,
      persuasion_angles: profile.persuasionAngles,
      model: result.model,
      prompt_version: PROMPT_VERSION,
      user_id: user.id,
    }).select("id").single();

    // A reading that cannot be saved has no id, so its outcome can never be
    // logged and the calibration loop never sees it. Surface that rather than
    // handing back a profile that looks fine and silently cannot be corrected.
    if (saveErr) {
      log.error("insert failed", { err: saveErr.message });
      return jsonError(500, `The reading was generated but could not be saved. Reference: ${log.requestId}`);
    }

    log.info("reading saved", { id: saved.id, model: result.model });
    return NextResponse.json({ ...profile, id: saved.id });
  } catch (err) {
    return internalError(log, err, "unhandled");
  }
}
