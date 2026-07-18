"use client";

import { Accordion } from "@base-ui/react/accordion";
import { useMemo } from "react";
import { selectStepCount } from "../../selectors";
import { useBundleStore } from "../../store/useBundleStore";
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
      className="group data-open:bg-surface data-open:rounded-card flex flex-col"
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
            <span className="text-ink text-[1.375rem] font-semibold">
              {category.stepTitle}
            </span>
            <span className="text-brand ml-auto flex items-center gap-1 text-sm font-medium">
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
          className="grid grid-cols-2 gap-4 px-4 pt-1 pb-5"
        >
          {category.products.map((product) =>
            category.singleSelect ? (
              <PlanCard
                key={product.id}
                product={product}
                className="last:odd:col-span-2 last:odd:mx-auto last:odd:w-[calc(50%-0.5rem)]"
              />
            ) : (
              <ProductCard
                key={product.id}
                product={product}
                className="last:odd:col-span-2 last:odd:mx-auto last:odd:w-[calc(50%-0.5rem)]"
              />
            ),
          )}
        </div>

        <div className="flex justify-center px-4 pb-5">
          {nextCategory ? (
            <button
              type="button"
              onClick={() => setOpenStep(nextCategory.step)}
              className="rounded-btn border-brand text-brand focus-visible:ring-brand cursor-pointer border px-6 py-2 text-lg font-semibold focus-visible:ring-2 focus-visible:outline-none"
            >
              Next: {nextCategory.stepTitle}
            </button>
          ) : (
            <>
              {/* visible on small screens */}
              <a
                href="#review"
                className="rounded-btn border-brand text-brand focus-visible:ring-brand border px-6 py-2 text-lg font-semibold focus-visible:ring-2 focus-visible:outline-none lg:hidden"
              >
                Review your bundle
              </a>

              {/* visible on lg screens */}
              <p className="text-kicker hidden text-sm lg:block">
                That&apos;s everything. Your bundle is ready on the right.
              </p>
            </>
          )}
        </div>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
