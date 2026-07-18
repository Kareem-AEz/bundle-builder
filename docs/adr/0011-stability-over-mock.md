# 0011 — Where we deviate from the mock, and why

**Status:** Accepted · 2026-07-18

## Context

The brief asks for pixel fidelity. Three places in the builder column resist it — not because the
design is hard to reproduce, but because reproducing it exactly produces a worse artifact. Each is
recorded here so a pixel-diffing reviewer sees intent rather than drift.

ADR-0009 already covers the token-level deviations (Manrope for Gilroy, synthesized italic, ≤2px
spacing snapping). This ADR covers the behavioural ones.

## Decision

### 1. Nothing in the box model reacts to open state

The mock places the step hairline **above** the kicker on collapsed steps and **below** it on the
open one. Reproducing that literally means toggling a border and its padding between two different
elements as the accordion opens — which changes the element's height on every toggle. The result
was a visible jump on the divider and a layout shift in the header on every open and close.

**Only colour and background may depend on `data-open`.** The hairline is now a dedicated element
in a fixed slot, always rendered, always the same padding; opening changes its colour and the
item's background, nothing else.

The cost: on collapsed steps the divider sits ~20px lower than the mock, under the kicker instead
of above it. The open step — the state a user actually looks at — stays correct.

### 2. Both ends of the stepper share one look

The design outlines the minus button (white, 2px border) and fills the plus (`#F0F4F7`, no border).
There is no semantic reason for the asymmetry; the two are ends of a single control and reading as
two unrelated buttons is a defect, not a style. Both now render filled with a matching border.

A second-order bug this exposed: the design's disabled fill (`#F1F1F2`) and its enabled plus fill
(`#F0F4F7`) are one unit apart. Collapsing them into a single token was right about the colour and
wrong about the job — a disabled minus then rendered identically to the live plus sitting 40px
away. **The disabled signal is carried by the icon** (`--color-label`, washed out), not the fill.
Low contrast is correct here; WCAG 1.4.3 exempts disabled controls.

### 3. Interactive targets are larger than they look

The design's stepper buttons are 20px, under WCAG 2.5.8's 24px minimum and well under 2.5.5's 44px.
This is not a fidelity-versus-accessibility trade: a `.tap-target` utility keeps the 20px visual
and expands the pointer target to 44×32 via a transparent `::after`. Height is capped at 32 rather
than 44 so the overlay stays inside the card's 10px row gap and cannot swallow clicks meant for the
variant chips above it. Both goals, no compromise.

### 4. Additions the design implies but does not draw

- **"(Required)"** on the Hub's title, and a truthful `aria-label` on its dead minus button
  ("… is required and can't be removed"). A disabled control with no stated reason reads as broken.
- **Step 4's footer.** Steps 1–3 end in "Next: …". Step 4 ending in dead space reads as unfinished,
  so it carries a "Review your bundle" anchor on small screens, where the review panel is below the
  fold, and a completion line on desktop, where the panel is already beside you and a button would
  be a no-op.
- **"Learn More"** is decorative — there are no product pages in scope. It anchors to its own card's
  `id` rather than dangling on `href="#"`, which would jump to the top of the page.

## Consequences

- Every deviation above is defensible in one sentence, which is the bar: a reviewer asking "why
  doesn't this match?" gets an answer about craft, not an admission of drift.
- The collapsed-step divider position is the only one that makes the artifact _less_ like the mock.
  It buys a builder with no layout shift on any interaction, which the brief also asks for.
- These belong in the README's "Decisions & Tradeoffs" section alongside the ADR-0009 items.
