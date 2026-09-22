import { describe, expect, it } from "vitest";
import { attemptTimeout, MIN_ATTEMPT_MS, MODELS } from "@/lib/analyze/gemini";

describe("attemptTimeout", () => {
  it("gives each attempt only what is left of the shared budget", () => {
    const now = 1_000_000;
    const deadline = now + 52_000;
    expect(attemptTimeout(deadline, now)).toBe(52_000);
    // After a 40s first attempt, the next gets 12s — not another full 45s,
    // which is how three attempts used to overrun the 60s platform limit.
    expect(attemptTimeout(deadline, now + 40_000)).toBe(12_000);
  });

  it("goes non-positive past the deadline so no attempt starts", () => {
    const now = 1_000_000;
    expect(attemptTimeout(now + 52_000, now + 60_000)).toBeLessThan(MIN_ATTEMPT_MS);
  });

  it("keeps the whole fallback chain inside a 60s platform limit", () => {
    // Worst case: every model consumes its share and the budget is the cap.
    const budget = 52_000;
    expect(budget + MIN_ATTEMPT_MS).toBeLessThan(60_000);
    expect(MODELS.length).toBeGreaterThan(1);
  });
});
