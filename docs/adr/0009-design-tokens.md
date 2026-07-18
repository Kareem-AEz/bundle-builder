# 0009 — Design tokens: Manrope, OKLCH, rem, and systematic spacing

**Status:** Accepted · 2026-07-18

## Context

The design targets 1:1 fidelity but is set in **Gilroy** (paid) plus **TT Norms Pro Bold** on one
button, and its raw values are off-grid and inconsistent across the three frames (card padding
`11px`, gaps `15`/`19px`, etc. — see `reference.local/DESIGN-TOKENS.md`). The inherited `globals.css`
was the stock shadcn stone theme (OKLCH), nothing to do with Wyze. We need a token layer that is
faithful, accessible, and maintainable rather than a scatter of magic pixels.

## Decision

- **Font → Manrope** (free variable font, closest match to Gilroy), wired via `next/font/google`.
  The lone TT Norms Pro use (Checkout) folds into Manrope Bold; a second license for one button is
  not worth it. Manrope ships no true italic, so the single italic label is browser-synthesized.
- **Colors → OKLCH in `@theme`.** Extracted the design's named color styles and encoded them as
  OKLCH for uniformity with the shadcn tokens and P3 headroom (source hex kept in comments for
  diffing). Semantic Wyze tokens (`brand`, `surface`, `success`, `sale`, the ink scale, `line`,
  `control`) are the authoring surface; a thin shim points `--primary`/`--ring` at `--color-brand`
  so vendored `ui/*` components inherit the brand, while `--destructive` stays actual-destructive
  (the sale red is its own `--color-sale`, never overloaded onto destructive).
- **Units.** Type, spacing, and radii in **rem** so they honor the user's root font-size setting
  (an accessibility win px forfeits); borders and hairlines in **px** for crispness; intrinsic asset
  dimensions in px. The px→rem conversion lives once, in the tokens.
- **Spacing → snapped to Tailwind's native rem scale.** The design is off-grid and internally
  inconsistent, so we treat those values as noise, not intent, and snap to the nearest 4px/rem step
  (deviation ≤2px, visually identical). This is a deliberate trade of exact-pixel fidelity for a
  systematic scale. No custom spacing tokens; structural dimensions that must read right (image
  `101×137`, thumbnails, panel width) stay as exact arbitrary values.

## Consequences

- Single source of truth for the palette; vendored components are on-brand for free.
- Type and spacing scale with the user's font-size preference by default.
- Known, deliberate deviations from Figma — font substitution, a synthesized italic, ≤2px spacing
  snapping — are documented in the README, not silent drift. A pixel-diffing reviewer sees intent.
- Two accessibility items surfaced by the tokens are flagged for the component phase: section labels
  (`#a8b2bd` on `#edf4ff`, ~1.9:1, below AA) and 20px steppers (under the 44px tap-target minimum).
