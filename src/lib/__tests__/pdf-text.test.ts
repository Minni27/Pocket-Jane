import { describe, expect, it } from "vitest";
import { chunkText, parseFilename } from "@/lib/pdf-text";
import { LIMITS } from "@/lib/limits";

describe("chunkText", () => {
  it("splits long text into overlapping passages", () => {
    const chunks = chunkText("word ".repeat(2000));
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(1200);
  });

  it("drops page furniture shorter than the minimum", () => {
    expect(chunkText("Chapter 1")).toEqual([]);
  });

  it("returns nothing for a PDF with no text layer", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n  \n ")).toEqual([]);
  });

  it("caps a runaway PDF at the per-book limit", () => {
    const huge = "x".repeat(1200 * (LIMITS.CHUNKS_PER_BOOK + 50));
    expect(chunkText(huge).length).toBeLessThanOrEqual(LIMITS.CHUNKS_PER_BOOK);
  });

  it("overlaps consecutive passages so a split sentence is still findable", () => {
    const text = Array.from({ length: 400 }, (_, i) => `w${i}`).join(" ");
    const chunks = chunkText(text);
    if (chunks.length > 1) {
      const tail = chunks[0].slice(-80);
      expect(chunks[1].includes(tail.split(" ").slice(1).join(" ").slice(0, 20))).toBe(true);
    }
  });
});

describe("parseFilename", () => {
  it("splits title and author on a dash", () => {
    expect(parseFilename("Influence - Robert Cialdini.pdf"))
      .toEqual({ title: "Influence", author: "Robert Cialdini" });
  });

  it("replaces underscores and collapses whitespace", () => {
    expect(parseFilename("Emotions_Revealed -  Paul_Ekman.pdf"))
      .toEqual({ title: "Emotions Revealed", author: "Paul Ekman" });
  });

  it("handles en and em dashes", () => {
    expect(parseFilename("Influence — Cialdini.pdf").author).toBe("Cialdini");
    expect(parseFilename("Influence – Cialdini.pdf").author).toBe("Cialdini");
  });

  it("falls back to Unknown with no author", () => {
    expect(parseFilename("Influence.pdf")).toEqual({ title: "Influence", author: "Unknown" });
  });

  it("rejoins a multi-dash author", () => {
    expect(parseFilename("Book - Jean - Luc.pdf").author).toBe("Jean - Luc");
  });

  it("truncates to the stored column length so the insert cannot fail", () => {
    const long = parseFilename(`${"x".repeat(500)}.pdf`);
    expect(long.title.length).toBeLessThanOrEqual(LIMITS.TITLE_CHARS);
  });

  it("never returns an empty title", () => {
    expect(parseFilename(".pdf").title).toBe("Untitled");
  });

  it("is case insensitive about the extension", () => {
    expect(parseFilename("Influence.PDF").title).toBe("Influence");
  });
});
