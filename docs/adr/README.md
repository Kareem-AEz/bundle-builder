# Architecture Decision Records

Short records of the consequential, non-obvious decisions behind Bundle Builder — the
kind a reviewer would (rightly) question. Each follows _Context · Decision · Consequences_.

| #                                     | Decision                                                         |
| ------------------------------------- | ---------------------------------------------------------------- |
| [0001](0001-money-in-cents.md)        | Money is integer cents; one `formatPrice`; float math banned     |
| [0002](0002-compare-at-pricing.md)    | Compare-at pricing model; card price is the source of truth      |
| [0003](0003-minimal-state.md)         | Minimal Zustand state; everything else is a derived selector     |
| [0004](0004-variant-model.md)         | Uniform variant model; plan is single-select in the same map     |
| [0005](0005-serializable-catalog.md)  | Catalog is serializable data; icons resolved in the UI           |
| [0006](0006-persistence.md)           | Explicit localStorage save/hydrate; no `persist` middleware      |
| [0007](0007-inferred-steps.md)        | Steps 2–4 and the Free tier are inferred; mock inconsistencies   |
| [0008](0008-ui-primitives.md)         | Base UI for behavior, hand-rolled Tailwind for pixels            |
| [0009](0009-design-tokens.md)         | Manrope, OKLCH, rem units, spacing snapped to the Tailwind scale |
| [0010](0010-one-time-vs-recurring.md) | One-time vs recurring money split; line strikes are line totals  |
| [0011](0011-stability-over-mock.md)   | Deliberate deviations: stability, stepper symmetry, tap targets  |
| [0012](0012-quantity-ceilings.md)     | Products may declare a quantity ceiling; the Hub's is 1          |
| [0013](0013-sqlite-local-file.md)     | SQLite as a local file, via the better-sqlite3 driver adapter    |
| [0014](0014-db-catalog-static-cache.md) | Catalog read from SQLite through `use cache`; page stays static |
| [0015](0015-store-factory-context.md) | Per-request store factory behind context; selectors take catalog |
| [0016](0016-responsive-breakpoints.md) | Responsive: three layouts, mobile-first, pure CSS              |

**0004, 0006, 0008 and 0010 carry amendments that reverse their original Decision sections.** Read
the amendment, not only the Decision.

0013–0016 realise the SQLite/server-catalog bonus that 0005 anticipated: 0013 (infra) → 0014
(read + cache) → 0015 (thread the catalog through the store) → 0016 (responsive).
