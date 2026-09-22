// The seed behind every reading's mark.
//
// A reading already carries the numbers: four trait strengths, a confidence,
// and an archetype. The mark is those numbers drawn — not decoration applied
// to them. Same reading, same mark, forever.
//
// The parameter range is deliberately narrow. A generative system drifts into
// noise when everything is free, so only geometry, hue offset and timing vary;
// type, spacing, structure and the base palette never do.

export type Seeded = {
  /** Hue offset in degrees, clamped to ±16 so the mark never leaves the theme */
  shift: number;
  /** Radians of rotation — two readings rarely sit at the same angle */
  rotation: number;
  /** Animation offset in ms, so side-by-side marks never draw in lockstep */
  delay: number;
  /** Normalised radii, one per trait, already clamped away from degenerate */
  radii: number[];
  /** Normalised radius of the inner confidence contour */
  inner: number;
  /** Control-point weight: ~0 draws a faceted polygon, ~0.3 a soft lobed form */
  tension: number;
};

// FNV-1a. Small, fast, and stable across runs — the mark must not change
// between a reading and its own history row.
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const MAX_SHIFT = 16;

export function seedFrom(
  archetype: string,
  traits: { strength: number }[],
  confidence: number
): Seeded {
  const h = hash(archetype || "unread");

  // Strengths arrive 50–95. Mapped to 0.42–1.0 so a low score still draws a
  // real shape: a radius near zero collapses the curve into a spike.
  const norm = (v: number) => 0.42 + (Math.min(95, Math.max(50, v)) - 50) / 45 * 0.58;

  const radii = (traits.length ? traits : [{ strength: 70 }])
    .slice(0, 6)
    .map((t) => norm(t.strength));

  // Fewer than three points cannot enclose an area
  while (radii.length < 3) radii.push(radii[radii.length - 1] ?? 0.7);

  return {
    shift: ((h % (MAX_SHIFT * 2 + 1)) - MAX_SHIFT),
    rotation: ((h >>> 8) % 360) * (Math.PI / 180),
    delay: (h >>> 16) % 120,
    radii,
    inner: norm(confidence) * 0.55,
    // Radius and rotation alone keep every mark inside one rounded family.
    // Tension is what makes some crystalline and others soft, which is the
    // difference between distinguishable side by side and recognisable at
    // a glance. Floor is above zero so a shape never degenerates to a spike.
    // Re-hashed rather than sliced from h: the high bits correlate with the
    // ones rotation already uses, and six archetypes landed within 0.02 of
    // each other. An independent digest spreads the range properly.
    tension: 0.02 + (hash(archetype + "~tension") % 1000) / 1000 * 0.26,
  };
}

/**
 * A closed Catmull-Rom curve through the trait radii, emitted as cubic béziers.
 * A polygon through the same points would read as a radar chart — a diagram
 * that restates numbers already written beside it. The curve reads as a mark.
 */
export function markPath(
  radii: number[],
  rotation: number,
  size: number,
  tension = 1 / 6
): string {
  const c = size / 2;
  const r = size / 2 - 2;
  const n = radii.length;

  const pt = (i: number) => {
    const a = rotation + (i / n) * Math.PI * 2;
    const m = radii[((i % n) + n) % n] * r;
    return [c + Math.cos(a) * m, c + Math.sin(a) * m] as const;
  };

  let d = "";
  for (let i = 0; i < n; i++) {
    const p0 = pt(i - 1), p1 = pt(i), p2 = pt(i + 1), p3 = pt(i + 2);
    if (i === 0) d += `M${p1[0].toFixed(2)},${p1[1].toFixed(2)}`;
    const c1x = p1[0] + (p2[0] - p0[0]) * tension;
    const c1y = p1[1] + (p2[1] - p0[1]) * tension;
    const c2x = p2[0] - (p3[0] - p1[0]) * tension;
    const c2y = p2[1] - (p3[1] - p1[1]) * tension;
    d += `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d + "Z";
}
