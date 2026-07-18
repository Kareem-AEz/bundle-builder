import type { ReviewGroup } from "../../selectors";
import { ReviewRow } from "./review-row";

/**
 * One category block in the review panel: an uppercase label over its rows, separated
 * from the block above by a hairline rule.
 *
 * Owns the no-stepper rule rather than taking it as a prop. The plan has no stepper
 * because it is single-select, a fact about the *category*, so deriving it here keeps
 * the panel from having to know and keeps the flag off `ReviewLine`.
 */
export function ReviewSection({ group }: { group: ReviewGroup }) {
  const showStepper = group.categoryId !== "plan";

  return (
    <section className="border-line flex flex-col gap-2 border-t pt-4">
      <h3
        // `id` links the list to its heading, so a screen reader announces "Cameras,
        // list, 2 items" instead of an unlabelled list.
        id={`review-${group.categoryId}`}
        className="text-faint text-xs tracking-[0.36px] uppercase"
      >
        {group.reviewLabel}
      </h3>

      <ul
        aria-labelledby={`review-${group.categoryId}`}
        className="flex flex-col gap-3"
      >
        {group.lines.map((line) => (
          <ReviewRow
            key={line.variantId}
            line={line}
            showStepper={showStepper}
          />
        ))}
      </ul>
    </section>
  );
}
