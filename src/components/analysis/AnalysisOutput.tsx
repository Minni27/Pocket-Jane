"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Button, Chip, Icon, Label, Mark, Meter, Textarea } from "@/components/ui";
import { seedFrom } from "@/lib/seed";
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
      <h2 className="rule">Reading</h2>
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

      {/* The reading, led by its own mark */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--s-3)" }}>
        <h2 className="rule" style={{ flex: 1, margin: 0 }}>The reading</h2>
        <Button variant="ghost" size="sm" icon="print" className="no-print" onClick={() => window.print()}>
          Save PDF
        </Button>
      </div>

      <div
        className="card"
        style={{
          ["--mark-shift" as string]: `${seedFrom(profile.archetype, profile.dominantTraits, profile.confidence).shift}`,
          padding: "var(--s-5)",
          display: "flex", flexDirection: "column", gap: "var(--s-5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-5)", flexWrap: "wrap" }}>
          <div style={{ flexShrink: 0 }}>
            <Mark
              archetype={profile.archetype}
              traits={profile.dominantTraits}
              confidence={profile.confidence}
              size={132}
              animate
            />
          </div>

          <div style={{ flex: 1, minWidth: "min(100%, 260px)" }}>
            <h3 style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "var(--t-display)", fontWeight: 600,
              color: "var(--text-primary)", lineHeight: 1.08,
              letterSpacing: "-0.02em", margin: "0 0 var(--s-3)",
              textWrap: "balance",
            }}>
              {profile.archetype}
            </h3>

            <div style={{ display: "flex", alignItems: "baseline", gap: "var(--s-2)", marginBottom: "var(--s-3)" }}>
              <span className="tabular" style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: "var(--t-title)", fontWeight: 600, color: "var(--mark)",
              }}>
                {profile.confidence}
              </span>
              <span style={{
                fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)",
                color: "var(--text-muted)", letterSpacing: "0.04em",
              }}>
                confidence out of 100
              </span>
            </div>

            {profile.summary && (
              <p style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "var(--t-body)", fontWeight: 400, lineHeight: 1.62,
                color: "var(--text-dim)", margin: 0, maxWidth: "var(--measure)",
              }}>
                {profile.summary}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)", borderTop: "1px solid var(--border-soft)", paddingTop: "var(--s-5)" }}>
          {profile.dominantTraits.map((t, i) => (
            <Meter key={`${i}-${t.name}`} label={t.name} value={t.strength} seeded />
          ))}
        </div>
      </div>

      {/* Methodology — expandable */}
      <h2 className="rule" style={{ marginTop: "var(--s-2)" }}>How it was read</h2>
      <div className="flex flex-col gap-2">
        {profile.methodology.map((m, i) => (
          <MethodologyCard key={`${i}-${m.framework}`} step={m} index={i} defaultOpen={i === 0} />
        ))}
      </div>

      {/* Persuasion vectors */}
      <h2 className="rule" style={{ marginTop: "var(--s-2)" }}>How to move them</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {profile.persuasionAngles.map((p, i) => (
          <div key={`${i}-${p.label}`} className="card" style={{ padding: "var(--s-4)" }}>
            <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-micro)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "var(--s-2)" }}>
              {p.label}
            </div>
            <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "var(--t-body)", fontWeight: 400, color: "var(--text-dim)", lineHeight: 1.6, maxWidth: "var(--measure)" }}>
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
function MethodologyCard({ step, index, defaultOpen }: { step: Profile["methodology"][number]; index: number; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "var(--s-3)",
          padding: "var(--s-3) var(--s-4)", background: "transparent", border: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <span className="tabular" style={{
          fontFamily: "var(--font-playfair), serif", fontSize: "var(--t-ui)",
          color: "var(--text-ghost)", lineHeight: 1, flexShrink: 0,
          width: "16px",
        }}>
          {index + 1}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-ui)",
            fontWeight: 500, color: "var(--text-primary)", marginBottom: "2px",
          }}>
            {step.framework}
          </div>
          {step.cite && (
            <div style={{
              fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)",
              color: "var(--text-ghost)",
            }}>
              {step.cite}
            </div>
          )}
        </div>

        <Icon
          name="chevron" size={16}
          style={{
            color: "var(--text-ghost)",
            transition: `transform var(--dur-reveal) var(--ease-out)`,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      <div style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: `grid-template-rows var(--dur-reveal) var(--ease-out)`,
      }}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ padding: "0 var(--s-4) var(--s-4) calc(var(--s-3) + 16px + var(--s-3))", display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            {step.observation && (
              <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-ui)", lineHeight: 1.62, color: "var(--text-dim)", margin: 0, maxWidth: "var(--measure)" }}>
                <span style={{ color: "var(--text-muted)" }}>Observed. </span>{step.observation}
              </p>
            )}
            {step.inference && (
              <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-ui)", lineHeight: 1.62, color: "var(--text-dim)", margin: 0, maxWidth: "var(--measure)" }}>
                <span style={{ color: "var(--text-muted)" }}>Therefore. </span>{step.inference}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Outcome logger ────────────────────────────────────────── */
const OUTCOME_OPTIONS: { value: Outcome; label: string; color: string }[] = [
  { value: "success", label: "Accurate", color: "var(--signal)"     },
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
              <button onClick={() => setPicking(true)} style={{ padding: "10px 24px", borderRadius: "8px", background: "transparent", border: "1px solid var(--border)", color: "var(--signal)", fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--raised)"; e.currentTarget.style.borderColor = "var(--border-accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border)"; }}
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
                style={{ padding: "8px 20px", borderRadius: "7px", background: "var(--raised)", border: "1px solid var(--border)", color: "var(--signal)", fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", fontWeight: 500, letterSpacing: "0.06em", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.5 : 1, transition: "all 0.2s ease" }}
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
  const color = value >= 75 ? "var(--signal)" : value >= 55 ? "var(--text-dim)" : "var(--accent)";
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
