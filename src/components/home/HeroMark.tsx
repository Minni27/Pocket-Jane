"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { seedFrom, markPath } from "@/lib/seed";

// The hero's own reading. Fixed values so the landing page is stable, run
// through the same seed the product uses — this is the real function's real
// output, not a drawing of one.
const HERO = {
  archetype: "Pocket Jane",
  traits: [{ strength: 88 }, { strength: 71 }, { strength: 83 }, { strength: 64 }],
  confidence: 86,
};

export default function HeroMark({
  progress, size = 620,
}: { progress: MotionValue<number>; size?: number }) {
  const s = seedFrom(HERO.archetype, HERO.traits, HERO.confidence);

  const outer = markPath(s.radii, s.rotation, size, s.tension);
  const inner = markPath(s.radii.map(() => s.inner), s.rotation, size, s.tension);

  // Scroll is the timeline. The outer contour resolves first, the confidence
  // ring follows it, and both fade before the section hands off.
  const outerDraw = useTransform(progress, [0.14, 0.58], [0, 1]);
  const innerDraw = useTransform(progress, [0.48, 0.74], [0, 1]);
  const bodyFade  = useTransform(progress, [0.20, 0.62, 0.88, 1], [0, 0.10, 0.10, 0]);
  const strokeOp  = useTransform(progress, [0.12, 0.28, 0.86, 1], [0, 0.85, 0.85, 0]);
  const innerOp   = useTransform(progress, [0.46, 0.60, 0.86, 1], [0, 0.5, 0.5, 0]);

  return (
    <svg
      width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      className="hero-mark"
      aria-hidden="true" focusable="false"
      style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none", overflow: "visible",
      }}
    >
      <defs>
        <radialGradient id="heroMarkFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="var(--accent)" stopOpacity="1" />
          <stop offset="55%"  stopColor="var(--accent)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <motion.path d={outer} fill="url(#heroMarkFill)"
        style={{ opacity: bodyFade, filter: "blur(38px)" }} />

      <motion.path d={outer}
        fill="none" stroke="var(--accent)" strokeWidth="1.25"
        strokeLinejoin="round" strokeLinecap="round"
        style={{ pathLength: outerDraw, opacity: strokeOp }} />

      <motion.path d={inner}
        fill="none" stroke="var(--accent)" strokeWidth="1"
        strokeLinejoin="round" strokeLinecap="round"
        style={{ pathLength: innerDraw, opacity: innerOp }} />
    </svg>
  );
}
