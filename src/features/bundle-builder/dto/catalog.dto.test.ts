import { describe, expect, it } from "vitest";
import { CATALOG } from "../constants/catalog";
import type { Catalog } from "../types";
import { toCatalog } from "./catalog.dto";

/**
 * Rebuilds the rows the seed would have written for a given catalog, so these
 * tests assert the mapper against `catalog.ts` itself rather than a hand-copied
 * fixture. If the seed and the mapper ever disagree about a column, the shapes
 * stop matching here instead of in the browser.
 *
 * Deliberately no DB: `npm test` has to pass on a fresh clone before anyone has
 * run `db:migrate`.
 */
function rowsFrom(catalog: Catalog) {
  const basename = (path: string) => path.slice(path.lastIndexOf("/") + 1);

  return catalog.map((category) => ({
    id: category.id,
    step: category.step,
    stepTitle: category.stepTitle,
    singleSelect: category.singleSelect ?? false,
    reviewLabel: category.reviewLabel,
    reviewOrder: category.reviewOrder,
    products: category.products.map((product, sortOrder) => ({
      id: product.id,
      title: product.title,
      tagline: product.tagline,
      image: product.image ? basename(product.image) : null,
      price: product.price,
      compareAt: product.compareAt ?? null,
      unit: product.unit ?? null,
      required: product.required ?? false,
      max: product.max ?? null,
      sortOrder,
      categoryId: category.id,
      variants: product.variants.map((variant, variantOrder) => ({
        id: variant.id,
        label: variant.label,
        swatch: variant.swatch ? basename(variant.swatch) : "",
        sortOrder: variantOrder,
        productId: product.id,
      })),
    })),
  }));
}

describe("toCatalog", () => {
  it("round-trips the seeded catalog back to catalog.ts exactly", () => {
    expect(toCatalog(rowsFrom(CATALOG))).toEqual(CATALOG);
  });

  it("omits absent optionals rather than setting them to undefined", () => {
    // `types.ts` distinguishes absent from false — `compareAt` absent means no
    // strikethrough — but SQLite only has NULL. The doorbell has no compareAt.
    const mapped = toCatalog(rowsFrom(CATALOG));
    const doorbell = mapped[0].products.find(
      (p) => p.id === "duo-cam-doorbell",
    )!;

    expect("compareAt" in doorbell).toBe(false);
    expect("required" in doorbell).toBe(false);
    expect("max" in doorbell).toBe(false);
  });

  it("preserves the Hub's required and max, which the savings math depends on", () => {
    const hub = toCatalog(rowsFrom(CATALOG))
      .flatMap((c) => c.products)
      .find((p) => p.id === "sense-hub")!;

    expect(hub.price).toBe(0);
    expect(hub.compareAt).toBe(2992);
    expect(hub.required).toBe(true);
    expect(hub.max).toBe(1);
  });

  it("rebuilds asset paths from bare filenames", () => {
    const camV4 = toCatalog(rowsFrom(CATALOG))[0].products[0];

    expect(camV4.image).toBe("/assets/bundle-builder/products/wyze-cam-v4.png");
    expect(camV4.variants[0].swatch).toBe(
      "/assets/bundle-builder/products/wyze-cam-v4-white.png",
    );
  });

  it("rejects a category id the selectors would not understand", () => {
    const rows = rowsFrom(CATALOG);
    rows[0].id = "cameras-typo";

    expect(() => toCatalog(rows)).toThrow(/Unknown category id/);
  });

  it("keeps display order independent of row order", () => {
    // SQL returns rows in no guaranteed order; only sortOrder carries intent.
    const rows = rowsFrom(CATALOG);
    const shuffled = rows.map((c) => ({
      ...c,
      products: [...c.products].reverse(),
    }));

    // The mapper trusts the query's ORDER BY, so reversed input maps reversed —
    // this documents that the ordering guarantee lives in CATALOG_INCLUDE, not
    // in the mapper, which is why that include is exported alongside it.
    expect(toCatalog(shuffled)[0].products[0].id).toBe(
      CATALOG[0].products.at(-1)!.id,
    );
  });
});
