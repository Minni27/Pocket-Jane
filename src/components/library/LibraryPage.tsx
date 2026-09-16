"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

const suggestedBooks = [
  { author: "Robert Cialdini",  title: "Influence",                 tag: "Persuasion"      },
  { author: "Joe Navarro",      title: "What Every Body Is Saying", tag: "Body Language"   },
  { author: "Daniel Kahneman", title: "Thinking, Fast and Slow",   tag: "Cognition"       },
  { author: "Paul Ekman",       title: "Emotions Revealed",         tag: "Microexpressions"},
  { author: "Chris Voss",       title: "Never Split the Difference",tag: "Negotiation"     },
  { author: "Robert Greene",    title: "The 48 Laws of Power",      tag: "Strategy"        },
  { author: "Jack Schafer",     title: "The Like Switch",           tag: "Rapport"         },
  { author: "Richard Thaler",   title: "Nudge",                     tag: "Behavioral Econ" },
];

type UploadStatus = { name: string; progress: number; status: "processing" | "done" | "error" };

export default function LibraryPage() {
  const [uploads, setUploads] = useState<UploadStatus[]>([]);

  const onDrop = useCallback((accepted: File[]) => {
    const pdfs = accepted.filter((f) => f.type === "application/pdf");
    pdfs.forEach((file) => {
      setUploads((prev) => [...prev, { name: file.name, progress: 0, status: "processing" }]);
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 18 + 5;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          setUploads((prev) => prev.map((u) => u.name === file.name ? { ...u, progress: 100, status: "done" } : u));
        } else {
          setUploads((prev) => prev.map((u) => u.name === file.name ? { ...u, progress: Math.floor(p) } : u));
        }
      }, 300);
    });
  }, []);

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
          {isDragActive ? "⊕" : "◈"}
        </div>
        <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "22px", fontWeight: 500, color: isDragActive ? "var(--text-primary)" : "var(--text-dim)", marginBottom: "6px", transition: "color 0.25s ease" }}>
          {isDragActive ? "Release to ingest" : "Drop your books here"}
        </p>
        <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-ghost)" }}>
          PDF only · Multiple files accepted · Processed locally in your browser
        </p>
      </div>

      {/* Upload queue */}
      {uploads.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionLabel>Processing Queue</SectionLabel>
          {uploads.map((u) => (
            <div key={u.name} className="card p-4 flex items-center gap-4" style={{ borderColor: u.status === "done" ? "var(--border-gold)" : u.status === "error" ? "var(--border-accent)" : "var(--border)" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "8px", flexShrink: 0,
                background: "var(--raised)", border: `1px solid ${u.status === "done" ? "var(--border-gold)" : "var(--border-accent)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px", color: u.status === "done" ? "var(--gold)" : "var(--accent)",
              }}>
                {u.status === "done" ? "✦" : u.status === "error" ? "✕" : "◎"}
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", fontWeight: 400, color: "var(--text-dim)", marginBottom: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {u.name}
                </p>
                <div className="rounded-full" style={{ height: "3px", background: "var(--raised)" }}>
                  <div className="h-full rounded-full" style={{ width: `${u.progress}%`, background: u.status === "done" ? "linear-gradient(90deg, var(--gold-deep), var(--gold))" : "linear-gradient(90deg, var(--accent), var(--accent-bright))", transition: "width 0.3s ease" }} />
                </div>
              </div>
              <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", color: u.status === "done" ? "var(--gold)" : "var(--text-muted)", flexShrink: 0 }}>
                {u.status === "done" ? "Indexed" : u.status === "error" ? "Failed" : `${u.progress}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Suggested reading */}
      <div className="flex flex-col gap-4">
        <SectionLabel>Suggested Reading</SectionLabel>
        <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-ghost)", marginTop: "-8px" }}>
          The books Jane was designed around. Find PDFs of these for best results.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestedBooks.map((b) => (
            <div
              key={b.title}
              className="card p-4 flex items-center gap-4"
              style={{ transition: "border-color 0.2s ease" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-gold)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = ""; }}
            >
              <div style={{ width: "36px", height: "44px", borderRadius: "4px", background: "var(--raised)", border: "1px solid var(--border-gold)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "var(--gold-dim)" }}>
                ◈
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "16px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {b.title}
                </p>
                <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "var(--text-muted)" }}>
                  {b.author}
                </p>
              </div>
              <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", color: "var(--gold-dim)", background: "var(--raised)", border: "1px solid var(--border-gold)", borderRadius: "4px", padding: "2px 8px", whiteSpace: "nowrap", flexShrink: 0 }}>
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
    <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}>
      {children}
    </p>
  );
}
