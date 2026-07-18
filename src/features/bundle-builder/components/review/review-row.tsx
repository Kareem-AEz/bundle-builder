"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ReviewLine } from "../../selectors";
import { useBundleStore } from "../../store/bundle-store-provider";
import { Price } from "../price";
import { QuantityStepper } from "../quantity-stepper";

/**
 * One row in the review panel. Takes its data as a prop rather than reading the store:
 * the row is fully described by the `ReviewLine` the section already computed.
 *
 * Money here is *line totals* (`lineSubtotal` / `lineCompareAt`), not per-unit. The card
 * shows what one costs; this side shows what the line costs.
 */
export function ReviewRow({
  line,
  showStepper = true,
  className,
}: {
  line: ReviewLine;
  /** False for the plan section: single-select, so there is nothing to step. */
  showStepper?: boolean;
  className?: string;
}) {
  const increment = useBundleStore((s) => s.increment);
  const decrement = useBundleStore((s) => s.decrement);

  return (
    <li className={cn("flex items-center gap-4", className)}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {line.image && (
          <Image
            src={line.image}
            // Next's optimizer rejects SVG unless dangerouslyAllowSVG is on globally. These assets
            // are first-party and checked in, so serving the file as-is beats loosening the config.
            unoptimized={line.image.endsWith(".svg")}
            // The thumb is the only thing naming the chosen colour, so it can't be
            // decorative here. Single-variant products have no label and stay alt="".
            alt={line.variantLabel && `${line.title}, ${line.variantLabel}`}
            width={41}
            height={41}
            className="rounded-thumb size-[41px] shrink-0 bg-white object-contain"
          />
        )}
        <p className="text-ink text-sm leading-4 font-medium tracking-[0.07px]">
          {line.title}
          {line.required && " (Required)"}
        </p>
      </div>

      {showStepper && (
        <QuantityStepper
          tone="review"
          value={line.qty}
          label={line.title}
          onIncrement={() => increment(line.variantId)}
          onDecrement={() => decrement(line.variantId)}
          minusDisabled={line.required === true && line.qty <= 1}
          plusDisabled={line.max !== undefined && line.qty >= line.max}
        />
      )}

      <Price
        tone="review"
        price={line.lineSubtotal}
        compareAt={line.lineCompareAt}
        unit={line.unit}
      />
    </li>
  );
}
