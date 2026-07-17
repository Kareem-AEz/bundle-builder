import type { Cents } from "../lib/money";

/**
 * The pill on a product card or review row.
 * - `free` — price is 0 (a struck-through compareAt may still show beside it).
 * - `save` — on sale; `percent` is the whole-number discount.
 * - `none` — full price, no pill.
 */
export type Badge =
  { kind: "free" } | { kind: "save"; percent: number } | { kind: "none" };

/**
 * Derives the badge from a price pair. Takes only `{ price, compareAt }`, not a whole
 * product, so a card and a review row can both call it with what they hold.
 *
 * FREE is checked before a discount: the Hub is $0 with a compareAt of $29.92 and must
 * read FREE, not "Save 100%". The struck-through original is drawn separately.
 *
 * `percent` is a ratio, not money, so the float division is fine; Math.floor (not
 * round) matches the design — Pan v3 = floor(500 / 3998 * 100) = 12%, not 13%.
 *
 * @param p.price - active price in cents.
 * @param p.compareAt - original price in cents, if on sale.
 * @returns A discriminated {@link Badge}.
 */
export function selectBadge(p: { price: Cents; compareAt?: Cents }): Badge {
  if (p.price === 0) return { kind: "free" };
  if (p.compareAt !== undefined && p.compareAt > p.price) {
    return {
      kind: "save",
      percent: Math.floor(((p.compareAt - p.price) / p.compareAt) * 100),
    };
  }
  return { kind: "none" };
}
