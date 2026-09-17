import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const { bookTitle, author, chunks } = await req.json() as {
      bookTitle: string;
      author: string;
      chunks: string[];
    };

    if (!bookTitle || !chunks?.length) {
      return NextResponse.json({ error: "bookTitle and chunks required." }, { status: 400 });
    }

    const rows = chunks.map((chunk_text, chunk_index) => ({
      book_title: bookTitle,
      author: author || "Unknown",
      chunk_index,
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
