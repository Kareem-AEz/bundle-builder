/**
 * Separator Components
 *
 * Visually or semantically separate content sections. Supports both plain dividers
 * and text-labeled separators with horizontal or vertical orientation.
 *
 * @example
 * ```tsx
 * // Plain horizontal separator
 * <Separator />
 *
 * // Vertical separator for inline content
 * <div className="flex items-center gap-4">
 *   <span>Home</span>
 *   <Separator orientation="vertical" />
 *   <span>About</span>
 * </div>
 *
 * // Text separator (commonly used in auth forms)
 * <TextSeparator>OR</TextSeparator>
 * <TextSeparator>Continue with</TextSeparator>
 *
 * // Custom styling
 * <Separator className="my-8" />
 * <TextSeparator className="text-muted-foreground">OR</TextSeparator>
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface SeparatorProps {
  /** Visual or semantic separator */
  decorative?: boolean;
  /** Horizontal or vertical orientation */
  orientation?: "horizontal" | "vertical";
  className?: string;
}

interface TextSeparatorProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Separator - Visual Divider
 *
 * A simple divider for separating content sections. Uses semantic HTML with proper
 * ARIA attributes for accessibility. Defaults to horizontal orientation with
 * decorative role.
 *
 * For vertical separators, ensure the parent container uses flexbox with
 * appropriate height constraints.
 *
 * @example
 * ```tsx
 * // Section divider
 * <div>
 *   <h2>Section 1</h2>
 *   <p>Content here...</p>
 * </div>
 * <Separator className="my-8" />
 * <div>
 *   <h2>Section 2</h2>
 *   <p>More content...</p>
 * </div>
 *
 * // Vertical divider in navigation
 * <nav className="flex items-center gap-4">
 *   <a href="/home">Home</a>
 *   <Separator orientation="vertical" className="h-4" />
 *   <a href="/about">About</a>
 *   <Separator orientation="vertical" className="h-4" />
 *   <a href="/contact">Contact</a>
 * </nav>
 * ```
 */
export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  (
    { decorative = true, orientation = "horizontal", className, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        role={decorative ? "none" : "separator"}
        aria-orientation={decorative ? undefined : orientation}
        className={cn(
          "bg-border shrink-0",
          orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
          className,
        )}
        {...props}
      />
    );
  },
);
Separator.displayName = "Separator";
