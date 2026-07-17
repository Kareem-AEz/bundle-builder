/**
 * Internal Route Paths
 *
 * The single source of truth for every internal URL the app links to or
 * redirects to. Each route is a function so the call style is uniform
 * (`PATHS.HOME()`) and dynamic routes can take typed params — a typo'd param is
 * a type error, not a broken link in production.
 *
 * Builders return a root-relative path (leading slash, no origin). For an
 * absolute URL, compose: `` `${baseUrl}${PATHS.HOME()}` ``.
 */

export const PATHS = {
  /** Home / landing page. */
  HOME: () => "/",
};
