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
  mismatch. `hydrate()` runs _after_ mount, applying restored state as a follow-up render.
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

## Amendment · 2026-07-18 — the restore frame is hidden before paint

Restoring in a mount effect leaves one frame where a returning visitor sees the design's seed
before their saved bundle replaces it. The original ADR accepted this as the price of not having a
hydration mismatch. On screen it reads as a glitch, so it is now covered.

**Two approaches were built and rejected first**, both recorded here because the reasons generalise:

1. **A marker cookie read on the server**, so the page could render a skeleton only for returning
   visitors. It works, but calling `cookies()` opts the route out of static rendering — every
   visitor pays for a dynamic render to fix a one-frame artifact that only affects some of them.
   Worse trade than the flash.
2. **A loading state for everyone until hydration completes.** Simplest to build, and the most
   expensive: meaningful content stops painting on first byte and waits for the JS bundle instead,
   which regresses LCP for every visitor including first-time ones with nothing to restore. It also
   makes server rendering pointless — the server would send a complete page that the client hides.

**Decision.** An inline script in `<body>`, ahead of any builder markup, checks whether the storage
key exists and sets `data-restoring` on `<html>`. CSS keys off that attribute to hold the builder
subtree `visibility: hidden`; the mount effect calls `hydrate()` and then clears the attribute.

Why this one wins: it runs in the gap between server render and React mount, which is precisely
where the problem lives. The rendered markup is byte-identical on both sides, so hydration stays
clean. The page stays static. First-time visitors match no rule and pay for a single localStorage
read. And because the seed markup underneath keeps its box, revealing the restored bundle shifts
nothing.

**Consequences.**

- `<html>` needs `suppressHydrationWarning`, since the script mutates an attribute React rendered.
  Same mechanism next-themes uses for the same class of problem.
- `STORAGE_KEY` moved to `lib/persistence.ts`, shared by the script and the store. Two copies could
  drift and leave the script checking a slot nothing writes to — the failure would be silent.
- The CSP already allows `'unsafe-inline'` for scripts (see `next.config.ts`), so nothing loosened.
- `visibility` rather than `display`, so nothing reflows in either direction.
