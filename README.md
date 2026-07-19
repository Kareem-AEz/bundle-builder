# Bundle Builder

A multi-step product-bundle configurator for Wyze home-security kits, with a live review panel
beside it. Four accordion steps (cameras · plan · sensors · extra protection), per-variant quantity
tracking, a summary that recomputes totals and savings on every change, and explicit
save-for-later to `localStorage`.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Zustand 5 · Tailwind CSS 4 ·
Base UI · Prisma 7 + SQLite · Vitest.

---

## Run it

Node 20+ (developed on 24). No accounts, no Docker, no services — the database is a local file.

```bash
npm install
npm run db:migrate    # creates prisma/dev.db from the migration
npm run db:seed       # loads the catalog into it
npm run dev           # http://localhost:3000
```

`.env` is optional; the defaults work as-is. Copy `.env.example` to `.env` if you want to point
`DATABASE_URL` somewhere else. `db:migrate` has to run before `db:seed` — better-sqlite3 creates an
empty file on connect, so seeding a fresh clone without migrating first fails with
`TableDoesNotExist`.

| Task             | Command                                       |
| ---------------- | --------------------------------------------- |
| Dev server       | `npm run dev`                                 |
| Production build | `npm run build`                               |
| Tests (53)       | `npm test`                                    |
| Typecheck        | `npm run type:check`                          |
| Lint / format    | `npm run lint:check` · `npm run format:check` |
| Inspect the DB   | `npm run db:studio`                           |

---

## How it's built

```
src/features/bundle-builder/
├── constants/catalog.ts   # the authored source of product data
├── types.ts               # Catalog / Category / Product / Variant contracts
├── store/                 # bundle-store.ts (factory) + bundle-store-provider.tsx (context)
├── selectors/             # pure derivations: totals, review lines, badges, catalog index
├── queries/get-catalog.ts # cached server read
├── dto/catalog.dto.ts     # DB rows → Catalog
├── lib/                   # money, asset paths, persistence keys
└── components/            # accordion/, review/, cards, stepper, chips
```

State is minimal — variant quantities, the active variant per product, the open step — and
everything else is derived through pure selectors over `(state, catalog)`. Two-way stepper sync
between a card and its review line falls out of that for free; there is no syncing code.

Everything in the brief is implemented, plus the optional backend: the four-step accordion with
distinct-product counts, per-variant quantities, the two-way-bound review panel, explicit save and
restore, three responsive layouts matching the three design frames, pure-CSS motion with
`prefers-reduced-motion` respected, and a catalog served from SQLite through a cached server query
that keeps the route static. Lighthouse accessibility is 100.

---

## Decisions & tradeoffs

Full reasoning lives in [`docs/adr/`](docs/adr/) — 16 short records. The ones worth knowing:

**The mock's own arithmetic doesn't reconcile** ([0002](docs/adr/0002-compare-at-pricing.md),
[0010](docs/adr/0010-one-time-vs-recurring.md)). The Cam Pan card reads `$34.98`/unit but its review
line shows `$47.98` for ×2. I priced per-unit and let the totals follow, so every figure on screen
reconciles with every other. The total also reads off hardware only, with the recurring plan on its
own `plus $9.99/mo` line — a monthly charge folded into a number labelled "total" is what made an
earlier version disagree with itself. Net: **$199.88** where the mock shows $187.89.

**Money in integer cents** ([0001](docs/adr/0001-money-in-cents.md)). `2798`, never `27.98`, with
one formatter at the render edge. The single division (financing) rounds rather than floors.

**Products can declare a quantity ceiling** ([0012](docs/adr/0012-quantity-ceilings.md)). The Hub is
`$0` against a `$29.92` compare-at, so every extra Hub minted fictional savings. `max: 1` is
enforced in the store's `clampQty`, not just the UI — a disabled button can't defend a hand-edited
`localStorage` payload.

**Explicit save, not `persist` middleware** ([0006](docs/adr/0006-persistence.md), amended). Seeded
defaults render on the server and the saved bundle restores client-side, so there's no hydration
mismatch; a pre-paint script hides the subtree until the restore commits.

**Two design tokens were darkened to pass WCAG AA**
([0011 amendment](docs/adr/0011-stability-over-mock.md)). Measured, not assumed: `--color-faint`
`#6f7882` → `#5f6872` and `--color-success` `#0aa288` → `#007e66`. Hue and chroma are the design's;
only lightness moves. Where fidelity and accessibility conflict, accessibility wins.

---

## Testing

53 tests (Vitest), covering the money layer and the DTO round trip.

They deliberately require **no database** — the DTO tests rebuild the rows the seed would write — so
the suite passes on a clean clone before you've run a migration.

---

## Known gaps

Honest list of what isn't done:

- **The Checkout button is a placeholder.** The brief scopes it out; there is no checkout flow.
- **"Learn More" anchors to its own card.** There are no product pages in scope, so it points
  somewhere real rather than dangling on `href="#"`.
- **One unresolved fidelity question.** The gap between the stepper and the price on product cards:
  the frame and the design tokens disagree, and I didn't settle which is authoritative. Currently
  `justify-between` — exact on Cam v4, up to ~18px off elsewhere.
- **The white Floodlight asset is lower-resolution** than its siblings (~166px of real detail vs
  713px). Invisible at the card's render size, marginally soft at 3× density.
- **No E2E tests.** The interaction paths (restore-from-storage, the clamp, two-way stepper sync)
  were verified by driving the browser rather than automated.
- **`db:migrate` is `prisma migrate dev`**, the authoring command. A deployment would want
  `migrate deploy`.
