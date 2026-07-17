/**
 * Container Components
 *
 * Responsive container components that provide consistent width constraints and spacing
 * across your application. All containers automatically center content and adjust padding
 * for different screen sizes.
 *
 * @example
 * ```tsx
 * // Basic container with size variants
 * <Container size="lg">Standard content width</Container>
 * <Container size="sm">Narrow content for forms</Container>
 * <Container size="full">Full width for dashboards</Container>
 *
 * // Semantic containers with default spacing
 * <PageContainer>Main page content with generous vertical spacing</PageContainer>
 * <SectionContainer>Content sections with moderate spacing</SectionContainer>
 * <NarrowContainer>Optimal reading width for long-form content</NarrowContainer>
 *
 * // Polymorphic rendering
 * <Container as="main">Renders as <main> element</Container>
 * <PageContainer as="section">Renders as <section> element</PageContainer>
 *
 * // Override defaults when needed
 * <PageContainer size="xl">Wider page layout</PageContainer>
 * <SectionContainer size="sm" className="bg-muted">Narrow section</SectionContainer>
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";

type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Container width variant */
  size?: ContainerSize;
  /** Render as a different HTML element */
  as?: React.ElementType;
}

interface SpecializedContainerProps extends Omit<ContainerProps, "size"> {
  /** Override the default size for this container type */
  size?: ContainerSize;
}

/**
 * Container width variants mapping to Tailwind's max-width utilities
 */
const containerSizes: Record<ContainerSize, string> = {
  sm: "max-w-3xl", // 768px - Forms and narrow content
  md: "max-w-5xl", // 1024px - Reading content and articles
  lg: "max-w-7xl", // 1280px - Standard page width
  xl: "max-w-screen-2xl", // 1536px - Wide layouts
  full: "max-w-none", // No constraint - Full width layouts
};

/**
 * Container - Base Layout Container
 *
 * The foundational container component with responsive width constraints and automatic
 * horizontal centering. Provides consistent horizontal padding that scales with viewport size.
 *
 * Use this directly when you need precise control over container sizing, or use one of the
 * specialized containers for common patterns.
 *
 * @example
 * ```tsx
 * <Container size="lg">
 *   <h1>Content with standard width</h1>
 * </Container>
 *
 * <Container size="full" className="px-6">
 *   <div className="grid grid-cols-12 gap-6">
 *     Dashboard layout with full width
 *   </div>
 * </Container>
 * ```
 */
export const Container = React.forwardRef<
  HTMLElement,
  ContainerProps & React.HTMLAttributes<HTMLElement>
>(
  (
    { children, className, size = "lg", as: Component = "div", ...props },
    ref,
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(
          "mx-auto w-full px-4 sm:px-6 lg:px-8",
          containerSizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    );
  },
);
Container.displayName = "Container";

/**
 * PageContainer - Primary Page Content
 *
 * Container with generous vertical spacing designed for main page content areas.
 * Defaults to the standard `lg` size with responsive vertical padding that creates
 * breathing room around page content.
 *
 * @example
 * ```tsx
 * // Homepage or landing pages
 * <PageContainer>
 *   <H1>Welcome to Our Platform</H1>
 *   <Lead>Start building something amazing</Lead>
 * </PageContainer>
 *
 * // Override size for wider layouts
 * <PageContainer size="xl">
 *   <Hero />
 *   <Features />
 * </PageContainer>
 * ```
 */
export const PageContainer = React.forwardRef<
  HTMLElement,
  SpecializedContainerProps & React.HTMLAttributes<HTMLElement>
>(({ children, className, size = "lg", ...props }, ref) => {
  return (
    <Container
      ref={ref}
      size={size}
      className={cn("py-8 lg:py-12", className)}
      {...props}
    >
      {children}
    </Container>
  );
});
PageContainer.displayName = "PageContainer";

/**
 * SectionContainer - Content Sections
 *
 * Container with moderate vertical spacing for breaking pages into distinct sections.
 * Perfect for feature blocks, testimonials, or any content that needs visual separation
 * without excessive spacing.
 *
 * @example
 * ```tsx
 * // Feature sections with backgrounds
 * <SectionContainer className="bg-muted/30">
 *   <H2>Our Features</H2>
 *   <div className="grid grid-cols-3 gap-6">
 *     <FeatureCard />
 *   </div>
 * </SectionContainer>
 *
 * // Multiple sections on one page
 * <>
 *   <SectionContainer>
 *     <H2>About Us</H2>
 *   </SectionContainer>
 *   <SectionContainer className="bg-accent/10">
 *     <H2>Our Team</H2>
 *   </SectionContainer>
 * </>
 * ```
 */
export const SectionContainer = React.forwardRef<
  HTMLElement,
  SpecializedContainerProps & React.HTMLAttributes<HTMLElement>
>(({ children, className, size = "lg", ...props }, ref) => {
  return (
    <Container
      ref={ref}
      size={size}
      className={cn("py-6 lg:py-8", className)}
      {...props}
    >
      {children}
    </Container>
  );
});
SectionContainer.displayName = "SectionContainer";

/**
 * NarrowContainer - Reading Content
 *
 * Container optimized for long-form reading content. The narrower width (max-w-5xl)
 * creates comfortable line lengths that improve readability and reduce eye strain.
 * Ideal for blog posts, articles, and documentation.
 *
 * @example
 * ```tsx
 * // Blog post or article
 * <NarrowContainer>
 *   <article>
 *     <H1>Understanding React Server Components</H1>
 *     <Muted>Published March 15, 2024 • 8 min read</Muted>
 *     <P>Your article content with optimal reading width...</P>
 *   </article>
 * </NarrowContainer>
 *
 * // Documentation pages
 * <NarrowContainer>
 *   <H1>API Reference</H1>
 *   <P>Detailed documentation content...</P>
 * </NarrowContainer>
 * ```
 */
export const NarrowContainer = React.forwardRef<
  HTMLElement,
  SpecializedContainerProps & React.HTMLAttributes<HTMLElement>
>(({ children, className, size = "md", ...props }, ref) => {
  return (
    <Container ref={ref} size={size} className={className} {...props}>
      {children}
    </Container>
  );
});
NarrowContainer.displayName = "NarrowContainer";
