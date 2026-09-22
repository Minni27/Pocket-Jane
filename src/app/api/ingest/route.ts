import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createLogger } from "@/lib/log";
import { internalError, jsonError, sameOrigin } from "@/lib/http";
import { LIMITS } from "@/lib/limits";
import { ingestRequest } from "@/lib/schemas";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const log = createLogger("ingest");

  try {
    if (!sameOrigin(req)) return jsonError(403, "Cross-origin request refused.");

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonError(401, "Not signed in.");

    // Every field is validated here: title and author length, passage count,
    // passage size, and that startIndex is a non-negative integer. The browser
    // checks the same limits for early feedback, but a request can be made
    // without the browser, and storage on the free tier is finite.
    const parsed = ingestRequest.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      log.warn("rejected payload", { path: issue?.path.join("."), code: issue?.code });
      return jsonError(400, `Invalid upload: ${issue?.path.join(".") ?? "body"} — ${issue?.message ?? "malformed"}.`);
    }
    const { bookTitle, author, chunks, startIndex } = parsed.data;
    const title = bookTitle.trim();

    // Book cap. Counted per distinct title, and the title being uploaded is
    // excluded so replacing an existing book is never blocked — the client
    // deletes the old copy first, but a mid-upload retry could otherwise
    // trip the limit on the user's own book.
    // Read the grouped view, not raw chunks: selecting book_title from
    // book_chunks caps at 1000 rows, so a single large book would mask every
    // other title and the limit would never trigger.
    const { data: existing } = await supabase
      .from("library_books")
      .select("book_title")
      .neq("book_title", title);

    const distinct = new Set((existing ?? []).map((r) => (r as { book_title: string }).book_title));
    if (distinct.size >= LIMITS.BOOKS_PER_USER) {
      return jsonError(409, `Library is full — ${LIMITS.BOOKS_PER_USER} books maximum. Remove one before adding another.`, { code: "LIBRARY_FULL" });
    }

    // Per-book passage cap, enforced server-side. Without this, a client
    // could loop this endpoint and store unbounded text under one title —
    // 250 passages per request is no limit at all if the requests never stop.
    const { count: already } = await supabase
      .from("book_chunks")
      .select("id", { count: "exact", head: true })
      .eq("book_title", title);

    if ((already ?? 0) + chunks.length > LIMITS.CHUNKS_PER_BOOK) {
      log.warn("per-book passage cap hit", { user: user.id, already, adding: chunks.length });
      return jsonError(413, `That book is too long — ${LIMITS.CHUNKS_PER_BOOK} passages maximum.`, { code: "BOOK_TOO_LONG" });
    }

    const rows = chunks.map((chunk_text, i) => ({
      book_title: title,
      author: author?.trim() || "Unknown",
      chunk_index: startIndex + i,
      chunk_text,
      user_id: user.id,
    }));

    const { error } = await supabase.from("book_chunks").insert(rows);
    if (error) {
      log.error("insert failed", { err: error.message });
      return jsonError(500, `Those passages could not be stored. Reference: ${log.requestId}`);
    }

    log.info("passages stored", { count: rows.length, title });
    return NextResponse.json({ stored: rows.length });
  } catch (err) {
    return internalError(log, err, "unhandled");
  }
}
