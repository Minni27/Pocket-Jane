import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
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
