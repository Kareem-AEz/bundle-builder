# 0004 — Uniform variant model; plan is single-select in the same map

**Status:** Accepted · 2026-07-17

## Context

Each color variant tracks its own quantity (2 Red and 1 Blue are distinct). Some products
have no color options (doorbell, sensors, accessory). The plan is select-one, priced
per month, and shown in the review with no stepper.

## Decision

**Every product has at least one variant.** Products with no color options carry a single
variant whose id equals the product id; the color selector renders only when
`variants.length > 1`. Quantities are keyed uniformly by variant id.

The **plan is folded into the same `quantities` map** (option A), not a separate field.
`selectPlan(variantId)` enforces single-select by clearing every plan variant to 0 then
setting the chosen one to 1.

## Consequences

- One uniform keyspace: selectors iterate `quantities` without special-casing the plan.
- "N selected" counts distinct products with any variant quantity > 0 — matching the mock
  (sensors shows "2 selected" for Motion ×2 + Hub ×1).
- The plan's no-stepper / monthly / single-select behavior is UI + action logic keyed off
  `category.id === "plan"`, not a state-shape concern.
- Single-variant products share a string namespace between product id and variant id;
  benign because the store only ever keys on variant ids.
