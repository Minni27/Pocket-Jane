"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useTheme } from "next-themes";
import Link from "next/link";

export default function OracleHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Default to light (Jane) before mount
  const isLight = !mounted || theme === "light";

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start","end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 55, damping: 22 });

  const logoOpacity = useTransform(smooth, [0, 0.10, 0.18], [0, 0, 1]);
  const logoY       = useTransform(smooth, [0, 0.18], [36, 0]);
  const bloomScale  = useTransform(smooth, [0, 0.45], [0.1, 2.4]);
  const bloomOp     = useTransform(smooth, [0, 0.10, 0.65, 0.95], [0, 0.75, 0.55, 0]);
  const readClip    = useTransform(smooth, [0.28, 0.56], ["inset(0 100% 0 0)","inset(0 0% 0 0)"]);
  const readOp      = useTransform(smooth, [0.26, 0.30], [0, 1]);
  const line2Op     = useTransform(smooth, [0.52, 0.70], [0, 1]);
  const line2X      = useTransform(smooth, [0.52, 0.70], [28, 0]);
  const subOp       = useTransform(smooth, [0.70, 0.86], [0, 1]);
  const subY        = useTransform(smooth, [0.70, 0.86], [22, 0]);
  const eyeOp       = useTransform(smooth, [0, 0.05, 0.84, 1], [0, 1, 1, 0]);
  const hintOp      = useTransform(smooth, [0, 0.07, 0.18], [1, 1, 0]);
  const gridOp      = useTransform(smooth, [0, 0.14, 0.72, 1], [0, 0.8, 0.8, 0]);

  // Jane (light) = blue bloom; Red John (dark) = red bloom
  const bloomBg = isLight
    ? "radial-gradient(circle, rgba(45,91,227,0.28) 0%, rgba(45,91,227,0.06) 45%, transparent 70%)"
    : "radial-gradient(circle, rgba(185,28,28,0.55) 0%, rgba(100,0,0,0.2) 40%, transparent 70%)";

  const gridColor = isLight ? "rgba(45,91,227,0.06)" : "rgba(185,28,28,0.055)";

  const line1Color = isLight ? "#0a0f1e" : "#f0ead8";
  const line2Color = isLight ? "#2d5be3" : "#b91c1c";
  const line2Glow  = isLight
    ? "0 0 60px rgba(45,91,227,0.35)"
    : "0 0 80px rgba(185,28,28,0.5)";

  const progressBg = isLight
    ? "linear-gradient(90deg,#0f2060,#2d5be3,#6e96ff)"
    : "linear-gradient(90deg,#3a0a0a,#b91c1c,#c9a84c)";

  const ctaBg = isLight
    ? "linear-gradient(135deg,#2d5be3,#0f2060)"
    : "linear-gradient(135deg,#b91c1c,#7f1d1d)";
  const ctaGlow = isLight
    ? "0 0 36px rgba(45,91,227,0.3)"
    : "0 0 40px rgba(185,28,28,0.35)";
  const ctaColor = isLight ? "#e8f0ff" : "#f0ead8";

  return (
    <div ref={containerRef} style={{ height: "560vh", position: "relative" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>

        {/* Background */}
        <div style={{ position: "absolute", inset: 0, background: "var(--bg)", transition: "background 0.4s ease" }} />

        {/* Bloom */}
        <motion.div style={{
          position: "absolute", top: "50%", left: "50%", x: "-50%", y: "-50%",
          width: "640px", height: "640px", borderRadius: "50%",
          background: bloomBg, filter: "blur(60px)",
          scale: bloomScale, opacity: bloomOp, pointerEvents: "none",
        }} />

        {/* Grid */}
        <motion.div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(${gridColor} 1px,transparent 1px),linear-gradient(90deg,${gridColor} 1px,transparent 1px)`,
          backgroundSize: "52px 52px",
          opacity: gridOp, pointerEvents: "none",
        }} />

        {/* Content */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: "0 24px",
        }}>
          {/* Oracle symbol */}
          <motion.div style={{ opacity: eyeOp, marginBottom: "28px" }}>
            <OracleSymbol isLight={isLight} smooth={smooth} />
          </motion.div>

          {/* Eyebrow */}
          <motion.div style={{ opacity: logoOpacity, y: logoY, marginBottom: "52px", textAlign: "center" }}>
            <span style={{
              fontFamily: "var(--font-inter),sans-serif",
              fontSize: "var(--t-meta)", fontWeight: 500,
              letterSpacing: "0.28em", textTransform: "uppercase",
              color: isLight ? "rgba(45,91,227,0.55)" : "rgba(168,131,42,0.6)",
            }}>Pocket Jane</span>
          </motion.div>

          {/* Line 1 — wipe */}
          <div style={{ overflow: "hidden", marginBottom: "6px" }}>
            <motion.h1 style={{
              fontFamily: "var(--font-playfair),Georgia,serif",
              fontSize: "clamp(1.7rem,8.5vw,8rem)", fontWeight: 700,
              lineHeight: 0.95, letterSpacing: "-0.03em",
              color: line1Color, margin: 0, whiteSpace: "nowrap",
              clipPath: readClip, WebkitClipPath: readClip, opacity: readOp,
              transition: "color 0.4s ease",
            }}>
              You&apos;ve Already
            </motion.h1>
          </div>

          {/* Line 2 — slide */}
          <motion.h1 style={{
            fontFamily: "var(--font-playfair),Georgia,serif",
            fontSize: "clamp(1.7rem,8.5vw,8rem)", fontWeight: 400, fontStyle: "italic",
            lineHeight: 0.95, letterSpacing: "-0.03em",
            color: line2Color, margin: 0, marginBottom: "52px",
            whiteSpace: "nowrap", textShadow: line2Glow,
            opacity: line2Op, x: line2X,
            transition: "color 0.4s ease, text-shadow 0.4s ease",
          }}>
            Told Me Everything.
          </motion.h1>

          {/* Subtitle + CTA */}
          <motion.div style={{
            opacity: subOp, y: subY,
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: "28px",
            textAlign: "center", maxWidth: "500px",
          }}>
            <p style={{
              fontFamily: "var(--font-inter),sans-serif",
              fontSize: "var(--t-body)", fontWeight: 300, lineHeight: 1.75,
              color: "var(--text-dim)", margin: 0, transition: "color 0.4s ease",
            }}>
              Real-time psychological profiling grounded in the literature that
              actually explains people — then a precise persuasion roadmap to act on it.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
              <Link href="/analyze" style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "14px 36px", borderRadius: "8px",
                background: ctaBg, border: "1px solid var(--border-accent)",
                boxShadow: ctaGlow, color: ctaColor,
                fontFamily: "var(--font-playfair),serif",
                fontSize: "var(--t-title)", fontWeight: 500, textDecoration: "none",
              }}>
                Begin Analysis →
              </Link>
              <Link href="/library" style={{
                display: "inline-flex", alignItems: "center",
                padding: "14px 28px", borderRadius: "8px",
                background: "transparent", border: "1px solid var(--border)",
                color: "var(--text-muted)",
                fontFamily: "var(--font-inter),sans-serif",
                fontSize: "var(--t-ui)", fontWeight: 400, textDecoration: "none",
              }}>
                Upload Books
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div style={{
          position: "absolute", bottom: "32px", left: "50%", x: "-50%",
          opacity: hintOp,
          display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
        }}>
          <span style={{
            fontFamily: "var(--font-inter),sans-serif",
            fontSize: "var(--t-micro)", letterSpacing: "0.22em", textTransform: "uppercase",
            color: "var(--text-ghost)",
          }}>scroll</span>
          <motion.div animate={{ y: [0,7,0] }} transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}>
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
              <path d="M1 1L8 8L15 1" stroke="var(--text-ghost)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </motion.div>
        </motion.div>

        {/* Progress bar */}
        <motion.div style={{
          position: "absolute", bottom: 0, left: 0,
          height: "1px", width: "100%",
          background: progressBg,
          scaleX: smooth, transformOrigin: "left",
        }} />
      </div>
    </div>
  );
}

function OracleSymbol({ isLight, smooth }: { isLight: boolean; smooth: ReturnType<typeof useSpring> }) {
  const rotate  = useTransform(smooth, [0, 1], [0, 360]);
  const opacity = useTransform(smooth, [0, 0.05, 0.84, 1], [0, 1, 1, 0]);

  const stroke  = isLight ? "rgba(45,91,227,0.4)"  : "rgba(185,28,28,0.5)";
  const dot     = isLight ? "#2d5be3"              : "#b91c1c";
  const cross   = isLight ? "rgba(45,91,227,0.25)" : "rgba(168,131,42,0.35)";
  const pulse   = isLight ? "rgba(45,91,227,0.18)" : "rgba(185,28,28,0.18)";

  return (
    <motion.div style={{ opacity, position: "relative" }}>
      <motion.svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ rotate }}>
        <circle cx="26" cy="26" r="24" stroke={stroke} strokeWidth="0.6" strokeDasharray="5 5"/>
        <circle cx="26" cy="26" r="15" stroke={stroke} strokeWidth="0.6"/>
        <circle cx="26" cy="26" r="4"  fill={dot}/>
        <line x1="26" y1="2"  x2="26" y2="12" stroke={cross} strokeWidth="0.6"/>
        <line x1="26" y1="40" x2="26" y2="50" stroke={cross} strokeWidth="0.6"/>
        <line x1="2"  y1="26" x2="12" y2="26" stroke={cross} strokeWidth="0.6"/>
        <line x1="40" y1="26" x2="50" y2="26" stroke={cross} strokeWidth="0.6"/>
      </motion.svg>
      <motion.div
        style={{
          position: "absolute", inset: "-10px", borderRadius: "50%",
          border: `1px solid ${pulse}`,
        }}
        animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }}
      />
    </motion.div>
  );
}
