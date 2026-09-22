"use client";

import { useId } from "react";
import { motion, type MotionValue } from "framer-motion";
import { seedFrom, markPath } from "@/lib/seed";

interface Props {
  archetype: string;
  traits: { strength: number }[];
  confidence: number;
  size?: number;
  /** The one authored moment — the mark strokes itself on as a reading resolves */
  animate?: boolean;
  /** Awaiting its contour: outcome not yet logged */
  hollow?: boolean;
  /** Scroll-driven draw, 0 to 1. Overrides `animate` when supplied. */
  drawProgress?: MotionValue<number>;
}

export default function Mark({
  archetype, traits, confidence, size = 120, animate = false, hollow = false, drawProgress,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const s = seedFrom(archetype, traits, confidence);

  const outer = markPath(s.radii, s.rotation, size, s.tension);
  const inner = markPath(s.radii.map(() => s.inner), s.rotation, size, s.tension);

  // Overshoot of the true path length; dashoffset only needs to exceed it
  const len = size * 3.4;

  return (
    <svg
      width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true" focusable="false"
      style={{
        // --mark must be declared here, not inherited. A custom property is
        // computed where it is declared, so the :root definition resolves
        // against --mark-shift: 0 and setting the shift on a descendant
        // changes nothing. Declaring it locally is what makes the hue move.
        ["--mark" as string]: `hsl(from var(--accent) calc(h + ${s.shift}) s l)`,
        display: "block", overflow: "visible",
      }}
    >
      <defs>
        <radialGradient id={`g${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="var(--mark)" stopOpacity={hollow ? 0.04 : 0.20} />
          <stop offset="70%" stopColor="var(--mark)" stopOpacity={hollow ? 0.01 : 0.06} />
          <stop offset="100%" stopColor="var(--mark)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <path d={outer} fill={`url(#g${uid})`}
        style={animate ? {
          animation: `mark-fill var(--dur-mark) var(--ease-out) ${s.delay}ms both`,
        } : undefined}
      />

      {drawProgress ? (
        <motion.path
          d={outer} fill="none" stroke="var(--mark)"
          strokeWidth={size > 64 ? 1.5 : 1.25} strokeLinejoin="round"
          style={{ pathLength: drawProgress }}
        />
      ) : (
      <path
        d={outer}
        fill="none"
        stroke="var(--mark)"
        strokeWidth={size > 64 ? 1.5 : 1.25}
        strokeLinejoin="round"
        style={animate ? {
          ["--mark-len" as string]: len,
          strokeDasharray: len,
          animation: `mark-draw var(--dur-mark) var(--ease-out) ${s.delay}ms both`,
        } : undefined}
      />
      )}

      {/* Confidence sits inside the traits it was drawn from */}
      <path
        d={inner}
        fill="none"
        stroke="var(--mark)"
        strokeWidth={size > 64 ? 1 : 0.85}
        strokeLinejoin="round"
        strokeDasharray={hollow ? "2 3" : undefined}
        opacity={hollow ? 0.45 : 0.72}
        style={animate && !hollow ? {
          ["--mark-len" as string]: len,
          strokeDasharray: len,
          animation: `mark-draw var(--dur-mark) var(--ease-out) ${s.delay + 140}ms both`,
        } : undefined}
      />
    </svg>
  );
}
