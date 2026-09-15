"use client";

const mockHistory = [
  {
    id: "1",
    date: "Sep 15, 2026",
    time: "2:34 PM",
    archetype: "The Calculated Optimist",
    confidence: 78,
    mode: "camera",
    outcome: "accurate",
    tags: ["Cialdini", "Voss", "Ekman"],
  },
  {
    id: "2",
    date: "Sep 14, 2026",
    time: "10:18 AM",
    archetype: "The Defensive Strategist",
    confidence: 64,
    mode: "text",
    outcome: "partial",
    tags: ["Navarro", "Kahneman"],
  },
  {
    id: "3",
    date: "Sep 13, 2026",
    time: "5:52 PM",
    archetype: "The Approval Seeker",
    confidence: 81,
    mode: "camera",
    outcome: null,
    tags: ["Cialdini", "Greene"],
  },
];

const outcomeStyle: Record<string, { label: string; color: string; bg: string }> = {
  accurate: { label: "Accurate", color: "#a8832a", bg: "rgba(168,131,42,0.1)" },
  partial:  { label: "Partial",  color: "#8b6020", bg: "rgba(139,96,32,0.1)"  },
  missed:   { label: "Missed",   color: "#8b1a30", bg: "rgba(139,26,48,0.1)"  },
};

export default function HistoryPage() {
  return (
    <div className="flex flex-col flex-1 px-4 py-8 max-w-4xl mx-auto w-full gap-8">

      {/* Header */}
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
          Analysis History
        </h1>
        <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", fontWeight: 300, color: "#6e6860" }}>
          Every profile Jane has built. Log outcomes to train your accuracy.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Analyses", value: "3"   },
          { label: "Avg Confidence", value: "74%" },
          { label: "Outcomes Logged", value: "2/3" },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "28px", fontWeight: 300, color: "#f0ead8", marginBottom: "4px" }}>
              {s.value}
            </div>
            <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#3a3530" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {mockHistory.map((h) => {
          const outcome = h.outcome ? outcomeStyle[h.outcome] : null;
          return (
            <div
              key={h.id}
              className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer"
              style={{ transition: "border-color 0.2s ease, box-shadow 0.2s ease" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(168,131,42,0.2)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 20px rgba(168,131,42,0.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              }}
            >
              {/* Mode icon */}
              <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(139,26,48,0.1)", border: "1px solid rgba(139,26,48,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "#8b1a30", flexShrink: 0 }}>
                {h.mode === "camera" ? "◎" : "✦"}
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "19px", fontWeight: 500, color: "#f0ead8", marginBottom: "4px" }}>
                  {h.archetype}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: "11px", color: "#3a3530" }}>
                    {h.date} · {h.time}
                  </span>
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: "11px", color: "#a8832a" }}>
                    {h.confidence}% confidence
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {h.tags.map((t) => (
                      <span key={t} style={{ fontFamily: "var(--font-inter)", fontSize: "9px", fontWeight: 500, letterSpacing: "0.08em", color: "#3a3530", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "3px", padding: "2px 6px" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Outcome / log button */}
              {outcome ? (
                <span style={{ fontFamily: "var(--font-inter)", fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", color: outcome.color, background: outcome.bg, borderRadius: "6px", padding: "4px 12px", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
                  {outcome.label}
                </span>
              ) : (
                <button
                  style={{ fontFamily: "var(--font-inter)", fontSize: "11px", fontWeight: 500, letterSpacing: "0.06em", color: "#6e6860", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", padding: "4px 12px", cursor: "pointer", whiteSpace: "nowrap" as const, flexShrink: 0, transition: "all 0.2s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#c9a84c"; e.currentTarget.style.borderColor = "rgba(168,131,42,0.3)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#6e6860"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                >
                  Log outcome
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
