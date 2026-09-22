import { describe, expect, it } from "vitest";
import { attemptBudget, attemptTimeout, MIN_ATTEMPT_MS, MODELS } from "@/lib/analyze/gemini";

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

describe("attemptBudget", () => {
  it("leaves time for the attempts still queued", () => {
    const now = 1_000_000;
    const deadline = now + 52_000;
    // The regression this guards: the first attempt used to be handed all
    // 52_000, so one hung connection skipped every model behind it.
    expect(attemptBudget(deadline, 6, now)).toBeLessThan(52_000);
    expect(attemptBudget(deadline, 6, now)).toBe(8_666);
  });

  it("hands the last attempt the whole remainder", () => {
    const now = 1_000_000;
    expect(attemptBudget(now + 52_000, 1, now)).toBe(52_000);
  });

  it("never returns a slice too short to be worth starting", () => {
    const now = 1_000_000;
    expect(attemptBudget(now + 20_000, 10, now)).toBe(MIN_ATTEMPT_MS);
  });

  it("never promises more time than the deadline allows", () => {
    const now = 1_000_000;
    expect(attemptBudget(now + 3_000, 4, now)).toBe(3_000);
  });
});

describe("MODELS", () => {
  it("does not list a model Google has retired", () => {
    // gemini-2.5-flash answered 404 "no longer available to new users" in
    // production, silently costing the chain a third of its depth.
    expect(MODELS).not.toContain("gemini-2.5-flash");
  });

  it("has no duplicates, so a pass is genuinely three models wide", () => {
    expect(new Set(MODELS).size).toBe(MODELS.length);
  });
});
