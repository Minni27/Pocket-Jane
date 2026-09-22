"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { SECTION_VH } from "./scrollMap";
import { Mark } from "@/components/ui";

// Illustrative readings, not customer data — they exist to show that the
// mark is computed rather than chosen. The numbers are the same shape the
// product produces, so the shapes are the real output of the real function.
const SPECIMENS = [
  { archetype: "The Rehearsed Charmer",  traits: [84, 77, 69, 90], confidence: 82 },
  { archetype: "The Cornered Deflector", traits: [92, 70, 66, 58], confidence: 70 },
  { archetype: "The Frantic Architect",  traits: [92, 78, 65, 88], confidence: 85 },
  { archetype: "The Exhausted Loyalist", traits: [63, 88, 71, 55], confidence: 74 },
];

export default function SignatureSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // Each specimen draws in turn across the pin, so the claim above builds
  // rather than arriving finished.
  const headingOp = useTransform(scrollYProgress, [0, 0.12], [0, 1]);

  // Hoisted rather than called inside the map: a hook in a loop only works
  // by accident of a fixed array length.
  const d0 = useTransform(scrollYProgress, [0.18, 0.42], [0, 1]);
  const d1 = useTransform(scrollYProgress, [0.34, 0.58], [0, 1]);
  const d2 = useTransform(scrollYProgress, [0.50, 0.74], [0, 1]);
  const d3 = useTransform(scrollYProgress, [0.66, 0.90], [0, 1]);
  const draws = [d0, d1, d2, d3];

  return (
    <div ref={ref} style={{ height: `${SECTION_VH.signature}vh`, position: "relative" }}>
    <section style={{ position: "sticky", top: 0, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "var(--s-6) 24px", maxWidth: "960px", margin: "0 auto", width: "100%" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
style={{ textAlign: "center", marginBottom: "var(--s-6)", opacity: headingOp }}
      >
        <h2 style={{
          fontFamily: "var(--font-playfair), serif",
          fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 600,
          color: "var(--text-primary)", lineHeight: 1.12,
          letterSpacing: "-0.02em", margin: "0 0 var(--s-3)",
          textWrap: "balance",
        }}>
          No two readings look alike.
        </h2>
        <p style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: "var(--t-body)", color: "var(--text-muted)",
          lineHeight: 1.65, margin: "0 auto", maxWidth: "52ch",
        }}>
          Every reading draws its own mark from that person&apos;s four trait scores and
          your confidence in them. The shape is the numbers — not an icon chosen to sit beside them.
        </p>
      </motion.div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "var(--s-5)",
      }}>
        {SPECIMENS.map((s, i) => (
          <motion.figure
            key={s.archetype}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.12 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
            style={{ margin: 0, textAlign: "center" }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--s-3)" }}>
              <Mark
                archetype={s.archetype}
                traits={s.traits.map((strength) => ({ strength }))}
                confidence={s.confidence}
                size={132}
                animate={inView}
                drawProgress={draws[i]}
              />
            </div>
            <figcaption>
              <p style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: "var(--t-ui)", fontWeight: 500,
                color: "var(--text-dim)", margin: "0 0 2px",
              }}>
                {s.archetype}
              </p>
              <p className="tabular" style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "var(--t-meta)", color: "var(--text-ghost)", margin: 0,
              }}>
                {s.confidence}% confidence
              </p>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
    </div>
  );
}
