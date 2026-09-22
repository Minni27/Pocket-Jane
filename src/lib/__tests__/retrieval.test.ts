import { describe, expect, it } from "vitest";
import { buildSearchQuery, CONCEPT_MAP, MIN_RANK } from "@/lib/analyze/retrieval";

describe("buildSearchQuery", () => {
  it("maps a behavioural cue to the books' vocabulary, not the surface word", () => {
    const q = buildSearchQuery("he fiddled with his glass the whole time");
    expect(q).toContain("pacifying");
    // The point of the mapping: "glass" would match incidental mentions.
    expect(q).not.toContain("glass");
  });

  it("combines several concepts when several cues appear", () => {
    const q = buildSearchQuery("he interrupted constantly, then went quiet and looked away");
    expect(q).toContain("dominance");
    expect(q).toContain("withdrawal");
  });

  it("falls back to distinctive own words when nothing maps", () => {
    const q = buildSearchQuery("the gentleman discussed horticulture extensively");
    expect(q).toContain("horticulture");
    expect(q).not.toContain("the");
  });

  it("drops stop words and short words from the fallback", () => {
    const q = buildSearchQuery("it was in the on at to of");
    expect(q).toBe("");
  });

  it("returns empty for empty input rather than searching everything", () => {
    expect(buildSearchQuery("")).toBe("");
    expect(buildSearchQuery("   ")).toBe("");
  });

  it("is case insensitive", () => {
    expect(buildSearchQuery("He FIDDLED with it")).toContain("pacifying");
  });

  it("caps the fallback at eight words so the tsquery stays bounded", () => {
    const input = Array.from({ length: 30 }, (_, i) => `distinctword${i}`).join(" ");
    expect(buildSearchQuery(input).split(/\s+/).length).toBe(8);
  });
});

describe("CONCEPT_MAP", () => {
  it("has no regex that matches the empty string", () => {
    // A concept matching "" would attach itself to every single reading.
    for (const [re] of CONCEPT_MAP) expect(re.test("")).toBe(false);
  });
});

describe("MIN_RANK", () => {
  it("sits inside the observed ts_rank band for ~1200-char chunks", () => {
    expect(MIN_RANK).toBeGreaterThan(0);
    expect(MIN_RANK).toBeLessThan(0.03);
  });
});
