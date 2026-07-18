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
- **Accordion → Base UI behavior + our own CSS animation.** The open/close is `grid-template-rows:
  0fr → 1fr` keyed off Base UI's `data-[open]`/`data-[closed]` attributes, gated by
  `prefers-reduced-motion`. No animation library, satisfying the pure-CSS motion rule.
- **Presentational, bespoke components → hand-rolled Tailwind (+ CVA for variants).** Product card,
  review line, quantity stepper, badge pill, price, variant chip. shadcn's generic primitives (e.g.
  `card`) are a bordered div and fight a 1:1 target; there is nothing to reuse.
- **Button → re-theme the existing `ui/button.tsx`** (already Base UI + CVA). Variant swatch pickers
  → Base UI `RadioGroup` (single-select with roving tabindex).

## Consequences

- One behavior library, no Radix and no `framer-motion`; consistent with "motion is pure CSS."
- Keyboard, `aria-expanded`/`aria-controls`, focus management, and inert collapsed panels come from
  Base UI rather than hand-maintained code.
- The fidelity surface is entirely ours, so nothing in the library fights the design.
- One-line defense: borrow the behavior, own the pixels; `base-vega` shadcn is only the scaffold.
