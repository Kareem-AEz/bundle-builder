import { create } from "zustand";

//  State = the 3 canonical fields. Everything else is derived later via selectors.
type BuilderState = {
  quantities: Record<string, number>; // variantId -> qry. Sparse: a missing key means 0.
  activeVariant: Record<string, string>; // productId -> variantId. sparse: missing means variants[0]
  openStep: number | null; // the one open accordion step (1..4); null = all closed.
};

type BuilderActions = {
  setQuantity: (variantId: string, qty: number) => void;
  increment: (varintId: string) => void;
  decrement: (varintId: string) => void;
  setActiveVariant: (productId: string, variantId: string) => void;
  toggleStep: (step: number) => void;
};

// Seed state that reproduces the design on load.
const SEED: BuilderState = {
  quantities: {
    "cam-v4-white": 1,
    "cam-pan-v3-white": 2,
    "sense-motion-sensor": 2,
    "sense-hub": 1,
    "microsd-256gb": 2,
    "cam-unlimited": 1, // the seeded plan
  },
  activeVariant: {}, // empty: both seeded cameras default to white = variants[0]
  openStep: 1,
};

export const useBundleStore = create<BuilderState & BuilderActions>()(
  (set) => ({
    ...SEED,

    // Object spread on quantities = the immutable nested update. Math.max(0,…) clamps the floor.
    setQuantity(variantId, qty) {
      set((s) => ({
        quantities: { ...s.quantities, [variantId]: Math.max(0, qty) },
      }));
    },

    // `?? 0` because the map is sparse — a variant you've never touched has no key yet.
    increment(varintId) {
      set((s) => ({
        quantities: {
          ...s.quantities,
          [varintId]: (s.quantities[varintId] ?? 0) + 1,
        },
      }));
    },

    decrement(varintId) {
      set((s) => ({
        quantities: {
          ...s.quantities,
          [varintId]: Math.max(0, (s.quantities[varintId] ?? 0) - 1),
        },
      }));
    },

    setActiveVariant(productId, variantId) {
      set((s) => ({
        activeVariant: { ...s.activeVariant, [productId]: variantId },
      }));
    },

    // Conditional set based on prev state: clicking the open step closes it.
    toggleStep(step) {
      set((s) => ({ openStep: s.openStep === step ? null : step }));
    },
  }),
);
