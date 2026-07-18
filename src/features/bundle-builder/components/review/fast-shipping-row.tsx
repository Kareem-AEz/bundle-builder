import { DeliveryIcon } from "../icons";
import { Price } from "../price";

/** Presentational only. Free shipping is a fact about the offer, not a line in the
 *  bundle, so it never reaches a selector — folding it into the money would move the
 *  reconciled savings figure (ADR-0010). */
const SHIPPING_COMPARE_AT = 599;

export function FastShippingRow() {
  return (
    <section className="border-line border-t pt-4">
      <div className="flex items-center gap-4">
        <div className="flex flex-1 items-center gap-3">
          <span className="rounded-thumb text-success grid size-[41px] shrink-0 place-items-center bg-white">
            <DeliveryIcon />
          </span>
          <p className="text-ink text-sm leading-4 font-medium tracking-[0.07px]">
            Fast Shipping
          </p>
        </div>
        <Price tone="review" price={0} compareAt={SHIPPING_COMPARE_AT} />
      </div>
    </section>
  );
}
