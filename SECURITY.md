# Security

What protects the data in this app, where the boundaries are, and what is
deliberately not defended against. Everything here is enforced by code or by
Postgres — there is no paid service in the chain.

## Trust boundaries

```
browser ──┬─► proxy.ts ─────► page / route handler ──► Supabase (RLS as the caller)
          │   (session refresh, redirect)                    │
          └─► Supabase directly (anon key, RLS as the caller)│
                                                             ▼
                          /api/admin/* only ──► service role (RLS bypassed)
```

The browser holds the anon key, which is public by design. **Row Level
Security is what actually protects the data**, not the application code:
both tables carry `user_id default auth.uid()` with policies scoped to the
owner, the `library_books` view and `search_book_chunks()` are
SECURITY INVOKER, so one account's query can never reach another's rows.

## Authentication and roles

- Sessions are cookie-based, refreshed on every request by `src/proxy.ts`.
- The proxy uses `getUser()`, which verifies the token with Supabase, not
  `getSession()`, which trusts whatever is in the cookie.
- Admin status lives in `app_metadata`, writable only by the service role.
  `user_metadata` would be wrong: users can edit their own, so anyone could
  promote themselves.
- Admin is checked twice — in the proxy so a non-admin is redirected, and
  again in every `/api/admin/*` handler, which is the check that matters.
- Access is invitation-only, enforced in Supabase (public signups disabled),
  not in the UI. Anyone holding the anon key can call `signUp()` directly, so
  a UI-side check would be decorative.

## Service role

`SUPABASE_SERVICE_ROLE_KEY` bypasses every RLS policy. It is:

- read only through `src/lib/supabase-admin.ts`,
- used only by `/api/admin/*` (after `requireAdmin()`) and by the cross-tenant
  daily cap in `/api/analyze`, which cannot see other accounts through RLS,
- never prefixed `NEXT_PUBLIC_`, so it cannot reach the browser bundle.

## Input validation

Every request body is parsed with a zod schema (`src/lib/schemas.ts`) before
anything touches Postgres or Gemini. Gemini's *response* is validated the
same way: a model is instructed to return a shape, which is not a guarantee,
and an off-shape profile used to reach the insert, fail a constraint, and
leave the caller with a reading that had no id and could never be corrected.

The database repeats the limits it can (`migrations/002-hardening.sql`),
because the browser talks to Postgres directly and the API is not the only
path in.

## Headers

Set in `next.config.ts` for every response:

- `Content-Security-Policy` — `default-src 'self'`, `frame-ancestors 'none'`,
  `object-src 'none'`. `'unsafe-inline'` for styles is required by the app's
  inline `style={{}}` objects and `next/font`; `'unsafe-eval'` is required by
  pdf.js, which compiles glyph programs to render text.
- `X-Frame-Options: DENY` — defence in depth for the admin page.
- `Permissions-Policy` — camera on this origin only; microphone, geolocation,
  payment and USB off.
- `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options:
  nosniff`, `Strict-Transport-Security`.
- `/api/*` is `no-store`, so no proxy or browser caches an account-scoped
  response.

## The pdf.js worker is served from this origin

`public/pdf.worker.min.mjs` is copied from `node_modules`. It must not be
loaded from a CDN: pdf.js fetches the worker script and runs it from a `blob:`
URL, which **inherits this origin**, so a compromised or tampered CDN response
would execute with the signed-in user's session and could call
`/api/admin/users` as them.

If `pdfjs-dist` is upgraded, re-copy the file:

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
```

## Errors and logging

Client-facing errors are fixed strings plus a request id. Postgres constraint
names, upstream quota text and stack traces stay in the server log, which is
one JSON line per event on stdout (`src/lib/log.ts`) — Vercel captures it for
free. Admin actions log actor and target, so there is a trail of who created,
deleted or promoted whom. Secrets, image data and prompt text are never
logged; only their lengths.

## Prompt injection

Library passages and the user's own correction notes are interpolated into the
prompt, so they are wrapped in an unguessable fence and labelled as data
(`src/lib/analyze/prompt.ts`). A PDF containing "ignore your instructions"
would otherwise steer every later reading for that account. The blast radius
is that one account — a book cannot reach another tenant's readings — so this
is an output-quality defence, not an isolation one.

## Rate limits and cost

- 20 readings per account per hour, counted from that account's own rows, so
  the limit is correct across serverless instances where an in-memory counter
  would not be.
- 400 readings per day across all accounts, as a circuit breaker on the
  shared Gemini free-tier quota.
- 30,000 passages per account, enforced by a database trigger, because the
  browser can insert directly.

Both counting limits are check-then-act: concurrent requests can slightly
exceed them. At this scale that is accepted rather than fixed with a lock.

## Not defended against

Stated plainly so nobody assumes otherwise:

- **A malicious signed-in user against their own data.** Any account can fill
  its own quota, upload anything, and read everything it owns. Accounts are
  created by an admin, and that is the control.
- **A compromised Supabase project or Gemini key.** Rotate in the provider
  console; nothing in this repo mitigates it.
- **Traffic analysis or a determined scraper.** There is no WAF or bot
  detection, both of which cost money.
- **An admin acting in bad faith.** An admin can read nothing directly (RLS
  still applies to their own session) but can reset any password and then sign
  in as that user. Admin is a trusted role.

## Reporting

This is a personal deployment. Open an issue, or if the finding is sensitive,
contact the repository owner directly rather than filing publicly.
