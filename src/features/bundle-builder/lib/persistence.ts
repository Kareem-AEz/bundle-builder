/** Versioned so a future shape change can be ignored or migrated rather than crashing. */
export const STORAGE_KEY = "bundle-builder:v1";

/**
 * Set on `<html>` before first paint when a saved bundle exists, cleared once the store
 * has restored it. CSS keys off it to hold the builder invisible for that one frame.
 */
export const RESTORING_ATTR = "data-restoring";

/**
 * Runs synchronously in `<body>`, before any builder markup is parsed, so it lands ahead
 * of first paint.
 *
 * The problem it solves: the server renders the design's seed, because localStorage does
 * not exist there. A returning visitor would therefore see the seed's numbers painted,
 * then watch them jump to their saved bundle a frame later once React mounts and
 * `hydrate()` runs. Reading storage during render instead would make the server and
 * client markup disagree and break hydration outright.
 *
 * So the check happens here, in the gap between the two: early enough that nothing has
 * painted, and outside React, so the rendered markup is byte-identical on both sides.
 * First-time visitors match nothing and pay for a single localStorage read.
 *
 * The seed markup underneath stays in the layout and holds the space, so revealing the
 * restored bundle shifts nothing. `try/catch` because storage throws outright in some
 * privacy modes, and a throw here would block the page.
 */
export const PREPAINT_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)}))document.documentElement.setAttribute(${JSON.stringify(
  RESTORING_ATTR,
)},"1")}catch(e){}`;
