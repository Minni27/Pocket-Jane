"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Icon, Mark } from "@/components/ui";
import { LIMITS } from "@/lib/limits";
import type { OutcomeUpdate } from "@/lib/database.types";

type Outcome = "success" | "partial" | "miss";

interface AnalysisRow {
  id: string;
  created_at: string;
  input_type: "camera" | "text";
  input_text: string | null;
  archetype: string;
  confidence: number;
  summary: string;
  dominant_traits: { name: string; strength: number }[];
  methodology: { framework: string }[];
  persuasion_angles: { label: string; text: string }[];
  outcome: Outcome | null;
  outcome_note: string | null;
}

const OUTCOME_META: Record<Outcome, { label: string; color: string; bg: string }> = {
  success: { label: "Accurate",  color: "var(--signal)",       bg: "var(--raised)"   },
  partial: { label: "Partial",   color: "var(--text-dim)",   bg: "var(--surface)"  },
  miss:    { label: "Missed",    color: "var(--accent-text)",     bg: "var(--surface)"  },
};

export default function HistoryPage() {
  const [rows, setRows] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [logging, setLogging] = useState<string | null>(null);
  const [noting, setNoting] = useState<{ id: string; outcome: Outcome } | null>(null);
  const [justSaved, setJustSaved] = useState<string | null>(null);
  const [toast, setToast] = useState<{ label: string; color: string } | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const showToast = useCallback((label: string, color: string) => {
    setToast({ label, color });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    supabase
      .from("analyses")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("[history] fetch error:", error.message);
          setFetchError(error.message);
        } else {
          setRows((data as AnalysisRow[]) ?? []);
        }
        setLoading(false);
      });
  }, []);

  async function deleteRow(id: string) {
    await supabase.from("analyses").delete().eq("id", id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function logOutcome(id: string, outcome: Outcome, note: string) {
    setLogging(null);
    setNoting(null);
    setUpdateError(null);
    const payload: OutcomeUpdate = { outcome, outcome_note: note.trim() || null };
    const { error } = await supabase.from("analyses").update(payload).eq("id", id);
    if (error) {
      console.error("[history] update error:", error.message);
      setUpdateError(`Failed to save: ${error.message}`);
      return;
    }
    setRows((prev) => prev.map((r) =>
      r.id === id ? { ...r, outcome, outcome_note: payload.outcome_note } : r
    ));
    setJustSaved(id);
    setTimeout(() => setJustSaved(null), 2500);
    const labels = { success: "Accurate", partial: "Partial", miss: "Missed" };
    const colors = { success: "var(--signal)", partial: "var(--text-dim)", miss: "var(--accent-text)" };
    showToast(
      note.trim() ? `Logged — Jane will learn from this` : `Outcome logged — ${labels[outcome]}`,
      colors[outcome]
    );
  }

  const total    = rows.length;
  const avgConf  = total ? Math.round(rows.reduce((s, r) => s + r.confidence, 0) / total) : 0;
  const logged   = rows.filter((r) => r.outcome).length;

  return (
    <div className="flex flex-col flex-1 px-4 py-8 max-w-4xl mx-auto w-full gap-8">

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "32px", left: "50%",
          transform: "translateX(-50%)",
          zIndex: 999,
          padding: "var(--s-4) var(--s-5)",
          borderRadius: "var(--r-card)",
          background: "var(--surface)",
          border: `1px solid ${toast.color}`,
          boxShadow: `0 0 32px rgba(0,0,0,0.4), 0 0 16px ${toast.color}33`,
          display: "flex", alignItems: "center", gap: "var(--s-3)",
          animation: "fadeUp 0.3s ease",
          whiteSpace: "nowrap",
        }}>
          <Icon name="check" size={15} style={{ color: toast.color }} />
          <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-ui)", fontWeight: 500, color: "var(--text-primary)" }}>
            {toast.label}
          </span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 style={{
          fontFamily: "var(--font-playfair), serif",
          fontSize: "clamp(2rem, 5vw, 3rem)",
          fontWeight: 600,
          color: "var(--text-primary)",
          lineHeight: 1.1,
          marginBottom: "var(--s-2)",
        }}>
          Analysis History
        </h1>
        <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-ui)", fontWeight: 300, color: "var(--text-muted)" }}>
          Every profile Jane has built. Log outcomes to train your accuracy.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total",      full: "Total Analyses",  value: total || "—"                },
          { label: "Confidence", full: "Avg Confidence",  value: total ? `${avgConf}%` : "—"  },
          { label: "Logged",     full: "Outcomes Logged", value: total ? `${logged}/${total}` : "—" },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "28px", fontWeight: 400,
              color: "var(--text-primary)", marginBottom: "var(--s-1)",
            }}>
              {s.value}
            </div>
            <div style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "var(--t-micro)", fontWeight: 500,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--text-ghost)",
            }}>
              <span className="sm:hidden">{s.label}</span>
              <span className="hidden sm:inline">{s.full}</span>
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      {updateError && (
        <div style={{ padding: "var(--s-3) var(--s-4)", borderRadius: "var(--r-input)", background: "var(--surface)", border: "1px solid var(--border-accent)", color: "var(--accent-text)", fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-ui)" }}>
          {updateError}
        </div>
      )}

      {fetchError && (
        <div style={{ padding: "var(--s-3) var(--s-4)", borderRadius: "var(--r-input)", background: "var(--surface)", border: "1px solid var(--border-accent)", color: "var(--accent-text)", fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-ui)" }}>
          Supabase error: {fetchError}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5" style={{ height: "72px" }}>
              <div className="shimmer h-3 w-48 rounded mb-3" />
              <div className="shimmer h-2 w-32 rounded" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-10 text-center">
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "var(--t-title)", color: "var(--text-muted)", fontStyle: "italic" }}>
            No analyses yet.
          </p>
          <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-ui)", color: "var(--text-ghost)", marginTop: "var(--s-2)" }}>
            Go to Analyze and profile someone first.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => {
            const outcomeMeta = row.outcome ? OUTCOME_META[row.outcome] : null;
            const date = new Date(row.created_at);
            const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
            // Chips show the author only, so one analysis citing an author
            // twice would otherwise render duplicates with colliding keys.
            const frameworks = [...new Set(
              (row.methodology as { framework: string }[])
                .map((m) => m.framework.split(/[—–-]/)[0].trim())
                .filter(Boolean)
            )].slice(0, 3);

            return (
              <div
                key={row.id}
                className="card p-5"
                style={{ transition: "border-color 0.2s ease" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-accent)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = ""; }}
              >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Link href={`/history/${row.id}`} style={{ textDecoration: "none", flexShrink: 0, lineHeight: 0 }}>
                  <Mark
                    archetype={row.archetype}
                    traits={row.dominant_traits ?? []}
                    confidence={row.confidence}
                    size={44}
                    hollow={!row.outcome}
                  />
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/history/${row.id}`} style={{ textDecoration: "none" }}>
                  <p style={{
                    fontFamily: "var(--font-playfair), serif",
                    fontSize: "var(--t-title)", fontWeight: 500,
                    color: "var(--text-primary)", marginBottom: "var(--s-1)",
                    transition: "color 0.15s ease",
                  }}>
                    {row.archetype}
                  </p>
                  </Link>
                  <div className="flex flex-wrap items-center gap-3">
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: "var(--t-meta)", color: "var(--text-ghost)" }}>
                      {dateStr} · {timeStr}
                    </span>
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: "var(--t-meta)", color: "var(--text-muted)" }}>
                      {row.confidence}% confidence
                    </span>
                    <div className="flex gap-1 flex-wrap">
                      {frameworks.map((f) => (
                        <span key={f} style={{
                          fontFamily: "var(--font-inter)", fontSize: "var(--t-micro)",
                          fontWeight: 500, letterSpacing: "0.08em",
                          color: "var(--text-ghost)",
                          background: "var(--surface)", border: "1px solid var(--border)",
                          borderRadius: "3px", padding: "var(--s-1) var(--s-2)",
                        }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => deleteRow(row.id)}
                  title="Delete"
                  style={{
                    width: "28px", height: "28px", borderRadius: "var(--r-input)", flexShrink: 0,
                    background: "transparent", border: "1px solid var(--border)",
                    color: "var(--text-ghost)", cursor: "pointer", fontSize: "var(--t-meta)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-text)"; e.currentTarget.style.borderColor = "var(--border-accent)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-ghost)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <Icon name="trash" size={14} />
                </button>

                {/* Outcome / log */}
                {justSaved === row.id ? (
                  <span style={{
                    fontFamily: "var(--font-inter)", fontSize: "var(--t-meta)", fontWeight: 600,
                    letterSpacing: "0.08em", color: "var(--signal)",
                    background: "var(--raised)", border: "1px solid var(--border)",
                    borderRadius: "var(--r-input)", padding: "var(--s-1) var(--s-3)",
                    whiteSpace: "nowrap", flexShrink: 0,
                    animation: "fadeIn 0.2s ease",
                  }}>
                    Saved
                  </span>
                ) : outcomeMeta ? (
                  <span
                    onClick={() => setLogging(row.id)}
                    title="Click to change"
                    style={{
                      fontFamily: "var(--font-inter)", fontSize: "var(--t-meta)", fontWeight: 500,
                      letterSpacing: "0.08em", color: outcomeMeta.color,
                      background: outcomeMeta.bg, border: "1px solid var(--border)",
                      borderRadius: "var(--r-input)", padding: "var(--s-1) var(--s-3)",
                      whiteSpace: "nowrap", flexShrink: 0,
                      cursor: "pointer",
                    }}
                  >
                    {outcomeMeta.label}
                  </span>
                ) : logging === row.id ? (
                  <OutcomePicker
                    onPick={(o) => { setLogging(null); setNoting({ id: row.id, outcome: o }); }}
                    onCancel={() => setLogging(null)}
                  />
                ) : (
                  <button
                    onClick={() => setLogging(row.id)}
                    style={{
                      fontFamily: "var(--font-inter)", fontSize: "var(--t-meta)", fontWeight: 500,
                      letterSpacing: "0.06em", color: "var(--text-muted)",
                      background: "transparent", border: "1px solid var(--border)",
                      borderRadius: "var(--r-input)", padding: "var(--s-1) var(--s-3)",
                      cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-text)"; e.currentTarget.style.borderColor = "var(--border-accent)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                  >
                    Log outcome
                  </button>
                )}
              </div>

              {/* Correction note — what Jane actually learns from */}
              {noting?.id === row.id && (
                <NoteEditor
                  outcome={noting.outcome}
                  onSave={(n) => logOutcome(row.id, noting.outcome, n)}
                  onCancel={() => setNoting(null)}
                />
              )}

              {/* Previously saved correction */}
              {noting?.id !== row.id && row.outcome_note && (
                <p style={{
                  marginTop: "var(--s-4)", paddingTop: "12px",
                  borderTop: "1px solid var(--border)",
                  fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)",
                  fontWeight: 300, lineHeight: 1.6, color: "var(--text-muted)", fontStyle: "italic",
                }}>
                  <span style={{ fontStyle: "normal", color: "var(--text-ghost)" }}>Your note: </span>
                  {row.outcome_note}
                </p>
              )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const NOTE_PROMPT: Record<Outcome, { label: string; placeholder: string }> = {
  success: { label: "What did Jane get right?", placeholder: "Optional — what landed…" },
  partial: { label: "What did Jane get wrong?", placeholder: "Close on the archetype, but the motive was off — he wasn't ambitious, he was…" },
  miss:    { label: "What actually happened?",  placeholder: "Wrong read entirely. He wasn't guarded — he'd just had bad news…" },
};

function NoteEditor({
  outcome, onSave, onCancel,
}: { outcome: Outcome; onSave: (note: string) => void; onCancel: () => void }) {
  const [note, setNote] = useState("");
  const meta = NOTE_PROMPT[outcome];

  return (
    <div style={{ marginTop: "var(--s-4)", paddingTop: "14px", borderTop: "1px solid var(--border)", animation: "fadeIn 0.2s ease" }}>
      <label style={{ display: "block", fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-micro)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "var(--s-2)" }}>
        {meta.label}
        {outcome === "success" && <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: "none", fontSize: "var(--t-meta)", color: "var(--text-ghost)" }}> (optional)</span>}
      </label>
      <textarea
        value={note}
        // Matches the analyses_note_len constraint, so the save cannot
        // fail on a length the UI allowed.
        maxLength={LIMITS.OUTCOME_NOTE_CHARS}
        onChange={(e) => setNote(e.target.value)}
        placeholder={meta.placeholder}
        rows={3}
        autoFocus
        style={{
          width: "100%", resize: "vertical",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--r-input)", outline: "none", padding: "var(--s-3) var(--s-3)",
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: "var(--t-ui)", fontWeight: 300, lineHeight: 1.6,
          color: "var(--text-primary)", caretColor: "var(--accent)",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-accent)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
      />
      <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: "var(--s-3)" }}>
        <button
          onClick={() => onSave(note)}
          style={{ padding: "var(--s-2) var(--s-4)", borderRadius: "var(--r-input)", background: "var(--raised)", border: "1px solid var(--border)", color: "var(--signal)", fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)", fontWeight: 500, letterSpacing: "0.06em", cursor: "pointer" }}
        >Save</button>
        <button
          onClick={() => onSave("")}
          style={{ padding: "var(--s-2) var(--s-3)", borderRadius: "var(--r-input)", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)", cursor: "pointer" }}
        >Skip</button>
        <button
          onClick={onCancel}
          style={{ fontSize: "var(--t-meta)", color: "var(--text-ghost)", background: "none", border: "none", cursor: "pointer", padding: "var(--s-2) var(--s-1)" }}
        >Cancel</button>
      </div>
    </div>
  );
}

function OutcomePicker({ onPick, onCancel }: { onPick: (o: Outcome) => void; onCancel: () => void }) {
  const options: { value: Outcome; label: string }[] = [
    { value: "success", label: "Accurate" },
    { value: "partial", label: "Partial"  },
    { value: "miss",    label: "Missed"   },
  ];
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onPick(o.value)}
          style={{
            fontFamily: "var(--font-inter)", fontSize: "var(--t-micro)", fontWeight: 500,
            letterSpacing: "0.06em", color: "var(--text-muted)",
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--r-input)", padding: "var(--s-1) var(--s-3)",
            cursor: "pointer", transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-text)"; e.currentTarget.style.borderColor = "var(--border-accent)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          {o.label}
        </button>
      ))}
      <button
        onClick={onCancel}
        style={{ fontSize: "var(--t-meta)", color: "var(--text-ghost)", background: "none", border: "none", cursor: "pointer", padding: "var(--s-1)" }}
      >
        <Icon name="close" size={13} />
      </button>
    </div>
  );
}
