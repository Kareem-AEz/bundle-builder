# 0001 — Money is integer cents

**Status:** Accepted · 2026-07-17

## Context

Prices drive the review panel's subtotals, total, and savings, all recomputed on every
change. Floating-point dollars (`27.98`) accumulate rounding error across sums and
multiplications, and the design shows exact cent-level figures that must reconcile.

## Decision

Represent all money as **integer cents** (`type Cents = number`, e.g. `2798`). A single
`formatPrice()` helper divides by 100 exactly once, at the display boundary, via
`Intl.NumberFormat`. Float dollar arithmetic is banned. Per-month prices use the same
unit (`999` = $9.99/mo).

## Consequences

- All arithmetic stays in whole cents, so totals and savings are exact.
- One formatting boundary (`cents / 100`) — `Intl` handles the `$`, separators, and two
  decimals, locale-correct. No hand-rolled `.toFixed`.
- Every value in the catalog and store is cents; readers must not mistake `2798` for
  dollars. A branded `Cents` type was considered and declined as ceremony.
