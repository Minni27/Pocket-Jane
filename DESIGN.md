# Design

<!-- impeccable:design-schema 1 -->

## Visual world: The Seeded Mark

A generative parametric identity. A mark redraws itself from a few parameters, and the same
seed spills outward into the surfaces around it — so a refresh tunes the whole brand a few
degrees off its last self.

Applied here: **every reading computes its own mark from that person's actual trait values.**
No two readings look alike, because no two people score alike. The mark is not decoration
applied to the data; it is the data, drawn.

This is the one direction on the table where the visual system is generated from the product's
content rather than laid on top of it. That is the whole bet.

## The seed

Every reading already carries the numbers: four trait strengths (50–95), a confidence (50–95),
and an archetype string. From those, deterministically:

- **Geometry.** Four traits become four radii on a closed curve. Strength sets radius. The
  archetype hash sets rotation. A second inner contour sits at the confidence value.
- **Hue.** The archetype hash yields an offset of ±16° from the theme accent. Deliberately
  narrow — see Discipline.
- **Rhythm.** The same hash offsets the mark's draw-in timing by up to 120ms, so two marks
  animating side by side are never in lockstep.

Same reading, same mark, forever. It appears at full size on the analysis, small as the row
identifier in history, and on the printed PDF.

Why it is not a radar chart: a radar chart shows axes, gridlines, and a labelled polygon. It is
a diagram. This is a mark — a closed form with weight and rotation, read as identity, not
measured. The numbers are already stated in text beside it; the mark does not restate them.

## Discipline — how a generative system avoids becoming noise

The named risk of this direction is drift into noise. The parameter range is therefore tight,
and the boundary is explicit:

**What varies:** the mark's geometry, its hue within ±16°, its motion offset.

**What never varies:** type scale, spacing, layout, structure, component shape, border weight,
the theme's base palette. A generative accent on a fixed grid. If the structure moved too, the
product would feel broken rather than alive.

**Never:** a seed that produces illegible contrast, a degenerate shape, or a hue outside the
theme family. All three are clamped, not hoped for.

## Palette

The dual identity is a binding brand commitment and is preserved.

- **Jane (light).** Paper `#fbfaf7` — warm, not clinical white. Ink `#14161c`, never pure black.
  Accent blue `#2d5be3`, seeded ±16°.
- **Red John (dark).** Ground `#0a0910`. Ink `#f2ede2`. Accent crimson `#b91c1c`, seeded ±16°.

Theme is not a preference toggle — it is part of the product's personality, and both directions
must hold contrast independently rather than one being an inversion of the other.

The old `--gold` token is removed. It held `#1a3db5` (blue) under Jane and `#c9a84c` (gold)
under Red John: one name, two unrelated hues, describing neither. Replaced by `--mark` for
seeded values and `--signal` for the fixed emphasis hue.

## Type

Playfair Display for display, Inter for everything else. The scale collapses from the 18 shipped
sizes to six steps, each perceivably different from its neighbours:

| Token | Size | Use |
|---|---|---|
| `--t-display` | clamp(2rem, 5vw, 3rem) | Page titles, archetype |
| `--t-title` | 20px | Card titles, section heads |
| `--t-body` | 15px | Prose, summaries, analysis |
| `--t-ui` | 13px | Controls, labels, list text |
| `--t-meta` | 11px | Timestamps, counts, captions |
| `--t-micro` | 10px | Uppercase eyebrow labels only |

Body measure caps at 70ch. Tracking never tighter than -0.03em. Tabular numerals on every
figure that sits in a column.

## Space

Six steps on a 4px base: 4, 8, 12, 16, 24, 40. Replaces the ~20 ad-hoc values in the audit,
which included 3, 5, 7, 9, 11 and 13px.

Radius: 14px for cards and panels, 8px for inputs and buttons, full for small pills.

## Components

The audit found 306 inline style objects and zero shared components — which is why the same
button shipped at three different radii. A real component layer lands in `src/components/ui`:
`Button`, `Card`, `Field`, `Label`, `Meter`, `Chip`, `Icon`, `Mark`. Surfaces compose these
rather than restyling from scratch.

## Icons

Drawn SVG on one 1.5px stroke at 24px, never Unicode glyphs. The shipped app uses ◈ ◎ ✦ ⊕ ◉
as its icon system; these are typographic ornaments at the mercy of font fallback, and they
are replaced.

The two brand marks — the Jane teacup and the Red John smile — stay. They are identity, not
iconography.

## Motion

One authored moment: **the mark drawing itself.** When a reading resolves, its mark strokes on
over ~700ms with an exponential ease-out, its inner confidence contour following. That is the
moment the reading becomes a specific person rather than a loading state.

Everything else is quiet — state changes at 150ms, disclosure at 250ms. No entrance animation
on scroll. Reduced motion renders the mark complete with no draw.

## States

Every state takes a distinct form — a mark, a rule, a reversal — never a colour shift alone,
so meaning survives both themes and colour-blindness.

Empty states are drawn as deliberately as filled ones: an unlogged outcome shows the mark's
outline awaiting its contour, not blank space.

## Browser surfaces

Selection, caret, focus ring, scrollbar and tabular numerals are themed from the palette rather
than left at browser defaults.
