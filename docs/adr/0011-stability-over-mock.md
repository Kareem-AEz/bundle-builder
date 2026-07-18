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

### 5. The summary carries a recurring line the mock does not draw

The design shows a single grand total. Ours shows a hardware total with `plus $9.99/mo` beneath it.
Full reasoning is in the ADR-0010 amendment; the short version is that the mock's single number
cannot be reconciled with the financing chip printed directly above it, and an unreconcilable
summary is a worse defect than an extra line.

### 6. Review prices sit in a fixed-width column

The review row is thumb, name, stepper, price. Only the price varies in width, so at higher
quantities it pushed the stepper leftward and the steppers stopped aligning down the column — the
control moved while the user was clicking it. The review price variant now carries a `76px` floor
and `tabular-nums`, which pins all three columns and stops digits jittering as counts change.

The rejected alternative was giving each row two lines, name above controls. It removes the
constraint entirely but grows the panel ~40% taller and abandons the mock's vertical rhythm to fix
a case that only appears at quantities no real cart reaches. Past ~`$999.99` the price still
overflows its floor and shifts the stepper; truncating money is not on the table, and a column wide
enough for four digits leaves a visible gap at every realistic quantity.

### 7. Review section labels are darker than the mock

The design sets the CAMERAS / SENSORS / ACCESSORIES / PLAN labels in `#A8B2BD` on the panel's
`#EDF4FF` surface — roughly **1.9:1**, far below WCAG 1.4.3's 4.5:1 for text this size. They are
the only thing telling you which category a row belongs to, so they are content, not decoration,
and none of the disabled-control exemptions apply.

They now render in `--color-faint` (`#6F7882`), the grey already carrying the review-side
strikethrough prices. That clears 4.5:1 while staying inside the same grey family, so the labels
still recede from the item names above them, which was the point of the light grey in the first
place.

Reproducing `#A8B2BD` exactly would have made the panel unreadable for anyone with low vision, in
service of a value the design very likely picked by eye on a white artboard rather than the
lavender surface it ships on.

## Consequences

- Every deviation above is defensible in one sentence, which is the bar: a reviewer asking "why
  doesn't this match?" gets an answer about craft, not an admission of drift.
- The collapsed-step divider position is the only one that makes the artifact _less_ like the mock.
  It buys a builder with no layout shift on any interaction, which the brief also asks for.
- These belong in the README's "Decisions & Tradeoffs" section alongside the ADR-0009 items.

## Amendment · 2026-07-19 — the contrast fix in §7 was measured, and it didn't pass

**§7 above claims `--color-faint` (`#6F7882`) "clears 4.5:1". That claim was never measured, and it
is wrong.** A Lighthouse pass put the accessibility score at 96 with the review panel's kickers and
strikethrough prices flagged; computing the ratios confirmed it.

| Pair                                   | Ratio      | AA (4.5:1)     |
| -------------------------------------- | ---------- | -------------- |
| `#6F7882` on the panel's `#EDF4FF`     | **4.05:1** | fails          |
| `#6F7882` on white                     | **4.48:1** | fails, by 0.02 |
| `#0AA288` (savings green) on `#EDF4FF` | **2.90:1** | fails badly    |

§7's _reasoning_ held — the `#A8B2BD` labels really were unreadable, and moving them into the grey
family was right. It just moved them to a colour that also fails, one measured on a white artboard
rather than the lavender surface it ships on. The same mistake the ADR diagnoses in the design.

**Both tokens now darken, hue and chroma untouched, lightness only:**

| Token             | Was       | Now       | On panel          | On white          |
| ----------------- | --------- | --------- | ----------------- | ----------------- |
| `--color-faint`   | `#6f7882` | `#5f6872` | 4.05 → **5.12:1** | 4.48 → **5.66:1** |
| `--color-success` | `#0aa288` | `#007e66` | 2.90 → **4.55:1** | 3.20 → **5.03:1** |

The two are not equivalent trades, and were decided separately:

- **`--color-faint` is imperceptible** at 12px uppercase and 14px struck text. Free.
- **`--color-success` is visible** — the celebratory teal becomes a deeper green. Taken knowingly.
  The savings figure is content, not decoration: it appears nowhere else in the summary (the rows
  above show the strike and the total, never the difference). WCAG's large-text exemption doesn't
  rescue the original either — `#0AA288` fails even 3:1.

`--color-success` is shared, so this also fixed a **latent failure Lighthouse never saw**: the
"Saved. Come back anytime" confirmation carries the same token but renders only for a few seconds
after a click, so no audit catches it. It had the identical 2.90:1 problem. The selected variant
chip's border uses it too and only gains headroom against 1.4.11's 3:1 boundary rule.

`--color-label` (`#a8b2bd`, 1.94:1) is deliberately unchanged. Its only remaining use is the
disabled stepper icon, and §2 above is right that 1.4.3 exempts disabled controls.

**The rule this establishes: a contrast claim without a measured ratio beside it is not a claim.**
Where fidelity and WCAG conflict, `AGENTS.md` says accessibility is non-negotiable, and these two
tokens are what that costs — one invisible, one visible.
