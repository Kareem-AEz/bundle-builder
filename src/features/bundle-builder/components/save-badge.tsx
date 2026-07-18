import { cn } from "@/lib/utils";

/**
 * The "Save 22%" pill overlaid on a product card image. Purely presentational — the
 * percent comes from `selectBadge`, and the card owns the absolute positioning so the
 * badge stays reusable if it ever appears somewhere flowed.
 */
export function SaveBadge({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-card bg-brand px-1.5 py-0.5 text-xs font-semibold text-white",
        className,
      )}
    >
      Save {percent}%
    </span>
  );
}
