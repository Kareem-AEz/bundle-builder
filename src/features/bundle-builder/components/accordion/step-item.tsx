"use client";

import { Accordion } from "@base-ui/react/accordion";
import { useMemo } from "react";
import { selectStepCount } from "../../selectors";
import { useBundleStore } from "../../store/bundle-store-provider";
import type { Category, CategoryId } from "../../types";
import {
  CameraIcon,
  ChevronDownIcon,
  KeypadIcon,
  SensorIcon,
  ShieldIcon,
} from ".././icons";
import { ProductCard } from ".././product-card";
import { PlanCard } from "../plan-card";

const STEP_ICON: Record<CategoryId, typeof CameraIcon> = {
  cameras: CameraIcon,
  plan: ShieldIcon,
  sensors: SensorIcon,
  "extra-protection": KeypadIcon,
};

export function StepItem({
  category,
  nextCategory,
}: {
  category: Category;
  nextCategory?: Category;
}) {
  const setOpenStep = useBundleStore((s) => s.setOpenStep);
  const quantities = useBundleStore((s) => s.quantities);
  const count = useMemo(
    () => selectStepCount(quantities, category),
    [quantities, category],
  );
  const Icon = STEP_ICON[category.id];

  return (
    <Accordion.Item
      value={category.step}
      id={`bundle-step-${category.step}`}
      className="group data-open:bg-surface data-open:rounded-card flex scroll-mt-4 flex-col"
    >
      <Accordion.Header>
        <Accordion.Trigger className="rounded-card focus-visible:ring-brand flex w-full cursor-pointer flex-col px-4 pt-4 pb-4 text-left focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset">
          <span className="text-kicker pb-4 text-xs font-medium tracking-[1.6px] uppercase">
            Step {category.step} of 4
          </span>

          {/* One hairline, one position, always present. Only its colour reacts to open
              state -- nothing in the box model does, so toggling can't nudge anything. */}
          <span className="border-line group-data-open:border-title/100 w-full border-t" />

          <span className="flex w-full items-center gap-2 pt-5">
            <Icon className="size-6.5 shrink-0" />
            {/* Smaller on mobile so the title and "N selected" share one line in a phone-
                width header; the 22px desktop size returns at md. min-w-0 lets it shrink
                rather than shove the count onto a second line. */}
            <span className="text-ink min-w-0 text-lg font-semibold md:text-[1.375rem]">
              {category.stepTitle}
            </span>
            <span className="text-brand ml-auto flex shrink-0 items-center gap-1 text-sm font-medium whitespace-nowrap">
              {count > 0 && `${count} selected`}
              <ChevronDownIcon className="transition-transform duration-200 group-data-open:rotate-180 motion-reduce:transition-none" />
            </span>
          </span>
        </Accordion.Trigger>
      </Accordion.Header>

      <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none">
        <div
          role={category.singleSelect ? "radiogroup" : undefined}
          aria-label={category.singleSelect ? category.stepTitle : undefined}
          className="grid grid-cols-1 gap-4 px-4 pt-1 pb-5 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] xl:grid-cols-2"
        >
          {/* Tablet packs as many ~240px portrait cards as fit (3 across on a portrait
              tablet, more on a wide one), matching the design's narrow cards rather than
              stretching two boxes across the row. Desktop returns to the fixed 2·2·1 grid,
              where a lone last card (cameras' 5th, the plan's odd one) centers across both
              columns — gated to xl since that trick only makes sense in a 2-column grid. */}
          {category.products.map((product) =>
            category.singleSelect ? (
              <PlanCard
                key={product.id}
                product={product}
                className="xl:last:odd:col-span-2 xl:last:odd:mx-auto xl:last:odd:w-[calc(50%-0.5rem)]"
              />
            ) : (
              <ProductCard
                key={product.id}
                product={product}
                className="xl:last:odd:col-span-2 xl:last:odd:mx-auto xl:last:odd:w-[calc(50%-0.5rem)]"
              />
            ),
          )}
        </div>

        <div className="flex justify-center px-4 pb-5">
          {nextCategory ? (
            <button
              type="button"
              onClick={() => {
                // Land the step being opened at the very top in a single motion. Its
                // header sits below the panel that's about to collapse, so its *final*
                // position is: right under this step's header, which itself doesn't move
                // (it's above its own panel). Compute that final scroll position and jump
                // there instantly, then open the next step — the accordion's own collapse
                // animation is the only thing that visibly moves, sliding the opened step
                // up into place. No scroll animation to wobble against the shrinking
                // panel, and no dip toward the review panel.
                // The header is the item's first child (Base UI renders it as the <h3>
                // before the panel); its height is what stays above the next step once
                // this panel collapses to zero.
                const header = document.getElementById(
                  `bundle-step-${category.step}`,
                )?.firstElementChild;
                if (header) {
                  const rect = header.getBoundingClientRect();
                  const SCROLL_MARGIN = 16; // matches scroll-mt-4 on the item
                  window.scrollTo({
                    top:
                      rect.top + window.scrollY + rect.height - SCROLL_MARGIN,
                  });
                }
                setOpenStep(nextCategory.step);
              }}
              className="rounded-btn border-brand text-brand focus-visible:ring-brand cursor-pointer border px-6 py-2 text-lg font-semibold focus-visible:ring-2 focus-visible:outline-none"
            >
              Next: {nextCategory.stepTitle}
            </button>
          ) : (
            <>
              {/* Below xl the review is stacked underneath, so mirror mobile: a link that
                  scrolls down to it. "On the right" is only true once the two-column
                  layout kicks in at xl. */}
              <a
                href="#review"
                className="rounded-btn border-brand text-brand focus-visible:ring-brand border px-6 py-2 text-lg font-semibold focus-visible:ring-2 focus-visible:outline-none xl:hidden"
              >
                Review your bundle
              </a>

              {/* Only at xl, where the review actually sits on the right. */}
              <p className="text-kicker hidden text-sm xl:block">
                That&apos;s everything. Your bundle is ready on the right.
              </p>
            </>
          )}
        </div>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
