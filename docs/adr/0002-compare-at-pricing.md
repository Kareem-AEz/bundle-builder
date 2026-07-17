# 0002 — Compare-at pricing model; card price is the source of truth

**Status:** Accepted · 2026-07-17

## Context

Product cards show an active price, a struck-through "was" price, and a "Save X%" badge.
Two domain models fit:

- **Promotion-driven** — store a base price + a discount rule; derive the sale price.
- **Compare-at** — store the exact `price` and an anchor `compareAt`; derive the percent.

Reverse-engineering the mock's percentages gives irrational-looking ratios (Cam v4
22.235%, Cam Pan v3 12.506%). Nobody authors those as promotions — they are the residue
of two independently set price points, which is the compare-at signature. Deriving the
price from a rounded percent also produces the wrong number (`35.98 × 0.78 = 28.06 ≠
27.98`) and requires banned float math.

The mock also contradicts itself on Cam Pan v3: the card shows $34.98 while the review
line implies ~$23.99. Both cannot be true under derived totals.

## Decision

Use the **compare-at** model. Store exact `price` + optional `compareAt`; derive the
badge as `floor((compareAt − price) / compareAt × 100)` — a display-only selector, never
stored. The **card price is the single source of truth**; review lines and totals derive
from it. For Cam Pan v3, the card price ($34.98) wins.

## Consequences

- Derived total is **$209.87**, not the mock's $187.89. The entire gap is
  `2 × ($34.98 − $23.99) = $21.98` — the Cam Pan v3 discrepancy, nothing else.
- Derived **savings is $50.92, matching the mock exactly** (savings depends only on the
  per-unit discount differences, which are invariant to the Pan v3 base-price choice).
- No `discount` field anywhere; float math avoided.
- `floor`, not `round`: Cam Pan v3 is 12.5% and must render "12%" (round gives 13).
- A future promotion engine would layer on top of compare-at and still resolve to these
  same two numbers, so this is the composable primitive.
