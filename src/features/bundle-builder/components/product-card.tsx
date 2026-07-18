"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { selectBadge } from "../selectors";
import { useBundleStore } from "../store/useBundleStore";
import type { Product } from "../types";
import { Price } from "./price";
import { QuantityStepper } from "./quantity-stepper";
import { SaveBadge } from "./save-badge";
import { VariantChips } from "./variant-chips";

/**
 * One product in an accordion step. Reads the store directly rather than taking qty
 * through props: two atomic subscriptions that each return a primitive, so the card
 * re-renders only when its own numbers move and never trips Zustand v5's
 * new-object-every-render trap.
 *
 * The card shows *per-unit* money regardless of quantity — the review panel is where
 * line totals live.
 */
export function ProductCard({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const activeVariantId =
    useBundleStore((s) => s.activeVariant[product.id]) ??
    product.variants[0].id;
  // The whole map, not one key: the card needs every variant's count to decide whether
  // it's selected. Safe to subscribe to — the store replaces `quantities` only when a
  // quantity actually changes, so the reference is stable between edits.
  const quantities = useBundleStore((s) => s.quantities);
  const setActiveVariant = useBundleStore((s) => s.setActiveVariant);
  const increment = useBundleStore((s) => s.increment);
  const decrement = useBundleStore((s) => s.decrement);

  const qty = quantities[activeVariantId] ?? 0;
  // Selected-ness belongs to the *product*, not the shown variant: a card with White at
  // 0 but Black at 2 is still in the bundle, so it keeps its border.
  const selected = product.variants.some((v) => (quantities[v.id] ?? 0) > 0);

  const badge = selectBadge(product);

  return (
    <article
      // Gives "Learn More" somewhere real to point. The link is decorative — there are no
      // product pages in scope — so it anchors back to its own card rather than dangling
      // on an href="#" that jumps to the top of the page.
      id={product.id}
      className={cn(
        "rounded-card flex items-center gap-5 border-2 bg-white p-3",
        // The border is always 2px, transparent when unselected, so selecting a card
        // recolours it instead of resizing it. No layout shift on click.
        selected ? "border-brand/70" : "border-transparent",
        className,
      )}
    >
      {product.image && (
        <div className="relative shrink-0">
          <Image
            src={product.image}
            alt={product.title}
            width={101}
            height={137}
            className="rounded-thumb h-[137px] w-[101px] object-contain"
          />
          {badge.kind === "save" && (
            <SaveBadge
              percent={badge.percent}
              className="absolute top-0 left-0"
            />
          )}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div className="flex flex-col gap-2">
          <h3 className="text-title text-base leading-5 font-semibold tracking-[0.6px]">
            {product.title}
            {product.required && " (Required)"}
          </h3>
          {/* "Learn More" sits inside the paragraph, not after it: the design lets it wrap
              as part of the tagline's text flow. */}
          <p className="text-title/75 text-xs leading-[1.3] font-medium">
            {product.tagline}{" "}
            <a
              href={`#${product.id}`}
              className="text-link focus-visible:ring-brand rounded-xs underline focus-visible:ring-2 focus-visible:outline-none"
            >
              Learn More
              <span className="visually-hidden"> about {product.title}</span>
            </a>
          </p>
        </div>

        <VariantChips
          productId={product.id}
          variants={product.variants}
          activeVariantId={activeVariantId}
          onSelect={(variantId) => setActiveVariant(product.id, variantId)}
        />

        <div className="flex items-center justify-between gap-2.5">
          <QuantityStepper
            tone="card"
            value={qty}
            label={product.title}
            onIncrement={() => increment(activeVariantId)}
            onDecrement={() => decrement(activeVariantId)}
            minusDisabled={qty === 0 || (product.required === true && qty <= 1)}
          />
          <Price
            tone="card"
            price={product.price}
            compareAt={product.compareAt}
            unit={product.unit}
          />
        </div>
      </div>
    </article>
  );
}
