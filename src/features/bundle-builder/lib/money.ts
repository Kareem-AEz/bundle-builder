/** Money is always integer cents. 2798 = $27.98. Float dollars are banned. */
export type Cents = number;

// One formatter, allocated once at module load, reused every call.
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/**
 * The ONLY place cents touch a fraction. Divide by 100 at the display
 * boundary — never in arithmetic. All math stays in whole cents upstream.
 */
export function formatPrice(cents: Cents): string {
  return usd.format(cents / 100);
}
