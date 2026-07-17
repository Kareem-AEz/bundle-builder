# 0006 — Explicit localStorage save/hydrate; no `persist` middleware

**Status:** Accepted · 2026-07-17

## Context

"Save my system for later" must survive a reload or return visit. The app is
server-rendered with design-seeded defaults, so naive client-only persistence risks a
hydration mismatch between server and client HTML.

## Decision

No Zustand `persist` middleware. Instead:

- `saveForLater()` writes `{ quantities, activeVariant }` to `localStorage` **on click**.
- `hydrate()` restores it in a **mount effect** (client-only).
- The server and the first client render both use the seed → identical HTML → no
  mismatch. `hydrate()` runs *after* mount, applying restored state as a follow-up render.
- `openStep` is **not** persisted — it is ephemeral UI, not "the system." The accordion
  resets to step 1 on return; the configuration is intact.

Storage access is wrapped in `try/catch` (quota, private mode); parsed input is typed
`unknown` and shape-checked at the top level. The key is versioned (`bundle-builder:v1`).

## Consequences

- No hydration mismatch, by construction.
- Save is explicit (not auto-save), matching the design's affordance.
- **Known gap:** value types inside the payload are not deep-validated, so a hand-edited or
  corrupt payload could yield odd-but-recoverable state. The `try/catch` guarantees no
  crash; a zod schema would harden this and is a reasonable future step.
