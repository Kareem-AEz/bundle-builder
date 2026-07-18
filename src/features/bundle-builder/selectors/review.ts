import type { Cents } from "../lib/money";
import type { Catalog, Category, CategoryId, Quantities } from "../types";
import { reviewOrdered } from "./catalog-index";

/**
 * One row in the review panel: a single added variant, flattened into a self-contained
 * view model. The panel renders straight from this and never reaches back into the
 * catalog, so every field a row needs to draw lives here.
 */
export type ReviewLine = {
  /** Stable quantity key, e.g. "cam-v4-white". Doubles as the React list key. */
  variantId: string;
  /** Parent product id, e.g. "cam-v4". */
  productId: string;
  /** Product name, e.g. "Wyze Cam v4". */
  title: string;
  /** Colour/option name, e.g. "White". Empty string for single-variant products. */
  variantLabel: string;
  /** Hardware photo. Absent for plans (a service has no product shot). */
  image?: string;
  /** "month" for the subscription plan; absent for one-time hardware. */
  unit?: "month";
  /** Active price, in cents. */
  unitPrice: Cents;
  /** Original price in cents when on sale — drives the strikethrough. Absent otherwise. */
  compareAt?: Cents;
  /** Hub only: qty clamps at min 1, so this row's minus button is disabled. */
  required?: boolean;
  /** Ceiling on qty, when the product has one. Disables this row's plus button. */
  max?: number;
  /** Count in the cart. Always > 0 for a row that exists. */
  qty: number;
  /** unitPrice * qty, in cents. Precomputed so the panel does no math. */
  lineSubtotal: Cents;
  /** compareAt * qty, in cents. Absent when not on sale. A line total, like
   *  `lineSubtotal`, so the struck price and the price under it are comparable. */
  lineCompareAt?: Cents;
};

/**
 * One review-panel section: a category heading and its rows. Only sections with at
 * least one row are produced (see {@link selectReviewGroups}).
 */
export type ReviewGroup = {
  categoryId: CategoryId;
  /** Heading text, e.g. "Cameras". */
  reviewLabel: string;
  lines: ReviewLine[];
};

/**
 * Builds the review panel: every added variant, grouped under its category heading, in
 * review order (Cameras -> Sensors -> Accessories -> Plan).
 *
 * A row is emitted per variant with qty > 0; a variant at 0 — or never touched, since
 * the map is sparse — contributes nothing. Categories that end up with no rows are
 * dropped, so an empty step shows no heading.
 *
 * Pure: depends only on its two arguments. Memoize in the component on the `quantities`
 * reference, which changes iff a quantity changes — the catalog is stable for the life
 * of the page.
 *
 * @param quantities - variantId -> count, from the store.
 * @param catalog - the catalog the page was rendered from.
 * @returns Non-empty groups, ready to render. Prices are in cents.
 */
export function selectReviewGroups(
  quantities: Quantities,
  catalog: Catalog,
): ReviewGroup[] {
  return reviewOrdered(catalog)
    .map((category) => ({
      categoryId: category.id,
      reviewLabel: category.reviewLabel,
      lines: category.products.flatMap((product) =>
        product.variants.flatMap((variant) => {
          const qty = quantities[variant.id] ?? 0;
          if (qty <= 0) return [];
          return [
            {
              variantId: variant.id,
              productId: product.id,
              title: product.title,
              variantLabel: variant.label,
              image: variant.swatch || product.image,
              unit: product.unit,
              unitPrice: product.price,
              compareAt: product.compareAt,
              required: product.required,
              max: product.max,
              qty,
              lineSubtotal: product.price * qty,
              lineCompareAt:
                product.compareAt === undefined
                  ? undefined
                  : product.compareAt * qty,
            } satisfies ReviewLine,
          ];
        }),
      ),
    }))
    .filter((group) => group.lines.length > 0);
}

/**
 * "N selected" for an accordion step: the count of distinct *products* in a category
 * that have anything in the cart. A product shown in two colours still counts once, so
 * this counts products, not variants.
 *
 * @param quantities - variantId -> count, from the store.
 * @param category - the step's catalog category.
 * @returns Number of products with at least one variant at qty > 0.
 */
export function selectStepCount(
  quantities: Quantities,
  category: Category,
): number {
  return category.products.filter((product) =>
    product.variants.some((variant) => (quantities[variant.id] ?? 0) > 0),
  ).length;
}
