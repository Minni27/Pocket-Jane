# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

No single vertical. The user is anyone who wants to read another person more accurately than
instinct allows — confirmed by the owner as "a mix of everything… used for all purposes."
Sales calls, interviews, dates, and idle curiosity are all in scope; the product does not
narrow to one of them.

Two distinct usage moments, both confirmed as real:

- **In the moment, on a phone.** Standing in or just out of a room, capturing someone via
  camera, discreetly. Speed and glanceability matter; the screen is small and the user is
  not comfortable.
- **Afterwards, at a desk.** Typing a longer description, reading the methodology properly,
  logging what actually happened. Density and depth are welcome here.

Neither is secondary. They are two jobs, not one layout compromise.

## Product Purpose

Produce a psychological read of a specific person — an archetype, their dominant traits, the
reasoning behind the read, and concrete scripted persuasion angles — from a photo, a written
description, or both.

Success is a read the user acts on and finds accurate afterwards. The outcome log exists to
measure exactly that gap.

## Positioning

The product is the embodiment of a mentalist — Patrick Jane in your pocket — not a category
tool wearing a theme. That framing is the position, and it is why the product commits to
specific claims where a general assistant would hedge.

Two mechanisms a neighbouring product could not truthfully copy:

1. **It cites the user's own library.** Books are uploaded as PDFs, indexed, and searched at
   analysis time; citations point at passages from those specific books. A competitor citing
   Cialdini from model memory is not doing this.
2. **It is corrected, and carries the correction forward.** When a read is marked partial or
   missed, the user writes what was wrong. Those corrections are injected into later prompts,
   along with a warning when confidence runs systematically higher on wrong reads than right
   ones. There is no fine-tuning; the learning is in-context and belongs to that user alone.

## Operating Context

- Capture is a camera frame or free text, optionally both, plus an optional context note.
- A reading takes roughly 26–30 seconds. This is a fixed property of the product, not a bug
  to design around silently — the wait is long enough that the interface must account for it.
- Output is read once immediately, and sometimes returned to later from history.
- Outcomes are logged after the real interaction, which may be hours or days later.
- Library upload is rare and deliberate; reading is frequent.

## Capabilities and Constraints

- **Tenancy:** every account is isolated. Own readings, own library, own calibration history,
  enforced by row-level security rather than application code.
- **Access is invitation-only.** There is no public signup. Accounts are created by an admin
  from inside the app.
- **Roles:** admin (manages users) and member.
- **Limits:** 7 books per account, 60MB per PDF, 20 readings per hour, 5MB per image,
  4000 characters of description.
- **Scanned PDFs fail.** There is no OCR; a PDF without a text layer cannot be indexed.
- **Installable PWA** with a mobile bottom tab bar.
- **Terminology, as used in the product:** a *reading* (not a scan or report), *archetype*,
  *dominant traits*, *methodology*, *persuasion angles*, *calibration*, *library*, *passages*.
- Model access is a third-party dependency and is intermittently unavailable; the product
  falls back across models rather than failing.

## Brand Commitments

- **Name:** Pocket Jane. Short name "Jane".
- **The dual identity is binding.** Light theme is *Jane* — white, electric blue. Dark theme
  is *Red John* — near-black, crimson. Both are named after characters in The Mentalist and
  the theme toggle is part of the product's personality, not a preference switch.
- **Voice:** commits rather than hedges. The analysis prompt explicitly bans "may be",
  "tends to", "often" and similar. Interface copy should hold the same line.
- Existing marks: a teacup (Jane) and a smile (Red John), used in the logo and PWA icons.

## Evidence on Hand

- A live deployment at pocket-jane.vercel.app with real accounts and real data.
- Real readings in the database with genuine archetypes, traits and citations — usable as
  design content. No need to invent sample output.
- A real library: five indexed books, 3,807 passages.
- **No** testimonials, user counts, press, case studies, pricing, or accuracy benchmarks
  exist. Future work must not fabricate any of these.

## Product Principles

1. **Commit, never hedge.** The product's value is a specific claim about a specific person.
   Vagueness is the failure mode it exists to avoid, in the output and in the interface.
2. **Show the reasoning.** The methodology and its citations are not an appendix — they are
   what separates this from a horoscope.
3. **The wait is part of the product.** Thirty seconds is not hidden or apologised for; it is
   made legible.
4. **What the user corrects, the product keeps.** Being wrong is expected and useful, and the
   interface should make correcting it feel like contribution rather than complaint.
5. **A library the user built beats a model's memory.** Their books, cited specifically.

## Accessibility & Inclusion

No formal standard was established. Two product-specific needs are known from the operating
context: the phone case is used one-handed and often in low light, and the dual theme must
hold legible contrast in both directions rather than only in light.
