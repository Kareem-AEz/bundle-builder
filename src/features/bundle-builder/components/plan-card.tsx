"use client";

import { cn } from "@/lib/utils";
import { selectBadge } from "../selectors";
import { useBundleStore } from "../store/useBundleStore";
import type { Product } from "../types";
import { Price } from "./price";
import { SaveBadge } from "./save-badge";

/**
 * A plan option. Same shell as a product card, but the interaction is exclusive choice,
 * not quantity: one native radio per card, all sharing a name, so the browser gives us
 * arrow-key navigation and a real selected state. Picking one calls `selectPlan`, which
 * zeroes every other plan variant.
 */
export function PlanCard({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const variantId = product.variants[0].id;
  const quantities = useBundleStore((s) => s.quantities);
  const selectPlan = useBundleStore((s) => s.selectPlan);

  const selected = (quantities[variantId] ?? 0) > 0;
  const badge = selectBadge(product);

  return (
    <div
      id={product.id}
      className={cn(
        "rounded-card has-[:focus-visible]:ring-brand relative flex flex-col gap-2.5 border-2 bg-white p-3 has-[:focus-visible]:ring-2",
        selected ? "border-brand/70" : "border-transparent",
        className,
      )}
    >
      <input
        id={`plan-${variantId}`}
        type="radio"
        name="bundle-plan"
        checked={selected}
        onChange={() => selectPlan(variantId)}
        className="visually-hidden"
      />
      {/* Stretched label: covers the whole card so anywhere is a hit target, while the
          "Learn More" link below lifts above it on z-10 and still gets its own clicks.
          Nesting the link inside a label instead would make it change the plan. */}
      <label
        htmlFor={`plan-${variantId}`}
        className="rounded-card absolute inset-0 cursor-pointer"
      >
        <span className="visually-hidden">{product.title}</span>
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-title text-base leading-5 font-semibold tracking-[0.6px]">
            {product.title}
          </h3>
          {badge.kind === "save" && <SaveBadge percent={badge.percent} />}
        </div>
        <p className="text-title/75 text-xs leading-[1.3] font-medium">
          {product.tagline}{" "}
          <a
            href={`#${product.id}`}
            className="text-link relative z-10 rounded-xs underline"
          >
            Learn More
            <span className="visually-hidden"> about {product.title}</span>
          </a>
        </p>
      </div>

      <div className="flex items-center justify-between gap-2.5">
        {/* Selected-ness can't rest on border colour alone. */}
        <span
          aria-hidden="true"
          className={cn(
            "grid size-5 shrink-0 place-items-center rounded-full border-2",
            selected ? "border-brand" : "border-control-line",
          )}
        >
          {selected && <span className="bg-brand size-2.5 rounded-full" />}
        </span>
        <Price
          tone="card"
          price={product.price}
          compareAt={product.compareAt}
          unit={product.unit}
        />
      </div>
    </div>
  );
}
