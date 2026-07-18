import { afterEach, describe, expect, it } from "vitest";
import { cameras, plan, sensors } from "../constants/catalog";
import { useBundleStore } from "../store/useBundleStore";
import type { Quantities } from "../types";
import {
  selectBadge,
  selectFinancingMonthly,
  selectHardwarePreDiscountTotal,
  selectHardwareSavings,
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

// The summary's headline total, its strike and its savings all read off hardware. These
// lock the three to a single base — mixing them is the bug ADR-0011 records.
describe("the summary's figures share one base", () => {
  it("hardware pre-discount is $247.80 from the seed", () => {
    expect(selectHardwarePreDiscountTotal(SEED)).toBe(24780);
  });

  it("hardware savings is pre-discount minus subtotal, both hardware", () => {
    expect(selectHardwareSavings(SEED)).toBe(4792);
    expect(selectHardwareSavings(SEED)).toBe(
      selectHardwarePreDiscountTotal(SEED) - selectHardwareSubtotal(SEED),
    );
  });

  it("excludes the plan from every hardware figure", () => {
    const hardware: Quantities = { "cam-v4-white": 1 };
    const withPlan: Quantities = { ...hardware, "cam-unlimited": 1 };
    expect(selectHardwareSubtotal(withPlan)).toBe(
      selectHardwareSubtotal(hardware),
    );
    expect(selectHardwarePreDiscountTotal(withPlan)).toBe(
      selectHardwarePreDiscountTotal(hardware),
    );
    expect(selectHardwareSavings(withPlan)).toBe(
      selectHardwareSavings(hardware),
    );
  });

  // Whole-cart and hardware-only differ by exactly the plan. If this ever holds by
  // accident the split has collapsed and nobody would notice from the UI.
  it("the hardware split accounts for the whole cart", () => {
    expect(selectHardwareSubtotal(SEED) + selectMonthlySubtotal(SEED)).toBe(
      selectSubtotal(SEED),
    );
    expect(selectHardwareSubtotal(SEED)).not.toBe(selectSubtotal(SEED));
  });
});

describe("selectFinancingMonthly", () => {
  it("spreads the seed's hardware over 12 months: $16.66", () => {
    expect(selectFinancingMonthly(SEED)).toBe(1666);
  });

  it("excludes the plan, which already bills monthly", () => {
    const withPlan: Quantities = { "cam-v4-white": 1, "cam-unlimited": 1 };
    const withoutPlan: Quantities = { "cam-v4-white": 1 };
    expect(selectFinancingMonthly(withPlan)).toBe(
      selectFinancingMonthly(withoutPlan),
    );
  });

  // 19988 / 12 = 1665.67. Math.floor would render $16.65 and under-state the payment;
  // this is the assertion that fails if the rounding mode ever changes.
  it("rounds to the nearest cent, never down", () => {
    expect(selectHardwareSubtotal(SEED)).toBe(19988);
    expect(selectFinancingMonthly(SEED)).toBeGreaterThan(19988 / 12);
  });

  it("an empty cart finances nothing", () => {
    expect(selectFinancingMonthly({})).toBe(0);
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

// The row thumbnail is colour-specific: picking Black must change the picture, not just
// the label. Asserted against the catalog rather than a filename so a renamed asset
// doesn't fail the test for the wrong reason.
describe("selectReviewGroups thumbnails", () => {
  it("uses the chosen variant's swatch when a product has colours", () => {
    const camV4 = cameras.products.find((p) => p.id === "cam-v4")!;
    const black = camV4.variants.find((v) => v.id === "cam-v4-black")!;
    const [group] = selectReviewGroups({ "cam-v4-black": 1 });
    expect(group.lines[0].image).toBe(black.swatch);
    expect(group.lines[0].image).not.toBe(camV4.image);
  });

  // Single-variant products carry swatch: "" — the falsy case `??` would let through,
  // leaving the row with an empty src.
  it("falls back to the product photo when the variant has no swatch", () => {
    const hub = sensors.products.find((p) => p.id === "sense-hub")!;
    const [group] = selectReviewGroups({ "sense-hub": 1 });
    expect(group.lines[0].image).toBe(hub.image);
    expect(group.lines[0].image).toBeTruthy();
  });

  // The plan's thumbnail is its brand mark, not a product shot, and it comes through the
  // same catalog field as everything else — no branch in the row knows what a plan is.
  it("gives the paid plan its brand mark and the free plan nothing", () => {
    const [paid] = selectReviewGroups({ "cam-unlimited": 1 });
    expect(paid.lines[0].image).toContain("cam-unlimited.svg");

    const [free] = selectReviewGroups({ "free-plan": 1 });
    expect(free.lines[0].image).toBeUndefined();
  });
});

// A $0 product with a `compareAt` mints savings on every unit added. Without a ceiling,
// 30 Hubs read as $897 saved on hardware nobody was ever going to buy. The cap is the fix,
// and it lives in the store so a hand-edited payload can't route around it.
describe("the Hub's quantity ceiling", () => {
  const restore = useBundleStore.getState().quantities;
  afterEach(() => useBundleStore.setState({ quantities: restore }));

  it("refuses to increment past the max", () => {
    const { increment } = useBundleStore.getState();
    for (let i = 0; i < 5; i++) increment("sense-hub");
    expect(useBundleStore.getState().quantities["sense-hub"]).toBe(1);
  });

  it("clamps a direct setQuantity", () => {
    useBundleStore.getState().setQuantity("sense-hub", 30);
    expect(useBundleStore.getState().quantities["sense-hub"]).toBe(1);
  });

  // `hydrate` runs the same clamp over a restored payload, but it needs localStorage and
  // this suite is node-env, so what's asserted here is the clamp itself.
  it("stops a capped product from inflating savings", () => {
    // What an unclamped 30 would produce: 30 x the Hub's $29.92 compareAt against a $0
    // price is pure fictional savings.
    expect(selectHardwareSavings({ "sense-hub": 30 })).toBe(2992 * 30);
    // What the store actually accepts. Emptied first so the figure is the Hub's alone,
    // not the seed cart's cameras as well.
    useBundleStore.setState({ quantities: {} });
    useBundleStore.getState().setQuantity("sense-hub", 30);
    expect(selectHardwareSavings(useBundleStore.getState().quantities)).toBe(
      2992,
    );
  });

  it("leaves uncapped products alone", () => {
    const { increment } = useBundleStore.getState();
    for (let i = 0; i < 5; i++) increment("cam-v4-black");
    expect(useBundleStore.getState().quantities["cam-v4-black"]).toBe(5);
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
