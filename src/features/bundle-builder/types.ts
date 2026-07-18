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
  /**
   * Ceiling on quantity, per product. The Hub sets 1: one hub runs the whole system, so a
   * second is not a purchase anyone makes. Left absent everywhere else — most products
   * have no natural limit.
   *
   * This is the other half of `required`, and it exists as data for the same reason: the
   * rule belongs to the product, not to a component that knows the Hub by name. Without
   * it a free product with a `compareAt` mints unbounded savings — 30 Hubs read as $897
   * saved on hardware that was never going to be bought.
   */
  max?: number;
  variants: Variant[]; // always ≥1 (option A); selector renders only when length > 1
};

export type Category = {
  id: CategoryId;
  step: number; // accordion order, 1..4
  stepTitle: string; // "Choose your cameras"
  singleSelect?: boolean; // products are mutually exclusive (the plan) -- radio, not steppers
  reviewLabel: string; // "Cameras" — review-panel subheading
  reviewOrder: number; // review order differs from step order (Plan is step 2 but shows LAST)
  products: Product[];
};

export type Catalog = Category[];
