import type { SupabaseClient } from "@supabase/supabase-js";
import type { Logger } from "@/lib/log";
import { fenceData } from "@/lib/analyze/prompt";

// Behavioural cues in the input mapped to the vocabulary the books actually
// use. Searching raw surface words ("glass", "shoes") matches incidental
// mentions; searching the underlying concept finds the passage that explains it.
export const CONCEPT_MAP: [RegExp, string][] = [
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

const STOP_WORDS = new Set(["the","a","an","is","are","was","were","be","been","have","has","had","do","does","did","will","would","could","should","may","might","this","that","these","those","and","or","but","in","on","at","to","for","of","with","by","from","as","it","its","they","their","them","he","she","his","her","we","our","you","your","i","me","my","about","when","then","some","very","just","really","said","went","came","like","also","what","which","there","here","much","more","most"]);

/**
 * Builds the search query: the concepts implied by the input, plus the input's
 * own distinctive words as a fallback when nothing maps.
 */
export function buildSearchQuery(text: string): string {
  const lower = text.toLowerCase();
  const concepts = CONCEPT_MAP.filter(([re]) => re.test(lower)).map(([, terms]) => terms);

  const own = lower
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4 && !STOP_WORDS.has(w))
    .slice(0, 8);

  return [...concepts, ...(concepts.length ? [] : own)].join(" ");
}

// ts_rank on ~1200-char chunks lands in the 0.01–0.03 band, so this floor is
// deliberately low — it exists to drop near-zero incidental collisions, not to
// rank. Relevance comes from searching concepts rather than surface words.
export const MIN_RANK = 0.012;

type Hit = { book_title: string; author: string; chunk_text: string; rank: number };

/** Ranked passages from the caller's own library, fenced as untrusted data. */
export async function fetchRelevantChunks(
  supabase: SupabaseClient,
  queryText: string,
  log: Logger
): Promise<string> {
  try {
    const keywords = buildSearchQuery(queryText);
    if (!keywords) return "";

    // Over-fetch, then keep only passages that clear the relevance floor.
    const { data, error } = await supabase.rpc("search_book_chunks", {
      query_text: keywords,
      match_count: 12,
    });

    if (error || !data?.length) {
      if (error) log.warn("book search failed", { err: error.message });
      return "";
    }

    const hits = (data as Hit[]).filter((c) => c.rank >= MIN_RANK).slice(0, 4);
    if (!hits.length) {
      log.info("no passage cleared the relevance floor");
      return "";
    }

    log.info("library hits", { books: hits.map((h) => h.book_title), ranks: hits.map((h) => +h.rank.toFixed(3)) });

    const passages = hits
      .map((c) => `[${c.book_title} — ${c.author}]\n${c.chunk_text}`)
      .join("\n\n---\n\n");

    return fenceData(
      "passages from books the user uploaded",
      `## Relevant passages from your knowledge library\n\nWhere one genuinely explains what you are seeing, use its vocabulary and cite that exact book. If a passage is not relevant, ignore it — do not force a citation.\n\n${passages}`
    );
  } catch {
    return "";
  }
}
