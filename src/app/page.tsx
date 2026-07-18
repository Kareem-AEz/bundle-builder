import { ProductCard } from "@/features/bundle-builder/components/product-card";
import { cameras } from "@/features/bundle-builder/constants/catalog";

export default function Home() {
  return (
    <main className="bg-surface rounded-card m-10 w-[768px] p-5">
      <div className="grid grid-cols-2 gap-4">
        {cameras.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
