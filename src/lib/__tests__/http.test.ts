import { describe, expect, it } from "vitest";
import { sameOrigin } from "@/lib/http";

const req = (headers: Record<string, string>) => new Request("https://app.test/api/x", { headers });

describe("sameOrigin", () => {
  it("allows a same-origin browser request", () => {
    expect(sameOrigin(req({ origin: "https://app.test", host: "app.test" }))).toBe(true);
  });

  it("rejects a cross-site request", () => {
    expect(sameOrigin(req({ origin: "https://evil.test", host: "app.test" }))).toBe(false);
  });

  it("allows a request with no Origin header", () => {
    // Same-origin fetch() and non-browser clients omit it; the session
    // cookie is what actually authorises the call.
    expect(sameOrigin(req({ host: "app.test" }))).toBe(true);
  });

  it("prefers the forwarded host behind a proxy", () => {
    expect(sameOrigin(req({ origin: "https://app.test", host: "internal:3000", "x-forwarded-host": "app.test" }))).toBe(true);
  });

  it("rejects a malformed Origin", () => {
    expect(sameOrigin(req({ origin: "not a url", host: "app.test" }))).toBe(false);
  });
});
