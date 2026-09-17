# Pocket Jane

A psychological profiling app inspired by Patrick Jane from *The Mentalist*. Point a camera at someone or describe them, and it returns an archetype, dominant traits, the reasoning behind the read, and persuasion angles — grounded in psychology books you upload yourself.

Two themes: light is Jane (blue), dark is Red John (red).

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Supabase** — Postgres for analyses and book passages
- **Gemini** — vision + reasoning for the profiling
- **pdfjs-dist** — PDF text extraction, in the browser

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where to get it |
|---|---|
| `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |

`GEMINI_API_KEY` is server-side only and must **not** be prefixed with `NEXT_PUBLIC_`, or it ships to the browser.

Next.js reads `.env.local` at startup, so restart the dev server after changing it.

### 3. Database

Run the whole of `supabase-schema.sql` in the Supabase SQL editor. It creates:

- `analyses` — every profile generated, plus the logged outcome and your correction note
- `book_chunks` — passages extracted from uploaded PDFs, with a GIN full-text index
- `library_books` — a grouped view, one row per book
- `search_book_chunks()` — the ranked passage lookup used during analysis

### 4. Run

```bash
npm run dev
```

## How it works

**Analysis.** Your input goes to Gemini with a prompt that forbids hedging and requires every claim to be anchored to a named observable. The route tries `gemini-3.8-flash` first and falls back through `gemini-2.5-flash` to `gemini-3.1-flash-lite`, since the newer models return 503 under load.

**The library.** Dropped PDFs are parsed in the browser, split into ~1200-character passages, and stored. At analysis time, behavioural cues in your input are mapped to the vocabulary the books actually use — *"fiddled with his glass"* becomes `pacifying self-soothing displacement` — and the best-ranked passages are injected into the prompt. Searching the books with raw surface words matches incidental mentions rather than the concepts, which is why the mapping exists.

Passages below a relevance floor are dropped entirely. Giving the model a bad passage is worse than giving it none, because it will cite it.

**Calibration.** When you log an outcome you can write what the read got wrong. Those corrections are fed into later prompts so the model can avoid repeating the same class of mistake. It also compares confidence on wrong reads against right ones and calls out systematic overconfidence. There is no fine-tuning — the learning is entirely in-context.

Name PDFs `Title - Author.pdf` so both fields parse correctly. Scanned PDFs with no text layer will fail, since there is no OCR step.

## Deploying

Works on any Next.js host. On Vercel: import the repo, add the three environment variables, deploy.

Make sure the Supabase schema has been run against the same project the environment variables point at.

## Auth

Email/password via Supabase Auth. Middleware guards every route except `/login` and refreshes the session cookie on each request.

Both tables carry a `user_id` that defaults to `auth.uid()`, with RLS policies scoped to the owner — so each account only ever sees its own readings and its own library. The `library_books` view and the `search_book_chunks()` function both run as SECURITY INVOKER, meaning RLS applies there too and one account's search can't reach another's books.

The anon key is public by design and ships in the client bundle; the RLS policies are what actually protect the data.

**In Supabase → Authentication → Providers**, make sure Email is enabled. Leaving "Confirm email" on is recommended; the login screen handles the confirm-then-sign-in flow.

### Upgrading an existing database

If your tables predate auth and still have the `Allow all for now` policy, run `migrations/001-add-auth.sql` rather than the main schema. It runs in two steps — add the column, sign up, then claim the existing rows — because rows can't be assigned an owner until an account exists.
