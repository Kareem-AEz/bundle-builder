# 0015 — Per-request store factory behind a context provider; selectors pure over `(state, catalog)`

**Status:** Accepted · 2026-07-18

## Context

Once the catalog comes from the database at request time ([0014](0014-db-catalog-static-cache.md)),
everything that derived from the catalog **at module load** breaks, because at import time there is
no request data yet. Three places did this:

- `catalog-index.ts` — `CATALOG_INDEX` and `REVIEW_ORDERED`, computed on import.
- `useBundleStore.ts` — `PLAN_VARIANTS_IDS` and `MAX_BY_VARIANT`, computed on import, plus the
  store itself created by `create(...)` at import.
- `builder-accordion.tsx` — read the `CATALOG` constant directly.

`AGENTS.md` already specifies selectors as pure over `(state, catalog)`; they had drifted into
closing over an imported singleton. This is the change that brings the code back in line.

## Decision

**Stop computing at load; compute when the catalog arrives.** The same move three times:

- Constants become functions: `CATALOG_INDEX` → `buildCatalogIndex(catalog)`, `REVIEW_ORDERED` →
  `reviewOrdered(catalog)`.
- `create(...)` becomes a **factory** `createBundleStore(catalog)` (built on `createStore` from
  `zustand/vanilla`), with `PLAN_VARIANTS_IDS`, `MAX_BY_VARIANT` and `clampQty` moved inside the
  closure. Every action is byte-identical; they now close over the factory's copy instead of the
  module's.
- Selectors take what they need: `selectReviewGroups(quantities, catalog)`, the `totals.ts`
  selectors take the index.

A **client provider** (`bundle-store-provider.tsx`) holds one store instance plus the catalog and
index, and a wrapper `useBundleStore(selector)` reads it from context — so all component call sites
stay `useBundleStore((s) => s.x)`, unchanged.

### Why a factory, not "create the singleton then inject the catalog via an action"

`hydrate()` clamps every restored localStorage value through `clampQty`, which needs the catalog's
`max` map ([0012](0012-quantity-ceilings.md)). If the catalog were injected **after** the store
existed, there would be a window where the store exists but `MAX_BY_VARIANT` is empty, and the mount
effect that calls `hydrate` (a child effect) fires before a provider injection (a parent effect) —
so a tampered `sense-hub: 30` payload would restore **unclamped**. A factory makes the catalog an
argument, so the store cannot exist before its limits do. The race is impossible, not handled.

### On the cost of context + Zustand

This is the official Next.js + Zustand pattern for server-provided initial state, and it is not a
re-render tax: context holds a **stable store reference**, `useStore(store, selector)` subscribes to
the store and bypasses context propagation, and the context value only re-identifies if the catalog
does — which, for prerendered data, is never. The provider holds the store in a lazy `useState`
initializer, not `useMemo` (which React may discard, silently resetting the bundle) and not a ref
(reading `.current` during render is unsafe under concurrent rendering).

The honesty: this app has one store instance and static data, so the per-request payoff the pattern
is built for does not visibly cash out here. It is correct and idiomatic, working slightly ahead of
the demo's needs — a stronger thing to defend than a client-hardcoded catalog.

## Consequences

- Selectors are pure functions of their arguments again, matching `AGENTS.md`; the store no longer
  secretly depends on a specific catalog module.
- Tests build the index from the authored catalog and construct stores with `createBundleStore` —
  isolation now comes from the store not being shared, replacing save-and-restore of a singleton.
- Behaviour is unchanged for the user (static data), verified in-browser: a tampered payload still
  clamps to 1, the pre-paint restore has no flash, and card ↔ review stepper sync still works.
- The store file no longer exports a hook named `useBundleStore` (the hook moved to the provider),
  so it was renamed `store/useBundleStore.ts` → **`store/bundle-store.ts`**. The hook lives in
  `store/bundle-store-provider.tsx`.
