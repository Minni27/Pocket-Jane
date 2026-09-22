import { describe, expect, it } from "vitest";
import { confidenceGap } from "@/lib/analyze/calibration";

const r = (outcome: "success" | "partial" | "miss", confidence: number) => ({ outcome, confidence });

describe("confidenceGap", () => {
  it("reports how much more confident the wrong reads were", () => {
    const gap = confidenceGap([r("miss", 90), r("miss", 88), r("success", 70)]);
    expect(gap).toBe(19);
  });

  it("returns null with too few misses to be meaningful", () => {
    expect(confidenceGap([r("miss", 90), r("success", 70)])).toBeNull();
  });

  it("returns null with no correct read to compare against", () => {
    expect(confidenceGap([r("miss", 90), r("miss", 88)])).toBeNull();
  });

  it("can be negative when the model is well calibrated", () => {
    const gap = confidenceGap([r("miss", 60), r("miss", 62), r("success", 85)]);
    expect(gap).toBeLessThan(0);
  });

  it("ignores partial outcomes in the comparison", () => {
    const gap = confidenceGap([r("miss", 90), r("miss", 90), r("partial", 10), r("success", 80)]);
    expect(gap).toBe(10);
  });
});
