import { LIMITS } from "@/lib/limits";

// Pure text handling for library uploads. Kept out of the component so it
// can be tested without a browser or a PDF.

const CHUNK_SIZE = 1200;    // characters per passage
const CHUNK_OVERLAP = 150;  // so a sentence split across the boundary is still findable
const MIN_CHUNK = 120;      // shorter than this is page furniture, not a passage

/** Splits extracted PDF text into overlapping passages, capped per book. */
export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const chunk = text.slice(i, i + CHUNK_SIZE).trim();
    if (chunk.length > MIN_CHUNK) chunks.push(chunk);
    if (chunks.length >= LIMITS.CHUNKS_PER_BOOK) break;
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

/** "Emotions_Revealed - Paul_Ekman.pdf" → { title: "Emotions Revealed", author: "Paul Ekman" } */
export function parseFilename(filename: string): { title: string; author: string } {
  const clean = (s: string) => s.replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  const noExt = filename.replace(/\.pdf$/i, "");
  const parts = noExt.split(/\s*[-–—]\s*/).map(clean).filter(Boolean);

  const truncate = (s: string) => s.slice(0, LIMITS.TITLE_CHARS);

  if (parts.length >= 2) {
    return { title: truncate(parts[0]), author: truncate(parts.slice(1).join(" - ")) };
  }
  return { title: truncate(clean(noExt)) || "Untitled", author: "Unknown" };
}
