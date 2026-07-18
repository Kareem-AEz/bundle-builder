import type { Cents } from "../lib/money";
import type { Quantities } from "../types";
import { CATALOG_INDEX } from "./catalog-index";

/**
 * Cart subtotal: the sum of active price x qty over every added variant, in cents.
 * The plan's monthly price folds in as just another entry — no special case. Unknown
 * ids (e.g. stale localStorage) and non-positive quantities are skipped.
 *
 * @param quantities - variantId -> count, from the store.
 * @returns Subtotal in cents. Seed -> 20987 ($209.87).
 */
export function selectSubtotal(quantities: Quantities): Cents {
  let subtotal = 0;
  for (const [variantId, qty] of Object.entries(quantities)) {
    if (qty <= 0) continue;
    const entry = CATALOG_INDEX.get(variantId);
    if (!entry) continue;
    subtotal += entry.product.price * qty;
  }
  return subtotal;
}

/**
 * What the same cart would cost at pre-sale prices: the sum of (compareAt ?? price) x
 * qty. A product with no `compareAt` isn't discounted, so it contributes its own price
 * and nothing to savings.
 *
 * @param quantities - variantId -> count, from the store.
 * @returns Pre-discount total in cents. Seed -> 26079 ($260.79).
 */
export function selectPreDiscountTotal(quantities: Quantities): Cents {
  let total = 0;
  for (const [variantId, qty] of Object.entries(quantities)) {
    if (qty <= 0) continue;
    const entry = CATALOG_INDEX.get(variantId);
    if (!entry) continue;
    total += (entry.product.compareAt ?? entry.product.price) * qty;
  }
  return total;
}

/**
 * Total saved = pre-discount total - subtotal. Two passes over a handful of entries;
 * written as "original - actual" because that reads as obviously correct.
 *
 * @param quantities - variantId -> count, from the store.
 * @returns Savings in cents. Seed -> 5092 ($50.92).
 */
export function selectSavings(quantities: Quantities): Cents {
  return selectPreDiscountTotal(quantities) - selectSubtotal(quantities);
}

/**
 * One-time hardware only: everything without a recurring `unit`. The plan bills monthly,
 * so it has no business in a figure you'd finance or charge once.
 *
 * @param quantities - variantId -> count, from the store.
 * @returns Hardware subtotal in cents. Seed -> 19988 ($199.88).
 */
export function selectHardwareSubtotal(quantities: Quantities): Cents {
  let subtotal = 0;
  for (const [variantId, qty] of Object.entries(quantities)) {
    if (qty <= 0) continue;
    const entry = CATALOG_INDEX.get(variantId);
    if (!entry || entry.product.unit) continue; // skip anything recurring
    subtotal += entry.product.price * qty;
  }
  return subtotal;
}

/**
 * The recurring side, on its own so nothing can fold a per-month charge into a one-time
 * total by accident.
 *
 * @param quantities - variantId -> count, from the store.
 * @returns Monthly charge in cents. Seed -> 999 ($9.99/mo).
 */
export function selectMonthlySubtotal(quantities: Quantities): Cents {
  let monthly = 0;
  for (const [variantId, qty] of Object.entries(quantities)) {
    if (qty <= 0) continue;
    const entry = CATALOG_INDEX.get(variantId);
    if (!entry || !entry.product.unit) continue;
    monthly += entry.product.price * qty;
  }
  return monthly;
}
