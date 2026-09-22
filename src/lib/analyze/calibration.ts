import type { SupabaseClient } from "@supabase/supabase-js";
import type { Logger } from "@/lib/log";
import { fenceData } from "@/lib/analyze/prompt";

// Past reads the user marked wrong, fed back so the model can correct course.
// There is no fine-tuning here — the "learning" is that prior corrections ride
// along in the prompt, so repeated mistakes get called out before they recur.

type Row = {
  archetype: string;
  confidence: number;
  summary: string;
  outcome: "success" | "partial" | "miss";
  outcome_note: string | null;
};

/** Confidence gap between wrong and right reads, or null when too few of either. */
export function confidenceGap(rows: Pick<Row, "outcome" | "confidence">[]): number | null {
  const wrong = rows.filter((r) => r.outcome === "miss");
  const right = rows.filter((r) => r.outcome === "success");
  if (wrong.length < 2 || right.length < 1) return null;
  const avg = (xs: typeof wrong) => xs.reduce((s, r) => s + r.confidence, 0) / xs.length;
  return Math.round(avg(wrong) - avg(right));
}

export async function fetchCalibration(supabase: SupabaseClient, log: Logger): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("analyses")
      .select("archetype, confidence, summary, outcome, outcome_note")
      .not("outcome", "is", null)
      .order("created_at", { ascending: false })
      .limit(40);

    if (error || !data?.length) return "";
    const rows = data as Row[];

    // Corrections the user actually wrote up
    const corrected = rows
      .filter((r) => r.outcome !== "success" && r.outcome_note?.trim())
      .slice(0, 6);

    const gap = confidenceGap(rows);
    const confidenceNote = gap !== null && gap > 5
      ? `\nYour incorrect reads have averaged ${gap} points *higher* confidence than your correct ones — you are most overconfident precisely when you are wrong. Lower your confidence when a read feels effortless.`
      : "";

    if (!corrected.length && !confidenceNote) return "";

    let section = `## Calibration — where you have been wrong before\n\nThese are your own past reads on other people, with the user's correction. They are not about the person you are analysing now. Use them to avoid repeating the same class of mistake.\n`;

    for (const r of corrected) {
      section += `\n- You read them as "${r.archetype}" at ${r.confidence}% confidence. The user marked this ${r.outcome.toUpperCase()} and said: "${r.outcome_note!.trim()}"`;
    }
    section += confidenceNote;
    section += `\n\nBefore committing to a read, check it against these corrections. If you are about to make a similar inference, either find stronger evidence or say something different.`;

    log.info("calibration applied", { corrections: corrected.length, confidenceNote: !!confidenceNote });

    // Fenced: outcome_note is free text the user typed, and it should not be
    // able to rewrite the instructions above it.
    return fenceData("the user's own notes on past readings", section);
  } catch {
    return "";
  }
}
