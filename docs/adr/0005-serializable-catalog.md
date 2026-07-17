# 0005 — Catalog is serializable data; icons resolved in the UI

**Status:** Accepted · 2026-07-17

## Context

The app is data-driven from a catalog, with an optional bonus of serving that catalog from
SQLite via a route handler. A payload served over HTTP cannot contain React components or
functions. Separately, the design uses two different labels for the same category (the
step header "Add extra protection" vs the review section "Accessories") and orders the
review sections differently from the accordion.

## Decision

The catalog holds **only serializable values** — strings, numbers, arrays. Images are
path strings, never components. The four category icons are resolved in the UI by
`CategoryId` (a `Record<CategoryId, ReactNode>`), not stored in the data. `Category`
carries `stepTitle` and `reviewLabel` separately, and `reviewOrder` separately from
`step`.

## Consequences

- The catalog is JSON- and API-ready with no reshaping; the SQLite/route bonus is a drop-in.
- Icons are a presentation concern, decoupled from data.
- The step-vs-review label mismatch and the accordion-vs-review ordering are represented
  cleanly by distinct fields, so the two never fight (see 0007 for why both are kept).
