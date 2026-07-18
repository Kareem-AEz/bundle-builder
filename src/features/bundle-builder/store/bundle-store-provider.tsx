"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useStore } from "zustand";
import {
  buildCatalogIndex,
  type CatalogEntry,
} from "../selectors/catalog-index";
import type { Catalog } from "../types";
import {
  type BuilderActions,
  type BuilderState,
  type BundleStore,
  createBundleStore,
} from "./useBundleStore";

type BundleContextValue = {
  store: BundleStore;
  catalog: Catalog;
  index: ReadonlyMap<string, CatalogEntry>;
};

const BundleContext = createContext<BundleContextValue | null>(null);

/**
 * Owns one store instance, built from the catalog the server read out of SQLite.
 *
 * A factory rather than a module singleton because `clampQty` — which `hydrate`
 * runs over every restored localStorage value — needs the catalog's `max` map at
 * construction. Injecting the catalog after the fact would race the mount effect
 * that calls `hydrate`, and losing that race restores a tampered payload
 * unclamped.
 *
 * The store is held in `useState` with a lazy initializer, not `useMemo` and not
 * a ref. `useMemo` is a performance hint React may discard, and a discarded store
 * would silently reset the user's bundle mid-session; a ref would mean reading
 * `.current` during render, which is unsafe under concurrent rendering. A lazy
 * `useState` initializer runs exactly once and is legal to read while rendering.
 */
export function BundleStoreProvider({
  catalog,
  children,
}: {
  catalog: Catalog;
  children: React.ReactNode;
}) {
  const [store] = useState<BundleStore>(() => createBundleStore(catalog));

  const value = useMemo(
    () => ({
      store,
      catalog,
      // Rebuilt only if the catalog identity changes, which in practice means
      // never — it is prerendered data.
      index: buildCatalogIndex(catalog),
    }),
    [store, catalog],
  );

  return (
    <BundleContext.Provider value={value}>{children}</BundleContext.Provider>
  );
}

function useBundleContext(): BundleContextValue {
  const value = useContext(BundleContext);
  if (!value) {
    throw new Error(
      "useBundleStore must be used inside <BundleStoreProvider>. The provider needs the catalog, which only a Server Component can read.",
    );
  }
  return value;
}

/**
 * Same call signature the components already use, so `useBundleStore((s) => s.x)`
 * is unchanged everywhere — only where the store comes from changed.
 */
export function useBundleStore<T>(
  selector: (state: BuilderState & BuilderActions) => T,
): T {
  return useStore(useBundleContext().store, selector);
}

/** The catalog the page was rendered from. */
export function useCatalog(): Catalog {
  return useBundleContext().catalog;
}

/** variantId -> {category, product, variant}, memoized per provider. */
export function useCatalogIndex(): ReadonlyMap<string, CatalogEntry> {
  return useBundleContext().index;
}
