"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useTheme } from "next-themes";
import Link from "next/link";

export default function ClosingCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && theme === "dark";

  return (
    <section
      ref={ref}
      style={{
        padding: "80px 24px 140px",
        display: "flex", flexDirection: "column",
        alignItems: "center", textAlign: "center",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Bloom */}
      <motion.div
        initial={{ opacity: 0, scale: 0.4 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute", top: "50%", left: "50%",
          x: "-50%", y: "-50%",
          width: "500px", height: "500px", borderRadius: "50%",
          background: isDark
            ? "radial-gradient(circle, rgba(185,28,28,0.22) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(45,91,227,0.18) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
        }}
      />

      {/* Patrick Jane quote */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", marginBottom: "10px" }}
      >
        {/* Open quote mark */}
        <div style={{
          fontFamily: "var(--font-playfair), serif",
          fontSize: "80px", lineHeight: 0.5,
          color: "var(--accent)",
          opacity: isDark ? 0.2 : 0.15,
          marginBottom: "16px",
          userSelect: "none",
        }}>"</div>

        <p style={{
          fontFamily: "var(--font-playfair), serif",
          fontSize: "clamp(1.4rem, 3vw, 2.2rem)",
          fontStyle: "italic", fontWeight: 400,
          color: "var(--text-muted)",
          maxWidth: "540px", lineHeight: 1.55,
          margin: "0 auto",
          transition: "color 0.35s ease",
        }}>
          The human mind is the greatest puzzle there is. Every person is an
          open book. Most just haven&apos;t learned to read.
        </p>

        <div style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: "11px", fontWeight: 500,
          letterSpacing: "0.14em", textTransform: "uppercase",
          color: "var(--text-muted)",
          marginTop: "18px",
        }}>
          — Patrick Jane
        </div>
      </motion.div>

      {/* Divider */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: "48px", height: "1px",
          background: "var(--accent)", opacity: 0.4,
          margin: "36px auto",
        }}
      />

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative" }}
      >
        <Link
          href="/analyze"
          style={{
            display: "inline-flex", alignItems: "center", gap: "10px",
            padding: "16px 48px", borderRadius: "8px",
            background: isDark
              ? "linear-gradient(135deg, #b91c1c, #7f1d1d)"
              : "linear-gradient(135deg, #2d5be3, #0f2060)",
            border: "1px solid var(--border-accent)",
            boxShadow: isDark
              ? "0 4px 24px rgba(185,28,28,0.25)"
              : "0 0 60px rgba(45,91,227,0.25), 0 0 120px rgba(13,18,50,0.3)",
            color: isDark ? "#fff5f5" : "#e8f0ff",
            fontFamily: "var(--font-playfair), serif",
            fontSize: "22px", fontWeight: 500,
            letterSpacing: "0.02em",
            textDecoration: "none",
          }}
        >
          Begin
          <span style={{ fontSize: "18px", opacity: 0.7 }}>→</span>
        </Link>
      </motion.div>
    </section>
  );
}
