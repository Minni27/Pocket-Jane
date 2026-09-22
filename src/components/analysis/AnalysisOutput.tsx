"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/profile";

type Outcome = "success" | "partial" | "miss";

interface Props {
  isLoading: boolean;
  result: Profile | null;
}

export default function AnalysisOutput({ isLoading, result }: Props) {
  if (isLoading) return <LoadingSkeleton />;
  if (!result) return null;
  return <ProfileResult profile={result} />;
}

/* ─── Loading skeleton ──────────────────────────────────────── */

// A reading takes ~30s. A single frozen "Reading…" reads as a hang, and
// people refresh — which throws away the result and spends another Gemini
// call. Naming the stage as it happens makes the same wait legible.
function ProgressNarration() {
  const [stage, setStage] = useState(0);
  const [titles, setTitles] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from("library_books")
      .select("book_title")
      .then(({ data }) => setTitles(
        ((data ?? []) as { book_title: string }[]).map((b) => b.book_title)
      ));
  }, []);

  const steps = useMemo(() => {
    const book = titles.length
      ? titles[Math.floor(Math.random() * titles.length)]
      : null;
    return [
      { at: 0,     text: "Taking in the details…" },
      { at: 4500,  text: "Searching your library…" },
      { at: 10000, text: book ? `Cross-referencing ${book}…` : "Cross-referencing the frameworks…" },
      { at: 16000, text: "Weighing your past corrections…" },
      { at: 22000, text: "Committing to a read…" },
      { at: 30000, text: "Almost there — the model is still thinking…" },
    ];
  }, [titles]);

  useEffect(() => {
    const timers = steps.map((s, i) =>
      setTimeout(() => setStage(i), s.at)
    );
    return () => timers.forEach(clearTimeout);
  }, [steps]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", minHeight: "20px" }}>
      <span style={{
        width: "6px", height: "6px", borderRadius: "50%",
        background: "var(--accent)", flexShrink: 0,
        animation: "pulse 1.4s ease-in-out infinite",
      }} />
      <span
        key={stage}
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: "13px", fontWeight: 300, letterSpacing: "0.02em",
          color: "var(--text-muted)",
          animation: "fadeIn 0.5s ease",
        }}
      >
        {steps[stage].text}
      </span>
      <style>{`@keyframes pulse { 0%,100% { opacity:.25; transform:scale(.8);} 50% { opacity:1; transform:scale(1);} }`}</style>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <div className="divider-ornate">◈ Reading</div>
      <ProgressNarration />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-5" style={{ height: "160px" }}>
            <div className="shimmer h-3 w-24 rounded mb-3" />
            <div className="shimmer h-2 w-full rounded mb-2" />
            <div className="shimmer h-2 w-4/5 rounded mb-2" />
            <div className="shimmer h-2 w-3/5 rounded" />
          </div>
        ))}
      </div>
      <div className="card p-5">
        <div className="shimmer h-3 w-32 rounded mb-4" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3 mb-3">
            <div className="shimmer rounded" style={{ minHeight: "40px", width: "2px" }} />
            <div className="flex-1">
              <div className="shimmer h-2 w-full rounded mb-2" />
              <div className="shimmer h-2 w-3/4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Full profile result ───────────────────────────────────── */
function ProfileResult({ profile }: { profile: Profile }) {
  return (
    <div id="profile-print-root" className="animate-fade-up flex flex-col gap-6">

      {/* Print header (hidden on screen) */}
      <div className="print-only" style={{ display: "none" }}>
        <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#888", marginBottom: "4px" }}>Pocket Jane — Psychological Profile</p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "28px", fontWeight: 700, marginBottom: "2px" }}>{profile.archetype}</h1>
        <p style={{ fontSize: "12px", color: "#666" }}>{profile.summary}</p>
        <hr style={{ margin: "16px 0", borderColor: "#ddd" }} />
      </div>

      {/* Section label + PDF button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="divider-ornate" style={{ flex: 1 }}>◈ Profile</div>
        <button
          onClick={() => window.print()}
          className="no-print"
          style={{
            marginLeft: "16px", flexShrink: 0,
            padding: "6px 14px", borderRadius: "6px",
            background: "transparent", border: "1px solid var(--border)",
            color: "var(--text-muted)", fontFamily: "var(--font-inter), sans-serif",
            fontSize: "11px", fontWeight: 500, letterSpacing: "0.06em",
            cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-accent)"; e.currentTarget.style.color = "var(--accent)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
          </svg>
          Save PDF
        </button>
      </div>

      {/* Top: archetype + traits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Archetype card */}
        <div className="card p-5 col-span-1" style={{ borderColor: "var(--border-gold)", position: "relative", overflow: "hidden" }}>
          {/* Ghost watermark */}
          <div style={{
            position: "absolute", bottom: "-12px", right: "-8px",
            fontFamily: "var(--font-playfair), serif",
            fontSize: "80px", fontWeight: 900, lineHeight: 1,
            color: "var(--accent)", opacity: 0.04,
            userSelect: "none", pointerEvents: "none",
          }}>◈</div>

          <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>
            Archetype
          </div>
          <div style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(18px,2.5vw,22px)", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.15, marginBottom: "10px" }}>
            {profile.archetype}
          </div>
          {profile.summary && (
            <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-muted)", lineHeight: 1.65, marginBottom: "14px", fontStyle: "italic" }}>
              {profile.summary}
            </p>
          )}
          <ConfidenceMeter value={profile.confidence} />
        </div>

        {/* Dominant traits */}
        <div className="card p-5 col-span-1 md:col-span-2">
          <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "16px" }}>
            Dominant Traits
          </div>
          <div className="flex flex-col gap-4">
            {profile.dominantTraits.map((t, i) => (
              <div key={`${i}-${t.name}`}>
                <div className="flex justify-between mb-2">
                  <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", fontWeight: 400, color: "var(--text-dim)" }}>
                    {t.name}
                  </span>
                  <span style={{ fontFamily: "var(--font-playfair), serif", fontSize: "14px", fontWeight: 600, color: "var(--accent)" }}>
                    {t.strength}%
                  </span>
                </div>
                <div className="rounded-full" style={{ height: "4px", background: "var(--raised)", overflow: "hidden" }}>
                  <div className="h-full rounded-full" style={{ width: `${t.strength}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-bright))", transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Methodology — expandable */}
      <div className="divider-ornate" style={{ marginTop: "4px" }}>◎ Methodology</div>
      <div className="flex flex-col gap-2">
        {profile.methodology.map((m, i) => (
          <MethodologyCard key={`${i}-${m.framework}`} step={m} defaultOpen={i === 0} />
        ))}
      </div>

      {/* Persuasion vectors */}
      <div className="divider-ornate" style={{ marginTop: "4px" }}>✦ Persuasion Vectors</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {profile.persuasionAngles.map((p, i) => (
          <div key={`${i}-${p.label}`} className="card p-4" style={{ borderColor: "var(--border-gold)" }}>
            <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold-dim)", marginBottom: "8px" }}>
              {p.label}
            </div>
            <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "16px", fontWeight: 400, color: "var(--text-primary)", lineHeight: 1.5 }}>
              {p.text}
            </p>
          </div>
        ))}
      </div>

      {/* Outcome logger */}
      <OutcomeLogger id={profile.id ?? null} />
    </div>
  );
}

/* ─── Expandable methodology card ──────────────────────────── */
function MethodologyCard({ step, defaultOpen }: { step: Profile["methodology"][number]; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card" style={{ borderLeft: "2px solid var(--accent)", overflow: "hidden" }}>
      {/* Header row — always visible */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "14px",
          padding: "14px 20px", background: "transparent", border: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ fontFamily: "var(--font-playfair), serif", fontSize: "18px", color: "var(--accent)", lineHeight: 1, flexShrink: 0 }}>
          {step.icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", fontWeight: 600, color: "var(--gold)", letterSpacing: "0.04em" }}>
            {step.framework}
          </span>
          <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", color: "var(--text-ghost)", letterSpacing: "0.06em", marginLeft: "10px" }}>
            {step.cite}
          </span>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-ghost)" strokeWidth="2" strokeLinecap="round"
          style={{ flexShrink: 0, transition: "transform 0.25s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Expandable body */}
      <div style={{
        maxHeight: open ? "800px" : "0px",
        overflow: "hidden",
        transition: "max-height 0.35s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{ padding: "0 20px 16px 52px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-dim)", lineHeight: 1.65 }}>
            <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Observed: </span>
            {step.observation}
          </div>
          <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-dim)", lineHeight: 1.65 }}>
            <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Inference: </span>
            {step.inference}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Outcome logger ────────────────────────────────────────── */
const OUTCOME_OPTIONS: { value: Outcome; label: string; color: string }[] = [
  { value: "success", label: "Accurate", color: "var(--gold)"     },
  { value: "partial", label: "Partial",  color: "var(--text-dim)" },
  { value: "miss",    label: "Missed",   color: "var(--accent)"   },
];

const NOTE_PROMPT: Record<Outcome, { label: string; placeholder: string }> = {
  success: { label: "What did Jane get right?",  placeholder: "Optional — what landed, and how you could tell…" },
  partial: { label: "What did Jane get wrong?",  placeholder: "The archetype was close but the motive was off — he wasn't ambitious, he was scared of…" },
  miss:    { label: "What actually happened?",   placeholder: "Completely wrong read. He wasn't guarded at all — he'd just had bad news that morning…" },
};

function OutcomeLogger({ id }: { id: string | null }) {
  const [picking, setPicking] = useState(false);
  const [noting, setNoting] = useState<Outcome | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState<Outcome | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Picking an outcome opens the note step; the note is what Jane actually
  // learns from, so a miss without one teaches nothing.
  function pick(outcome: Outcome) {
    setPicking(false);
    setNoting(outcome);
    setNote("");
  }

  async function log(outcome: Outcome, outcomeNote: string) {
    setSaving(true);
    setNoting(null);
    if (id) {
      const payload = { outcome, outcome_note: outcomeNote.trim() || null };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from("analyses").update(payload as any).eq("id", id);
      if (error) { showToast("Failed to save — try again"); setSaving(false); return; }
    }
    setSaved(outcome);
    setSaving(false);
    const label = OUTCOME_OPTIONS.find((o) => o.value === outcome)?.label ?? outcome;
    showToast(outcomeNote.trim() ? `Logged as ${label} — Jane will learn from this` : `Logged as ${label}`);
  }

  const savedMeta = saved ? OUTCOME_OPTIONS.find((o) => o.value === saved) : null;

  return (
    <>
      {toast && (
        <div className="no-print" style={{
          position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)",
          zIndex: 999, padding: "14px 28px", borderRadius: "10px",
          background: "var(--surface)", border: `1px solid ${savedMeta?.color ?? "var(--accent)"}`,
          boxShadow: "0 0 32px rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", gap: "10px",
          animation: "fadeUp 0.3s ease", whiteSpace: "nowrap",
        }}>
          <span style={{ fontSize: "16px", color: savedMeta?.color ?? "var(--accent)" }}>✓</span>
          <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{toast}</span>
        </div>
      )}

      <div className="card no-print p-5 mt-2" style={{ borderColor: "var(--border-soft)" }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "18px", color: "var(--text-primary)", marginBottom: "4px" }}>
              How did the interaction go?
            </p>
            <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-muted)" }}>
              Log the outcome. Jane learns from the gap between prediction and reality.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {savedMeta ? (
              <span onClick={() => { setSaved(null); setPicking(true); }} title="Click to change" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", color: savedMeta.color, background: "var(--raised)", border: `1px solid ${savedMeta.color}55`, borderRadius: "8px", padding: "8px 18px", cursor: "pointer", whiteSpace: "nowrap" }}>
                ✓ {savedMeta.label}
              </span>
            ) : noting ? (
              <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", color: OUTCOME_OPTIONS.find((o) => o.value === noting)!.color, whiteSpace: "nowrap" }}>
                {OUTCOME_OPTIONS.find((o) => o.value === noting)!.label}
              </span>
            ) : picking ? (
              <>
                {OUTCOME_OPTIONS.map((o) => (
                  <button key={o.value} onClick={() => pick(o.value)} disabled={saving} style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.06em", color: o.color, background: "var(--surface)", border: `1px solid ${o.color}55`, borderRadius: "7px", padding: "8px 14px", cursor: "pointer", transition: "all 0.15s ease", whiteSpace: "nowrap" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--raised)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface)"; }}
                  >{o.label}</button>
                ))}
                <button onClick={() => setPicking(false)} style={{ fontSize: "12px", color: "var(--text-ghost)", background: "none", border: "none", cursor: "pointer", padding: "8px 4px" }}>✕</button>
              </>
            ) : (
              <button onClick={() => setPicking(true)} style={{ padding: "10px 24px", borderRadius: "8px", background: "transparent", border: "1px solid var(--border-gold)", color: "var(--gold)", fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--raised)"; e.currentTarget.style.borderColor = "var(--border-accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border-gold)"; }}
              >Log Outcome →</button>
            )}
          </div>
        </div>

        {/* Correction step — this text is what feeds back into future reads */}
        {noting && (
          <div style={{ marginTop: "18px", paddingTop: "18px", borderTop: "1px solid var(--border)", animation: "fadeIn 0.2s ease" }}>
            <label style={{ display: "block", fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
              {NOTE_PROMPT[noting].label}
              {noting === "success" && <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: "none", fontSize: "11px", color: "var(--text-ghost)" }}> (optional)</span>}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={NOTE_PROMPT[noting].placeholder}
              rows={3}
              autoFocus
              style={{
                width: "100%", resize: "vertical",
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "8px", outline: "none", padding: "10px 12px",
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "13px", fontWeight: 300, lineHeight: 1.65,
                color: "var(--text-primary)", caretColor: "var(--accent)",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
            <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", fontWeight: 300, color: "var(--text-ghost)", margin: "8px 0 12px" }}>
              Be specific about what was wrong — this gets fed into future readings as calibration.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => log(noting, note)}
                disabled={saving}
                style={{ padding: "8px 20px", borderRadius: "7px", background: "var(--raised)", border: "1px solid var(--border-gold)", color: "var(--gold)", fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", fontWeight: 500, letterSpacing: "0.06em", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.5 : 1, transition: "all 0.2s ease" }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => log(noting, "")}
                disabled={saving}
                style={{ padding: "8px 14px", borderRadius: "7px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", fontWeight: 400, cursor: "pointer" }}
              >
                Skip
              </button>
              <button
                onClick={() => { setNoting(null); setPicking(true); }}
                style={{ fontSize: "12px", color: "var(--text-ghost)", background: "none", border: "none", cursor: "pointer", padding: "8px 4px" }}
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Confidence meter ──────────────────────────────────────── */
function ConfidenceMeter({ value }: { value: number }) {
  const color = value >= 75 ? "var(--gold)" : value >= 55 ? "var(--text-dim)" : "var(--accent)";
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Confidence
        </span>
        <span style={{ fontFamily: "var(--font-playfair), serif", fontSize: "18px", fontWeight: 600, color }}>
          {value}%
        </span>
      </div>
      <div className="rounded-full" style={{ height: "4px", background: "var(--raised)" }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color, transition: "width 1s cubic-bezier(0.4,0,0.2,1)" }} />
      </div>
    </div>
  );
}
