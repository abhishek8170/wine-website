import { useState } from "react";
import { Link } from "react-router-dom";
import { getImageUrl } from "../utils/image";

import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";

const API_BASE_URL = "http://localhost:5000/api";

function Wishlist() {
  const { addToCart } = useCart();

  const {
    wishlistItems,
    removeFromWishlist,
    clearWishlist,
    loading: wishlistLoading,
  } = useWishlist();

  const [addingProductId, setAddingProductId] = useState(null);
  const [addedProductId, setAddedProductId] = useState(null);
  const [actionError, setActionError] = useState("");

  /*
    Add wishlist product to cart using
    the REAL product + REAL variant from PostgreSQL.
  */
  const handleAddToCart = async (item) => {
    if (!item?.productId) {
      return;
    }

    try {
      setActionError("");
      setAddingProductId(item.productId);
      setAddedProductId(null);

      /*
        Fetch the complete product from backend.
        This gives us the real product variant ID
        required by the PostgreSQL cart.
      */
      const response = await fetch(
        `${API_BASE_URL}/products/${item.productId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load product"
        );
      }

      /*
        Backend may return the product directly
        or inside data.product.
      */
      const product = data.product || data;

      const variant = product?.variants?.[0];

      if (!product?.id || !variant?.id) {
        throw new Error(
          "This wine does not have a valid product variant."
        );
      }

      const stockQuantity = Number(
        variant.stock_quantity || 0
      );

      if (stockQuantity <= 0) {
        throw new Error(
          "This wine is currently out of stock."
        );
      }

      /*
        Add using the real product and real
        database variant.
      */
      await addToCart(product, 1);

      setAddedProductId(item.productId);

      /*
        Remove success message after a short delay.
      */
      setTimeout(() => {
        setAddedProductId(null);
      }, 1800);
    } catch (error) {
      console.error(
        "Failed to add wishlist item to cart:",
        error
      );

      setActionError(
        error.message ||
          "Unable to add this wine to your cart."
      );

      setTimeout(() => {
        setActionError("");
      }, 3000);
    } finally {
      setAddingProductId(null);
    }
  };

  /*
    Remove wishlist item safely.
  */
  const handleRemove = async (productId) => {
    try {
      setActionError("");

      await removeFromWishlist(productId);
    } catch (error) {
      console.error(
        "Failed to remove wishlist item:",
        error
      );

      setActionError(
        error.message ||
          "Unable to remove this wine from your wishlist."
      );
    }
  };

  /*
    Clear wishlist safely.
  */
  const handleClearWishlist = async () => {
    try {
      setActionError("");

      await clearWishlist();
    } catch (error) {
      console.error(
        "Failed to clear wishlist:",
        error
      );

      setActionError(
        error.message ||
          "Unable to clear your wishlist."
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#f3e8d7] text-[#351716]">
      {/* =====================================
          HEADER
      ====================================== */}
      <section className="border-b border-[#c9a45c]/20 bg-[#eee1ce] px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#8f6d32]">
            Your Selection
          </p>

          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="font-serif text-4xl font-semibold text-[#351716] md:text-5xl">
                My Wishlist
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[#351716]/60">
                Wines you've saved for your next occasion.
              </p>
            </div>

            {wishlistItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearWishlist}
                disabled={wishlistLoading}
                className="
                  self-start
                  rounded-md
                  border
                  border-[#351716]/20
                  px-5
                  py-2.5
                  text-[10px]
                  font-medium
                  uppercase
                  tracking-[0.16em]
                  text-[#351716]
                  transition-all
                  duration-300
                  hover:border-[#351716]
                  hover:bg-[#351716]
                  hover:text-[#f3e8d7]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  md:self-auto
                "
              >
                {wishlistLoading
                  ? "Updating..."
                  : "Clear Wishlist"}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* =====================================
          ERROR MESSAGE
      ====================================== */}
      {actionError && (
        <div className="mx-auto max-w-7xl px-5 pt-6 md:px-8">
          <div className="border border-red-900/20 bg-red-900/5 px-4 py-3 text-sm text-red-900">
            {actionError}
          </div>
        </div>
      )}

      {/* =====================================
          EMPTY WISHLIST
      ====================================== */}
      {wishlistItems.length === 0 ? (
        <section className="flex min-h-[55vh] items-center justify-center px-5 py-16">
          <div className="max-w-xl text-center">
            <div
              className="
                mx-auto
                flex
                h-20
                w-20
                items-center
                justify-center
                rounded-full
                border
                border-[#c9a45c]/50
                bg-[#eee1ce]
                text-4xl
                text-[#8f6d32]
              "
            >
              ♡
            </div>

            <p className="mt-7 text-[10px] font-medium uppercase tracking-[0.28em] text-[#8f6d32]">
              Nothing Saved Yet
            </p>

            <h2 className="mt-3 font-serif text-3xl text-[#351716]">
              Your wishlist is waiting
            </h2>

            <p className="mt-4 text-sm leading-7 text-[#351716]/60">
              Explore our wines and save the bottles you'd
              like to discover later.
            </p>

            <Link
              to="/shop"
              className="
                mt-7
                inline-block
                rounded-md
                bg-[#351716]
                px-7
                py-3.5
                text-[10px]
                font-medium
                uppercase
                tracking-[0.18em]
                text-[#f3e8d7]
                transition-all
                duration-300
                hover:bg-[#4a211d]
              "
            >
              Explore Wines
            </Link>
          </div>
        </section>
      ) : (
        /* =====================================
            WISHLIST PRODUCTS
        ====================================== */
        <section className="px-5 py-12 md:px-8 md:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center justify-between">
              <p className="text-xs text-[#351716]/55">
                {wishlistItems.length}{" "}
                {wishlistItems.length === 1
                  ? "wine"
                  : "wines"}{" "}
                saved
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              
              {wishlistItems.map((item) => {
                
                const isAdding =
                  addingProductId === item.productId;

                const wasAdded =
                  addedProductId === item.productId;

                return (
                  <article
                    key={item.productId}
                    className="
                      group
                      overflow-hidden
                      rounded-2xl
                      border
                      border-[#c9a45c]/30
                      bg-[#eee1ce]
                      shadow-[0_8px_25px_rgba(53,23,22,0.08)]
                      transition-all
                      duration-500
                      hover:-translate-y-1
                      hover:border-[#c9a45c]
                      hover:shadow-[0_18px_40px_rgba(53,23,22,0.14)]
                    "
                  >
                    {/* IMAGE */}
                    <Link
                      to={`/shop/${item.productId}`}
                      className="
                        relative
                        flex
                        aspect-square
                        items-center
                        justify-center
                        overflow-hidden
                        bg-[#e8dbc7]
                      "
                    >
                      <img
                       src={getImageUrl(item.image)}
                        alt={item.name}
                        className="
                          h-full
                          w-full
                          object-contain
                          p-8
                          transition-transform
                          duration-500
                          group-hover:scale-[1.04]
                        "
                      />

                      <span
                        className="
                          pointer-events-none
                          absolute
                          inset-4
                          rounded-xl
                          border
                          border-[#c9a45c]/60
                        "
                      />
                    </Link>

                    {/* CONTENT */}
                    <div className="bg-[#f3e8d7] p-5">
                      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#8f6d32]">
                        {item.category || "Wine"}
                      </p>

                      <Link
                        to={`/shop/${item.productId}`}
                        className="mt-2 block"
                      >
                        <h2 className="font-serif text-xl font-semibold leading-tight text-[#351716] transition-colors duration-300 hover:text-[#8f6d32]">
                          {item.name}
                        </h2>
                      </Link>

                      {item.bottleSize && (
                        <p className="mt-2 text-xs text-[#351716]/50">
                          {item.bottleSize}
                        </p>
                      )}

                      <div className="my-4 h-px bg-[#c9a45c]/30" />

                      <div className="flex items-baseline gap-3">
                        <span className="font-serif text-xl font-semibold text-[#351716]">
                          ₹
                          {Number(
                            item.price || 0
                          ).toLocaleString("en-IN")}
                        </span>

                        {Number(item.mrp || 0) >
                          Number(item.price || 0) && (
                          <span className="text-xs text-[#351716]/40 line-through">
                            ₹
                            {Number(
                              item.mrp || 0
                            ).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      {/* ACTIONS */}
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleAddToCart(item)
                          }
                          disabled={isAdding}
                          className="
                            flex-1
                            rounded-md
                            border
                            border-[#351716]
                            px-3
                            py-2.5
                            text-[10px]
                            font-medium
                            uppercase
                            tracking-[0.12em]
                            text-[#351716]
                            transition-all
                            duration-300
                            hover:bg-[#351716]
                            hover:text-[#f3e8d7]
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                          "
                        >
                          {isAdding
                            ? "Adding..."
                            : wasAdded
                              ? "✓ Added"
                              : "Add to Cart"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemove(
                              item.productId
                            )
                          }
                          aria-label={`Remove ${item.name} from wishlist`}
                          className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-md
                            border
                            border-[#351716]/20
                            text-lg
                            text-[#351716]
                            transition-all
                            duration-300
                            hover:border-red-800
                            hover:bg-red-800
                            hover:text-[#f3e8d7]
                          "
                        >
                          ×
                        </button>
                      </div>

                      <Link
                        to={`/shop/${item.productId}`}
                        className="
                          mt-2.5
                          block
                          w-full
                          rounded-md
                          border
                          border-[#351716]/15
                          px-4
                          py-2.5
                          text-center
                          text-[10px]
                          font-medium
                          uppercase
                          tracking-[0.16em]
                          text-[#351716]
                          transition-all
                          duration-300
                          hover:border-[#c9a45c]
                          hover:text-[#8f6d32]
                        "
                      >
                        View Details
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default Wishlist;