/**
 * Site Configuration — Static Brand Identity
 *
 * Single source of truth for the app's name and description. These are identical
 * across every environment, so they live here as plain constants rather than env
 * vars. Anything genuinely per-environment (base URL, database) belongs in
 * `@/lib/env`.
 */

export interface SiteConfig {
  /** Display name of the app. Used in the document title. */
  name: string;
  /** Default description for metadata. */
  description: string;
}

export const siteConfig: SiteConfig = {
  name: "Bundle Builder",
  description: "Build your personalized Wyze security system bundle.",
};
