// Product limits, in one place, imported by both the browser and the API.
// The client uses them for early feedback; the server enforces them. If
// they disagree the user sees a confusing error after a long upload, so
// they must never be duplicated.

export const LIMITS = {
  /** Books per account. Supabase free tier is 500MB; 7 books × ~5MB of text is safe. */
  BOOKS_PER_USER: 7,
  /** Passages per book — ~4.8M characters. Guards against runaway PDFs. */
  CHUNKS_PER_BOOK: 4000,
  /** Passages per /api/ingest request. Keeps request bodies ~250KB. */
  CHUNKS_PER_REQUEST: 250,
  /** Characters per stored passage. A malformed PDF can yield huge "passages". */
  CHUNK_CHARS: 4000,
  /** Characters for book title and author. */
  TITLE_CHARS: 200,
  /** PDF file size accepted by the browser. */
  PDF_BYTES: 60 * 1024 * 1024,

  /** Decoded size of the base64 image sent to /api/analyze. */
  IMAGE_BYTES: 5 * 1024 * 1024,
  /** Characters of description or context. */
  TEXT_CHARS: 4000,
  /** Readings per user per hour. */
  READINGS_PER_HOUR: 20,
  /** Readings across every account per day — a circuit breaker for the
   *  Gemini free-tier quota, so one runaway client can't exhaust it for
   *  everyone. Raise this when you move to a paid tier. */
  READINGS_PER_DAY_GLOBAL: 400,
  /** Characters of an outcome note. */
  OUTCOME_NOTE_CHARS: 2000,
} as const;
