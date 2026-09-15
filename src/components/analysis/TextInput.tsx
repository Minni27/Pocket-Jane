"use client";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

const placeholderText = `Describe the person in as much detail as you can observe...

— Physical presence, posture, how they occupy space
— Eye contact patterns, micro-expressions you noticed
— Speech cadence, word choices, what they said
— What they want from this interaction
— Context: where you met, what's at stake`;

export default function TextInput({ value, onChange }: Props) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        aspectRatio: "4/3",
        display: "flex",
        flexDirection: "column",
        background: "#0f0e14",
        border: "1px solid rgba(255,255,255,0.07)",
        transition: "border-color 0.2s ease",
      }}
      onFocusCapture={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(139,26,48,0.35)";
      }}
      onBlurCapture={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <span style={{ color: "#8b1a30", fontSize: "14px" }}>✦</span>
        <span
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#6e6860",
          }}
        >
          Subject Description
        </span>
      </div>

      {/* Textarea */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholderText}
        style={{
          flex: 1,
          resize: "none",
          background: "transparent",
          border: "none",
          outline: "none",
          padding: "16px",
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: "14px",
          fontWeight: 300,
          lineHeight: 1.7,
          color: "#f0ead8",
          caretColor: "#8b1a30",
        }}
        className="placeholder-[#3a3530]"
      />

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <span
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "12px",
            fontStyle: "italic",
            color: "#3a3530",
          }}
        >
          More detail = sharper profile
        </span>
        <span
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "11px",
            color: wordCount > 20 ? "#a8832a" : "#3a3530",
            transition: "color 0.3s ease",
          }}
        >
          {wordCount} words
        </span>
      </div>
    </div>
  );
}
