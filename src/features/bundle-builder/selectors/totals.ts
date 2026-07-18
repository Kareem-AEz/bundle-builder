import type { Cents } from "../lib/money";
import type { Product, Quantities } from "../types";
import type { CatalogEntry } from "./catalog-index";

/** variantId -> catalog entry, built once per store by the provider. */
export type CatalogIndex = ReadonlyMap<string, CatalogEntry>;

/**
 * The shape every cart sum shares: walk the added variants, skip unknown ids (e.g. stale
 * localStorage) and non-positive quantities, add up whatever `amount` picks. `include`
 * narrows to a slice of the cart.
 */
function sumCart(
  quantities: Quantities,
  index: CatalogIndex,
  amount: (product: Product) => Cents,
  include: (product: Product) => boolean = () => true,
): Cents {
  let total = 0;
  for (const [variantId, qty] of Object.entries(quantities)) {
    if (qty <= 0) continue;
    const entry = index.get(variantId);
    if (!entry || !include(entry.product)) continue;
    total += amount(entry.product) * qty;
  }
  return total;
}

const activePrice = (p: Product) => p.price;
/** No `compareAt` means the product isn't discounted, so it contributes its own price. */
const originalPrice = (p: Product) => p.compareAt ?? p.price;
const isHardware = (p: Product) => p.unit === undefined;
const isRecurring = (p: Product) => p.unit !== undefined;

/**
 * Cart subtotal: the sum of active price x qty over every added variant, in cents.
 * The plan's monthly price folds in as just another entry — no special case.
 *
 * @param quantities - variantId -> count, from the store.
 * @returns Subtotal in cents. Seed -> 20987 ($209.87).
 */
export function selectSubtotal(
  quantities: Quantities,
  index: CatalogIndex,
): Cents {
  return sumCart(quantities, index, activePrice);
}

/**
 * What the same cart would cost at pre-sale prices.
 *
 * @param quantities - variantId -> count, from the store.
 * @returns Pre-discount total in cents. Seed -> 26079 ($260.79).
 */
export function selectPreDiscountTotal(
  quantities: Quantities,
  index: CatalogIndex,
): Cents {
  return sumCart(quantities, index, originalPrice);
}

/**
 * Total saved = pre-discount total - subtotal. Written as "original - actual" because
 * that reads as obviously correct.
 *
 * @param quantities - variantId -> count, from the store.
 * @returns Savings in cents. Seed -> 5092 ($50.92).
 */
export function selectSavings(
  quantities: Quantities,
  index: CatalogIndex,
): Cents {
  return (
    selectPreDiscountTotal(quantities, index) -
    selectSubtotal(quantities, index)
  );
}

/**
 * One-time hardware only: everything without a recurring `unit`. The plan bills monthly,
 * so it has no business in a figure you'd finance or charge once. This is the summary's
 * headline total.
 *
 * @param quantities - variantId -> count, from the store.
 * @returns Hardware subtotal in cents. Seed -> 19988 ($199.88).
 */
export function selectHardwareSubtotal(
  quantities: Quantities,
  index: CatalogIndex,
): Cents {
  return sumCart(quantities, index, activePrice, isHardware);
}

/**
 * Hardware at pre-sale prices: the strike above the total, matched to the total's base.
 *
 * @param quantities - variantId -> count, from the store.
 * @returns Pre-discount hardware total in cents. Seed -> 24780 ($247.80).
 */
export function selectHardwarePreDiscountTotal(
  quantities: Quantities,
  index: CatalogIndex,
): Cents {
  return sumCart(quantities, index, originalPrice, isHardware);
}

/**
 * Savings on the hardware only. Deliberately not whole-cart: it sits under a
 * hardware-only total, and the plan's monthly discount already shows its own strike in
 * the plan row. Mixing bases is what made the summary disagree with itself.
 *
 * @param quantities - variantId -> count, from the store.
 * @returns Hardware savings in cents. Seed -> 4792 ($47.92).
 */
export function selectHardwareSavings(
  quantities: Quantities,
  index: CatalogIndex,
): Cents {
  return (
    selectHardwarePreDiscountTotal(quantities, index) -
    selectHardwareSubtotal(quantities, index)
  );
}

/**
 * The recurring side, on its own so nothing can fold a per-month charge into a one-time
 * total by accident.
 *
 * @param quantities - variantId -> count, from the store.
 * @returns Monthly charge in cents. Seed -> 999 ($9.99/mo).
 */
export function selectMonthlySubtotal(
  quantities: Quantities,
  index: CatalogIndex,
): Cents {
  return sumCart(quantities, index, activePrice, isRecurring);
}

/**
 * "as low as $X/mo" — the hardware total spread over 12 months. Hardware only: the plan
 * already bills monthly, so financing it would be double-counting a subscription.
 *
 * The one division in the money layer, and it rounds. Math.floor would render $16.65 on
 * a $199.88 total and quietly under-state the payment.
 */
export function selectFinancingMonthly(
  quantities: Quantities,
  index: CatalogIndex,
): Cents {
  return Math.round(selectHardwareSubtotal(quantities, index) / 12);
}
