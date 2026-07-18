/**
 * Database seed script.
 *
 * Run with: npm run db:migrate && npm run db:seed
 * (migrate first — better-sqlite3 creates an empty file on connect, so seeding
 * a fresh clone without migrating dies with `TableDoesNotExist`.)
 *
 * `src/features/bundle-builder/constants/catalog.ts` stays the single authored
 * source of product data; this script only mirrors it into SQLite.
 *
 * It wipes and recreates rather than upserting. The catalog is wholly owned by
 * the TS file, so the DB must match it exactly — an upsert would leave rows
 * behind for any product removed from the catalog, and those ghosts would then
 * render. Wipe-and-recreate makes the seed reproducible, not merely idempotent.
 *
 * This is a standalone tsx script, so console output is intentional here.
 */
import { CATALOG } from "@/features/bundle-builder/constants/catalog";
import prisma from "@/lib/prisma";

/**
 * `catalog.ts` stores resolved paths (`PATHS.product("x.png")`), but rows hold
 * the bare filename so `PATHS` stays the only place that knows the asset layout.
 * Taking the basename avoids restating that prefix here and getting it wrong.
 */
function toFilename(assetPath: string): string {
  return assetPath.slice(assetPath.lastIndexOf("/") + 1);
}

async function main() {
  // Children first — the FKs point upward.
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  for (const category of CATALOG) {
    await prisma.category.create({
      data: {
        id: category.id,
        step: category.step,
        stepTitle: category.stepTitle,
        singleSelect: category.singleSelect ?? false,
        reviewLabel: category.reviewLabel,
        reviewOrder: category.reviewOrder,
        products: {
          create: category.products.map((product, productIndex) => ({
            id: product.id,
            title: product.title,
            tagline: product.tagline,
            image: product.image ? toFilename(product.image) : null,
            price: product.price,
            compareAt: product.compareAt ?? null,
            unit: product.unit ?? null,
            required: product.required ?? false,
            max: product.max ?? null,
            // Array position is the display order in catalog.ts; rows come back
            // unordered without this, which silently reshuffles the cards.
            sortOrder: productIndex,
            variants: {
              create: product.variants.map((variant, variantIndex) => ({
                // Never derive this. It is the quantity key the store maps and
                // localStorage persists — rewriting it breaks saved bundles.
                id: variant.id,
                label: variant.label,
                swatch: variant.swatch ? toFilename(variant.swatch) : "",
                sortOrder: variantIndex,
              })),
            },
          })),
        },
      },
    });
  }

  const [categories, products, variants] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.variant.count(),
  ]);

  console.log(
    `Seeded catalog: ${categories} categories, ${products} products, ${variants} variants`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
