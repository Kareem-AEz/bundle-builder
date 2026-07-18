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
      kind: { minus: "", plus: "" },
      disabled: { true: "", false: "" },
      tone: { card: "", review: "" },
    },
    compoundVariants: [
      // Enabled: the card's minus is an outlined white box, its plus a filled one. The
      // review's steppers sit on the lavender panel, so both read as plain white.
      {
        kind: "minus",
        disabled: false,
        tone: "card",
        className: "border-control-line border-2 bg-white",
      },
      { kind: "plus", disabled: false, tone: "card", className: "bg-control" },
      {
        disabled: false,
        tone: "review",
        className: "border-control-line border bg-white",
      },
      // One disabled look for both kinds: the greyed box the design gives the required
      // Hub row. (Figma's #F1F1F2 there vs. #F0F4F7 here is a sub-1% delta, not a token.)
      {
        disabled: true,
        className: "bg-control border-line text-faint border",
      },
    ],
    defaultVariants: { kind: "minus", disabled: false, tone: "card" },
  },
);

type QuantityStepperProps = VariantProps<typeof stepperRoot> & {
  value: number;
  /** Product name, e.g. "Wyze Cam v4". Names the group and both buttons for screen readers. */
  label: string;
  onIncrement: () => void;
  onDecrement: () => void;
  /** True at qty 0, and on the required Hub which clamps at 1. Only minus ever locks —
   *  there is no ceiling on any product, the Hub included. */
  minusDisabled?: boolean;
  className?: string;
};

export function QuantityStepper({
  value,
  label,
  onIncrement,
  onDecrement,
  minusDisabled = false,
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
        aria-label={`Decrease quantity of ${label}`}
        className={stepperButton({
          kind: "minus",
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
        aria-label={`Increase quantity of ${label}`}
        className={stepperButton({ kind: "plus", disabled: false, tone })}
      >
        <PlusIcon />
      </button>
    </div>
  );
}
