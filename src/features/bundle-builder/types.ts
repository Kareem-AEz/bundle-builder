import { Cents } from "./lib/money";

/** The four accordion steps. Union (not string) so selectors get autocomplete + exhaustiveness. */
export type CategoryId = "cameras" | "plan" | "sensors" | "extra-protection";

/** Sparse map: variantId -> quantity. A missing key means 0. */
export type Quantities = Record<string, number>;

/**
 * A purchasable color option. Its `id` is the stable quantity key — Red and Blue
 * of the same product are tracked separately, so each needs its own id.
 */
export type Variant = {
  id: string; // stable quantity key, e.g. "cam-v4-white" — Red and Blue tracked separately
  label: string; // "White", "Grey", "Black" — empty string for single-variant products
  swatch: string; // 48px selector thumbnail image (a small product-in-color photo, not a color dot)
};

export type Product = {
  id: string;
  title: string; // "Wyze Cam v4"
  tagline: string; // "The clearest Wyze Cam ever made." — short marketing line
  image?: string; // hardware photo + review thumbnail. Absent for plans (services have no product shot).
  price: Cents; // active price
  compareAt?: Cents; // presence => strikethrough + derived "Save X%" badge
  unit?: "month"; // plan is priced /mo; absent => one-time
  required?: boolean; // Hub: min quantity 1, stepper minus disabled
  variants: Variant[]; // always ≥1 (option A); selector renders only when length > 1
};

export type Category = {
  id: CategoryId;
  step: number; // accordion order, 1..4
  stepTitle: string; // "Choose your cameras"
  reviewLabel: string; // "Cameras" — review-panel subheading
  reviewOrder: number; // review order differs from step order (Plan is step 2 but shows LAST)
  products: Product[];
};

export type Catalog = Category[];
