"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AnalysisOutput from "@/components/analysis/AnalysisOutput";
import type { Profile } from "@/types/profile";

interface RawRow {
  id: string;
  created_at: string;
  input_type: "camera" | "text";
  archetype: string;
  confidence: number;
  summary: string;
  dominant_traits: { name: string; strength: number }[];
  methodology: {
    icon?: string;
    framework: string;
    observation?: string;
    inference?: string;
    cite?: string;
  }[];
  persuasion_angles: { label: string; text: string }[];
  outcome: string | null;
}

function rowToProfile(row: RawRow): Profile {
  return {
    id: row.id,
    archetype: row.archetype,
    confidence: row.confidence,
    summary: row.summary,
    dominantTraits: row.dominant_traits ?? [],
    methodology: (row.methodology ?? []).map((m) => ({
      icon: m.icon ?? "",
      framework: m.framework ?? "",
      observation: m.observation ?? "",
      inference: m.inference ?? "",
      cite: m.cite ?? "",
    })),
    persuasionAngles: row.persuasion_angles ?? [],
  };
}

export default function ProfileDetailPage({ id }: { id: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ date: string; inputType: string } | null>(null);

  useEffect(() => {
    supabase
      .from("analyses")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError(err?.message ?? "Analysis not found.");
        } else {
          const row = data as RawRow;
          setProfile(rowToProfile(row));
          const d = new Date(row.created_at);
          setMeta({
            date: d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) +
              " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            inputType: row.input_type === "camera" ? "Camera" : "Described",
          });
        }
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="flex flex-col flex-1 px-4 py-8 max-w-4xl mx-auto w-full" style={{ gap: "var(--s-5)" }}>

      {/* Back link */}
      <div>
        <Link
          href="/history"
          style={{
            display: "inline-flex", alignItems: "center", gap: "var(--s-2)",
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "var(--t-meta)", fontWeight: 500,
            letterSpacing: "0.06em", textTransform: "uppercase",
            color: "var(--text-muted)", textDecoration: "none",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--accent-text)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)"; }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          History
        </Link>
      </div>

      {/* Page header */}
      {!loading && profile && (
        <div>
          <h1 style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
            fontWeight: 600,
            color: "var(--text-primary)",
            lineHeight: 1.1,
            marginBottom: "var(--s-2)",
          }}>
            {profile.archetype}
          </h1>
          {meta && (
            <p style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "var(--t-meta)", fontWeight: 300,
              color: "var(--text-ghost)",
            }}>
              {meta.inputType} · {meta.date}
            </p>
          )}
        </div>
      )}

      {/* States */}
      {loading && (
        <div className="flex flex-col gap-4">
          <div className="card p-5" style={{ height: "80px" }}>
            <div className="shimmer h-3 w-48 rounded mb-3" />
            <div className="shimmer h-2 w-32 rounded" />
          </div>
          <div className="card p-5" style={{ height: "200px" }}>
            <div className="shimmer h-3 w-32 rounded mb-4" />
            <div className="shimmer h-2 w-full rounded mb-2" />
            <div className="shimmer h-2 w-4/5 rounded mb-2" />
            <div className="shimmer h-2 w-3/5 rounded" />
          </div>
        </div>
      )}

      {error && (
        <div style={{
          padding: "var(--s-4) var(--s-4)", borderRadius: "var(--r-input)",
          background: "var(--surface)", border: "1px solid var(--border-accent)",
          color: "var(--accent-text)",
          fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-ui)",
        }}>
          {error}
        </div>
      )}

      {!loading && profile && (
        <AnalysisOutput isLoading={false} result={profile} />
      )}
    </div>
  );
}
