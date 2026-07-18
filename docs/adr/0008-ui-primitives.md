# 0008 — UI primitives: Base UI for behavior, hand-rolled for pixels

**Status:** Accepted · 2026-07-18

## Context

The UI needs an accessible accordion and form controls (steppers, a variant picker) that are
pixel-perfect to a bespoke design, with motion as pure CSS and no animation library. The primitive
strategy was left open (shadcn vs Base UI vs hand-rolled). Inspection settled the premise: the repo
already standardizes on Base UI — `components/ui/button.tsx` and `tooltip.tsx` both import
`@base-ui/react/*`, and `components.json` uses the `base-vega` style. So shadcn here is not a
competing library; it is the scaffold that vendors Base-UI-backed components into `components/ui/`.

## Decision

Split behavior from pixels.

- **Behavior / accessibility → Base UI.** It owns the ARIA state machines, roving keyboard, focus,
  and inert-when-closed panels we would otherwise get subtly wrong by hand.
- **Accordion → Base UI behavior + our own CSS animation.** ~~The open/close is
  `grid-template-rows: 0fr → 1fr`~~ — **superseded during implementation, see Amendment below.**
  The open/close animates `height` off Base UI's `--accordion-panel-height`, gated by
  `prefers-reduced-motion`. No animation library, satisfying the pure-CSS motion rule.
- **Presentational, bespoke components → hand-rolled Tailwind (+ CVA for variants).** Product card,
  review line, quantity stepper, badge pill, price, variant chip. shadcn's generic primitives (e.g.
  `card`) are a bordered div and fight a 1:1 target; there is nothing to reuse.
- **Button → re-theme the existing `ui/button.tsx`** (already Base UI + CVA). ~~Variant swatch
  pickers → Base UI `RadioGroup`~~ — **superseded, see Amendment below.**

## Consequences

- One behavior library, no Radix and no `framer-motion`; consistent with "motion is pure CSS."
- Keyboard, `aria-expanded`/`aria-controls`, focus management, and inert collapsed panels come from
  Base UI rather than hand-maintained code.
- The fidelity surface is entirely ours, so nothing in the library fights the design.
- One-line defense: borrow the behavior, own the pixels; `base-vega` shadcn is only the scaffold.

## Amendment · 2026-07-18 — two choices reversed during implementation

Both original calls were made before reading the installed Base UI 1.6 docs. Building against the
real API changed them.

**1. Panel animation: `height`, not `grid-template-rows`.**

The `0fr → 1fr` grid trick exists for exactly one reason: CSS cannot animate to `height: auto`, and
without JS you cannot know the content's height. Base UI's `Accordion.Panel` measures itself and
exposes `--accordion-panel-height`, which removes that constraint — so the trick solves a problem we
no longer have.

It is also the slower of the two. Both animate on the main thread and neither is compositor-only,
but grid re-resolves track sizing every frame _on top of_ the block layout the height animation
already performs. Grid is never cheaper here. Layering it over Base UI's own
`data-starting-style` / `data-ending-style` machinery would also mean two systems driving one
transition.

```
h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-200 ease-out
data-starting-style:h-0 data-ending-style:h-0 motion-reduce:transition-none
```

Still pure CSS, still no animation library. Revisit if `interpolate-size: allow-keywords` reaches
cross-browser support, which would make animating to `auto` native and drop the measurement.

**2. Selection controls: native radios in labels, not Base UI `RadioGroup`.**

Variant chips and plan cards both use a visually-hidden `<input type="radio">` inside a `<label>`.
The browser supplies arrow-key navigation, the selected state, and the group name for free — the
things `RadioGroup` exists to provide — and the label gives a full-size hit target with no JS. One
less abstraction between the markup and the pixels, which is the point of the split above.

One trap this creates, worth knowing: a `<label>` wrapping a card **natively activates its input
from any click inside it**, including a nested link. `stopPropagation` does not help, because native
label activation is not a React synthetic event. Where a card contains both a radio and a link (the
plan cards' "Learn More"), the label is instead absolutely positioned across the card and the link
lifts above it on `z-10`. Verified in the browser: clicking "Learn More" navigates without changing
the selected plan.
