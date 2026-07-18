# 0010 — One-time and recurring money are separate; line strikes are line totals

**Status:** Accepted · 2026-07-18

## Context

Two arithmetic problems surfaced while building the review panel, both invisible at the seed's
default quantities and both wrong in the mock.

**Mixed units.** `selectSubtotal` sums every entry in `quantities`, which folds the plan's
`$9.99/mo` in with one-time hardware. That is fine for a single displayed total, but the design
also shows a financing chip ("as low as $19.19/mo"). Financing a subscription is a category
error — you would be charging interest on a recurring bill.

**Per-unit strikes over line totals.** `ReviewLine` carried a line-total `lineSubtotal` next to a
per-unit `compareAt`. Rendering both stacks two different kinds of number: Pan v3 at qty 2 would
read `$39.98` struck over `$69.96`. At qty 1 the bug is invisible, which is why it survived review.

The mock's own numbers are no help — its financing figure derives from nothing (`$19.19` is neither
`total/12` nor any stated APR) and its Pan v3 line reads `$57.98 → $47.98`, which is neither
per-unit nor a line total. ADR-0002 already established that mock arithmetic is not authoritative.

## Decision

**Split the money by billing cadence in the selector layer.** `Product.unit` already types the
distinction, so:

- `selectHardwareSubtotal` — one-time only, skips anything with a `unit`. Seed → `19988`.
- `selectMonthlySubtotal` — recurring only. Seed → `999`.
- `selectSubtotal` is untouched and still drives the displayed total.

The financing chip derives from **hardware only**: `selectHardwareSubtotal / 12`, so the seeded
bundle reads `$16.66/mo` rather than the mock's `$19.19`.

**Add `lineCompareAt` to `ReviewLine`** — `compareAt * qty`, `undefined` when not on sale — so the
struck price and the price beneath it are the same kind of number. Computed in the selector, not
the panel, preserving the "the panel does no math" contract that `ReviewLine` advertises.

**Do not split the displayed grand total.** The design shows one number and one number only.
Rendering `$199.88 + $9.99/mo` would be a visible feature the mock does not have, which the scope
rule forbids.

**Fast Shipping stays presentational.** The design's `$5.99 → FREE` row is not a catalog product.
Adding it would make it contribute to `selectPreDiscountTotal` and move the reconciled savings
figure. It renders as a static row and never touches a selector.

## Consequences

- The single displayed total still mixes a one-time sum with a recurring charge, because the design
  dictates it. This is a known imperfection, not an oversight: the domain is modelled correctly in
  the selectors and the deviation is confined to one rendered number.
- Nine tests lock the arithmetic. The load-bearing one asserts
  `hardware + monthly === selectSubtotal` — drop the `unit` guard from either function and the
  halves stop summing to the whole. The `lineCompareAt` tests deliberately use Pan v3 at **qty 2**;
  at qty 1 the correct and buggy values are identical and a test would prove nothing.
- The `$0` Free plan counts as recurring, not hardware — it has a `unit`, so cadence is decided by
  billing shape, not by price.
- Our numbers diverge from the mock's on screen. That is the point; see ADR-0002.
