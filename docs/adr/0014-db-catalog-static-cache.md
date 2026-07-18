# 0014 — Catalog read from SQLite through `use cache`, page stays static

**Status:** Accepted · 2026-07-18

## Context

With SQLite in place ([0013](0013-sqlite-local-file.md)), the catalog can come from the database
instead of being imported as a TypeScript constant — making the DB the real source, not a decorative
checkbox. But awaiting a database query in a Server Component opts the whole route into **dynamic
rendering**. Dynamic rendering was explicitly rejected earlier this project (it was the "far worse"
cure considered for the restore flash in [0006](0006-persistence.md)), so the read must not quietly
cost static rendering.

Separately, `types.ts` is the contract the selectors already consume. Rows come back as Prisma
models with nullable columns and no ordering guarantee; something has to map them back to `Catalog`
without the money layer ever learning a database exists.

## Decision

**Read the catalog on the server through a `use cache` function; keep the page prerendered.**

- `next.config.ts` enables `cacheComponents: true`.
- `queries/get-catalog.ts` is `"use cache"` + `cacheLife("max")` + `cacheTag("catalog")`. The data
  only changes when someone re-seeds — there is no runtime write path — so `max` is honest, and the
  tag gives a `revalidateTag("catalog")` lever if that ever changes.
- `page.tsx` awaits `getCatalog()` and passes the result down as plain props. Because the value is
  cached and serializable, the build reports the route as `○ (Static)`; the catalog crosses to the
  client as data, not a client-side fetch.
- Mapping lives in `dto/catalog.dto.ts` (`toCatalog` + an exported `CATALOG_INCLUDE`). The row type
  is **derived** from that include via `Prisma.CategoryGetPayload`, so widening the mapper without
  widening the query is a type error, not a runtime `undefined`.

The DTO reproduces `types.ts` faithfully: optional keys are spread **conditionally** rather than set
to `undefined`, because `types.ts` distinguishes absent from false (`compareAt` absent means "no
strikethrough") while SQLite only has NULL, and `undefined` serializes differently across the cache
boundary. Ordering is explicit at every level (`step`, then `sortOrder`) because SQL guarantees no
order without an `ORDER BY`, and array position **is** the display order in the authored catalog.

## Consequences

- The DB is genuinely the source of what renders, and the page is still static — the caching
  decision from [0006](0006-persistence.md) is preserved rather than sacrificed.
- Verified two ways, because neither alone is sufficient: pure DTO tests (no DB, so `npm test` runs
  on a cold clone) assert the mapper against the authored catalog, and a one-off probe ran real DB
  rows through the real DTO and deep-compared to `catalog.ts` — exact match, Hub constraints intact.
- `catalog.ts` stays the single **authored** source; the seed mirrors it into SQLite and the DTO
  mirrors it back, so the TS file and the DB cannot silently disagree without a test failing.
- The seed **wipes and recreates** rather than upserts: the catalog is wholly owned by the TS file,
  so a removed product must leave no ghost row. Reproducible beats merely idempotent.
