import { describe, expect, it } from "vitest";
import { authErrorMessage, safeRedirect } from "@/lib/safe-redirect";

describe("safeRedirect", () => {
  it("keeps a same-site path", () => {
    expect(safeRedirect("/history")).toBe("/history");
    expect(safeRedirect("/history/abc?x=1")).toBe("/history/abc?x=1");
  });

  it("rejects protocol-relative URLs", () => {
    // The case a "starts with /" check would miss: browsers treat this as
    // absolute, so it navigates off-site.
    expect(safeRedirect("//evil.com")).toBe("/");
    expect(safeRedirect("//evil.com/path")).toBe("/");
  });

  it("rejects absolute and scheme URLs", () => {
    expect(safeRedirect("https://evil.com")).toBe("/");
    expect(safeRedirect("javascript:alert(1)")).toBe("/");
    expect(safeRedirect("/\\evil.com")).toBe("/");
  });

  it("falls back when absent", () => {
    expect(safeRedirect(null)).toBe("/");
    expect(safeRedirect("", "/analyze")).toBe("/analyze");
  });
});

describe("authErrorMessage", () => {
  it("maps known codes", () => {
    expect(authErrorMessage("link_expired")).toMatch(/expired/i);
  });

  it("never echoes an unknown code back to the page", () => {
    const crafted = "Your account is locked. Call 555-0100";
    expect(authErrorMessage(crafted)).not.toContain("555");
  });

  it("returns null with no code", () => {
    expect(authErrorMessage(null)).toBeNull();
  });
});
