"use client";

import { useEffect, useLayoutEffect } from "react";
import { RESTORING_ATTR } from "../lib/persistence";
import { useBundleStore } from "../store/bundle-store-provider";
import { BuilderAccordion } from "./accordion/builder-accordion";
import { ReviewPanel } from "./review/review-panel";

/**
 * The feature root: builder left, live review right.
 *
 * Restores the saved bundle in a mount effect rather than during render, on purpose. The
 * server renders the design's seed; localStorage does not exist there, and reading it
 * during render would make the two markups disagree and break hydration (ADR-0006).
 *
 * That leaves one frame where a returning visitor's screen shows the seed instead of
 * their bundle. The pre-paint script in the layout covers it by hiding this subtree
 * before anything paints; clearing the attribute here is what reveals the restored
 * state. Order matters: `hydrate()` first, then reveal, or the frame we were hiding
 * paints anyway.
 */
export function BundleBuilder() {
  const hydrate = useBundleStore((s) => s.hydrate);
  const hydrated = useBundleStore((s) => s.hydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Two effects, not one. `hydrate()` only *schedules* a re-render, so removing the
  // attribute on the next line would reveal the builder while the DOM still held seed
  // values — the exact flash this exists to prevent, moved a few milliseconds later.
  //
  // Keying on `hydrated` means this runs after the restored values are committed, and
  // `useLayoutEffect` means it runs before the browser paints them. The first render has
  // `hydrated: false` and does nothing.
  useLayoutEffect(() => {
    if (hydrated) document.documentElement.removeAttribute(RESTORING_ATTR);
  }, [hydrated]);

  return (
    <div data-bundle-root>
      {/* Mobile-only orientation heading (mobile frame). Tablet and desktop open with
          step 1 already visible, so they don't need it. */}
      <h1 className="text-ink pb-6 text-center text-3xl font-bold md:hidden">
        Let&rsquo;s get started!
      </h1>

      {/* Stacked on mobile and tablet; the fixed two-column layout is desktop-only, where
          768 + 399 + gap first fits. */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <div className="w-full xl:w-[768px] xl:shrink-0">
          <BuilderAccordion />
        </div>
        <div className="w-full xl:w-[399px] xl:shrink-0">
          <ReviewPanel />
        </div>
      </div>
    </div>
  );
}
