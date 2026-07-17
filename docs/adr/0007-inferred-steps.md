# 0007 — Steps 2–4 and the Free tier are inferred; mock inconsistencies

**Status:** Accepted · 2026-07-17

## Context

The design provides three responsive frames (desktop, tablet, mobile). In all three,
steps 2–4 (plan, sensors, extra protection) are **collapsed** — there are no expanded card
designs for them. The only hard data for those steps is what the review panel reveals for
the seeded items. Design-tool extraction was additionally rate-limited.

## Decision

Infer the steps 2–4 catalogs from the review-panel seed data plus product logic. Real
prices come from the review; **product taglines and the Free plan tier are inferred and
marked as such in the catalog**. Reproduce the mock's cross-frame inconsistencies
faithfully rather than "correcting" them, and document each — the divergences are
intentional design choices, not bugs to flatten.

Inconsistencies handled:

1. **"Next" button label** — desktop "…plan" vs tablet "…sensors." Data-driven from step
   order (always "Next: {title of step N+1}"); desktop is correct.
2. **Plan section label** — "PLAN" (desktop/tablet) vs "HOME MONITORING PLAN" (mobile).
   Standardized on **"Plan"** (desktop is the fidelity target).
3. **"Let's get started!" heading** — appears only on mobile.
4. **Cam Pan v3 pricing** — card vs review-line contradiction; card is authoritative
   (see 0002).
5. **Card layout** — image-left (desktop) flips to image-top (tablet/mobile).

The review panel deliberately groups all one-time hardware (Cameras, Sensors, Accessories)
and floats the recurring subscription (Plan) to the bottom, next to the total — diverging
from the accordion's funnel order. This is intentional and kept.

## Consequences

- Honest provenance: real vs inferred data is distinguishable in the catalog and here.
- Fidelity is preserved and the "surprising but intentional" choices are explained rather
  than silently changed.
- If the real step 2–4 designs surface later, only the inferred taglines/tiers change; the
  structure holds.
