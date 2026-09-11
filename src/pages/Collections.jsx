import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";

export default function Collections() {
        //return <div style={{ color: "red", fontSize: "50px" }}>COLLECTION TEST</div>;

    console.log("NEW COLLECTIONS PAGE LOADED");

  const [collections, setCollections] = useState([]);
  const [collectionProducts, setCollectionProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // Fetch collections and their products
  // --------------------------------------------------

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        setError("");

        // Get all active collections
        const collectionsResponse = await fetch(
          `${API_BASE}/collections`
        );

        if (!collectionsResponse.ok) {
          throw new Error("Failed to fetch collections");
        }

        const collectionsData = await collectionsResponse.json();

        if (!collectionsData.success) {
          throw new Error(
            collectionsData.message || "Failed to fetch collections"
          );
        }

        const activeCollections = collectionsData.collections || [];

        setCollections(activeCollections);

        // Fetch products for every collection
        const productRequests = activeCollections.map(async (collection) => {
          const response = await fetch(
            `${API_BASE}/collections/${collection.slug}`
          );

          if (!response.ok) {
            throw new Error(
              `Failed to fetch ${collection.name}`
            );
          }

          const data = await response.json();

          return {
            slug: collection.slug,
            products: data.success ? data.products || [] : [],
          };
        });

        const productResults = await Promise.all(productRequests);

        const productsByCollection = {};

        productResults.forEach((result) => {
          productsByCollection[result.slug] = result.products;
        });

        setCollectionProducts(productsByCollection);
      } catch (err) {
        console.error("Collections page error:", err);
        setError("Unable to load collections. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return "/images/wine.png";
    }

    return imageUrl;
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) {
      return "₹—";
    }

    return `₹${Number(price).toLocaleString("en-IN")}`;
  };

  const getDiscount = (mrp, sellingPrice) => {
    if (!mrp || !sellingPrice) {
      return null;
    }

    const mrpNumber = Number(mrp);
    const sellingNumber = Number(sellingPrice);

    if (mrpNumber <= sellingNumber) {
      return null;
    }

    return Math.round(
      ((mrpNumber - sellingNumber) / mrpNumber) * 100
    );
  };

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-[#241311] text-[#f3e9d8]">
        <section className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border border-[#c9ab69]/30 border-t-[#c9ab69]" />

            <p className="mt-5 text-[10px] font-semibold tracking-[0.3em] text-[#c9ab69]">
              CURATING THE CELLAR
            </p>
          </div>
        </section>
      </main>
    );
  }

  // --------------------------------------------------
  // Error
  // --------------------------------------------------

  if (error) {
    return (
      <main className="min-h-screen bg-[#241311] text-[#f3e9d8]">
        <section className="flex min-h-[70vh] items-center justify-center px-6">
          <div className="max-w-md border border-[#c9ab69]/20 bg-white/[0.03] p-10 text-center">
            <p className="text-[10px] font-semibold tracking-[0.3em] text-[#c9ab69]">
              SOMETHING WENT WRONG
            </p>

            <p className="mt-5 text-sm leading-7 text-[#cdbeb0]">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-7 border border-[#c9ab69]/50 px-7 py-3 text-[10px] font-semibold tracking-[0.2em] text-[#f7eedf] transition hover:bg-[#c9ab69] hover:text-[#241311]"
            >
              TRY AGAIN
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#241311] text-[#f3e9d8]">

      {/* ==================================================
          HERO
      ================================================== */}

      <section className="relative overflow-hidden border-b border-[#c9ab69]/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(126,32,45,0.38),transparent_55%)]" />

        <div className="relative mx-auto flex min-h-[52vh] max-w-7xl items-center justify-center px-6 py-24 text-center sm:px-8 lg:px-12">
          <div className="max-w-4xl">

            <p className="mb-6 text-[10px] font-semibold tracking-[0.38em] text-[#c9ab69] sm:text-xs">
              THE VINEORA CELLAR
            </p>

            <h1 className="font-serif text-5xl leading-[0.95] tracking-[-0.03em] text-[#f7eedf] sm:text-6xl md:text-7xl lg:text-8xl">
              Explore Our
              <span className="block text-[#c9ab69]">
                Collection
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-sm leading-7 text-[#d8cbbb] sm:text-base sm:leading-8">
              Discover carefully selected wines brought together
              for their character, craftsmanship, and ability to make
              every occasion memorable.
            </p>

            <div className="mt-9">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center border border-[#c9ab69]/60 bg-[#c9ab69]/10 px-8 py-4 text-[10px] font-semibold tracking-[0.22em] text-[#f7eedf] backdrop-blur-md transition duration-300 hover:border-[#c9ab69] hover:bg-[#c9ab69] hover:text-[#241311]"
              >
                SHOP ALL WINES
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================
          COLLECTION OVERVIEW
      ================================================== */}

      <section className="bg-[#f3e9d8] px-6 py-20 text-[#241311] sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">

          <div className="mb-12">
            <p className="text-[10px] font-semibold tracking-[0.3em] text-[#8c6c35]">
              CURATED SELECTIONS
            </p>

            <h2 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
              Find Your
              <span className="block text-[#7b2737]">
                Perfect Collection
              </span>
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {collections.map((collection) => (
              <a
                key={collection.id}
                href={`#${collection.slug}`}
                className="group border border-[#7b2737]/15 bg-white/50 p-6 transition duration-300 hover:border-[#7b2737]/40 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-4">

                  <span className="font-serif text-3xl text-[#7b2737]">
                    {String(collection.id).padStart(2, "0")}
                  </span>

                  <span className="text-[10px] tracking-[0.15em] text-[#8c6c35]">
                    {collection.product_count}{" "}
                    {collection.product_count === 1
                      ? "WINE"
                      : "WINES"}
                  </span>

                </div>

                <h3 className="mt-10 font-serif text-2xl text-[#241311]">
                  {collection.name}
                </h3>

                <p className="mt-4 text-sm leading-6 text-[#685950]">
                  {collection.description}
                </p>

                <div className="mt-7 text-[10px] font-semibold tracking-[0.2em] text-[#7b2737]">
                  EXPLORE COLLECTION →
                </div>
              </a>
            ))}

          </div>

        </div>
      </section>

      {/* ==================================================
          ALL COLLECTION PRODUCTS
      ================================================== */}

      <section className="bg-[#241311] px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">

          {collections.map((collection) => {

            const products =
              collectionProducts[collection.slug] || [];

            return (
              <section
                key={collection.id}
                id={collection.slug}
                className="mb-24 scroll-mt-24 last:mb-0"
              >

                {/* Collection heading */}

                <div className="mb-12 border-b border-[#c9ab69]/15 pb-8">

                  <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.3em] text-[#c9ab69]">
                        COLLECTION {String(collection.id).padStart(2, "0")}
                      </p>

                      <h2 className="mt-3 font-serif text-4xl text-[#f7eedf] sm:text-5xl">
                        {collection.name}
                      </h2>

                      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#cdbeb0]">
                        {collection.description}
                      </p>
                    </div>

                    <span className="text-[10px] tracking-[0.2em] text-[#a99586]">
                      {products.length}{" "}
                      {products.length === 1
                        ? "WINE"
                        : "WINES"}
                    </span>

                  </div>

                </div>

                {/* Products */}

                {products.length === 0 ? (
                  <div className="border border-[#c9ab69]/15 bg-white/[0.03] px-6 py-16 text-center">

                    <p className="text-[10px] font-semibold tracking-[0.3em] text-[#c9ab69]">
                      COLLECTION COMING SOON
                    </p>

                    <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#cdbeb0]">
                      New wines will be added to this collection soon.
                    </p>

                  </div>
                ) : (

                  <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                    {products.map((product) => {

                      const discount = getDiscount(
                        product.mrp,
                        product.selling_price
                      );

                      const stock =
                        Number(product.stock_quantity) > 0;

                      return (
                        <article
                          key={`${collection.id}-${product.id}`}
                          className="group overflow-hidden border border-[#c9ab69]/15 bg-[#2c1816] transition duration-500 hover:border-[#c9ab69]/40"
                        >

                          {/* Product image */}

                          <Link
                            to={`/shop/${product.id}`}
                            className="relative block overflow-hidden bg-[#f0e4d3]"
                          >

                            {discount && (
                              <span className="absolute left-4 top-4 z-10 bg-[#7b2737] px-3 py-2 text-[9px] font-semibold tracking-[0.15em] text-[#f7eedf]">
                                {discount}% OFF
                              </span>
                            )}

                            <div className="flex aspect-[4/5] items-center justify-center p-8">

                              <img
                                src={getImageUrl(
                                  product.image_url
                                )}
                                alt={
                                  product.alt_text ||
                                  product.name
                                }
                                className="h-full w-full object-contain transition duration-700 group-hover:scale-105"
                              />

                            </div>

                          </Link>

                          {/* Product information */}

                          <div className="p-6">

                            <p className="text-[9px] font-semibold tracking-[0.2em] text-[#c9ab69]">
                              {product.category_name ||
                                "WINE"}
                            </p>

                            <Link
                              to={`/shop/${product.id}`}
                              className="mt-2 block"
                            >
                              <h3 className="font-serif text-2xl leading-tight text-[#f7eedf] transition hover:text-[#c9ab69]">
                                {product.name}
                              </h3>
                            </Link>

                            {product.description && (
                              <p className="mt-3 line-clamp-2 text-xs leading-6 text-[#cdbeb0]">
                                {product.description}
                              </p>
                            )}

                            {/* Product details */}

                            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-[#a99586]">

                              {product.vintage && (
                                <span>
                                  VINTAGE {product.vintage}
                                </span>
                              )}

                              {product.bottle_size && (
                                <span>
                                  {product.bottle_size}
                                </span>
                              )}

                              {product.region && (
                                <span>
                                  {product.region}
                                </span>
                              )}

                            </div>

                            {/* Price */}

                            <div className="mt-6 flex items-end justify-between gap-4">

                              <div>

                                <p className="text-lg font-medium text-[#f7eedf]">
                                  {formatPrice(
                                    product.selling_price
                                  )}
                                </p>

                                {product.mrp &&
                                  Number(product.mrp) >
                                    Number(
                                      product.selling_price
                                    ) && (
                                    <p className="mt-1 text-xs text-[#8f7c70] line-through">
                                      {formatPrice(
                                        product.mrp
                                      )}
                                    </p>
                                  )}

                              </div>

                              <span
                                className={`text-[9px] font-semibold tracking-[0.12em] ${
                                  stock
                                    ? "text-[#9fbd8f]"
                                    : "text-[#c87a7a]"
                                }`}
                              >
                                {stock
                                  ? "IN STOCK"
                                  : "OUT OF STOCK"}
                              </span>

                            </div>

                            {/* Details button */}

                            <Link
                              to={`/shop/${product.id}`}
                              className="mt-6 flex w-full items-center justify-center border border-[#c9ab69]/40 px-5 py-3 text-[9px] font-semibold tracking-[0.2em] text-[#f7eedf] transition duration-300 hover:border-[#c9ab69] hover:bg-[#c9ab69] hover:text-[#241311]"
                            >
                              VIEW DETAILS
                            </Link>

                          </div>

                        </article>
                      );
                    })}

                  </div>

                )}

              </section>
            );
          })}

        </div>
      </section>

      {/* ==================================================
          PHILOSOPHY
      ================================================== */}

      <section className="border-t border-[#c9ab69]/15 bg-[#f3e9d8] px-6 py-20 text-[#241311] sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">

          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">

            <div>

              <p className="text-[10px] font-semibold tracking-[0.3em] text-[#8c6c35]">
                THE VINEORA PHILOSOPHY
              </p>

              <h2 className="mt-5 font-serif text-4xl leading-tight sm:text-5xl">
                Wine Selected
                <span className="block text-[#7b2737]">
                  With Purpose
                </span>
              </h2>

              <p className="mt-6 max-w-lg text-sm leading-7 text-[#685950]">
                Every collection is an invitation to discover something
                distinctive — from refined classics to wines that deserve
                their own moment.
              </p>

            </div>

            <div className="grid gap-5 sm:grid-cols-3">

              <div className="border border-[#7b2737]/15 bg-white/50 p-6">
                <span className="text-xs tracking-[0.2em] text-[#8c6c35]">
                  01
                </span>

                <h3 className="mt-8 font-serif text-xl">
                  Character
                </h3>

                <p className="mt-4 text-sm leading-6 text-[#685950]">
                  Wines chosen for their distinctive personality
                  and expression.
                </p>
              </div>

              <div className="border border-[#7b2737]/15 bg-white/50 p-6">
                <span className="text-xs tracking-[0.2em] text-[#8c6c35]">
                  02
                </span>

                <h3 className="mt-8 font-serif text-xl">
                  Craftsmanship
                </h3>

                <p className="mt-4 text-sm leading-6 text-[#685950]">
                  Thoughtfully selected bottles that reflect care
                  and attention to detail.
                </p>
              </div>

              <div className="border border-[#7b2737]/15 bg-white/50 p-6">
                <span className="text-xs tracking-[0.2em] text-[#8c6c35]">
                  03
                </span>

                <h3 className="mt-8 font-serif text-xl">
                  Discovery
                </h3>

                <p className="mt-4 text-sm leading-6 text-[#685950]">
                  New bottles and memorable discoveries waiting to
                  be uncorked.
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ==================================================
          FINAL CTA
      ================================================== */}

      <section className="bg-[#241311] px-6 py-20 text-center sm:px-8 lg:py-24">

        <div className="mx-auto max-w-3xl">

          <p className="text-[10px] font-semibold tracking-[0.3em] text-[#c9ab69]">
            THE CELLAR AWAITS
          </p>

          <h2 className="mt-4 font-serif text-4xl leading-tight text-[#f7eedf] sm:text-5xl">
            Discover Your
            <span className="block text-[#c9ab69]">
              Next Favourite
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#cdbeb0]">
            Browse the complete VINEORA selection and find the bottle
            that belongs at your next occasion.
          </p>

          <Link
            to="/shop"
            className="mt-8 inline-flex items-center justify-center bg-[#7b2737] px-9 py-4 text-[10px] font-semibold tracking-[0.22em] text-[#f7eedf] transition duration-300 hover:bg-[#c9ab69] hover:text-[#241311]"
          >
            EXPLORE ALL WINES
          </Link>

        </div>

      </section>

    </main>
  );
}