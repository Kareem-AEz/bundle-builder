import { BundleBuilder } from "@/features/bundle-builder/components/bundle-builder";
import { getCatalog } from "@/features/bundle-builder/queries/get-catalog";
import { BundleStoreProvider } from "@/features/bundle-builder/store/bundle-store-provider";

/**
 * Reads the catalog on the server and hands it to the client store.
 *
 * `getCatalog` is a `use cache` function, so this await does not make the route
 * dynamic — the page stays prerendered and the catalog crosses to the client as
 * plain serializable props rather than a client-side fetch.
 */
export default async function Home() {
  const catalog = await getCatalog();

  return (
    <main className="mx-auto w-fit py-10">
      <BundleStoreProvider catalog={catalog}>
        <BundleBuilder />
      </BundleStoreProvider>
    </main>
  );
}
