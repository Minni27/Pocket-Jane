"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/lib/supabase";
import { Icon } from "@/components/ui";

type UploadStatus = {
  id: string;
  name: string;
  progress: number;
  status: "queued" | "extracting" | "ingesting" | "done" | "error";
  detail?: string;
};

const MAX_FILE_BYTES = 60 * 1024 * 1024; // 60MB — scanned-ish book PDFs run large
const MAX_BOOKS      = 7;
const MAX_CHUNKS_PER_BOOK = 4000;        // ~4.8M characters; guards against runaway PDFs

const CHUNK_SIZE   = 1200; // characters per chunk
const CHUNK_BATCH  = 200;  // chunks per /api/ingest request (keeps payloads ~250KB)
const CHUNK_OVERLAP = 150;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const chunk = text.slice(i, i + CHUNK_SIZE).trim();
    if (chunk.length > 120) chunks.push(chunk);
    if (chunks.length >= MAX_CHUNKS_PER_BOOK) break;
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

async function extractPdfText(
  file: File,
  onProgress: (pct: number) => void
): Promise<string> {
  // Dynamically import pdfjs to avoid SSR issues
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc =
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageText = content.items.map((item: any) => item.str ?? "").join(" ");
    fullText += pageText + "\n";
    onProgress(Math.round((p / pdf.numPages) * 50)); // first 50% = extraction
  }
  return fullText;
}

async function ingestChunks(
  bookTitle: string,
  author: string,
  chunks: string[],
  onProgress: (pct: number) => void // 50–100%
): Promise<void> {
  const totalBatches = Math.ceil(chunks.length / CHUNK_BATCH);
  for (let b = 0; b < totalBatches; b++) {
    const batch = chunks.slice(b * CHUNK_BATCH, (b + 1) * CHUNK_BATCH);
    const res = await fetch("/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookTitle, author, chunks: batch, startIndex: b * CHUNK_BATCH }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error ?? "Ingest failed");
    }
    onProgress(50 + Math.round(((b + 1) / totalBatches) * 50));
  }
}

// "Emotions_Revealed -Paul_Ekman.pdf" → { title: "Emotions Revealed", author: "Paul Ekman" }
function parseFilename(filename: string): { title: string; author: string } {
  const clean = (s: string) => s.replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  const noExt = filename.replace(/\.pdf$/i, "");
  const parts = noExt.split(/\s*[-–—]\s*/).map(clean).filter(Boolean);

  if (parts.length >= 2) return { title: parts[0], author: parts.slice(1).join(" - ") };
  return { title: clean(noExt), author: "Unknown" };
}

type IndexedBook = { book_title: string; author: string; chunk_count: number };

export default function LibraryPage() {
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [books, setBooks] = useState<IndexedBook[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);

  const pending      = useRef<{ file: File; id: string }[]>([]);
  const queueRunning = useRef(false);
  const uploadsRef   = useRef<UploadStatus[]>([]);
  const booksRef     = useRef<IndexedBook[]>([]);
  useEffect(() => { uploadsRef.current = uploads; }, [uploads]);
  useEffect(() => { booksRef.current = books; }, [books]);

  const refreshBooks = useCallback(async () => {
    // library_books is a grouped view — one row per book, so no 1000-row cap issues
    const { data, error } = await supabase
      .from("library_books")
      .select("book_title, author, chunk_count")
      .order("book_title");

    if (error) {
      console.error("[library] fetch error:", error.message);
      setLoadingBooks(false);
      return;
    }
    setBooks((data as IndexedBook[]) ?? []);
    setLoadingBooks(false);
  }, []);

  useEffect(() => { refreshBooks(); }, [refreshBooks]);

  async function deleteBook(title: string) {
    await supabase.from("book_chunks").delete().eq("book_title", title);
    setBooks((prev) => prev.filter((b) => b.book_title !== title));
  }

  function setStatus(id: string, patch: Partial<UploadStatus>) {
    setUploads((prev) => prev.map((u) => u.id === id ? { ...u, ...patch } : u));
  }

  async function processFile(file: File, id: string) {
    const name = file.name;
    try {
      const { title: bookTitle, author } = parseFilename(name);

      // Replace any existing copy of this book so re-uploads don't duplicate
      await supabase.from("book_chunks").delete().eq("book_title", bookTitle);

      const fullText = await extractPdfText(file, (pct) =>
        setStatus(id, { progress: pct, status: "extracting", detail: "Reading pages…" })
      );

      const chunks = chunkText(fullText);
      if (chunks.length === 0) throw new Error("No readable text — is this a scanned PDF?");
      setStatus(id, { progress: 50, status: "ingesting", detail: `${chunks.length} passages` });

      await ingestChunks(bookTitle, author, chunks, (pct) =>
        setStatus(id, { progress: pct, status: "ingesting", detail: `Storing… ${pct}%` })
      );

      setStatus(id, { progress: 100, status: "done", detail: `${chunks.length} passages indexed` });
      refreshBooks();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setStatus(id, { status: "error", detail: msg });
    }
  }

  // Files are processed one at a time — extracting 9 PDFs concurrently
  // exhausts browser memory and locks the tab.
  async function drainQueue() {
    if (queueRunning.current) return;
    queueRunning.current = true;
    while (pending.current.length > 0) {
      const next = pending.current.shift()!;
      await processFile(next.file, next.id);
    }
    queueRunning.current = false;
  }

  const onDrop = useCallback((accepted: File[]) => {
    const pdfs = accepted.filter((f) => f.type === "application/pdf");
    const fresh: UploadStatus[] = [];

    // Titles already held, plus anything queued this drop, so the cap counts
    // the whole batch rather than letting 7 files through one at a time.
    const titles = new Set(booksRef.current.map((b) => b.book_title));

    for (const file of pdfs) {
      const name = file.name;
      const id = `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const alreadyQueued =
        pending.current.some((p) => p.file.name === name) ||
        uploadsRef.current.some((u) => u.name === name && u.status !== "error" && u.status !== "done");
      if (alreadyQueued) continue;

      // Reject oversized files before reading them — extractPdfText pulls the
      // whole thing into memory as an ArrayBuffer.
      if (file.size > MAX_FILE_BYTES) {
        fresh.push({
          id, name, progress: 0, status: "error",
          detail: `Too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Limit is ${MAX_FILE_BYTES / 1024 / 1024}MB.`,
        });
        continue;
      }

      const { title } = parseFilename(name);
      if (!titles.has(title) && titles.size >= MAX_BOOKS) {
        fresh.push({
          id, name, progress: 0, status: "error",
          detail: `Library is full (${MAX_BOOKS} books). Remove one first.`,
        });
        continue;
      }
      titles.add(title);

      pending.current.push({ file, id });
      fresh.push({ id, name, progress: 0, status: "queued", detail: "Waiting…" });
    }

    if (fresh.length) setUploads((prev) => [...prev, ...fresh]);
    drainQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshBooks]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "application/pdf": [".pdf"] }, multiple: true,
  });

  return (
    <div className="flex flex-col flex-1 px-4 py-8 max-w-4xl mx-auto w-full gap-10">

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.1, marginBottom: "6px" }}>
          Knowledge Library
        </h1>
        <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-muted)" }}>
          Upload PDFs of psychology and persuasion books. Jane reads them and cites them in every analysis.
        </p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        style={{
          padding: "48px 32px", borderRadius: "12px", cursor: "pointer",
          border: `2px dashed ${isDragActive ? "var(--border-accent)" : "var(--border)"}`,
          background: isDragActive ? "var(--raised)" : "var(--surface)",
          transition: "all 0.25s ease", textAlign: "center",
          boxShadow: isDragActive ? "var(--shadow-glow)" : "none",
        }}
      >
        <input {...getInputProps()} />
        <div style={{
          width: "56px", height: "56px", borderRadius: "12px", margin: "0 auto 16px",
          background: isDragActive ? "var(--raised)" : "var(--surface)",
          border: `1px solid ${isDragActive ? "var(--border-accent)" : "var(--border)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22px", color: "var(--accent)", transition: "all 0.25s ease",
        }}>
          <Icon name={isDragActive ? "plus" : "books"} size={24} />
        </div>
        <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "22px", fontWeight: 500, color: isDragActive ? "var(--text-primary)" : "var(--text-dim)", marginBottom: "6px", transition: "color 0.25s ease" }}>
          {isDragActive ? "Release to ingest" : "Drop your books here"}
        </p>
        <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-ghost)" }}>
          PDF only · up to {MAX_BOOKS} books · {MAX_FILE_BYTES / 1024 / 1024}MB each
        </p>
      </div>

      {/* Upload queue */}
      {uploads.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionLabel>Processing Queue</SectionLabel>
          {uploads.map((u) => (
            <div
              key={u.id}
              className="card p-4 flex items-center gap-4"
              style={{
                borderColor: u.status === "done"
                  ? "var(--border)"
                  : u.status === "error"
                    ? "var(--border-accent)"
                    : "var(--border)",
              }}
            >
              <div style={{
                width: "36px", height: "36px", borderRadius: "8px", flexShrink: 0,
                background: "var(--raised)",
                border: `1px solid ${u.status === "done" ? "var(--border)" : "var(--border-accent)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px",
                color: u.status === "done" ? "var(--signal)" : u.status === "error" ? "var(--accent)" : "var(--accent)",
              }}>
                {u.status === "done" ? <Icon name="check" size={15}/> : u.status === "error" ? <Icon name="alert" size={15}/> : u.status === "queued" ? <Icon name="clock" size={15}/> : <Spinner />}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", gap: "8px" }}>
                  <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", fontWeight: 400, color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.name}
                  </p>
                  <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.06em", color: u.status === "done" ? "var(--signal)" : u.status === "error" ? "var(--accent)" : "var(--text-muted)", flexShrink: 0, whiteSpace: "nowrap" }}>
                    {u.status === "done" ? "Indexed" : u.status === "error" ? "Failed" : u.status === "queued" ? "Queued" : `${u.progress}%`}
                  </span>
                </div>
                {u.detail && (
                  <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: u.status === "error" ? "var(--accent)" : "var(--text-ghost)", marginBottom: "6px" }}>
                    {u.detail}
                  </p>
                )}
                {u.status !== "error" && (
                  <div className="rounded-full" style={{ height: "3px", background: "var(--raised)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${u.progress}%`,
                        background: u.status === "done"
                          ? "linear-gradient(90deg, var(--accent-deep), var(--signal))"
                          : "linear-gradient(90deg, var(--accent), var(--accent-bright))",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Indexed books */}
      <div className="flex flex-col gap-4">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
          <SectionLabel>In Your Library</SectionLabel>
          {books.length > 0 && (
            <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: books.length >= MAX_BOOKS ? "var(--accent)" : "var(--text-muted)", flexShrink: 0 }}>
              {books.length} of {MAX_BOOKS} books ·{" "}
              {books.reduce((s, b) => s + b.chunk_count, 0).toLocaleString()} passages
            </span>
          )}
        </div>

        {loadingBooks ? (
          <div className="flex flex-col gap-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="card p-4" style={{ height: "60px" }}>
                <div className="shimmer h-3 w-40 rounded mb-2" />
                <div className="shimmer h-2 w-24 rounded" />
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="card p-8 text-center">
            <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "18px", color: "var(--text-muted)", fontStyle: "italic" }}>
              Nothing indexed yet.
            </p>
            <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", color: "var(--text-ghost)", marginTop: "6px" }}>
              Drop a PDF above and Jane will start citing it.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {books.map((b) => (
              <div key={b.book_title} className="card p-4 flex items-center gap-4" style={{ borderColor: "var(--border)" }}>
                <div style={{
                  width: "34px", height: "42px", borderRadius: "4px", flexShrink: 0,
                  background: "var(--raised)", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "12px", color: "var(--signal)",
                }}>
                  <Icon name="books" size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "16px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {b.book_title}
                  </p>
                  <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "var(--text-muted)" }}>
                    {b.author !== "Unknown" ? `${b.author} · ` : ""}{b.chunk_count.toLocaleString()} passages
                  </p>
                </div>
                <button
                  onClick={() => deleteBook(b.book_title)}
                  title="Remove from library"
                  style={{
                    width: "28px", height: "28px", borderRadius: "6px", flexShrink: 0,
                    background: "transparent", border: "1px solid var(--border)",
                    color: "var(--text-ghost)", cursor: "pointer", fontSize: "12px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.borderColor = "var(--border-accent)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-ghost)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}>
      {children}
    </p>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M12 3 A9 9 0 0 1 21 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
