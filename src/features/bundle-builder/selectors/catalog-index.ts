import type { Catalog, Category, Product, Variant } from "../types";

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
export function buildCatalogIndex(
  catalog: Catalog,
): ReadonlyMap<string, CatalogEntry> {
  const index = new Map<string, CatalogEntry>();
  for (const category of catalog)
    for (const product of category.products)
      for (const variant of product.variants)
        index.set(variant.id, { category, product, variant });
  return index;
}

/** Categories in review-panel order (Cameras -> Sensors -> Accessories -> Plan). Sorted once. */
export function reviewOrdered(catalog: Catalog): readonly Category[] {
  return [...catalog].sort((a, b) => a.reviewOrder - b.reviewOrder);
}
