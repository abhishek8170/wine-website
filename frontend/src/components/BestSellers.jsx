import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";

function BestSellers() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/products/best-sellers"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch best sellers");
        }

        const data = await response.json();

        setProducts(data.products || []);
      } catch (error) {
        console.error("Error fetching best sellers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  if (loading) {
    return (
      <section className="bg-[#f3e8d7] px-5 pb-28 pt-10 md:px-8 md:py-12">
        <div className="mx-auto w-full max-w-[1280px]">
          <p className="text-sm uppercase tracking-[0.25em] text-[#8f6d32]">
            Loading best sellers...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#f3e8d7] px-5 pb-28 pt-10 md:px-8 md:py-12">
      <div className="mx-auto w-full max-w-[1280px]">

        {/* =========================
            SECTION HEADING
        ========================== */}
        <div className="mb-7 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#8f6d32]">
            Customer Favorites
          </p>

          <h2 className="mt-2 font-serif text-3xl font-semibold text-[#351716] md:text-4xl">
            Best Sellers
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#351716]/60">
            Discover the wines our customers return to time and time again.
          </p>

          {/* GOLD ORNAMENT */}
          <div className="mx-auto mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-[#c9a45c]/60" />
            <span className="text-xs text-[#c9a45c]">◆</span>
            <span className="h-px w-10 bg-[#c9a45c]/60" />
          </div>
        </div>

        {/* =========================
            EMPTY STATE
        ========================== */}
        {products.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-[#351716]/60">
              No best sellers available yet.
            </p>
          </div>
        ) : (
          /* =========================
             PRODUCTS
          ========================== */
          <div className="grid grid-cols-1 justify-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showCartActions={false}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default BestSellers;