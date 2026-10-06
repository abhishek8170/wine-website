import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getImageUrl } from "../utils/image";

const API_URL = "http://localhost:5000/api/products";

function FeaturedWines() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFeaturedWines = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Failed to fetch wines");
        }

        const result = await response.json();

        /*
          Your products API may return:
          { products: [...] }
          or directly:
          [...]
        */

        const products = Array.isArray(result)
          ? result
          : result.products || result.data || [];

        /*
          For now we use the first active products from the
          database.

          Later, when we add a proper featured flag / collection
          relationship in the database, this section can use
          that instead.
        */

        const activeProducts = products
          .filter((product) => {
            return (
              product.is_active !== false &&
              product.isActive !== false
            );
          })
          .slice(0, 4);

        setWines(activeProducts);
      } catch (err) {
        console.error("Featured wines error:", err);
        setError("Unable to load featured wines.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedWines();
  }, []);

  const getImage = (wine) => {
    const image =
      wine.image_url ||
      wine.imageUrl ||
      wine.primary_image ||
      wine.primaryImage ||
      wine.images?.[0]?.image_url ||
      wine.images?.[0]?.imageUrl ||
      "";

    return getImageUrl(image);
  };

  const getCategory = (wine) => {
    return (
      wine.category_name ||
      wine.categoryName ||
      wine.category?.name ||
      "Wine"
    );
  };

  const getDescription = (wine) => {
    return (
      wine.description ||
      wine.tasting_notes ||
      wine.tastingNotes ||
      "A beautifully crafted wine with distinctive character."
    );
  };

  return (
    <section className="relative overflow-hidden bg-[#241311] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">

      {/* Decorative background element */}
      <div className="pointer-events-none absolute -right-32 top-20 h-72 w-72 rounded-full bg-[#8b1e2d]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">

        {/* Section Header */}
        <div className="mb-12 flex flex-col gap-6 border-b border-[#c9a45c]/30 pb-8 sm:mb-16 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.35em] text-[#c9a45c]">
              A Curated Selection
            </p>

            <h2 className="font-serif text-4xl leading-tight text-[#f3e8d7] sm:text-5xl lg:text-6xl">
              Featured Wines
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-[#d8c8b6] sm:text-base">
              Discover a selection of exceptional wines chosen for their
              character, craftsmanship and distinctive expression.
            </p>
          </div>

          <Link
            to="/shop"
            className="group inline-flex w-fit items-center gap-3 border-b border-[#c9a45c] pb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#f3e8d7] transition hover:text-[#c9a45c]"
          >
            Explore All Wines

            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-[480px] animate-pulse rounded-sm border border-[#c9a45c]/10 bg-[#321b18]"
              />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="border border-[#c9a45c]/20 bg-[#321b18]/60 p-8 text-center">
            <p className="text-sm text-[#d8c8b6]">{error}</p>
          </div>
        )}

        {/* No products */}
        {!loading && !error && wines.length === 0 && (
          <div className="border border-[#c9a45c]/20 bg-[#321b18]/60 p-8 text-center">
            <p className="text-sm text-[#d8c8b6]">
              No featured wines are available right now.
            </p>
          </div>
        )}

        {/* Wine Grid */}
        {!loading && !error && wines.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {wines.map((wine) => (
              <Link
                key={wine.id}
                to={`/shop/${wine.id}`}
                className="group relative overflow-hidden border border-[#c9a45c]/15 bg-[#321b18]/60 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-[#c9a45c]/50"
              >
                {/* Image */}
                {/* Image */}
                <div className="relative h-[390px] overflow-hidden bg-[#f3e8d7]">
                  <div className="flex h-full w-full items-center justify-center p-8 sm:p-10">
                    <img
                      src={getImage(wine)}
                      alt={wine.name || "Featured wine"}
                      className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                      onError={(event) => {
                        event.currentTarget.src = "/images/wine.png";
                      }}
                    />
                  </div>

                  {/* Image Overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#241311]/60 via-transparent to-transparent opacity-70" />

                  {/* Category */}
                  <div className="absolute left-4 top-4 border border-[#f3e8d7]/40 bg-[#241311]/60 px-3 py-2 backdrop-blur-md">
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#f3e8d7]">
                      {getCategory(wine)}
                    </span>
                  </div>
                </div>

                {/* Product Information */}
                <div className="p-5">
                  <h3 className="font-serif text-2xl text-[#f3e8d7] transition-colors duration-300 group-hover:text-[#c9a45c]">
                    {wine.name}
                  </h3>

                  {wine.vintage && (
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#c9a45c]">
                      {wine.vintage}
                    </p>
                  )}

                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#cbbcad]">
                    {getDescription(wine)}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-[#c9a45c]/15 pt-4">
                    <span className="text-xs uppercase tracking-[0.18em] text-[#cbbcad]">
                      Discover
                    </span>

                    <span className="text-lg text-[#c9a45c] transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>

                {/* Bottom Gold Line */}
                <div className="absolute bottom-0 left-0 h-px w-0 bg-[#c9a45c] transition-all duration-500 group-hover:w-full" />
              </Link>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}

export default FeaturedWines;