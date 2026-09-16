import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PROMPT = `You are Pocket Jane — a psychological profiling intelligence modelled on Patrick Jane from The Mentalist.

Analyze the person described or shown and return a JSON object with this exact structure:

{
  "archetype": "<2-4 word psychological archetype, e.g. 'The Calculated Optimist'>",
  "confidence": <integer 50-95, your confidence in this read>,
  "summary": "<one punchy sentence summarising this person's core psychology>",
  "dominantTraits": [
    { "name": "<trait name>", "strength": <integer 50-95> },
    { "name": "<trait name>", "strength": <integer 50-95> },
    { "name": "<trait name>", "strength": <integer 50-95> }
  ],
  "methodology": [
    {
      "icon": "⊕",
      "framework": "<Author — Framework name>",
      "observation": "<what you observed or inferred>",
      "inference": "<what it means about them>",
      "cite": "<Book title, Ch.N>"
    },
    {
      "icon": "◈",
      "framework": "<Author — Framework name>",
      "observation": "<what you observed or inferred>",
      "inference": "<what it means about them>",
      "cite": "<Book title, Ch.N>"
    },
    {
      "icon": "◉",
      "framework": "<Author — Framework name>",
      "observation": "<what you observed or inferred>",
      "inference": "<what it means about them>",
      "cite": "<Book title, Ch.N>"
    }
  ],
  "persuasionAngles": [
    { "label": "Lead with", "text": "<the opener or hook that will land>" },
    { "label": "Avoid", "text": "<what will make them shut down>" },
    { "label": "Unlock with", "text": "<the exact question or move that opens them up>" },
    { "label": "Expect objection", "text": "<the objection they'll raise and how to counter it>" }
  ]
}

Draw from Cialdini (Influence), Ekman (Emotions Revealed), Kahneman (Thinking Fast and Slow), Navarro (What Every BODY is Saying), Voss (Never Split the Difference), Carnegie (How to Win Friends), and Frankl (Man's Search for Meaning).

Be specific and insightful — not generic. Patrick Jane reads people in seconds and is always right. Return ONLY valid JSON, no markdown, no explanation.`;

const MODEL = "gemini-3.1-flash-lite";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export async function POST(req: NextRequest) {
  try {
    const { image, text } = await req.json() as { image?: string; text?: string };

    if (!image && !text?.trim()) {
      return NextResponse.json({ error: "Provide an image or description." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    console.log("[analyze] key prefix:", apiKey?.slice(0, 8), "model:", MODEL);

    // Build Gemini REST payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [];
    if (image) {
      const base64Data = image.includes(",") ? image.split(",")[1] : image;
      parts.push({ inline_data: { mime_type: "image/jpeg", data: base64Data } });
    }
    const userContext = text?.trim() ? `\n\nAdditional context: ${text.trim()}` : "";
    parts.push({ text: PROMPT + userContext });

    const geminiRes = await fetch(`${API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }] }),
    });

    const geminiJson = await geminiRes.json();
    console.log("[analyze] status:", geminiRes.status);

    if (!geminiRes.ok) {
      const errMsg = geminiJson?.error?.message ?? JSON.stringify(geminiJson);
      console.error("[analyze] Gemini error:", errMsg);
      return NextResponse.json({ error: `Gemini: ${errMsg}` }, { status: 500 });
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
