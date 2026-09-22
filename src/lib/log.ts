// Structured logging on stdout. Vercel captures this for free; a JSON line
// per event means the log viewer can filter by route, user or request id
// without a paid log service.
//
// Never log secrets, image data or full prompt text — only their lengths.

type Level = "info" | "warn" | "error";

export type Logger = ReturnType<typeof createLogger>;

export function createLogger(scope: string, requestId = crypto.randomUUID().slice(0, 8)) {
  const emit = (level: Level, msg: string, data?: Record<string, unknown>) => {
    const line = JSON.stringify({ t: new Date().toISOString(), level, scope, rid: requestId, msg, ...data });
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  };
  return {
    requestId,
    info: (msg: string, data?: Record<string, unknown>) => emit("info", msg, data),
    warn: (msg: string, data?: Record<string, unknown>) => emit("warn", msg, data),
    error: (msg: string, data?: Record<string, unknown>) => emit("error", msg, data),
  };
}
