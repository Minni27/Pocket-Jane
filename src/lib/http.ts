import { NextResponse } from "next/server";
import type { Logger } from "@/lib/log";

// Client-facing errors carry a stable message and the request id, never the
// underlying exception — Postgres constraint names, upstream quota text and
// stack traces belong in the server log only.
export function jsonError(status: number, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function internalError(log: Logger, err: unknown, context: string) {
  const msg = err instanceof Error ? err.message : String(err);
  log.error(context, { err: msg });
  return jsonError(500, `Something went wrong. Reference: ${log.requestId}`);
}

// Reject cross-site requests to state-changing routes. Supabase's cookies are
// SameSite=Lax, which already blocks this, but an explicit check costs nothing
// and holds if a cookie setting ever changes.
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin fetch() and non-browser clients omit it
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
