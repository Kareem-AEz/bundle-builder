"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { MinusIcon, PlusIcon } from "./icons";

const stepperRoot = cva("flex items-center justify-between py-1", {
  variants: {
    tone: {
      card: "w-20",
      review: "w-18",
    },
  },
  defaultVariants: { tone: "card" },
});

const stepperValue = cva("text-ink text-center tabular-nums", {
  variants: {
    tone: {
      card: "text-base leading-5 font-medium",
      review: "text-sm leading-4 font-semibold",
    },
  },
  defaultVariants: { tone: "card" },
});

/**
 * `tap-target` (globals.css) grows the pointer area past the 20px visual box — the
 * design's control is under the WCAG 2.5.8 minimum on its own.
 */
const stepperButton = cva(
  "tap-target rounded-control focus-visible:ring-brand grid size-5 place-items-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
  {
    variants: {
      disabled: { true: "", false: "" },
      tone: { card: "", review: "" },
    },
    compoundVariants: [
      // Both ends of the control share one look. The design outlines minus and fills
      // plus; that reads as two unrelated buttons rather than one stepper.
      {
        disabled: false,
        tone: "card",
        className: "bg-control border-control-line border-2",
      },
      {
        disabled: false,
        tone: "review",
        className: "border-control-line border bg-white",
      },
      {
        disabled: true,
        className:
          "bg-control border-line text-label cursor-not-allowed border",
      },
    ],
    defaultVariants: { disabled: false, tone: "card" },
  },
);

type QuantityStepperProps = VariantProps<typeof stepperRoot> & {
  value: number;
  /** Product name, e.g. "Wyze Cam v4". Names the group and both buttons for screen readers. */
  label: string;
  onIncrement: () => void;
  onDecrement: () => void;
  /** True at qty 0, and on the required Hub which clamps at 1. */
  minusDisabled?: boolean;
  /** True once a capped product is at its ceiling. Only the Hub sets one today. */
  plusDisabled?: boolean;
  className?: string;
};

export function QuantityStepper({
  value,
  label,
  onIncrement,
  onDecrement,
  minusDisabled = false,
  plusDisabled = false,
  tone,
  className,
}: QuantityStepperProps) {
  return (
    <div
      role="group"
      aria-label={`${label} quantity`}
      className={cn(stepperRoot({ tone }), className)}
    >
      <button
        type="button"
        onClick={onDecrement}
        disabled={minusDisabled}
        aria-label={
          minusDisabled && value > 0
            ? `${label} is required and can't be removed`
            : `Decrease quantity of ${label}`
        }
        className={stepperButton({
          disabled: minusDisabled,
          tone,
        })}
      >
        <MinusIcon />
      </button>

      {/* Focus stays on the button after a click, so the count would otherwise change
          silently. aria-live is scoped per stepper — only the one you touched speaks. */}
      <span aria-live="polite" className={stepperValue({ tone })}>
        {value}
      </span>

      <button
        type="button"
        onClick={onIncrement}
        disabled={plusDisabled}
        // Same treatment as the required minus: a dead control with no stated reason
        // reads as broken, so the label carries the why.
        aria-label={
          plusDisabled
            ? `${label} is limited to ${value} per system`
            : `Increase quantity of ${label}`
        }
        className={stepperButton({ disabled: plusDisabled, tone })}
      >
        <PlusIcon />
      </button>
    </div>
  );
}
