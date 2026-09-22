/**
 * A caller-supplied ?next= is only ever navigated to if it is a path on this
 * site. "//evil.com" is a protocol-relative URL that browsers treat as
 * absolute, so a bare "starts with /" check is not enough — it let
 * /login?next=//evil.com bounce a user off-site immediately after they
 * signed in, which is a usable phishing step.
 */
export function safeRedirect(next: string | null, fallback = "/"): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (next.includes("://")) return fallback;
  return next;
}

/**
 * Messages shown on the login screen, addressed by code.
 *
 * The page used to render ?error= verbatim, so any URL could put arbitrary
 * text in a styled error box — "Your account is locked, call 555-0100" is a
 * convincing lure that costs an attacker nothing to craft.
 */
export const AUTH_ERRORS = {
  link_invalid: "That link is missing its token. Ask for a new invite.",
  link_expired: "That link has expired or was already used. Ask for a new one.",
  session_missing: "That invite link has expired or was already used.",
  verify_failed: "That link could not be verified. Ask for a new one.",
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERRORS;

export function authErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return AUTH_ERRORS[code as AuthErrorCode] ?? "Something went wrong signing you in. Try again.";
}
