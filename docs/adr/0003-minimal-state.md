# 0003 — Minimal Zustand state; everything else is a derived selector

**Status:** Accepted · 2026-07-17

## Context

The builder and the live review panel must stay in sync, and quantity steppers appear in
both places (product card and review line) for the same item. Storing derived figures
(counts, subtotals, totals) invites them drifting out of sync with the source data.

## Decision

Canonical state is **minimal** — three fields:

- `quantities: Record<variantId, number>` (sparse; absent = 0)
- `activeVariant: Record<productId, variantId>` (sparse; absent = `variants[0]`)
- `openStep: number | null`

Everything the UI shows beyond that — review lines, "N selected" counts, subtotals, the
total, savings, the "Save X%" badge, whether a stepper's minus is disabled — is a **pure
selector** over `(state, catalog)`. Builder config is ephemeral local state persisted to
`localStorage` (see 0006), not the URL.

## Consequences

- The card↔review stepper sync is free: both read `quantities[variantId]`, so a change in
  one is reflected everywhere with no wiring.
- One source of truth; no derived value can drift.
- Selectors must stay pure and be memoized where they build new objects.
- State stays tiny and trivial to persist.
