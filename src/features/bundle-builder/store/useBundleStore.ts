import { create } from "zustand";
import { CATALOG, plan } from "../constants/catalog";
// Shared with the layout's pre-paint script, which checks the same slot. Two copies of
// the key could drift and leave the script looking in the wrong place.
import { STORAGE_KEY } from "../lib/persistence";

//  Computed once at load: ["cam-unlimited", "free-plan"]. selectPlan needs to know every plan option.
const PLAN_VARIANTS_IDS = plan.products.flatMap((p) =>
  p.variants.map((v) => v.id),
);

// variantId -> ceiling, for the few products that declare one. Built once at load, like
// PLAN_VARIANTS_IDS above. Products with no `max` are simply absent, so a lookup miss
// means "no limit" and no sentinel value is needed.
const MAX_BY_VARIANT = new Map<string, number>(
  CATALOG.flatMap((category) =>
    category.products.flatMap((product) =>
      product.max === undefined
        ? []
        : product.variants.map((v) => [v.id, product.max!] as const),
    ),
  ),
);

/**
 * Floor at 0, ceiling from the catalog. Every write to `quantities` goes through this,
 * including the one in `hydrate` — the UI disables the plus button at the ceiling, but a
 * hand-edited localStorage payload never touched that button. Enforcing it here is the
 * same reason you validate on the server and not only in the form.
 */
function clampQty(variantId: string, qty: number): number {
  return Math.min(Math.max(0, qty), MAX_BY_VARIANT.get(variantId) ?? Infinity);
}

//  State = the 3 canonical fields. Everything else is derived later via selectors.
type BuilderState = {
  quantities: Record<string, number>; // variantId -> qry. Sparse: a missing key means 0.
  activeVariant: Record<string, string>; // productId -> variantId. sparse: missing means variants[0]
  openStep: number | null; // the one open accordion step (1..4); null = all closed.
  // Both start false/null on the server and stay that way through the client's first
  // render, so the two markups agree. The mount effect is what changes them.
  hydrated: boolean;
  /** JSON of the last persisted {quantities, activeVariant}. Survives reload, so the
   *  save link knows it's already saved after a restore — component state couldn't. */
  savedSignature: string | null;
};

type BuilderActions = {
  setQuantity: (variantId: string, qty: number) => void;
  increment: (varintId: string) => void;
  decrement: (varintId: string) => void;
  setActiveVariant: (productId: string, variantId: string) => void;
  toggleStep: (step: number) => void;
  setOpenStep: (step: number | null) => void;
  selectPlan: (variantId: string) => void;
  saveForLater: () => boolean;
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
  hydrated: false,
  savedSignature: null,
};

export const useBundleStore = create<BuilderState & BuilderActions>()(
  (set, get) => ({
    ...SEED,

    // Object spread on quantities = the immutable nested update. clampQty owns both ends.
    setQuantity(variantId, qty) {
      set((s) => ({
        quantities: { ...s.quantities, [variantId]: clampQty(variantId, qty) },
      }));
    },

    // `?? 0` because the map is sparse — a variant you've never touched has no key yet.
    increment(variantId) {
      set((s) => ({
        quantities: {
          ...s.quantities,
          [variantId]: clampQty(variantId, (s.quantities[variantId] ?? 0) + 1),
        },
      }));
    },

    // No clamp call needed: this only ever moves down, and Math.max holds the floor.
    decrement(variantId) {
      set((s) => ({
        quantities: {
          ...s.quantities,
          [variantId]: Math.max(0, (s.quantities[variantId] ?? 0) - 1),
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
      const payload = JSON.stringify({ quantities, activeVariant });
      try {
        localStorage.setItem(STORAGE_KEY, payload);
        // The same string that was written, kept as the signature: the save link compares
        // against it to know whether anything has changed since.
        set({ savedSignature: payload });
        return true;
      } catch {
        return false;
      }
    },
    // Restore from localStorage. Called once from a mount effect (client only)
    hydrate() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) return;
        const data = parsed as Partial<
          Pick<BuilderState, "quantities" | "activeVariant">
        >;

        // Clamped on the way in. This is the case the disabled plus button cannot
        // defend: a hand-edited payload never touched it. A tampered save therefore
        // lands as legal state that disagrees with `savedSignature`, so the link
        // correctly offers to save again — the state really is no longer the file.
        const restored = data.quantities ?? {};
        set({
          quantities: Object.fromEntries(
            Object.entries(restored).map(([id, qty]) => [id, clampQty(id, qty)]),
          ),
          activeVariant: data.activeVariant ?? {},
          // The signature is what was actually stored, so a restored bundle reads as
          // already-saved and the link shows "Saved" rather than offering a no-op.
          savedSignature: raw,
        });
      } catch {
        // Corrupt JSON or storage unavailable — fall through to the seed.
      } finally {
        // `finally`, not the end of `try`: three of the paths above return early, and any of
        // them leaving `hydrated` false would strand a returning visitor on the skeleton.
        set({ hydrated: true });
      }
    },
  }),
);
