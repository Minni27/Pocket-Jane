import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const maxDuration = 60;

export const MAX_BOOKS_PER_USER = 7;
const MAX_CHUNKS_PER_REQUEST = 250;
const MAX_CHUNK_CHARS = 4000;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const { bookTitle, author, chunks, startIndex = 0 } = await req.json() as {
      bookTitle: string;
      author: string;
      chunks: string[];
      startIndex?: number;
    };

    if (!bookTitle?.trim() || !chunks?.length) {
      return NextResponse.json({ error: "bookTitle and chunks required." }, { status: 400 });
    }

    if (chunks.length > MAX_CHUNKS_PER_REQUEST) {
      return NextResponse.json(
        { error: `Too many passages in one request (max ${MAX_CHUNKS_PER_REQUEST}).` },
        { status: 413 }
      );
    }

    // A malformed PDF can yield enormous "passages"; refuse rather than
    // storing megabytes of junk in a single row.
    if (chunks.some((c) => c.length > MAX_CHUNK_CHARS)) {
      return NextResponse.json({ error: "One or more passages are oversized." }, { status: 413 });
    }

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
      .neq("book_title", bookTitle.trim());

    const distinct = new Set((existing ?? []).map((r) => (r as { book_title: string }).book_title));
    if (distinct.size >= MAX_BOOKS_PER_USER) {
      return NextResponse.json(
        {
          error: `Library is full — ${MAX_BOOKS_PER_USER} books maximum. Remove one before adding another.`,
          code: "LIBRARY_FULL",
        },
        { status: 409 }
      );
    }

    const rows = chunks.map((chunk_text, i) => ({
      book_title: bookTitle.trim(),
      author: author?.trim() || "Unknown",
      chunk_index: startIndex + i,
      chunk_text,
      user_id: user.id,
    }));

    const { error } = await supabase.from("book_chunks").insert(rows);
    if (error) {
      console.error("[ingest] supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[ingest] stored ${rows.length} chunks for "${bookTitle}"`);
    return NextResponse.json({ stored: rows.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ingest] unhandled:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
