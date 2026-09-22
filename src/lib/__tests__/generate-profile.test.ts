import { afterEach, describe, expect, it, vi } from "vitest";
import { generateProfile, MODELS } from "@/lib/analyze/gemini";
import type { Logger } from "@/lib/log";

// The production failure these cover: gemini-2.5-flash had been retired and
// answered 404 on every pass, while the two live models were shedding load
// with 503 "experiencing high demand". A single pass over a chain one third
// dead turned a transient spike into a failed reading.

const log = (): Logger => ({
  requestId: "test",
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const profile = {
  archetype: "The Rehearsed Charmer",
  confidence: 72,
  summary: "Wants to be read correctly more than he wants to be liked.",
};

const ok = () => ({
  ok: true,
  status: 200,
  json: async () => ({
    candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify(profile) }] } }],
  }),
});

const fail = (status: number, message = "nope") => ({
  ok: false,
  status,
  json: async () => ({ error: { message } }),
});

/** Model name out of the URL the client called, in call order. */
const calledModels = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.map((c) => String(c[0]).match(/models\/([^:]+):/)?.[1]);

const deadline = () => Date.now() + 52_000;

afterEach(() => vi.unstubAllGlobals());

describe("generateProfile", () => {
  it("retries a model that shed load, rather than failing the reading", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(fail(503, "high demand"))
      .mockResolvedValueOnce(fail(503, "high demand"))
      .mockResolvedValueOnce(fail(503, "high demand"))
      .mockResolvedValueOnce(ok());
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateProfile([{ text: "x" }], deadline(), log());

    expect(result.ok).toBe(true);
    // The whole first pass 503'd; the reading survived because there is a second.
    expect(fetchMock).toHaveBeenCalledTimes(MODELS.length + 1);
  });

  it("does not call a model again once it answers 404", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      String(url).includes(MODELS[0]) ? fail(404, "no longer available") : fail(503, "high demand")
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateProfile([{ text: "x" }], deadline(), log());

    expect(result.ok).toBe(false);
    // A retired model is quarantined after its first answer, so it appears
    // once and the retry budget goes to models that might still respond.
    expect(calledModels(fetchMock).filter((m) => m === MODELS[0])).toHaveLength(1);
  });

  it("reports the last real failure rather than a generic one", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fail(503, "high demand")));

    const result = await generateProfile([{ text: "x" }], deadline(), log());

    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.error).toContain("503");
  });

  it("treats a 200 with no text as a failed attempt and moves on", async () => {
    const blocked = {
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ finishReason: "SAFETY", content: { parts: [] } }] }),
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(blocked)
      .mockResolvedValueOnce(ok());
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateProfile([{ text: "x" }], deadline(), log());

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.model).toBe(MODELS[1]);
  });

  it("starts no attempt it cannot finish", async () => {
    const fetchMock = vi.fn(async () => ok());
    vi.stubGlobal("fetch", fetchMock);

    // Deadline already passed: the function must give up, not fire a request
    // the platform will kill mid-flight.
    const result = await generateProfile([{ text: "x" }], Date.now() - 1, log());

    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
