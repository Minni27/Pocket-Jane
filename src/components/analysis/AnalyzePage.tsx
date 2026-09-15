"use client";

import { useState } from "react";
import CameraCapture from "@/components/camera/CameraCapture";
import TextInput from "@/components/analysis/TextInput";
import AnalysisOutput from "@/components/analysis/AnalysisOutput";

type InputMode = "camera" | "text";

export default function AnalyzePage() {
  const [mode, setMode] = useState<InputMode>("camera");
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<null | object>(null);

  function handleSnapshot(dataUrl: string) {
    setSnapshot(dataUrl);
    setResult(null);
  }

  function handleAnalyze() {
    if (isAnalyzing) return;
    if (mode === "camera" && !snapshot) return;
    if (mode === "text" && !text.trim()) return;
    // TODO: wire to /api/analyze
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setResult({ _placeholder: true });
    }, 2500);
  }

  return (
    <div
      className="flex flex-col flex-1 px-4 py-8 max-w-4xl mx-auto w-full"
      style={{ gap: "28px" }}
    >
      {/* ── Page header ─────────────────────────────────────── */}
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
          Profile Analysis
        </h1>
        <p
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "13px",
            fontWeight: 300,
            color: "#6e6860",
            letterSpacing: "0.02em",
          }}
        >
          Capture a moment or describe someone. Jane does the rest.
        </p>
      </div>

      {/* ── Mode toggle ─────────────────────────────────────── */}
      <div
        className="flex gap-1 p-1 self-start rounded-lg"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {(["camera", "text"] as InputMode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setSnapshot(null); setResult(null); }}
            style={{
              padding: "7px 20px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "12px",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              transition: "all 0.2s ease",
              background: mode === m ? "rgba(139,26,48,0.25)" : "transparent",
              color: mode === m ? "#c9a84c" : "#6e6860",
              boxShadow: mode === m ? "0 0 12px rgba(139,26,48,0.2)" : "none",
            }}
          >
            {m === "camera" ? "◎ Camera" : "✦ Describe"}
          </button>
        ))}
      </div>

      {/* ── Input area ──────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          {mode === "camera" ? (
            <CameraCapture
              onSnapshot={handleSnapshot}
              snapshot={snapshot}
            />
          ) : (
            <TextInput value={text} onChange={setText} />
          )}
        </div>

        {/* ── Side panel ──────────────────────────────────── */}
        <div
          className="flex flex-col gap-4 lg:w-64"
        >
          {/* Snapshot preview in text mode (if previously captured) */}
          {mode === "text" && snapshot && (
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: "1px solid rgba(168,131,42,0.2)" }}
            >
              <img src={snapshot} alt="Captured" className="w-full object-cover" />
              <div
                className="px-3 py-2 flex items-center justify-between"
                style={{ background: "rgba(168,131,42,0.08)" }}
              >
                <span style={{ fontSize: "11px", color: "#a8832a", fontFamily: "var(--font-inter)" }}>
                  Snapshot attached
                </span>
                <button
                  onClick={() => setSnapshot(null)}
                  style={{ fontSize: "11px", color: "#6e6860", background: "none", border: "none", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || (mode === "camera" ? !snapshot : !text.trim())}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid rgba(139,26,48,0.5)",
              background: isAnalyzing
                ? "rgba(139,26,48,0.1)"
                : "linear-gradient(135deg, #8b1a30, #5c0a17)",
              color: "#f0ead8",
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "20px",
              fontWeight: 400,
              letterSpacing: "0.04em",
              cursor: isAnalyzing || (mode === "camera" ? !snapshot : !text.trim())
                ? "not-allowed"
                : "pointer",
              opacity: (mode === "camera" ? !snapshot : !text.trim()) && !isAnalyzing ? 0.4 : 1,
              boxShadow: isAnalyzing ? "none" : "0 0 24px rgba(139,26,48,0.25)",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {isAnalyzing ? (
              <>
                <AnalyzingSpinner />
                <span>Reading…</span>
              </>
            ) : (
              "Analyze"
            )}
          </button>

          {/* Context hint */}
          <div
            className="rounded-lg p-4"
            style={{
              background: "rgba(168,131,42,0.05)",
              border: "1px solid rgba(168,131,42,0.12)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontSize: "13px",
                fontStyle: "italic",
                color: "#6e6860",
                lineHeight: 1.6,
              }}
            >
              Add context about the situation — where you met, what they want,
              what they said. Jane uses it to sharpen the read.
            </p>
          </div>
        </div>
      </div>

      {/* ── Analysis output ─────────────────────────────────── */}
      {(isAnalyzing || result) && (
        <AnalysisOutput isLoading={isAnalyzing} result={result} />
      )}
    </div>
  );
}

function AnalyzingSpinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      style={{ animation: "spin 1s linear infinite" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="12" cy="12" r="9"
        fill="none"
        stroke="rgba(240,234,216,0.3)"
        strokeWidth="2"
      />
      <path
        d="M12 3 A9 9 0 0 1 21 12"
        fill="none"
        stroke="#f0ead8"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
