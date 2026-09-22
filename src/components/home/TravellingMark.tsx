"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { seedFrom, markPath } from "@/lib/seed";
import { PHASE, CASE_PROFILES } from "./scrollMap";

const SIZE = 620;

// One mark for the whole page. It draws in the hero, contracts and moves
// aside, reshapes through each carousel case, then withdraws so the
// signature section's own four specimens can take over.
//
// The shape morphs by interpolating the *parameters* — four radii, rotation,
// tension — and recomputing the path each frame. Interpolating the path
// string itself would not work: these are arbitrary curves, not matched
// vertex lists.
export default function TravellingMark() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const p = useSpring(scrollYProgress, { stiffness: 60, damping: 24, restDelta: 0.0005 });

  const HERO = seedFrom("Pocket Jane", [{ strength: 88 }, { strength: 71 }, { strength: 83 }, { strength: 64 }], 86);

  // Phase edges, with the handoff overlapping the hero's exit
  const handoff = PHASE.heroEnd - 0.05;
  const caseSpan = (PHASE.featuresEnd - handoff) / CASE_PROFILES.length;

  // Radii interpolate from the hero profile through each case in turn
  const stops = [0, handoff, ...CASE_PROFILES.map((_, i) => handoff + caseSpan * (i + 1))];
  const radiiFor = (i: number) =>
    [HERO.radii, HERO.radii, ...CASE_PROFILES.map((c) => c.traits.map((t) => 0.42 + (t - 50) / 45 * 0.58))]
      .map((r) => r[i] ?? 0.7);

  const r0 = useTransform(p, stops, radiiFor(0));
  const r1 = useTransform(p, stops, radiiFor(1));
  const r2 = useTransform(p, stops, radiiFor(2));
  const r3 = useTransform(p, stops, radiiFor(3));
  const tension = useTransform(p, stops, [HERO.tension, HERO.tension, ...CASE_PROFILES.map((c) => c.tension)]);
  const rotation = useTransform(p, [0, PHASE.featuresEnd], [HERO.rotation, HERO.rotation + Math.PI * 0.6]);

  const d = useTransform(
    [r0, r1, r2, r3, tension, rotation] as const,
    ([a, b, c, e, t, rot]: number[]) => markPath([a, b, c, e], rot, SIZE, t)
  );

  // Draw only in the hero; afterwards the contour stays whole
  const draw = useTransform(p, [0.04, PHASE.heroEnd * 0.62], [0, 1]);

  // Large and centred through the hero, then smaller and to the right
  // alongside the cards, then out of the way.
  const scale = useTransform(p, [0, handoff, handoff + 0.06, PHASE.featuresEnd], [1, 1, 0.66, 0.66]);
  const x     = useTransform(p, [handoff, handoff + 0.06], ["0%", "42%"]);
  const y     = useTransform(p, [handoff, handoff + 0.06], ["0%", "-20%"]);
  const op    = useTransform(
    p,
    [0.03, 0.10, handoff, handoff + 0.06, PHASE.featuresEnd - 0.02, PHASE.featuresEnd + 0.03],
    [0, 0.9, 0.9, 0.42, 0.42, 0]
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="travelling-mark"
      style={{
        position: "fixed", inset: 0, zIndex: 0,
        pointerEvents: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <motion.svg
        width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ overflow: "visible", scale, x, y, opacity: op }}
      >
        <motion.path
          d={d}
          fill="none" stroke="var(--accent)" strokeWidth="1.25"
          strokeLinejoin="round" strokeLinecap="round"
          style={{ pathLength: draw }}
        />
      </motion.svg>
    </div>
  );
}
