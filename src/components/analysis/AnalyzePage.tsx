"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import CameraCapture from "@/components/camera/CameraCapture";
import TextInput from "@/components/analysis/TextInput";
import AnalysisOutput from "@/components/analysis/AnalysisOutput";
import type { Profile } from "@/types/profile";

type InputMode = "camera" | "text";

export default function AnalyzePage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isLight = !mounted || theme !== "dark";

  const [mode, setMode] = useState<InputMode>("camera");
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSnapshot(dataUrl: string) {
    setSnapshot(dataUrl);
    setResult(null);
    setError(null);
  }

  async function handleAnalyze() {
    if (isAnalyzing) return;
    if (mode === "camera" && !snapshot) return;
    if (mode === "text" && !text.trim()) return;

    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: mode === "camera" ? snapshot : undefined,
          text: mode === "camera"
            ? (context.trim() || undefined)
            : (text.trim() || undefined),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed.");
      setResult(data as Profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  const canAnalyze = mode === "camera" ? !!snapshot : !!text.trim();

  return (
    <div className="flex flex-col flex-1 px-4 py-8 max-w-4xl mx-auto w-full" style={{ gap: "28px" }}>

      {/* Page header */}
      <div>
        <h1 style={{
          fontFamily: "var(--font-playfair), serif",
          fontSize: "clamp(2rem, 5vw, 3rem)",
          fontWeight: 600,
          color: "var(--text-primary)",
          lineHeight: 1.1,
          marginBottom: "6px",
        }}>
          Profile Analysis
        </h1>
        <p style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: "13px",
          fontWeight: 300,
          color: "var(--text-muted)",
          letterSpacing: "0.02em",
        }}>
          Capture a moment or describe someone. Jane does the rest.
        </p>
      </div>

      {/* Mode toggle */}
      <div
        className="flex gap-1 p-1 self-start rounded-lg"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {(["camera", "text"] as InputMode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setSnapshot(null); setResult(null); setError(null); }}
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
              background: mode === m ? "var(--raised)" : "transparent",
              color: mode === m ? "var(--accent)" : "var(--text-muted)",
              boxShadow: mode === m ? "var(--shadow-card)" : "none",
            }}
          >
            {m === "camera" ? "◎ Camera" : "✦ Describe"}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          {mode === "camera" ? (
            <CameraCapture onSnapshot={handleSnapshot} snapshot={snapshot} />
          ) : (
            <TextInput value={text} onChange={setText} />
          )}
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-4 lg:w-64">
          {mode === "text" && snapshot && (
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-gold)" }}>
              <img src={snapshot} alt="Captured" className="w-full object-cover" />
              <div className="px-3 py-2 flex items-center justify-between" style={{ background: "var(--surface)" }}>
                <span style={{ fontSize: "11px", color: "var(--gold-dim)", fontFamily: "var(--font-inter)" }}>
                  Snapshot attached
                </span>
                <button
                  onClick={() => setSnapshot(null)}
                  style={{ fontSize: "11px", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !canAnalyze}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid var(--border-accent)",
              background: isAnalyzing
                ? "var(--surface)"
                : isLight
                  ? "linear-gradient(135deg, #2d5be3, #0f2060)"
                  : "linear-gradient(135deg, #b91c1c, #7f1d1d)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-playfair), serif",
              fontSize: "20px",
              fontWeight: 500,
              letterSpacing: "0.04em",
              cursor: isAnalyzing || !canAnalyze ? "not-allowed" : "pointer",
              opacity: !canAnalyze && !isAnalyzing ? 0.4 : 1,
              boxShadow: isAnalyzing ? "none" : "var(--shadow-glow)",
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
                <span style={{ color: isLight ? "#e8f0ff" : "#f0ead8" }}>Reading…</span>
              </>
            ) : (
              <span style={{ color: isLight ? "#e8f0ff" : "#f0ead8" }}>Analyze</span>
            )}
          </button>

          {/* Error */}
          {error && (
            <div style={{
              padding: "12px 14px",
              borderRadius: "8px",
              background: "var(--surface)",
              border: "1px solid var(--border-accent)",
              color: "var(--accent)",
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "13px",
              lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          {/* Context textarea */}
          <div style={{ position: "relative" }}>
            <div style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "10px", fontWeight: 600,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: "var(--text-muted)", marginBottom: "6px",
            }}>
              Context <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: "none", fontSize: "11px" }}>(optional)</span>
            </div>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={"Where you met, what they want, what they said…"}
              rows={4}
              style={{
                width: "100%", resize: "none",
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "8px", outline: "none",
                padding: "10px 12px",
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "13px", fontWeight: 300, lineHeight: 1.65,
                color: "var(--text-primary)",
                caretColor: "var(--accent)",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
          </div>
        </div>
      </div>

      {/* Analysis output */}
      {(isAnalyzing || result) && (
        <AnalysisOutput isLoading={isAnalyzing} result={result} />
      )}
    </div>
  );
}

function AnalyzingSpinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
      <path d="M12 3 A9 9 0 0 1 21 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
