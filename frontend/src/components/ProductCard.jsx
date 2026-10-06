import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { getImageUrl } from "../utils/image";

function ProductCard({ product, showCartActions = true }) {
  const {
    addToCart,
    setCartItemQuantity,
    cartItems,
    loading: cartLoading,
  } = useCart();

  const { isInWishlist, toggleWishlist } = useWishlist();

  const navigate = useNavigate();

  const [addedToCart, setAddedToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [actionError, setActionError] = useState("");

  const variant = product.variants?.[0];

  const mrp = Number(variant?.mrp || 0);

  const sellingPrice = Number(
    variant?.selling_price || 0
  );

  const stock = Number(
    variant?.stock_quantity || 0
  );

  const rating = Number(
    product.average_rating || 0
  );

  const reviewCount = Number(
    product.review_count || 0
  );

  const discount =
    mrp > sellingPrice
      ? Math.round(
          ((mrp - sellingPrice) / mrp) * 100
        )
      : 0;

  const isInStock = stock > 0;

  const wishlist = isInWishlist(product.id);

  /* =====================================================
     PRODUCT IMAGE
  ===================================================== */

  /*
    Priority:

    1. product.image_url
       -> Image uploaded from Admin Panel

    2. product.images[0].image_url
       -> Existing product_images system

    3. /images/wine.png
       -> Default fallback image
  */

  const productImage =
  product.image_url ||
  product.images?.[0]?.image_url ||
  "/images/wine.png";

const imageUrl = getImageUrl(productImage);

  /* =====================================================
     CURRENT CART ITEM
  ===================================================== */

  const currentCartItem = cartItems?.find(
    (item) =>
      Number(item.productId) === Number(product.id) &&
      Number(item.variantId) === Number(variant?.id)
  );

  /* =====================================================
     ADD TO CART
  ===================================================== */

  const handleAddToCart = async () => {
    if (
      !isInStock ||
      cartLoading ||
      buyingNow
    ) {
      return;
    }

    setActionError("");

    try {
      await addToCart(product);

      setAddedToCart(true);

      setTimeout(() => {
        setAddedToCart(false);
      }, 1500);
    } catch (error) {
      console.error(
        "Add to cart error:",
        error
      );

      setActionError(
        error.message ||
          "Unable to add this wine to your cart."
      );
    }
  };

  /* =====================================================
     BUY NOW
  ===================================================== */

  const handleBuyNow = async () => {
    if (
      !product ||
      !variant ||
      !isInStock ||
      cartLoading ||
      buyingNow
    ) {
      return;
    }

    setActionError("");

    try {
      setBuyingNow(true);

      /*
        If the product already exists in the cart,
        set its quantity to exactly 1.
      */

      if (currentCartItem) {
        await setCartItemQuantity(
          product.id,
          variant.id,
          1
        );
      } else {
        /*
          Product is not currently in cart,
          so add exactly one bottle.
        */

        await addToCart(product, 1);
      }

      /*
        Go directly to checkout.
      */

      navigate("/checkout");
    } catch (error) {
      console.error(
        "Buy now error:",
        error
      );

      setActionError(
        error.message ||
          "Unable to continue to checkout. Please try again."
      );
    } finally {
      setBuyingNow(false);
    }
  };

  return (
    <article className="group relative w-full max-w-[320px]">

      {/* =================================================
          MAIN CARD
      ================================================= */}

      <div
        className="
          relative
          overflow-hidden
          rounded-2xl
          border
          border-transparent
          bg-[#eee1ce]
          shadow-[0_8px_25px_rgba(53,23,22,0.08)]
          transition-all
          duration-500
          ease-out
          group-hover:-translate-y-1
          group-hover:border-[#c9a45c]
          group-hover:shadow-[0_18px_40px_rgba(53,23,22,0.15)]
        "
      >

        {/* =================================================
            IMAGE
        ================================================= */}

        <div
          className="
            relative
            flex
            aspect-square
            items-center
            justify-center
            overflow-hidden
            rounded-t-2xl
            bg-[#e8dbc7]
          "
        >

          {/* GOLD INNER FRAME */}

          <span
            className="
              pointer-events-none
              absolute
              inset-3
              z-10
              rounded-xl
              border
              border-[#c9a45c]/80
              transition-all
              duration-500
              group-hover:inset-2
              group-hover:border-[#c9a45c]
            "
          />

          {/* PREMIUM LIGHT SWEEP */}

          <div
            className="
              pointer-events-none
              absolute
              inset-x-0
              top-0
              z-20
              h-1/2
              -translate-y-full
              bg-gradient-to-b
              from-transparent
              via-white/15
              to-transparent
              transition-transform
              duration-1000
              ease-out
              group-hover:translate-y-[180%]
            "
          />

          {/* PRODUCT IMAGE */}

          <Link
            to={`/shop/${product.id}`}
            className="
              relative
              z-[5]
              block
              h-full
              w-full
            "
          >
            <img
              src={imageUrl}
              alt={product.name}
              onError={(event) => {
                event.currentTarget.src =
                  "/images/wine.png";
              }}
              className="
                h-full
                w-full
                object-contain
                px-5
                py-5
                transition-transform
                duration-700
                ease-out
                group-hover:scale-[1.04]
              "
            />
          </Link>

          {/* DISCOUNT */}

          {discount > 0 && (
            <span
              className="
                absolute
                left-5
                top-5
                z-30
                rounded-sm
                bg-[#351716]
                px-3
                py-1.5
                text-[10px]
                font-medium
                uppercase
                tracking-[0.14em]
                text-[#f3e8d7]
                shadow-sm
              "
            >
              {discount}% Off
            </span>
          )}

          {/* WISHLIST */}

          <button
            type="button"
            aria-label={
              wishlist
                ? `Remove ${product.name} from wishlist`
                : `Add ${product.name} to wishlist`
            }
            onClick={() =>
              toggleWishlist(product)
            }
            className={` 
              absolute
              right-5
              top-5
              z-30
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              border
              transition-all
              duration-200
              active:scale-90
              ${
                wishlist
                  ? "border-[#c9a45c] bg-[#c9a45c] text-[#351716]"
                  : "border-[#c9a45c]/60 bg-[#f3e8d7]/95 text-[#351716] hover:border-[#c9a45c] hover:bg-[#c9a45c]"
              }
            `}
          >
            <span className="text-xl leading-none">
              {wishlist ? "♥" : "♡"}
            </span>
          </button>
        </div>

        {/* =================================================
            PRODUCT INFORMATION
        ================================================= */}

        <div
          className="
            bg-[#f3e8d7]
            px-5
            pb-4
            pt-4
          "
        >

          {/* CATEGORY */}

          <p
            className="
              text-[10px]
              font-medium
              uppercase
              tracking-[0.25em]
              text-[#8f6d32]
            "
          >
            {product.category_name}
          </p>

          {/* NAME */}

          <Link
            to={`/shop/${product.id}`}
            className="mt-2 block min-h-[2.8rem]"
          >
            <h2
              className="
                font-serif
                text-xl
                font-semibold
                leading-[1.15]
                text-[#351716]
                transition-colors
                duration-300
                hover:text-[#8f6d32]
              "
            >
              {product.name}
            </h2>
          </Link>

          {/* WINERY */}

          {product.winery_name && (
            <p
              className="
                mt-1.5
                text-xs
                font-medium
                text-[#351716]/60
              "
            >
              {product.winery_name}
            </p>
          )}

          {/* DESCRIPTION */}

          {product.description && (
            <p
              className="
                mt-2
                line-clamp-2
                text-xs
                leading-5
                text-[#351716]/55
              "
            >
              {product.description}
            </p>
          )}

          {/* DETAILS */}

          <div
            className="
              mt-3
              flex
              flex-wrap
              gap-x-3
              gap-y-1
              text-[10px]
              text-[#351716]/55
            "
          >

            {product.region && (
              <span>
                {product.region}
              </span>
            )}

            {product.vintage && (
              <span>
                Vintage {product.vintage}
              </span>
            )}

            {product.alcohol_percentage && (
              <span>
                {product.alcohol_percentage}% ABV
              </span>
            )}

            {variant?.bottle_size && (
              <span>
                {variant.bottle_size}
              </span>
            )}

          </div>

          {/* GOLD DIVIDER */}

          <div
            className="
              my-3
              h-px
              bg-[#c9a45c]/35
            "
          />

          {/* RATING */}

          <div
            className="
              flex
              min-h-5
              items-center
            "
          >

            {reviewCount > 0 ? (
              <>
                <span
                  className="
                    text-xs
                    tracking-wide
                    text-[#a88342]
                  "
                  aria-label={`${rating} out of 5 stars`}
                >
                  {"★".repeat(
                    Math.min(
                      5,
                      Math.max(
                        0,
                        Math.round(rating)
                      )
                    )
                  )}

                  {"☆".repeat(
                    5 -
                      Math.min(
                        5,
                        Math.max(
                          0,
                          Math.round(rating)
                        )
                      )
                  )}
                </span>

                <span
                  className="
                    ml-2
                    text-[10px]
                    text-[#351716]/55
                  "
                >
                  {rating.toFixed(1)} (
                  {reviewCount})
                </span>
              </>
            ) : (
              <span
                className="
                  text-[11px]
                  text-[#351716]/50
                "
              >
                No reviews yet
              </span>
            )}

          </div>

          {/* PRICE */}

          {variant && (
            <div
              className="
                mt-3
                flex
                items-baseline
                gap-3
              "
            >

              <span
                className="
                  font-serif
                  text-[21px]
                  font-semibold
                  text-[#351716]
                "
              >
                ₹
                {sellingPrice.toLocaleString(
                  "en-IN"
                )}
              </span>

              {mrp > sellingPrice && (
                <span
                  className="
                    text-xs
                    text-[#351716]/40
                    line-through
                  "
                >
                  ₹
                  {mrp.toLocaleString(
                    "en-IN"
                  )}
                </span>
              )}

            </div>
          )}

          {/* STOCK */}

          <p
            className={`
              mt-1.5
              text-[10px]
              font-medium
              uppercase
              tracking-[0.16em]
              ${
                isInStock
                  ? "text-green-800"
                  : "text-red-800"
              }
            `}
          >
            {isInStock
              ? "In Stock"
              : "Out of Stock"}
          </p>

          {/* =================================================
              ERROR MESSAGE
          ================================================= */}

          {actionError && (
            <div
              className="
                mt-3
                border
                border-red-800/20
                bg-red-900/5
                px-3
                py-2.5
              "
            >
              <p
                className="
                  text-[10px]
                  leading-4
                  text-red-900
                "
              >
                {actionError}
              </p>
            </div>
          )}

          {/* =================================================
              SHOP ACTIONS
          ================================================= */}

          {showCartActions ? (
            <>

              <div
                className="
                  mt-3
                  flex
                  gap-2
                "
              >

                {/* ADD TO CART */}

                <button
                  type="button"
                  disabled={
                    !isInStock ||
                    cartLoading ||
                    buyingNow
                  }
                  onClick={
                    handleAddToCart
                  }
                  className={`
                    flex-1
                    rounded-md
                    border
                    px-2
                    py-2.5
                    text-[10px]
                    font-medium
                    uppercase
                    tracking-[0.12em]
                    transition-all
                    duration-300
                    active:scale-[0.97]
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                    ${
                      addedToCart
                        ? "border-[#8f6d32] bg-[#8f6d32] text-[#f3e8d7]"
                        : "border-[#351716] text-[#351716] hover:bg-[#351716] hover:text-[#f3e8d7]"
                    }
                  `}
                >
                  {addedToCart
                    ? "✓ Added to Cart"
                    : "Add to Cart"}
                </button>

                {/* BUY NOW */}

                <button
                  type="button"
                  disabled={
                    !isInStock ||
                    cartLoading ||
                    buyingNow
                  }
                  onClick={
                    handleBuyNow
                  }
                  className="
                    flex-1
                    rounded-md
                    bg-[#351716]
                    px-2
                    py-2.5
                    text-[10px]
                    font-medium
                    uppercase
                    tracking-[0.12em]
                    text-[#f3e8d7]
                    transition-all
                    duration-300
                    hover:bg-[#4a211d]
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  {buyingNow
                    ? "Preparing..."
                    : "Buy Now"}
                </button>

              </div>

              {/* VIEW DETAILS */}

              <Link
                to={`/shop/${product.id}`}
                className="
                  mt-2.5
                  block
                  w-full
                  rounded-md
                  border
                  border-[#351716]/20
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

            </>
          ) : (

            /* =================================================
               BEST SELLER ACTION
            ================================================= */

            <Link
              to={`/shop/${product.id}`}
              className="
                relative
                mt-3
                block
                w-full
                overflow-hidden
                rounded-md
                border
                border-[#351716]
                px-4
                py-2.5
                text-center
                text-[10px]
                font-medium
                uppercase
                tracking-[0.18em]
                text-[#351716]
                transition-all
                duration-300
                hover:bg-[#351716]
                hover:text-[#f3e8d7]
                active:scale-[0.98]
              "
            >
              Explore Wine
            </Link>

          )}

        </div>
      </div>

      {/* =================================================
          SUBTLE REFLECTION
      ================================================= */}

      <div
        className="
          pointer-events-none
          absolute
          -bottom-8
          left-[10%]
          right-[10%]
          h-12
          overflow-hidden
          opacity-[0.14]
          blur-[2px]
        "
      >
        <div
          className="
            h-full
            scale-y-[-0.35]
            rounded-2xl
            bg-gradient-to-b
            from-[#351716]/35
            to-transparent
          "
        />
      </div>

    </article>
  );
}

export default ProductCard;