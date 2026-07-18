"use client";

import Image from "next/image";
import { useState } from "react";
import { formatPrice } from "../../lib/money";
import { PATHS } from "../../lib/paths";
import {
  selectFinancingMonthly,
  selectHardwarePreDiscountTotal,
  selectHardwareSavings,
  selectHardwareSubtotal,
  selectMonthlySubtotal,
} from "../../selectors";
import { useBundleStore } from "../../store/useBundleStore";

const SAVE_LABEL = {
  idle: "Save my system for later",
  saved: "Saved. Come back anytime",
  failed: "Couldn't save, storage is unavailable",
} as const;

/**
 * The closing block: guarantee rosette, financing chip, total, savings, checkout.
 *
 * Reads `quantities` once and derives every figure through selectors — nothing here is
 * typed by hand. Total, strike, savings and the financing chip all read off *hardware*,
 * so they reconcile with each other; the recurring plan gets its own line rather than
 * being folded into a number labelled as a total (ADR-0010 amendment).
 */
export function ReviewSummary() {
  const quantities = useBundleStore((s) => s.quantities);
  const activeVariant = useBundleStore((s) => s.activeVariant);
  const saveForLater = useBundleStore((s) => s.saveForLater);
  const savedSignature = useBundleStore((s) => s.savedSignature);

  // Only the failure needs component state. Success is derived below from what is
  // actually persisted, so it survives a reload — a restored bundle reads as saved
  // rather than inviting a no-op click.
  const [failed, setFailed] = useState(false);

  // Whether the save happened *in this session*. A bundle restored from a previous visit
  // is equally saved, but the confirmation copy is not interchangeable: "come back
  // anytime" is only true in the moment after clicking. On a return visit they already
  // came back, and saying it then reads as the app not knowing what just happened.
  const [justSaved, setJustSaved] = useState(false);

  // The comparison lives against the persisted string, not a reference captured this
  // session. Key order makes JSON.stringify strict: removing a variant and re-adding it
  // can produce a different string for identical state, which shows the save link when it
  // wasn't needed. That is the safe direction to be wrong in.
  const dirty =
    JSON.stringify({ quantities, activeVariant }) !== savedSignature;

  const saveState = failed ? "failed" : dirty ? "idle" : "saved";

  // Every figure below reads off the same base: hardware. The plan is recurring, so it
  // gets its own line rather than being folded into a number labelled as a total.
  const total = selectHardwareSubtotal(quantities);
  const preDiscount = selectHardwarePreDiscountTotal(quantities);
  const savings = selectHardwareSavings(quantities);
  const monthly = selectMonthlySubtotal(quantities);
  const financing = selectFinancingMonthly(quantities);

  return (
    <div className="flex flex-col gap-2 pt-4">
      <div className="flex items-end justify-between gap-4">
        <Image
          src={PATHS.badge("satisfaction-guarantee.png")}
          alt="100% Wyze satisfaction guarantee: 30-day hassle-free returns"
          width={78}
          height={78}
          className="shrink-0"
        />

        <div className="flex flex-col items-end gap-2">
          <p className="rounded-badge bg-brand px-2 py-[5px] text-xs font-semibold text-white">
            as low as {formatPrice(financing)}/mo
          </p>
          <p className="flex items-baseline gap-2">
            {preDiscount > total && (
              <span className="text-faint text-lg line-through">
                <span className="visually-hidden">Original total </span>
                {formatPrice(preDiscount)}
              </span>
            )}
            <span className="text-brand text-[28px] leading-none font-bold">
              <span className="visually-hidden">Total </span>
              {formatPrice(total)}
            </span>
          </p>

          {/* The plan is recurring, so it sits beside the total instead of inside it.
              Hidden at $0/mo: the free plan would render "plus $0.00/mo", which is noise. */}
          {monthly > 0 && (
            <p className="text-ink-muted text-sm font-medium">
              plus {formatPrice(monthly)}/mo
            </p>
          )}
        </div>
      </div>

      {/* 12px, not the 14px the rest of the block uses: the sentence is ~54 characters and
          the panel's content column is 350px, so at 14px it wraps to two lines and the
          summary loses its rhythm. Deliberately not `whitespace-nowrap` — a four-figure
          saving would then overflow the panel instead of wrapping. */}
      {savings > 0 && (
        <p className="text-success pt-2.5 text-center text-xs font-semibold">
          Congrats! You&rsquo;re saving {formatPrice(savings)} on your security
          bundle!
        </p>
      )}

      <button
        type="button"
        className="rounded-control bg-brand focus-visible:ring-brand w-full px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Checkout
      </button>

      {/* One slot, three states: the link when there is something to save, a confirmation
          for a few seconds after saving, and nothing once that has passed — a bundle
          restored from a previous visit is already saved, so there is nothing to say and
          nothing to click. The slot keeps its height in all three so the block never
          jumps, and `aria-live` speaks the change for anyone whose focus was on the
          button that just went away. */}
      <p
        aria-live="polite"
        className="flex min-h-5 items-center justify-center text-sm italic"
      >
        {saveState !== "saved" ? (
          <button
            type="button"
            onClick={() => {
              const ok = saveForLater();
              setFailed(!ok);
              setJustSaved(ok);
            }}
            className="text-kicker focus-visible:ring-brand rounded-xs underline focus-visible:ring-2 focus-visible:outline-none"
          >
            {SAVE_LABEL[saveState]}
          </button>
        ) : (
          justSaved && (
            <span className="text-success font-medium">{SAVE_LABEL.saved}</span>
          )
        )}
      </p>
    </div>
  );
}
