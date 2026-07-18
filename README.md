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

**`db:migrate` is not optional.** better-sqlite3 creates an empty file on connect, so seeding a
fresh clone without migrating first fails with `TableDoesNotExist`.

No `.env` is needed — `DATABASE_URL` defaults to `file:./prisma/dev.db`. Copy `.env.example` only
if you want to point it elsewhere.

| Task             | Command                                       |
| ---------------- | --------------------------------------------- |
| Dev server       | `npm run dev`                                 |
| Production build | `npm run build`                               |
| Tests (53)       | `npm test`                                    |
| Typecheck        | `npm run type:check`                          |
| Lint / format    | `npm run lint:check` · `npm run format:check` |
| Inspect the DB   | `npm run db:studio`                           |

---

## What's implemented

Everything in the brief, plus the optional backend.

- **Accordion** — 4 steps, step 1 open on load, "N selected" counts **distinct products** (not
  total quantity), `Next:` advances and scrolls the opened step to the top.
- **Product cards** — optional discount badge, image, description, "Learn More", variant chips,
  quantity stepper, compare-at + active price. Selected state (qty > 0) highlights the border.
  Rendered from data; there is no per-product markup anywhere.
- **Variant model** — every variant has its own quantity. The card's stepper is bound to the active
  variant, so adding 2 White then switching to Black shows 0, and White ×2 stays in the review
  panel as its own line.
- **Review panel** — lines grouped by category in review order (Cameras → Sensors → Accessories →
  Plan), each with a thumbnail, its own stepper, and pricing. Steppers are two-way bound: changing
  either the card or the review line updates the other and every total.
- **Money** — integer cents throughout, one `formatPrice()`, float math banned. Every displayed
  figure is derived through a pure selector; nothing is hardcoded.
- **Persistence** — "Save my system for later" writes to `localStorage`; a return visit restores
  the exact configuration.
- **Backend (the bonus)** — the catalog is served from SQLite via Prisma, read through a cached
  server query. The page still prerenders as static.
- **Responsive** — three layouts (mobile / tablet / desktop) matching the three design frames.
- **Accessibility** — semantic HTML, `aria-expanded` on accordion headers, labelled steppers with
  truthful disabled reasons, visible focus rings, keyboard-operable throughout, `aria-live` on the
  save confirmation.
- **Motion** — pure CSS. The accordion animates `height` off a measured custom property; no
  animation library. `prefers-reduced-motion` respected.

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

**State is minimal and everything else is derived.** The store holds only what can't be computed:
variant quantities, the active variant per product, the open step, and two hydration flags.
Review lines, "N selected" counts, subtotals, savings and the financing figure are all **pure
selectors** over `(state, catalog)`. Two-way stepper sync falls out of this for free — both
steppers write the same key and both read the same derivation, so there is no syncing code.

**The catalog is data, end to end.** `catalog.ts` is the authored source; the seed mirrors it into
SQLite; a DTO maps rows back to the same `Catalog` type the selectors already consume. Tests assert
the round trip, so the TS file and the database cannot silently disagree.

**The database doesn't cost static rendering.** `getCatalog()` is a `use cache` function, so the
query runs at build time and the route still reports `○ (Static)`. The catalog crosses to the client
as serializable props, not a client-side fetch.

---

## Decisions & tradeoffs

Full reasoning for each lives in [`docs/adr/`](docs/adr/) — 16 short records of the non-obvious
calls. The ones worth knowing:

**Money in integer cents** ([0001](docs/adr/0001-money-in-cents.md)). `2798`, never `27.98`. One
formatter at the render edge. The one division in the codebase (financing) rounds, because flooring
would render `$16.65` on a `$199.88` total and understate the payment.

**The summary reads off hardware only** ([0010](docs/adr/0010-one-time-vs-recurring.md), amended).
Total, strike-through, savings and the financing chip all share one base — hardware — and the
recurring plan renders as a separate `plus $9.99/mo` line. Mixing a monthly charge into a figure
labelled as a total is what made an earlier version disagree with itself.

**Products can declare a quantity ceiling** ([0012](docs/adr/0012-quantity-ceilings.md)). The Hub is
`$0` with a `$29.92` compare-at, so every extra Hub minted fictional savings — 30 of them read as
$897 saved. `max: 1` is the product's truth (one hub runs the system), enforced both in the UI and
in the store's `clampQty`, because a disabled button can't defend a hand-edited `localStorage`
payload.

**Explicit save, not `persist` middleware** ([0006](docs/adr/0006-persistence.md), amended).
Design-seeded defaults render on the server and the saved bundle is restored client-side, so
there's no hydration mismatch. An inline pre-paint script hides the subtree until the restore
commits, which is what stops a returning visitor seeing the seed flash before their own bundle.

**A per-request store factory behind context** ([0015](docs/adr/0015-store-factory-context.md)).
Once the catalog arrives at request time, nothing can derive from it at module load. The store is
built by `createBundleStore(catalog)` rather than a module singleton — specifically so `clampQty`
exists before `hydrate()` can run, which closes a race where a tampered payload would restore
unclamped.

**Deliberate deviations from the mock** ([0011](docs/adr/0011-stability-over-mock.md),
[0016](docs/adr/0016-responsive-breakpoints.md)). The design's three frames disagree with each
other in places; where they do, the records say which one won and why. Notably the tablet frame
packs 5 cards into a row that would be ~150px wide, so the grid packs as many ~240px portrait cards
as fit instead.

---

## Testing

53 tests (Vitest), covering the money layer and the DTO round trip:

```bash
npm test
```

They deliberately require **no database** — the DTO tests rebuild the rows the seed would write —
so the suite passes on a clean clone before you've run a migration. Totals are asserted against the
seed state read from the store rather than hand-copied numbers, so a catalog price change or a seed
change fails loudly instead of silently drifting.

---

## Known gaps

Honest list of what isn't done:

- **The Checkout button is a placeholder.** The brief scopes it out; there is no checkout flow.
- **"Learn More" anchors to its own card.** There are no product pages in scope, so it points
  somewhere real rather than dangling on `href="#"`.
- **One unresolved fidelity question.** The gap between the stepper and the price on product cards:
  the design tokens and the frame disagree, and settling it needs a Figma measurement I ran out of
  API budget for. Currently `justify-between` — exact on Cam v4, up to ~18px off elsewhere.
- **The white Floodlight asset is lower-resolution** than its siblings (~166px of real detail vs
  713px). Invisible at the card's render size, marginally soft at 3× density.
- **No E2E tests.** The interaction paths (restore-from-storage, the clamp, two-way stepper sync)
  were verified by driving the browser rather than automated. Unit tests cover the arithmetic
  underneath them.
- **`db:migrate` is `prisma migrate dev`**, the authoring command. A deployment would want
  `migrate deploy`.
