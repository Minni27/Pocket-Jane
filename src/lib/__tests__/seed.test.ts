import { describe, expect, it } from "vitest";
import { markPath, seedFrom } from "@/lib/seed";

const traits = [{ strength: 80 }, { strength: 60 }, { strength: 90 }, { strength: 55 }];

describe("seedFrom", () => {
  it("is stable for the same archetype — a reading's mark must never change", () => {
    expect(seedFrom("The Rehearsed Charmer", traits, 70))
      .toEqual(seedFrom("The Rehearsed Charmer", traits, 70));
  });

  it("keeps the hue inside the theme", () => {
    for (const name of ["A", "The Exhausted Loyalist", "ZZZ", ""]) {
      const { shift } = seedFrom(name, traits, 70);
      expect(Math.abs(shift)).toBeLessThanOrEqual(16);
    }
  });

  it("always produces at least three radii, so the curve encloses an area", () => {
    expect(seedFrom("A", [{ strength: 70 }], 70).radii.length).toBeGreaterThanOrEqual(3);
    expect(seedFrom("A", [], 70).radii.length).toBeGreaterThanOrEqual(3);
  });

  it("never collapses a radius to a spike", () => {
    const { radii, inner } = seedFrom("A", [{ strength: 0 }, { strength: 50 }, { strength: 95 }], 0);
    for (const r of radii) expect(r).toBeGreaterThan(0.3);
    expect(inner).toBeGreaterThan(0);
  });

  it("spreads tension across the range rather than clustering", () => {
    const names = ["The Rehearsed Charmer", "The Exhausted Loyalist", "The Quiet Auditor",
                   "The Borrowed Authority", "The Careful Optimist", "The Practised Sceptic"];
    const tensions = names.map((n) => seedFrom(n, traits, 70).tension);
    expect(Math.max(...tensions) - Math.min(...tensions)).toBeGreaterThan(0.05);
    for (const t of tensions) {
      expect(t).toBeGreaterThan(0);
      expect(t).toBeLessThan(0.3);
    }
  });

  it("caps at six radii", () => {
    const many = Array(12).fill({ strength: 70 });
    expect(seedFrom("A", many, 70).radii.length).toBe(6);
  });
});

describe("markPath", () => {
  it("emits a closed path with finite coordinates", () => {
    const d = markPath([0.8, 0.6, 0.9, 0.55], 0.3, 100);
    expect(d.startsWith("M")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    expect(d).not.toMatch(/NaN|Infinity/);
  });

  it("handles the minimum of three points", () => {
    expect(markPath([0.7, 0.7, 0.7], 0, 100)).not.toMatch(/NaN/);
  });
});
