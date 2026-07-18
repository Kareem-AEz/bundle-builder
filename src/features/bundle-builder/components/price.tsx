import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { type Cents, formatPrice } from "../lib/money";

/**
 * The struck-original-over-active price pair, used by both the product card and the
 * review row. Same skeleton, two tones: the builder side strikes in red on a muted
 * active price, the review side strikes in gray on a brand-purple one.
 *
 * Deliberately dumb about quantity. The card passes per-unit money, the review row
 * passes line totals; unifying that here would bake one caller's meaning into a shared
 * component.
 */
const priceRoot = cva("flex flex-col items-end gap-[3px] tracking-[0.6px]", {
  variants: {
    tone: {
      card: "text-base leading-5",
      // Fixed floor + tabular figures keep the review rows on a shared column grid: the
      // stepper stops sliding left as a price gets wider, and digits don't jitter as
      // counts change. Only overflows past ~$999.99, which no realistic cart reaches.
      review: "min-w-[76px] text-sm leading-4 tabular-nums",
    },
  },
  defaultVariants: { tone: "card" },
});

const strike = cva("line-through", {
  variants: {
    tone: {
      card: "text-sale",
      review: "text-faint font-medium",
    },
  },
  defaultVariants: { tone: "card" },
});

const active = cva("", {
  variants: {
    tone: {
      card: "text-ink-muted",
      review: "text-brand font-semibold",
    },
  },
  defaultVariants: { tone: "card" },
});

type PriceProps = VariantProps<typeof priceRoot> & {
  /** Active price in cents. 0 renders as "FREE". */
  price: Cents;
  /** Original price in cents. Struck through above; omitted when absent or not a discount. */
  compareAt?: Cents;
  /** "month" appends "/mo" to both lines (the subscription plan). */
  unit?: "month";
  className?: string;
};

export function Price({ price, compareAt, unit, tone, className }: PriceProps) {
  const suffix = unit === "month" ? "/mo" : "";
  const showStrike = compareAt !== undefined && compareAt > price;

  return (
    <p className={cn(priceRoot({ tone }), className)}>
      {showStrike && (
        <span className={strike({ tone })}>
          {/* <s>/line-through is not reliably announced, so name the two lines outright. */}
          <span className="visually-hidden">Original price </span>
          {formatPrice(compareAt)}
          {suffix}
        </span>
      )}
      <span className={active({ tone })}>
        {showStrike && <span className="visually-hidden">Now </span>}
        {price === 0 ? "FREE" : `${formatPrice(price)}${suffix}`}
      </span>
    </p>
  );
}
