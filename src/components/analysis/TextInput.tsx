"use client";

import { Icon } from "@/components/ui";

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
        background: "var(--surface)",
        border: "1px solid var(--border)",
        transition: "border-color 0.2s ease",
      }}
      onFocusCapture={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-accent)";
      }}
      onBlurCapture={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid var(--border-soft)" }}
      >
        <Icon name="pen" size={14} style={{ color: "var(--accent)" }} />
        <span style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: "11px", fontWeight: 500,
          letterSpacing: "0.1em", textTransform: "uppercase",
          color: "var(--text-muted)",
        }}>
          Subject Description
        </span>
      </div>

      {/* Textarea */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholderText}
        style={{
          flex: 1, resize: "none",
          background: "transparent", border: "none", outline: "none",
          padding: "16px",
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: "14px", fontWeight: 300, lineHeight: 1.7,
          color: "var(--text-primary)",
          caretColor: "var(--accent)",
        }}
      />

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderTop: "1px solid var(--border-soft)" }}
      >
        <span style={{
          fontFamily: "var(--font-playfair), serif",
          fontSize: "12px", fontStyle: "italic",
          color: "var(--text-ghost)",
        }}>
          More detail = sharper profile
        </span>
        <span style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: "11px",
          color: wordCount > 20 ? "var(--signal)" : "var(--text-ghost)",
          transition: "color 0.3s ease",
        }}>
          {wordCount} words
        </span>
      </div>
    </div>
  );
}
