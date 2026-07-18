import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";
import { CATALOG_INCLUDE, toCatalog } from "../dto/catalog.dto";
import type { Catalog } from "../types";

/**
 * Reads the catalog from SQLite and hands the rows to the DTO for mapping.
 *
 * `use cache` is what keeps the page prerendered. Without it, awaiting a DB
 * query in a Server Component opts the whole route into dynamic rendering.
 * `cacheLife("max")` because this data only changes when someone re-seeds —
 * there is no runtime write path — and `cacheTag` gives us one if that ever
 * changes, via `revalidateTag("catalog")`.
 */
export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("max");
  cacheTag("catalog");

  const rows = await prisma.category.findMany({
    orderBy: { step: "asc" },
    include: CATALOG_INCLUDE,
  });

  return toCatalog(rows);
}
