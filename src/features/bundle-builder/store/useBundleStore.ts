import { create } from "zustand";
import { plan } from "../constants/catalog";

const STORAGE_KEY = "bundle-builder:v1"; // versioned so a future shape change can be ignored/migrated

//  Computed once at load: ["cam-unlimited", "free-plan"]. selectPlan needs to know every plan option.
const PLAN_VARIANTS_IDS = plan.products.flatMap((p) =>
  p.variants.map((v) => v.id),
);

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
  setOpenStep: (step: number | null) => void;
  selectPlan: (variantId: string) => void;
  saveForLater: () => void;
  hydrate: () => void;
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
  (set, get) => ({
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

    // Direct set, not a toggle. Base UI's Accordion reports the *resulting* open set, so
    // the caller already knows the answer — re-deriving a toggle from it reads backwards.
    setOpenStep(step) {
      set({ openStep: step });
    },

    //  Singele-select: zero every plan, then set the chosen one to 1
    selectPlan(variantId) {
      if (get().quantities[variantId] === 1) return; // already the active plan -> do nothing
      set((s) => {
        const next = { ...s.quantities };
        for (const id of PLAN_VARIANTS_IDS) next[id] = 0;
        next[variantId] = 1;
        return { quantities: next };
      });
    },

    // Persist only "the system" — quantities + variant choices. Uses get() to read current state.
    saveForLater() {
      const { quantities, activeVariant } = get();
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ quantities, activeVariant }),
        );
      } catch {
        // storage unavailable (quota, private mode) — non-fatal, just don't persist
        console.error("Err saving the bundle");
      }
    },

    // Restore from localStorage. Called once from a mount effect (client only)
    hydrate() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return; // nothing saved => keep the seed

        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) return;
        const data = parsed as Partial<
          Pick<BuilderState, "quantities" | "activeVariant">
        >;

        set({
          quantities: data.quantities ?? {},
          activeVariant: data.activeVariant ?? {},
        });
      } catch {
        // corrupt or unavailable - keep the seed, don't crash <3
        console.log("Err restoring the bundle");
      }
    },
  }),
);
