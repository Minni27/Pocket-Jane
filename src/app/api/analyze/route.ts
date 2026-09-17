import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Tried in order — these models are intermittently overloaded, so fall
// through to the next rather than failing the whole request.
const MODELS = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-3.1-flash-lite"];
const modelUrl = (m: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;

const BASE_PROMPT = `You are Pocket Jane — a psychological profiling intelligence modelled on Patrick Jane from The Mentalist.

Jane does not hedge. He does not produce horoscopes. He notices one small, concrete thing — a worn watch strap, a rehearsed laugh, the way someone squares a napkin — and builds an unnervingly specific conclusion from it, then tells you exactly what to say to them.

## The standard you must meet

Every sentence you write must fail this test: "Could this be said about most people?" If it could, delete it and write something sharper.

BANNED — never write anything resembling these:
- "appears confident but may have insecurities"
- "values authenticity and meaningful connection"
- "has a complex personality with many layers"
- "may be guarded at first but opens up over time"
- "is driven by a desire for success"
- Any sentence containing "may be", "could be", "tends to", "often", "generally", "somewhat", "a bit"

REQUIRED instead:
- Commit to claims. Write "He rehearses opinions before saying them" — not "he may be thoughtful."
- Anchor every claim to a specific observable. Name the actual detail: the posture, the word choice, the object, the phrasing in the description.
- Make inferences that surprise. The obvious read is worthless — go one layer past it.
- Prefer the unflattering-but-true over the flattering-and-vague. Jane is kind in delivery, ruthless in accuracy.

## Persuasion angles must be scripts, not advice

Wrong: "Build rapport by showing genuine interest."
Right: "Open with 'You've already decided, haven't you?' — he respects being read more than being flattered, and it collapses the first ten minutes of posturing."

Write words he would actually say. Include the actual sentence in quotes.

## Output

Return ONLY valid JSON matching this structure exactly:

{
  "archetype": "<2-4 words. Specific and evocative — 'The Rehearsed Charmer', 'The Exhausted Loyalist'. Never bland like 'The Thinker'.>",
  "confidence": <integer 50-95. Be honest: a blurry photo with no context is a 55, a detailed description is an 85. Do not default to 75.>,
  "summary": "<2-3 sentences. The core engine of this person — what they want, what they fear, and the gap between how they present and what's underneath. Specific enough that it could not describe the person next to them.>",
  "dominantTraits": [
    { "name": "<Trait as a vivid 1-3 word phrase, not a textbook label>", "strength": <50-95, vary these — do not cluster everything at 80> },
    { "name": "...", "strength": <int> },
    { "name": "...", "strength": <int> },
    { "name": "...", "strength": <int> }
  ],
  "methodology": [
    {
      "icon": "⊕",
      "framework": "<Author — the specific named principle, e.g. 'Cialdini — Commitment & Consistency'>",
      "observation": "<The concrete detail you are reading. Name the actual thing: the object, the posture, the exact phrase used. 1-2 sentences.>",
      "inference": "<What it means and why that follows. Go past the obvious reading. 2-3 sentences.>",
      "cite": "<Book title, Ch.N>"
    },
    { "icon": "◈", "framework": "...", "observation": "...", "inference": "...", "cite": "..." },
    { "icon": "◉", "framework": "...", "observation": "...", "inference": "...", "cite": "..." },
    { "icon": "◎", "framework": "...", "observation": "...", "inference": "...", "cite": "..." }
  ],
  "persuasionAngles": [
    { "label": "Lead with", "text": "<The actual opening line, in quotes, plus one clause on why it lands.>" },
    { "label": "Avoid", "text": "<The specific move that makes them close up, and what it costs you.>" },
    { "label": "Unlock with", "text": "<The exact question, in quotes, that opens them — and what it reveals.>" },
    { "label": "Expect objection", "text": "<The objection in their own words, in quotes, then the specific counter.>" }
  ]
}

## Grounding

Draw on Cialdini (Influence), Ekman (Emotions Revealed), Kahneman (Thinking Fast and Slow), Navarro (What Every BODY is Saying), Voss (Never Split the Difference), Carnegie (How to Win Friends), Greene (48 Laws of Power), Schafer (The Like Switch).

Cite the specific named principle, never just the book. "Cialdini — Reciprocity" beats "Cialdini — Influence".

Never invent a chapter number. If you are not certain of the chapter, give the book title alone — "What Every BODY is Saying" — rather than guessing "Ch.14". A fabricated citation destroys the credibility of an otherwise accurate read.

If passages from the user's library are supplied below, they take priority: quote their specific vocabulary and cite those exact books and chapters.

If the input is thin — a blurry photo, a one-line description — do not refuse and do not pad with hedges. Read what is actually there, commit to it, and set confidence low to reflect the thin evidence.

Return ONLY the JSON object. No markdown fences, no preamble.`;

// Behavioural cues in the input mapped to the vocabulary the books actually
// use. Searching raw surface words ("glass", "shoes") matches incidental
// mentions; searching the underlying concept finds the passage that explains it.
const CONCEPT_MAP: [RegExp, string][] = [
  [/\bfiddl|\bfidget|\btouch(ing|ed)? (his|her|their)|\brubb(ing|ed)|\bscratch/, "pacifying self-soothing displacement adaptor"],
  [/\binterrupt|\btalk(ed|ing)? over|\bdominat|\bloud/,                          "dominance territorial assertion conversational control"],
  [/\bquiet|\bwent silent|\bwithdrew|\bavoid|\blooked away|\bshut down/,          "withdrawal blocking distancing aversion freeze"],
  [/\bsmil|\blaugh|\bgrin/,                                                      "smile zygomatic genuine masking felt"],
  [/\bnervous|\banxious|\bsweat|\bshaky|\btense/,                                "anxiety stress limbic arousal discomfort"],
  [/\bangry|\bfrustrat|\bsnapp|\birritat/,                                       "anger contempt disgust emotion trigger"],
  [/\bconfident|\bposture|\bupright|\bchest|\bspread/,                           "confidence territorial display gravity defying"],
  [/\bexpensive|\bwatch|\bbrand|\bluxur|\bdesigner|\bstatus/,                    "status signaling authority liking social proof"],
  [/\blied?|\blying|\bdeceiv|\bhid|\bevasive|\bdodge/,                           "deception leakage microexpression truth default"],
  [/\bnegotiat|\bdeal|\bprice|\boffer|\bpitch|\bsell/,                           "negotiation anchoring concession reciprocity"],
  [/\bcommit|\bpromis|\bagree|\bconsistent/,                                     "commitment consistency compliance"],
  [/\bfriend|\brapport|\bwarm|\blike(d|able)?/,                                  "rapport liking similarity friendship"],
];

// Builds the search query: the concepts implied by the input, plus the input's
// own distinctive words as a fallback when nothing maps.
function buildSearchQuery(text: string): string {
  const lower = text.toLowerCase();
  const concepts = CONCEPT_MAP.filter(([re]) => re.test(lower)).map(([, terms]) => terms);

  const stopWords = new Set(["the","a","an","is","are","was","were","be","been","have","has","had","do","does","did","will","would","could","should","may","might","this","that","these","those","and","or","but","in","on","at","to","for","of","with","by","from","as","it","its","they","their","them","he","she","his","her","we","our","you","your","i","me","my","about","when","then","they","some","very","just","really","said","went","came","like","also","what","which","there","here","much","more","most","been","were","them"]);
  const own = lower
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4 && !stopWords.has(w))
    .slice(0, 8);

  return [...concepts, ...(concepts.length ? [] : own)].join(" ");
}

// ts_rank on ~1200-char chunks lands in the 0.01–0.03 band, so this floor is
// deliberately low — it exists to drop near-zero incidental collisions, not to
// rank. Relevance comes from searching concepts rather than surface words.
const MIN_RANK = 0.012;

// Past reads the user marked wrong, fed back so the model can correct course.
// There is no fine-tuning here — the "learning" is that prior corrections ride
// along in the prompt, so repeated mistakes get called out before they recur.
async function fetchCalibration(supabase: SupabaseClient): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("analyses")
      .select("archetype, confidence, summary, outcome, outcome_note")
      .not("outcome", "is", null)
      .order("created_at", { ascending: false })
      .limit(40);

    if (error || !data?.length) return "";

    type Row = {
      archetype: string; confidence: number; summary: string;
      outcome: "success" | "partial" | "miss"; outcome_note: string | null;
    };
    const rows = data as Row[];

    // Corrections the user actually wrote up
    const corrected = rows
      .filter((r) => r.outcome !== "success" && r.outcome_note?.trim())
      .slice(0, 6);

    // Confidence calibration: are the wrong reads also the over-confident ones?
    const wrong = rows.filter((r) => r.outcome === "miss");
    const right = rows.filter((r) => r.outcome === "success");
    let confidenceNote = "";
    if (wrong.length >= 2 && right.length >= 1) {
      const avg = (xs: Row[]) => xs.reduce((s, r) => s + r.confidence, 0) / xs.length;
      const gap = Math.round(avg(wrong) - avg(right));
      if (gap > 5) {
        confidenceNote = `\nYour incorrect reads have averaged ${gap} points *higher* confidence than your correct ones — you are most overconfident precisely when you are wrong. Lower your confidence when a read feels effortless.`;
      }
    }

    if (!corrected.length && !confidenceNote) return "";

    let section = `\n\n## Calibration — where you have been wrong before\n\nThese are your own past reads on other people, with the user's correction. They are not about the person you are analysing now. Use them to avoid repeating the same class of mistake.\n`;

    for (const r of corrected) {
      section += `\n- You read them as "${r.archetype}" at ${r.confidence}% confidence. The user marked this ${r.outcome.toUpperCase()} and said: "${r.outcome_note!.trim()}"`;
    }
    section += confidenceNote;
    section += `\n\nBefore committing to a read, check it against these corrections. If you are about to make a similar inference, either find stronger evidence or say something different.`;

    console.log(`[analyze] calibration: ${corrected.length} corrections${confidenceNote ? " + confidence note" : ""}`);
    return section;
  } catch {
    return "";
  }
}

async function fetchRelevantChunks(supabase: SupabaseClient, queryText: string): Promise<string> {
  try {
    const keywords = buildSearchQuery(queryText);
    if (!keywords) return "";

    // Over-fetch, then keep only passages that clear the relevance floor.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("search_book_chunks", {
      query_text: keywords,
      match_count: 12,
    });

    if (error || !data?.length) {
      if (error) console.error("[analyze] book search error:", error.message);
      return "";
    }

    type Hit = { book_title: string; author: string; chunk_text: string; rank: number };
    const hits = (data as Hit[]).filter((c) => c.rank >= MIN_RANK).slice(0, 4);

    if (!hits.length) {
      console.log("[analyze] no library passage cleared the relevance floor — skipping");
      return "";
    }

    console.log("[analyze] library hits:", hits.map((h) => `${h.book_title}(${h.rank.toFixed(3)})`).join(", "));

    const passages = hits
      .map((c) => `[${c.book_title} — ${c.author}]\n${c.chunk_text}`)
      .join("\n\n---\n\n");

    return `\n\n## Relevant passages from your knowledge library\n\nThese come from books the user uploaded. Where one genuinely explains what you are seeing, use its vocabulary and cite that exact book. If a passage is not relevant, ignore it — do not force a citation.\n\n${passages}`;
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const { image, text } = await req.json() as { image?: string; text?: string };

    if (!image && !text?.trim()) {
      return NextResponse.json({ error: "Provide an image or description." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY!;
    console.log("[analyze] key prefix:", apiKey?.slice(0, 8), "models:", MODELS.join(" → "));

    // Build query for full-text book search
    const queryText = text?.trim()
      || "personality traits behavior patterns psychology persuasion body language";

    // Fetch relevant book passages (non-blocking — falls back to empty string on failure)
    const [bookContext, calibration] = await Promise.all([
      fetchRelevantChunks(supabase, queryText),
      fetchCalibration(supabase),
    ]);
    if (bookContext) console.log("[analyze] injecting book context, length:", bookContext.length);

    const PROMPT = BASE_PROMPT + bookContext + calibration;

    // Build Gemini REST payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [];
    if (image) {
      const base64Data = image.includes(",") ? image.split(",")[1] : image;
      parts.push({ inline_data: { mime_type: "image/jpeg", data: base64Data } });
    }
    const userContext = text?.trim() ? `\n\nAdditional context: ${text.trim()}` : "";
    parts.push({ text: PROMPT + userContext });

    const body = JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 1.1,        // vivid, committed prose rather than safe hedging
        topP: 0.95,
        maxOutputTokens: 4096,   // room for the longer observation/inference fields
        responseMimeType: "application/json",
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let geminiJson: any = null;
    let lastErr = "";

    for (const model of MODELS) {
      const res = await fetch(`${modelUrl(model)}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const json = await res.json();

      if (res.ok) {
        console.log("[analyze] model:", model, "status:", res.status);
        geminiJson = json;
        break;
      }

      lastErr = json?.error?.message ?? JSON.stringify(json);
      console.warn(`[analyze] ${model} failed (${res.status}), trying next:`, lastErr.slice(0, 120));
    }

    if (!geminiJson) {
      return NextResponse.json({ error: `Gemini: ${lastErr}` }, { status: 500 });
    }

    const raw: string = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    console.log("[analyze] raw:", raw.slice(0, 150));

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`No JSON in response. Raw: ${raw.slice(0, 300)}`);

    const profile = JSON.parse(jsonMatch[0]);

    // Persist to Supabase
    const { data: saved, error: saveErr } = await supabase.from("analyses").insert({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      input_type: (image ? "camera" : "text") as any,
      input_text: text?.trim() ?? null,
      archetype: profile.archetype,
      confidence: profile.confidence,
      summary: profile.summary ?? "",
      dominant_traits: profile.dominantTraits ?? [],
      methodology: profile.methodology ?? [],
      persuasion_angles: profile.persuasionAngles ?? [],
      outcome: null,
      outcome_note: null,
      user_id: user.id,
    }).select("id").single();

    if (saveErr) console.error("[analyze] supabase error:", saveErr.message);
    else console.log("[analyze] saved id:", saved?.id);

    return NextResponse.json({ ...profile, id: saved?.id ?? null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[analyze] unhandled:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
