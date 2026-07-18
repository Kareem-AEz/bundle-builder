# 0012 — Products can declare a quantity ceiling; the Hub's is 1

**Status:** Accepted · 2026-07-18

## Context

The Hub is priced `0` with a `compareAt` of `2992`, which is how the design shows it: `$29.92`
struck through, then `FREE`. Savings is `(compareAt ?? price) × qty` summed across the cart, so
every additional Hub adds `$29.92` of savings against `$0` of cost.

Nothing stopped the quantity climbing. Thirty Hubs rendered as **$941.60 saved on a $295.81
order**, $897.60 of it fictional. The savings callout is the panel's most quotable number, and a
figure larger than the total it sits under discredits every other number beside it.

The same shape exists for any free-with-`compareAt` product, so this is a hole in the pricing
model, not a quirk of one row.

## Decision

**`max?: number` on `Product`.** The Hub sets `max: 1`. It is the other half of `required`, which
already means "min 1", and it is data for the same reason: the rule belongs to the product, not to
a component that recognises the Hub by id.

`max: 1` is not a workaround for the savings bug, it is the product's truth. One Sense Hub runs an
entire system — roughly a hundred sensors — so a second one is not a purchase anyone makes.

Enforced in two places, deliberately:

- **`QuantityStepper` gains `plusDisabled`**, mirroring the `minusDisabled` it already had, with a
  truthful label ("… is limited to 1 per system"). Both the card and the review row pass it.
- **`clampQty` in the store** guards every write to `quantities`, including the one inside
  `hydrate`. The disabled button cannot defend a hand-edited localStorage payload; this can. Same
  reason validation belongs on the server and not only in the form.

### Rejected: tiered pricing (first Hub free, subsequent ones $29.92)

More commercially realistic on the face of it, and it was the first instinct. It fails on both
axes.

On product truth: it prices a purchase that does not happen. If one Hub serves the whole system,
"additional Hubs cost $29.92" is a rule with no customers, and the cap it avoids is the more
realistic model.

On cost: `Product.price` is a single `Cents` and every sum is `amount(product) × qty`. Tiering
breaks that everywhere — `sumCart` would need `amount(product, qty)` returning a line total,
`ReviewLine.unitPrice` would stop meaning anything with two unit prices on one line, savings would
gain a third rule, and the card's `$29.92 → FREE` display becomes a lie at qty 2, requiring UI the
design does not have. A pricing engine, for no reviewer-visible gain.

## Consequences

- `max` currently has exactly one user. Accepted: the alternative is `id === "sense-hub"` inside a
  component, which breaks the data-driven rule for the sake of avoiding an optional field.
- `decrement` needs no clamp — it only moves down, and the floor was already there.
- Clamping inside `hydrate` means restored state can differ from `savedSignature`, so a tampered
  payload shows the save link as unsaved. Correct: the state genuinely is no longer the file.
- Four tests cover it, including the one that names the bug outright — an unclamped 30 Hubs would
  produce `2992 × 30` in savings.
- Any future free-with-`compareAt` product needs a `max` for the same reason. The field is the
  reminder.
