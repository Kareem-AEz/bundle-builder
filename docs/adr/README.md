# Architecture Decision Records

Short records of the consequential, non-obvious decisions behind Bundle Builder — the
kind a reviewer would (rightly) question. Each follows _Context · Decision · Consequences_.

| #                                    | Decision                                                        |
| ------------------------------------ | --------------------------------------------------------------- |
| [0001](0001-money-in-cents.md)       | Money is integer cents; one `formatPrice`; float math banned    |
| [0002](0002-compare-at-pricing.md)   | Compare-at pricing model; card price is the source of truth     |
| [0003](0003-minimal-state.md)        | Minimal Zustand state; everything else is a derived selector    |
| [0004](0004-variant-model.md)        | Uniform variant model; plan is single-select in the same map    |
| [0005](0005-serializable-catalog.md) | Catalog is serializable data; icons resolved in the UI          |
| [0006](0006-persistence.md)          | Explicit localStorage save/hydrate; no `persist` middleware     |
| [0007](0007-inferred-steps.md)       | Steps 2–4 and the Free tier are inferred; mock inconsistencies  |
| [0008](0008-ui-primitives.md)        | Base UI for behavior, hand-rolled Tailwind for pixels           |
| [0009](0009-design-tokens.md)        | Manrope, OKLCH, rem units, spacing snapped to the Tailwind scale |
