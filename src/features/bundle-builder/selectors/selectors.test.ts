import { describe, expect, it } from "vitest";
import { cameras, plan } from "../constants/catalog";
import { useBundleStore } from "../store/useBundleStore";
import type { Quantities } from "../types";
import {
  selectBadge,
  selectHardwareSubtotal,
  selectMonthlySubtotal,
  selectPreDiscountTotal,
  selectReviewGroups,
  selectSavings,
  selectStepCount,
  selectSubtotal,
} from "./index";

// The design-seeded boot state, read straight from the store. Asserting totals against
// this (not a hand-copied map) means any catalog price change OR seed change fails loudly.
const SEED = useBundleStore.getState().quantities;

describe("totals reproduce the design from the seed", () => {
  it("subtotal is $209.87", () => {
    expect(selectSubtotal(SEED)).toBe(20987);
  });

  it("pre-discount total is $260.79", () => {
    expect(selectPreDiscountTotal(SEED)).toBe(26079);
  });

  it("savings is $50.92 and equals pre-discount minus subtotal", () => {
    expect(selectSavings(SEED)).toBe(5092);
    expect(selectSavings(SEED)).toBe(
      selectPreDiscountTotal(SEED) - selectSubtotal(SEED),
    );
  });
});

describe("totals edge cases", () => {
  it("an empty cart is zero across the board", () => {
    expect(selectSubtotal({})).toBe(0);
    expect(selectPreDiscountTotal({})).toBe(0);
    expect(selectSavings({})).toBe(0);
  });

  it("skips unknown ids and non-positive quantities", () => {
    const q: Quantities = {
      "not-a-real-id": 3,
      "cam-v4-white": 0,
      "cam-v4-grey": -2,
    };
    expect(selectSubtotal(q)).toBe(0);
    expect(selectPreDiscountTotal(q)).toBe(0);
  });

  it("a product with no compareAt adds nothing to savings", () => {
    const q: Quantities = { "microsd-256gb": 2 }; // 2 x $20.98, never on sale
    expect(selectSubtotal(q)).toBe(4196);
    expect(selectPreDiscountTotal(q)).toBe(4196);
    expect(selectSavings(q)).toBe(0);
  });

  it("the free Hub still contributes its compareAt to savings", () => {
    const q: Quantities = { "sense-hub": 1 }; // price 0, compareAt 2992
    expect(selectSubtotal(q)).toBe(0);
    expect(selectPreDiscountTotal(q)).toBe(2992);
    expect(selectSavings(q)).toBe(2992);
  });
});

describe("one-time and recurring money stay separated", () => {
  it("splits the seed into $199.88 hardware and $9.99/mo", () => {
    expect(selectHardwareSubtotal(SEED)).toBe(19988);
    expect(selectMonthlySubtotal(SEED)).toBe(999);
  });

  // The whole point of the split: a figure you'd finance or charge once must not have a
  // subscription folded into it. If someone later drops the `unit` guard, this fails.
  it("the two halves reconstruct the combined subtotal exactly", () => {
    expect(selectHardwareSubtotal(SEED) + selectMonthlySubtotal(SEED)).toBe(
      selectSubtotal(SEED),
    );
  });

  it("a cart of nothing but the plan is all recurring, no hardware", () => {
    const q: Quantities = { "cam-unlimited": 1 };
    expect(selectHardwareSubtotal(q)).toBe(0);
    expect(selectMonthlySubtotal(q)).toBe(999);
  });

  it("a cart of nothing but hardware has no recurring charge", () => {
    const q: Quantities = { "microsd-256gb": 2 };
    expect(selectHardwareSubtotal(q)).toBe(4196);
    expect(selectMonthlySubtotal(q)).toBe(0);
  });

  it("the $0 Free plan is still recurring, not hardware", () => {
    const q: Quantities = { "free-plan": 1 };
    expect(selectHardwareSubtotal(q)).toBe(0);
    expect(selectMonthlySubtotal(q)).toBe(0);
  });

  it("both skip unknown ids and non-positive quantities", () => {
    const q: Quantities = {
      "ghost-id": 3,
      "cam-v4-white": 0,
      "cam-unlimited": -1,
    };
    expect(selectHardwareSubtotal(q)).toBe(0);
    expect(selectMonthlySubtotal(q)).toBe(0);
  });
});

describe("selectBadge", () => {
  it("price 0 reads FREE even with a compareAt (the Hub)", () => {
    expect(selectBadge({ price: 0, compareAt: 2992 })).toEqual({
      kind: "free",
    });
  });

  it("floors the discount so Pan v3 is 12%, not a rounded 13%", () => {
    expect(selectBadge({ price: 3498, compareAt: 3998 })).toEqual({
      kind: "save",
      percent: 12,
    });
  });

  it("Cam v4 saves 22%", () => {
    expect(selectBadge({ price: 2798, compareAt: 3598 })).toEqual({
      kind: "save",
      percent: 22,
    });
  });

  it("no compareAt means no pill", () => {
    expect(selectBadge({ price: 8998 })).toEqual({ kind: "none" });
  });

  it("a compareAt not above price is not a discount", () => {
    expect(selectBadge({ price: 1000, compareAt: 1000 })).toEqual({
      kind: "none",
    });
    expect(selectBadge({ price: 1000, compareAt: 800 })).toEqual({
      kind: "none",
    });
  });
});

describe("selectStepCount", () => {
  it("counts distinct products, not variants", () => {
    const q: Quantities = { "cam-v4-white": 1, "cam-v4-grey": 2 };
    expect(selectStepCount(q, cameras)).toBe(1);
  });

  it("counts each product that has any selected variant", () => {
    const q: Quantities = { "cam-v4-white": 1, "cam-pan-v3-white": 2 };
    expect(selectStepCount(q, cameras)).toBe(2);
  });

  it("zero and missing variants do not count", () => {
    expect(selectStepCount({ "cam-v4-white": 0 }, cameras)).toBe(0);
    expect(selectStepCount({}, cameras)).toBe(0);
  });

  it("the single-select plan always reads one selected", () => {
    expect(selectStepCount(SEED, plan)).toBe(1);
  });
});

describe("selectReviewGroups from the seed", () => {
  const groups = selectReviewGroups(SEED);

  it("orders sections by reviewOrder, so Plan shows last", () => {
    expect(groups.map((g) => g.reviewLabel)).toEqual([
      "Cameras",
      "Sensors",
      "Accessories",
      "Plan",
    ]);
  });

  it("emits one line per variant with qty > 0", () => {
    const cams = groups.find((g) => g.categoryId === "cameras");
    expect(cams?.lines.map((l) => l.variantId)).toEqual([
      "cam-v4-white",
      "cam-pan-v3-white",
    ]);
  });

  it("carries a complete view model on a line (Pan v3)", () => {
    const cams = groups.find((g) => g.categoryId === "cameras");
    const pan = cams?.lines.find((l) => l.variantId === "cam-pan-v3-white");
    expect(pan).toMatchObject({
      productId: "cam-pan-v3",
      title: "Wyze Cam Pan v3",
      variantLabel: "White",
      unitPrice: 3498,
      compareAt: 3998,
      qty: 2,
      lineSubtotal: 6996,
      lineCompareAt: 7996,
    });
  });

  // The bug this field exists to prevent: a per-unit strike stacked over a line total.
  // At qty 1 the two are indistinguishable, so Pan v3 at qty 2 is the case that matters.
  it("the struck price is a line total, so it stays above the price under it", () => {
    const cams = groups.find((g) => g.categoryId === "cameras");
    const pan = cams?.lines.find((l) => l.variantId === "cam-pan-v3-white");
    expect(pan?.lineCompareAt).toBe(pan!.compareAt! * pan!.qty);
    expect(pan?.lineCompareAt).toBeGreaterThan(pan!.lineSubtotal);
  });

  it("every discounted line's strike is compareAt x qty", () => {
    const discounted = groups
      .flatMap((g) => g.lines)
      .filter((l) => l.compareAt !== undefined);
    expect(discounted.length).toBeGreaterThan(0);
    for (const line of discounted) {
      expect(line.lineCompareAt).toBe(line.compareAt! * line.qty);
    }
  });

  it("marks the free Hub required with a zero subtotal and its compareAt intact", () => {
    const sensors = groups.find((g) => g.categoryId === "sensors");
    const hub = sensors?.lines.find((l) => l.variantId === "sense-hub");
    expect(hub).toMatchObject({
      required: true,
      unitPrice: 0,
      lineSubtotal: 0,
      compareAt: 2992,
      lineCompareAt: 2992,
    });
  });

  it("a line with no compareAt carries no strike at all", () => {
    const acc = groups.find((g) => g.categoryId === "extra-protection");
    const sd = acc?.lines.find((l) => l.variantId === "microsd-256gb");
    expect(sd?.compareAt).toBeUndefined();
    expect(sd?.lineCompareAt).toBeUndefined();
  });
});

describe("selectReviewGroups edge cases", () => {
  it("drops sections that have no selected lines", () => {
    const q: Quantities = { "microsd-256gb": 1 };
    expect(selectReviewGroups(q).map((g) => g.reviewLabel)).toEqual([
      "Accessories",
    ]);
  });

  it("an empty cart yields no sections", () => {
    expect(selectReviewGroups({})).toEqual([]);
  });

  it("unknown ids never surface as lines", () => {
    expect(selectReviewGroups({ "ghost-id": 5 })).toEqual([]);
  });
});
