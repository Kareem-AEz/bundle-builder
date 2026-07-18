import type { Prisma } from "@/generated/prisma/client";
import { PATHS } from "../lib/paths";
import type { Catalog, CategoryId } from "../types";

/**
 * The shape the query must fetch for `toCatalog` to have everything it needs.
 * Exported so the query and the mapper cannot drift: the row type below is
 * derived from this, so widening the mapper without widening the query is a
 * type error rather than a runtime `undefined`.
 *
 * Ordering is explicit at every level. Array position is the display order in
 * `catalog.ts`, and SQL guarantees no order without an ORDER BY, so dropping
 * these would reshuffle the cards non-deterministically.
 */
export const CATALOG_INCLUDE = {
  products: {
    orderBy: { sortOrder: "asc" },
    include: { variants: { orderBy: { sortOrder: "asc" } } },
  },
} satisfies Prisma.CategoryInclude;

type CategoryRow = Prisma.CategoryGetPayload<{
  include: typeof CATALOG_INCLUDE;
}>;

const CATEGORY_IDS: readonly CategoryId[] = [
  "cameras",
  "plan",
  "sensors",
  "extra-protection",
];

/**
 * Rows store `id` as TEXT, so the DB cannot promise it is a `CategoryId`.
 * Failing loudly here beats casting: a stale or hand-edited row would otherwise
 * render a step that no selector knows about, and the bug would surface as a
 * silently missing section rather than an error.
 */
function toCategoryId(id: string): CategoryId {
  const match = CATEGORY_IDS.find((known) => known === id);
  if (!match) {
    throw new Error(
      `Unknown category id "${id}" in the database. Re-run \`npm run db:seed\`.`,
    );
  }
  return match;
}

/**
 * Maps persisted rows onto the `Catalog` shape the selectors already consume.
 * `types.ts` stays the contract and Prisma stays storage, so the money layer
 * never learns that a database exists.
 *
 * The optional-key spreads are deliberate: `types.ts` distinguishes absent from
 * false (`compareAt` absent means no strikethrough), while SQLite only has
 * NULL. Spreading conditionally reproduces absence instead of emitting
 * `compareAt: undefined`, which would serialize differently across the cache
 * boundary.
 */
export function toCatalog(rows: CategoryRow[]): Catalog {
  return rows.map((category) => ({
    id: toCategoryId(category.id),
    step: category.step,
    stepTitle: category.stepTitle,
    ...(category.singleSelect && { singleSelect: true }),
    reviewLabel: category.reviewLabel,
    reviewOrder: category.reviewOrder,
    products: category.products.map((product) => ({
      id: product.id,
      title: product.title,
      tagline: product.tagline,
      // Rows hold bare filenames so `PATHS` stays the only place that knows
      // the asset layout.
      ...(product.image && { image: PATHS.product(product.image) }),
      price: product.price,
      ...(product.compareAt !== null && { compareAt: product.compareAt }),
      ...(product.unit !== null && { unit: "month" as const }),
      ...(product.required && { required: true }),
      ...(product.max !== null && { max: product.max }),
      variants: product.variants.map((variant) => ({
        id: variant.id,
        label: variant.label,
        swatch: variant.swatch ? PATHS.product(variant.swatch) : "",
      })),
    })),
  }));
}
