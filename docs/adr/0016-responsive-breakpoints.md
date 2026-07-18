# 0016 — Responsive: three layouts, mobile-first, pure CSS

**Status:** Accepted · 2026-07-19

## Context

The feature shipped desktop-only: a fixed `w-[768px]` builder + `w-[399px]` review in a flex row,
`grid-cols-2` cards, image-left card layout, and a `w-fit` page wrapper — so a phone got a
horizontally scrolling desktop. The design has three frames (mobile ~390, tablet ~810, desktop),
and the tablet/mobile frames were never MCP-extracted, so this pass worked from the local frame PNGs
(`DESIGN-TOKENS.md` sanctions this: "derive spacing from PNGs").

## Decision

**Rebase mobile-first, map the three frames to breakpoints, keep motion pure CSS.**

- Base = mobile (stacked, `grid-cols-1`, image-top cards). `md` (768) = tablet, `xl` (1280) =
  desktop. Desktop's fixed values all move behind `xl:`; `page.tsx` drops `w-fit` for
  `w-full max-w-[1200px] px-4`.
- **Review panel** goes one column → two columns → one column as the screen grows
  (`flex-col md:flex-row xl:flex-col`): stacked on mobile, split on tablet (line items left, summary
  right, matching frame 1736), back to a single column in the narrow desktop rail. This needed the
  one DOM change of the pass — wrapping the line items so the summary is their sibling.
- **Cards** flip image-top → image-left at `xl`. On tablet they pack via
  `grid-cols-[repeat(auto-fill,minmax(240px,1fr))]` — 3–4 narrow portrait cards per row that adapt
  to width — rather than two wide, sparse boxes. Desktop returns to the fixed 2·2·1 grid, where the
  lone-last-card centering trick is gated to `xl` (it only makes sense in a 2-column grid).
- **Next-button scroll.** Advancing a step collapses a tall panel; the browser keeps the scroll
  offset and dumps the user into the review panel. Fix: read the current header's height, jump the
  scroll **instantly** to where the opened step's header will land after the collapse, then open the
  step — so the accordion's own height animation is the only visible motion. Instant, not smooth: a
  smooth scroll animating the full height of a collapsing panel is what produced the "down then up"
  wobble.
- No JS breakpoint detection; pure CSS/Tailwind variants only, same discipline as the motion rule,
  so the page stays static with zero runtime CLS.

## Consequences

- All three layouts match the frames; totals held through the pass, confirming the money layer was
  untouched (presentation-only change).
- Header row: title shrinks to `text-lg` on mobile and "N selected" is `shrink-0 whitespace-nowrap`,
  so a phone header fits on one line.
- "Your bundle is ready on the right" and its mobile counterpart flip at `xl`, not `lg` — the
  message must only appear where the review is actually on the right.

### Deliberate deviations from the frames

Extends [0011](0011-stability-over-mock.md)'s "stability over mock" stance to the responsive pass:

- **Tablet cards** pack 3–4 per row, not the frame's literal 5-across — 5 narrow cards at ~810px is
  cramped and breaks below ~700px; `auto-fill` is faithful to the intent (narrow portrait cards) and
  robust at any width.
- **Returns copy** sits above the rosette in the tablet summary rather than beside it; in a ~340px
  column it reads cleaner stacked. Content is faithful, exact placement is not.
- **Mobile plan label** stays "PLAN", not the frame's "HOME MONITORING PLAN" — a per-breakpoint copy
  exception would break the catalog-driven label, and it reads as mock drift (see 0007).

### Still open

The card stepper→price gap fidelity question (desktop-only) predates this pass: `DESIGN-TOKENS.md`
and the frame disagree, and settling it costs a Figma MCP call. Left as-is.
