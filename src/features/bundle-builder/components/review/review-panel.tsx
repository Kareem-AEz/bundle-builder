"use client";

import { selectReviewGroups } from "../../selectors";
import { useBundleStore } from "../../store/useBundleStore";
import { FastShippingRow } from "./fast-shipping-row";
import { ReviewSection } from "./review-section";
import { ReviewSummary } from "./review-summary";

/**
 * The live review column. Subscribes to `quantities` alone and rebuilds the groups on
 * each render — no useMemo, because the React Compiler is on (`reactCompiler: true` in
 * next.config) and memoizes this for us. Hand-written memo hooks here would be noise.
 */
export function ReviewPanel() {
  const quantities = useBundleStore((s) => s.quantities);
  const groups = selectReviewGroups(quantities);

  return (
    <aside
      // Step 4's footer links here.
      id="review"
      aria-labelledby="review-heading"
      className="bg-surface rounded-card flex flex-col gap-[5px] pt-4"
    >
      <p className="text-kicker px-4 text-xs tracking-[1.6px] uppercase">
        Review
      </p>

      <div className="flex flex-col gap-2.5 px-5 pt-5 pb-8">
        <div className="flex flex-col gap-[5px]">
          <h2
            id="review-heading"
            className="text-title text-[22px] leading-tight font-semibold"
          >
            Your security system
          </h2>
          <p className="text-title/75 text-sm leading-[1.3] font-medium">
            Review your personalized protection system designed to keep what
            matters most safe.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {groups.length > 0 ? (
            groups.map((group) => (
              <ReviewSection key={group.categoryId} group={group} />
            ))
          ) : (
            // The design never shows this, but every quantity is removable, so it is
            // reachable. Extrapolated from the panel's own voice rather than left blank.
            <p className="border-line text-faint border-t pt-4 text-sm">
              Nothing in your system yet. Add a camera to get started.
            </p>
          )}
          <FastShippingRow />
        </div>

        <ReviewSummary />
      </div>
    </aside>
  );
}
