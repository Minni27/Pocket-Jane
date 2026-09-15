"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

const suggestedBooks = [
  { author: "Robert Cialdini",     title: "Influence",                    tag: "Persuasion" },
  { author: "Joe Navarro",         title: "What Every Body Is Saying",     tag: "Body Language" },
  { author: "Daniel Kahneman",     title: "Thinking, Fast and Slow",       tag: "Cognition" },
  { author: "Paul Ekman",          title: "Emotions Revealed",             tag: "Microexpressions" },
  { author: "Chris Voss",          title: "Never Split the Difference",    tag: "Negotiation" },
  { author: "Robert Greene",       title: "The 48 Laws of Power",          tag: "Strategy" },
  { author: "Jack Schafer",        title: "The Like Switch",               tag: "Rapport" },
  { author: "Richard Thaler",      title: "Nudge",                         tag: "Behavioral Econ" },
];

type UploadStatus = { name: string; progress: number; status: "processing" | "done" | "error" };

export default function LibraryPage() {
  const [uploads, setUploads] = useState<UploadStatus[]>([]);

  const onDrop = useCallback((accepted: File[]) => {
    const pdfs = accepted.filter((f) => f.type === "application/pdf");
    pdfs.forEach((file) => {
      setUploads((prev) => [...prev, { name: file.name, progress: 0, status: "processing" }]);
      // Simulate progress — real impl will batch embed chunks
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 18 + 5;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          setUploads((prev) =>
            prev.map((u) => u.name === file.name ? { ...u, progress: 100, status: "done" } : u)
          );
        } else {
          setUploads((prev) =>
            prev.map((u) => u.name === file.name ? { ...u, progress: Math.floor(p) } : u)
          );
        }
      }, 300);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
  });

  return (
    <div className="flex flex-col flex-1 px-4 py-8 max-w-4xl mx-auto w-full gap-10">

      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h1
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 300,
            color: "#f0ead8",
            lineHeight: 1.1,
            marginBottom: "6px",
          }}
        >
          Knowledge Library
        </h1>
        <p
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "13px",
            fontWeight: 300,
            color: "#6e6860",
          }}
        >
          Upload PDFs of psychology and persuasion books. Jane reads them and cites them in every analysis.
        </p>
      </div>

      {/* ── Drop zone ───────────────────────────────────────── */}
      <div
        {...getRootProps()}
        style={{
          padding: "48px 32px",
          borderRadius: "12px",
          border: `2px dashed ${isDragActive ? "rgba(139,26,48,0.6)" : "rgba(255,255,255,0.08)"}`,
          background: isDragActive
            ? "rgba(139,26,48,0.06)"
            : "rgba(15,14,20,0.6)",
          cursor: "pointer",
          transition: "all 0.25s ease",
          textAlign: "center",
          boxShadow: isDragActive ? "0 0 40px rgba(139,26,48,0.12)" : "none",
        }}
      >
        <input {...getInputProps()} />
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "12px",
            background: isDragActive ? "rgba(139,26,48,0.2)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${isDragActive ? "rgba(139,26,48,0.4)" : "rgba(255,255,255,0.08)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: "22px",
            transition: "all 0.25s ease",
          }}
        >
          {isDragActive ? "⊕" : "◈"}
        </div>
        <p
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "22px",
            fontWeight: 400,
            color: isDragActive ? "#f0ead8" : "#b8af9a",
            marginBottom: "6px",
            transition: "color 0.25s ease",
          }}
        >
          {isDragActive ? "Release to ingest" : "Drop your books here"}
        </p>
        <p
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "12px",
            fontWeight: 300,
            color: "#3a3530",
          }}
        >
          PDF only · Multiple files accepted · Processed locally in your browser
        </p>
      </div>

      {/* ── Upload queue ────────────────────────────────────── */}
      {uploads.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionLabel>Processing Queue</SectionLabel>
          {uploads.map((u) => (
            <div
              key={u.name}
              className="card p-4 flex items-center gap-4"
              style={{
                borderColor: u.status === "done"
                  ? "rgba(168,131,42,0.2)"
                  : u.status === "error"
                  ? "rgba(139,26,48,0.3)"
                  : "rgba(255,255,255,0.07)",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: u.status === "done"
                    ? "rgba(168,131,42,0.1)"
                    : "rgba(139,26,48,0.1)",
                  border: `1px solid ${u.status === "done" ? "rgba(168,131,42,0.2)" : "rgba(139,26,48,0.2)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  flexShrink: 0,
                }}
              >
                {u.status === "done" ? "✦" : u.status === "error" ? "✕" : "◎"}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "13px",
                    fontWeight: 400,
                    color: "#b8af9a",
                    marginBottom: "6px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {u.name}
                </p>
                <div
                  className="rounded-full"
                  style={{ height: "3px", background: "rgba(255,255,255,0.07)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${u.progress}%`,
                      background: u.status === "done"
                        ? "linear-gradient(90deg, #8b6020, #c9a84c)"
                        : "linear-gradient(90deg, #5c0a17, #8b1a30)",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>

              {/* Status */}
              <span
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  color: u.status === "done" ? "#a8832a" : "#6e6860",
                  flexShrink: 0,
                }}
              >
                {u.status === "done" ? "Indexed" : u.status === "error" ? "Failed" : `${u.progress}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Suggested reading ───────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <SectionLabel>Suggested Reading</SectionLabel>
        <p
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "12px",
            fontWeight: 300,
            color: "#3a3530",
            marginTop: "-8px",
          }}
        >
          The books Jane was designed around. Find PDFs of these for best results.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestedBooks.map((b) => (
            <div
              key={b.title}
              className="card p-4 flex items-center gap-4"
              style={{ transition: "border-color 0.2s ease" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "rgba(168,131,42,0.18)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")
              }
            >
              <div
                style={{
                  width: "36px",
                  height: "44px",
                  borderRadius: "4px",
                  background: "linear-gradient(160deg, #1e1b2a, #0f0e14)",
                  border: "1px solid rgba(168,131,42,0.15)",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  color: "#6b5224",
                }}
              >
                ◈
              </div>
              <div className="flex-1 min-w-0">
                <p
                  style={{
                    fontFamily: "var(--font-cormorant), serif",
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#f0ead8",
                    marginBottom: "2px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {b.title}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "11px",
                    color: "#6e6860",
                  }}
                >
                  {b.author}
                </p>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: "10px",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  color: "#6b5224",
                  background: "rgba(107,82,36,0.12)",
                  border: "1px solid rgba(107,82,36,0.2)",
                  borderRadius: "4px",
                  padding: "2px 8px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {b.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-inter), sans-serif",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "#6e6860",
      }}
    >
      {children}
    </p>
  );
}
