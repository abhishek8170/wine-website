import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";

// Images are presentation assets for the homepage.
// Collection names, descriptions and product counts come from PostgreSQL.
const collectionImages = {
  premium: "/images/wine.png",
  "new-arrivals": "/images/wine.png",
  "limited-edition": "/images/wine.png",
};

const featuredSlugs = [
  "premium",
  "new-arrivals",
  "limited-edition",
];

export default function ExploreCollections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch(`${API_BASE}/collections`);

        if (!response.ok) {
          throw new Error("Failed to fetch collections");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(
            data.message || "Failed to fetch collections"
          );
        }

        const allCollections = data.collections || [];

        // Show only the collections intended for the homepage.
        const featuredCollections = featuredSlugs
          .map((slug) =>
            allCollections.find(
              (collection) => collection.slug === slug
            )
          )
          .filter(Boolean);

        setCollections(featuredCollections);
      } catch (error) {
        console.error(
          "Explore Collections error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  if (loading) {
    return (
      <section className="bg-[#f3e9d8] px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12">
            <p className="text-[10px] font-semibold tracking-[0.3em] text-[#8c6c35]">
              CURATED FOR YOU
            </p>

            <h2 className="mt-4 font-serif text-4xl leading-tight text-[#241311] sm:text-5xl lg:text-6xl">
              Explore Our
              <span className="block text-[#7b2737]">
                Collection
              </span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[480px] animate-pulse bg-[#e8dac5]"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-[#f3e9d8] px-6 py-20 text-[#241311] sm:px-8 lg:px-12 lg:py-28">
      {/* Subtle luxury background detail */}
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-[#7b2737]/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">

        {/* ==================================================
            SECTION HEADER
        ================================================== */}

        <div className="mb-12 grid gap-6 lg:grid-cols-[1fr_0.65fr] lg:items-end">

          <div>
            <p className="text-[10px] font-semibold tracking-[0.32em] text-[#8c6c35]">
              CURATED FOR YOU
            </p>

            <h2 className="mt-4 font-serif text-4xl leading-[1.05] tracking-[-0.02em] text-[#241311] sm:text-5xl lg:text-6xl">
              Explore Our
              <span className="block text-[#7b2737]">
                Collection
              </span>
            </h2>
          </div>

          <p className="max-w-xl text-sm leading-7 text-[#685950] lg:justify-self-end">
            Explore carefully considered collections and discover
            wines selected for different tastes, occasions, and
            memorable moments.
          </p>

        </div>

        {/* ==================================================
            COLLECTION CARDS
        ================================================== */}

        {collections.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">

            {collections.map((collection, index) => {

              const image =
                collectionImages[collection.slug] ||
                "/images/wine.png";

              return (
                <article
                  key={collection.id}
                  className="group relative overflow-hidden border border-[#7b2737]/20 bg-[#241311]"
                >

                  {/* Image */}
                  <div className="relative aspect-[4/5] overflow-hidden">

                    <img
                      src={image}
                      alt={collection.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />

                    {/* Image overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#241311] via-[#241311]/55 to-transparent" />

                  </div>

                  {/* Card content */}
                  <div className="absolute inset-x-0 bottom-0 p-7 sm:p-8">

                    <div className="flex items-center justify-between gap-4">

                      <span className="text-[9px] font-semibold tracking-[0.25em] text-[#c9ab69]">
                        COLLECTION{" "}
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="text-[9px] tracking-[0.18em] text-[#d8cbbb]">
                        {collection.product_count || 0}{" "}
                        {Number(collection.product_count) === 1
                          ? "WINE"
                          : "WINES"}
                      </span>

                    </div>

                    <h3 className="mt-4 font-serif text-3xl text-[#f7eedf] sm:text-4xl">
                      {collection.name}
                    </h3>

                    <p className="mt-3 max-w-sm text-xs leading-6 text-[#d8cbbb]">
                      {collection.description}
                    </p>

                    <Link
                      to={`/collections#${collection.slug}`}
                      className="mt-6 inline-flex items-center border-b border-[#c9ab69]/60 pb-2 text-[9px] font-semibold tracking-[0.22em] text-[#f7eedf] transition duration-300 hover:border-[#c9ab69] hover:text-[#c9ab69]"
                    >
                      EXPLORE COLLECTION
                      <span className="ml-3 transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </Link>

                  </div>

                </article>
              );
            })}

          </div>
        ) : (
          <div className="border border-[#7b2737]/15 bg-white/40 px-6 py-16 text-center">
            <p className="text-[10px] font-semibold tracking-[0.25em] text-[#8c6c35]">
              COLLECTIONS COMING SOON
            </p>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#685950]">
              Our curated wine collections are being prepared.
            </p>
          </div>
        )}

        {/* ==================================================
            VIEW ALL
        ================================================== */}

        <div className="mt-10 flex justify-center">

          <Link
            to="/collections"
            className="inline-flex items-center justify-center border border-[#7b2737]/40 px-8 py-4 text-[10px] font-semibold tracking-[0.22em] text-[#7b2737] transition duration-300 hover:border-[#7b2737] hover:bg-[#7b2737] hover:text-[#f7eedf]"
          >
            VIEW ALL COLLECTIONS
          </Link>

        </div>

      </div>
    </section>
  );
}