# Privacy

Pocket Jane produces psychological profiles of **other people** from photos
and descriptions. That makes the legal position different from a typical app,
and different from what the code alone can settle. This file records what the
software actually does, so anyone deploying it can make an informed decision.

## What is stored

| Data | Stored? | Where |
|---|---|---|
| The photograph you capture | **No** | Sent to Google's Gemini API for the reading, never written to the database |
| Your typed description or context note | Yes | `analyses.input_text` |
| The generated profile | Yes | `analyses` |
| Your outcome log and correction note | Yes | `analyses.outcome`, `analyses.outcome_note` |
| PDFs you upload | The extracted text only | `book_chunks`; the PDF file itself is never uploaded — it is parsed in your browser |
| Your email and password | Yes | Supabase Auth (password hashed by Supabase) |

Every row is scoped to your account by Row Level Security. No other account
can read it, and there is no analytics, telemetry or third-party tracking in
the app.

## What leaves the deployment

- **Google (Gemini API)** — the image, your description, the passages selected
  from your library, and your past correction notes, as one request per
  reading. Check which Gemini tier the key belongs to: on the free tier,
  Google may use submitted content to improve its models.
- **Supabase** — everything in the table above.
- **Google Fonts** — the browser fetches the three fonts from
  `fonts.gstatic.com`.

Nothing else. There is no CDN in the runtime path: the pdf.js worker is
served from this origin.

## Deleting data

- A reading: delete it on the History page. It is gone immediately.
- A book: remove it on the Library page; every passage is deleted.
- An account: an admin deletes it from the Users page. The foreign keys
  cascade, so every reading and passage for that account goes with it.

There is no soft delete and no backup held by this app. Supabase's own
point-in-time backups, if enabled on the project, are outside its control.

## Before deploying this publicly

The software is written for an invitation-only, personal deployment. Making it
available more widely raises questions the code does not answer:

- Photographs of a face are **biometric data** under the GDPR and UK GDPR, and
  under Illinois BIPA. The person in the photo has not consented and is not a
  user of the app.
- The **EU AI Act** restricts emotion inference in workplace and education
  settings, and certain biometric categorisation, with obligations already in
  force.
- Some jurisdictions require notice before recording or photographing a person.

Take legal advice before offering this to anyone beyond people who know
exactly what it does. This is a description of the software, not legal advice,
and not a privacy policy for any particular deployment.
