"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Variant } from "../types";

/**
 * The colour picker on a multi-variant card. Built on native radios inside labels: the
 * browser gives us roving-arrow-key navigation, a real selected state, and a group name
 * for free, which a div-with-onClick would all have to fake.
 *
 * Renders nothing for single-variant products — the caller does not have to guard.
 */
export function VariantChips({
  productId,
  variants,
  activeVariantId,
  onSelect,
  className,
}: {
  productId: string;
  variants: Variant[];
  activeVariantId: string;
  onSelect: (variantId: string) => void;
  className?: string;
}) {
  if (variants.length <= 1) return null;

  return (
    <fieldset className={cn("flex items-end gap-1.5", className)}>
      <legend className="visually-hidden">Colour</legend>
      {variants.map((variant) => {
        const selected = variant.id === activeVariantId;
        return (
          <label
            key={variant.id}
            className={cn(
              "rounded-chip focus-within:ring-brand flex h-6.5 cursor-pointer items-center gap-1 px-1 py-0.5 focus-within:ring-2 focus-within:ring-offset-1",
              selected
                ? "border-success bg-chip-fill border"
                : "border-chip-line border-[0.5px] bg-white",
            )}
          >
            <input
              type="radio"
              name={`${productId}-variant`}
              value={variant.id}
              checked={selected}
              onChange={() => onSelect(variant.id)}
              className="visually-hidden"
            />
            {variant.swatch && (
              <Image
                src={variant.swatch}
                alt=""
                width={22}
                height={22}
                className="rounded-thumb size-[22px] object-contain"
              />
            )}
            <span className="text-title text-[10px] font-medium tracking-[0.6px] select-none">
              {variant.label}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
