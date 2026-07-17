import { CATALOG } from "../constants/catalog";
import type { Category, Product, Variant } from "../types";

/** One flattened catalog row: a variant plus the product and category it belongs to. */
export type CatalogEntry = {
  category: Category;
  product: Product;
  variant: Variant;
};

/**
 * variantId -> entry. The catalog is static, so we index it once at module load;
 * selectors are then pure functions of state that read this constant.
 */
export const CATALOG_INDEX: ReadonlyMap<string, CatalogEntry> = (() => {
  const index = new Map<string, CatalogEntry>();
  for (const category of CATALOG) {
    for (const product of category.products) {
      for (const variant of product.variants) {
        index.set(variant.id, { category, product, variant });
      }
    }
  }
  return index;
})();

/** Categories in review-panel order (Cameras -> Sensors -> Accessories -> Plan). Sorted once. */
export const REVIEW_ORDERED: readonly Category[] = [...CATALOG].sort(
  (a, b) => a.reviewOrder - b.reviewOrder,
);
