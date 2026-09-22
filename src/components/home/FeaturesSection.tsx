"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

const features = [
  {
    num: "01",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.3"/>
        <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.6"/>
        <line x1="12" y1="3" x2="12" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="3" y1="12" x2="7" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="17" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    title: "Real-Time Analysis",
    body: "Point the camera or describe in words. A complete psychological profile — in seconds.",
    color: "accent",
  },
  {
    num: "02",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 6h16M4 10h12M4 14h8M4 18h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="19" cy="17" r="3" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M21.5 19.5L23 21" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    title: "Grounded in Literature",
    body: "Every inference cites the book and principle behind it — Cialdini, Ekman, Kahneman, Navarro.",
    color: "gold",
  },
  {
    num: "03",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L15 9H22L16.5 13.5L18.5 21L12 16.5L5.5 21L7.5 13.5L2 9H9L12 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    title: "Persuasion Vectors",
    body: "Which levers work on this person. Which objections they'll raise. The exact sequence that leads to yes.",
    color: "accent",
  },
  {
    num: "04",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 3l7.5 7.5M21 3l-7.5 7.5M12 10.5V21M12 10.5C12 10.5 7 8 3 12M12 10.5C12 10.5 17 8 21 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Learns From You",
    body: "Log outcomes. Jane tracks your accuracy, finds your blind spots, and calibrates every future read.",
    color: "gold",
  },
];

export default function FeaturesSection() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isLight = !mounted || theme !== "dark";
  const headingRef = useRef<HTMLDivElement>(null);
  const inView = useInView(headingRef, { once: true, margin: "-80px" });
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);

  function go(next: number) {
    setDirection(next > active ? 1 : -1);
    setActive(next);
  }

  function prev() {
    go(active === 0 ? features.length - 1 : active - 1);
  }

  function next() {
    go(active === features.length - 1 ? 0 : active + 1);
  }

  const accentRgbLight = "45,91,227";
  const accentRgbDark  = "185,28,28";

  return (
    <section style={{ padding: "120px 24px 100px", maxWidth: "960px", margin: "0 auto", width: "100%" }}>

      {/* Section heading */}
      <div ref={headingRef} style={{ marginBottom: "64px", textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          

          <h2 style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
            fontWeight: 600,
            color: "var(--text-primary)",
            lineHeight: 1.15,
            margin: 0,
            transition: "color 0.35s ease",
          }}>
            Everything you need to{" "}
            <em style={{ fontStyle: "italic", color: "var(--accent)" }}>understand</em>{" "}
            anyone.
          </h2>
        </motion.div>
      </div>

      {/* Carousel */}
      <div style={{ position: "relative" }}>
        {/* Cards track */}
        <div style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "14px",
          border: "1px solid var(--border)",
          minHeight: "300px",
        }}>
          <AnimatePresence mode="wait" custom={direction}>
            <CarouselCard
              key={active}
              feature={features[active]}
              index={active}
              isLight={isLight}
              direction={direction}
              accentRgbLight={accentRgbLight}
              accentRgbDark={accentRgbDark}
            />
          </AnimatePresence>
        </div>

        {/* Prev / Next + dots row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginTop: "20px" }}>
          <button onClick={prev} aria-label="Previous" style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-muted)", boxShadow: "var(--shadow-card)", transition: "all 0.2s ease", flexShrink: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-accent)"; e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>

        {/* Dot indicators */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
          {features.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Go to card ${i + 1}`}
              style={{
                width: i === active ? "24px" : "7px",
                height: "7px",
                borderRadius: "4px",
                background: i === active ? "var(--accent)" : "var(--border)",
                border: "none", cursor: "pointer", padding: 0,
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

          <button onClick={next} aria-label="Next" style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-muted)", boxShadow: "var(--shadow-card)", transition: "all 0.2s ease", flexShrink: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-accent)"; e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </section>
  );
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

function CarouselCard({
  feature,
  index,
  isLight,
  direction,
  accentRgbLight,
  accentRgbDark,
}: {
  feature: (typeof features)[number];
  index: number;
  isLight: boolean;
  direction: number;
  accentRgbLight: string;
  accentRgbDark: string;
}) {
  const isAccent = feature.color === "accent";
  const accentColor = isAccent ? "var(--accent)" : "var(--signal)";
  const accentRgb = isAccent
    ? (isLight ? accentRgbLight : accentRgbDark)
    : (isLight ? "27,29,127" : "201,168,76");

  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "var(--surface)",
        padding: "52px 48px",
        position: "relative",
        overflow: "hidden",
        minHeight: "300px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Ghost number watermark */}
      <div style={{
        position: "absolute",
        top: "-8px", right: "24px",
        fontFamily: "var(--font-playfair), serif",
        fontSize: "160px", fontWeight: 900,
        color: `rgba(${accentRgb}, ${isLight ? "0.06" : "0.04"})`,
        lineHeight: 1,
        userSelect: "none", pointerEvents: "none",
        letterSpacing: "-0.05em",
      }}>
        {feature.num}
      </div>

      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
        {/* Case chip */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "4px 10px", borderRadius: "4px",
          background: `rgba(${accentRgb}, ${isLight ? "0.08" : "0.12"})`,
          border: `1px solid rgba(${accentRgb}, 0.2)`,
        }}>
          <span style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "var(--t-micro)", fontWeight: 700,
            letterSpacing: "0.14em", textTransform: "uppercase",
            color: accentColor,
          }}>
            Case {feature.num}
          </span>
        </div>

        {/* Icon */}
        <div style={{ color: accentColor, opacity: 0.7 }}>
          {feature.icon}
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <h3 style={{
          fontFamily: "var(--font-playfair), serif",
          fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 600,
          color: "var(--text-primary)",
          margin: "0 0 16px",
          lineHeight: 1.2,
          transition: "color 0.35s ease",
        }}>
          {feature.title}
        </h3>

        <p style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: "var(--t-body)", fontWeight: 300, lineHeight: 1.72,
          color: "var(--text-muted)",
          margin: 0, maxWidth: "480px",
          transition: "color 0.35s ease",
        }}>
          {feature.body}
        </p>
      </div>

      {/* Progress bar across cards */}
      <div style={{
        display: "flex", gap: "4px", marginTop: "40px",
      }}>
        {features.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: "2px", borderRadius: "1px",
            background: i <= index
              ? `rgba(${accentRgb}, 0.55)`
              : `rgba(${accentRgb}, 0.12)`,
            transition: "background 0.3s ease",
          }} />
        ))}
      </div>

      {/* Bottom accent line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: "2px",
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
          transformOrigin: "left",
          opacity: 0.5,
        }}
      />
    </motion.div>
  );
}
