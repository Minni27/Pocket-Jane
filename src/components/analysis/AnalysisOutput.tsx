"use client";

interface Props {
  isLoading: boolean;
  result: object | null;
}

export default function AnalysisOutput({ isLoading, result }: Props) {
  if (isLoading) return <LoadingSkeleton />;
  if (!result) return null;

  // TODO: replace with real structured data from API
  return <PlaceholderResult />;
}

function LoadingSkeleton() {
  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <div className="divider-ornate">◈ Reading</div>
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
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-3 mb-3">
            <div className="shimmer w-1 h-full rounded" style={{ minHeight: "40px", width: "2px" }} />
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

const demoProfile = {
  archetype: "The Calculated Optimist",
  confidence: 78,
  dominantTraits: [
    { name: "High Need for Recognition", strength: 85 },
    { name: "Conflict Avoidance", strength: 72 },
    { name: "Reciprocity Sensitivity", strength: 68 },
  ],
  methodology: [
    {
      icon: "⊕",
      framework: "Cialdini — Social Proof",
      observation: "Repeatedly referenced what others in their position have done.",
      inference: "Seeks validation through consensus before committing.",
      cite: "Influence, Ch.4",
    },
    {
      icon: "◈",
      framework: "Ekman — Microexpressions",
      observation: "Brief contempt flash when budget was mentioned.",
      inference: "Price sensitivity is real; framing matters more than number.",
      cite: "Emotions Revealed, Ch.7",
    },
    {
      icon: "◉",
      framework: "Voss — Tactical Empathy",
      observation: "Leaned in when speaking about team impact.",
      inference: "Identity is tied to how this decision affects their team.",
      cite: "Never Split the Difference, Ch.5",
    },
  ],
  persuasionAngles: [
    { label: "Lead with", text: "Peer adoption story — who else is doing this." },
    { label: "Avoid", text: "Pressure tactics. They'll retreat." },
    { label: "Unlock with", text: `"What would make this a no-brainer for your team?"` },
    { label: "Expect objection", text: "Budget. Counter: ROI framing, not price defense." },
  ],
};

function PlaceholderResult() {
  return (
    <div className="animate-fade-up flex flex-col gap-6">

      {/* Divider */}
      <div className="divider-ornate">◈ Profile</div>

      {/* Top cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Archetype */}
        <div
          className="card p-5 col-span-1"
          style={{ borderColor: "rgba(168,131,42,0.2)" }}
        >
          <div
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#6e6860",
              marginBottom: "10px",
            }}
          >
            Archetype
          </div>
          <div
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "22px",
              fontWeight: 500,
              color: "#f0ead8",
              lineHeight: 1.2,
              marginBottom: "12px",
            }}
          >
            {demoProfile.archetype}
          </div>
          <ConfidenceMeter value={demoProfile.confidence} />
        </div>

        {/* Dominant Traits */}
        <div className="card p-5 col-span-1 md:col-span-2">
          <div
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#6e6860",
              marginBottom: "14px",
            }}
          >
            Dominant Traits
          </div>
          <div className="flex flex-col gap-3">
            {demoProfile.dominantTraits.map((t) => (
              <div key={t.name}>
                <div className="flex justify-between mb-1.5">
                  <span
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "13px",
                      fontWeight: 400,
                      color: "#b8af9a",
                    }}
                  >
                    {t.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "12px",
                      color: "#6e6860",
                    }}
                  >
                    {t.strength}%
                  </span>
                </div>
                <div
                  className="rounded-full"
                  style={{
                    height: "3px",
                    background: "rgba(255,255,255,0.07)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${t.strength}%`,
                      background: `linear-gradient(90deg, #5c0a17, #c9a84c)`,
                      transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Methodology */}
      <div className="divider-ornate" style={{ marginTop: "4px" }}>◎ Methodology</div>
      <div className="flex flex-col gap-3">
        {demoProfile.methodology.map((m) => (
          <div
            key={m.framework}
            className="card p-5"
            style={{ borderLeft: "2px solid #5c0a17" }}
          >
            <div className="flex items-start gap-4">
              <span
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontSize: "20px",
                  color: "#8b1a30",
                  lineHeight: 1,
                  marginTop: "2px",
                }}
              >
                {m.icon}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#c9a84c",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {m.framework}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "10px",
                      color: "#3a3530",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {m.cite}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "13px",
                    fontWeight: 300,
                    color: "#b8af9a",
                    marginBottom: "4px",
                    lineHeight: 1.6,
                  }}
                >
                  <span style={{ color: "#6e6860" }}>Observed: </span>
                  {m.observation}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "13px",
                    fontWeight: 300,
                    color: "#b8af9a",
                    lineHeight: 1.6,
                  }}
                >
                  <span style={{ color: "#6e6860" }}>Inference: </span>
                  {m.inference}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Persuasion vectors */}
      <div className="divider-ornate" style={{ marginTop: "4px" }}>✦ Persuasion Vectors</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {demoProfile.persuasionAngles.map((p) => (
          <div
            key={p.label}
            className="card-gold p-4"
          >
            <div
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#a8832a",
                marginBottom: "6px",
              }}
            >
              {p.label}
            </div>
            <p
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontSize: "17px",
                fontWeight: 400,
                color: "#f0ead8",
                lineHeight: 1.4,
              }}
            >
              {p.text}
            </p>
          </div>
        ))}
      </div>

      {/* Feedback prompt */}
      <div
        className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div>
          <p
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "18px",
              color: "#f0ead8",
              marginBottom: "4px",
            }}
          >
            How did the interaction go?
          </p>
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "12px",
              fontWeight: 300,
              color: "#6e6860",
            }}
          >
            Log the outcome. Jane learns from the gap between prediction and reality.
          </p>
        </div>
        <button
          style={{
            padding: "10px 24px",
            borderRadius: "8px",
            background: "transparent",
            border: "1px solid rgba(168,131,42,0.3)",
            color: "#c9a84c",
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(168,131,42,0.1)";
            e.currentTarget.style.borderColor = "rgba(168,131,42,0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(168,131,42,0.3)";
          }}
        >
          Log Outcome →
        </button>
      </div>
    </div>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  const color = value >= 75 ? "#c9a84c" : value >= 50 ? "#8b6020" : "#5c0a17";
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#6e6860",
          }}
        >
          Confidence
        </span>
        <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "18px", color }}>
          {value}%
        </span>
      </div>
      <div
        className="rounded-full"
        style={{ height: "3px", background: "rgba(255,255,255,0.07)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            background: color,
            transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
}
