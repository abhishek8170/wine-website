import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext.jsx";
import { getImageUrl } from "../utils/image";

function ProductDetails() {
  const {
    addToCart,
    setCartItemQuantity,
    cartItems,
    loading: cartLoading,
  } = useCart();

  const navigate = useNavigate();
  const { id } = useParams();

  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const [buyingNow, setBuyingNow] = useState(false);

  const [selectedImage, setSelectedImage] = useState("");

  /* -------------------------------------------------------
     REVIEWS
  ------------------------------------------------------- */

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");

  /* -------------------------------------------------------
     FETCH PRODUCT
  ------------------------------------------------------- */

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");
        setActionMessage("");
        setActionError("");

        const response = await fetch(
          `http://localhost:5000/api/products/${id}`
        );

        if (!response.ok) {
          throw new Error("Product not found");
        }

        const data = await response.json();

        if (!data.success || !data.product) {
          throw new Error("Product not found");
        }

        setProduct(data.product);
        setQuantity(1);
      } catch (err) {
        // console.error("Product details error:", err);
        setError("Unable to load this wine.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  /* -------------------------------------------------------
     FETCH PRODUCT REVIEWS
  ------------------------------------------------------- */

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        setReviewsError("");

        const response = await fetch(
          `http://localhost:5000/api/reviews/product/${id}`
        );

        if (!response.ok) {
          throw new Error("Unable to load reviews");
        }

        const data = await response.json();

        console.log(
          "PRODUCT REVIEWS API RESPONSE:",
          data
        );

        if (!data.success) {
          throw new Error(
            data.message || "Unable to load reviews"
          );
        }

        /*
          Support the existing API response structure
          without changing the backend.
        */

        const reviewList =
          data.reviews ||
          data.data?.reviews ||
          data.data ||
          [];

        setReviews(
          Array.isArray(reviewList)
            ? reviewList
            : []
        );
      } catch (err) {
        console.error(
          "Product reviews error:",
          err
        );

        setReviewsError(
          "Unable to load customer reviews."
        );
      } finally {
        setReviewsLoading(false);
      }
    };

    if (id) {
      fetchReviews();
    }
  }, [id]);

  /* -------------------------------------------------------
     PRODUCT IMAGES
  ------------------------------------------------------- */

  /*
    Image priority:

    1. Current uploaded product.image_url
    2. Existing product.images
    3. Default wine image

    Duplicate image URLs are removed.
  */

  const productImages = [
    ...(product?.image_url
      ? [{ image_url: product.image_url }]
      : []),

    ...(Array.isArray(product?.images)
      ? product.images
      : []),
  ].filter(
    (image, index, array) =>
      image?.image_url &&
      array.findIndex(
        (item) => item.image_url === image.image_url
      ) === index
  );

  /* -------------------------------------------------------
     SET DEFAULT SELECTED IMAGE
  ------------------------------------------------------- */

  useEffect(() => {
    if (!product) {
      return;
    }

    if (productImages.length > 0) {
      setSelectedImage(productImages[0].image_url);
    } else {
      setSelectedImage("/images/wine.png");
    }
  }, [product?.id]);

  const imageUrl = getImageUrl(
    selectedImage || "/images/wine.png"
  );

  /* -------------------------------------------------------
     PRODUCT VARIANT
  ------------------------------------------------------- */

  const variant = product?.variants?.[0];

  const stock = Number(
    variant?.stock_quantity || 0
  );

  const isInStock = stock > 0;

  /* -------------------------------------------------------
     CURRENT CART ITEM
  ------------------------------------------------------- */

  const currentCartItem = cartItems?.find(
    (item) =>
      Number(item.productId) === Number(product?.id) &&
      Number(item.variantId) === Number(variant?.id)
  );

  /* -------------------------------------------------------
     CLEAR ACTION MESSAGES
  ------------------------------------------------------- */

  const clearActionMessages = () => {
    setActionMessage("");
    setActionError("");
  };

  /* -------------------------------------------------------
     ADD TO CART
  ------------------------------------------------------- */

  const handleAddToCart = async () => {
    if (!product || !variant || !isInStock) {
      return;
    }

    clearActionMessages();

    try {
      await addToCart(product, quantity);

      setActionMessage(
        `${quantity} ${
          quantity === 1 ? "bottle has" : "bottles have"
        } been added to your cart.`
      );

      setTimeout(() => {
        setActionMessage("");
      }, 2500);
    } catch (err) {
      // console.error("Add to cart error:", err);

      setActionError(
        err.message ||
          "Unable to add this wine to your cart. Please try again."
      );
    }
  };

  /* -------------------------------------------------------
     BUY NOW
  ------------------------------------------------------- */

  const handleBuyNow = async () => {
    if (!product || !variant || !isInStock) {
      return;
    }

    clearActionMessages();

    try {
      setBuyingNow(true);

      if (currentCartItem) {
        await setCartItemQuantity(
          product.id,
          variant.id,
          quantity
        );
      } else {
        await addToCart(product, quantity);
      }

      navigate("/checkout");
    } catch (err) {
      // console.error("Buy now error:", err);

      setActionError(
        err.message ||
          "Unable to continue to checkout. Please try again."
      );
    } finally {
      setBuyingNow(false);
    }
  };

  /* -------------------------------------------------------
     QUANTITY
  ------------------------------------------------------- */

  const increaseQuantity = () => {
    clearActionMessages();

    setQuantity((current) => {
      if (current >= stock) {
        return current;
      }

      return current + 1;
    });
  };

  const decreaseQuantity = () => {
    clearActionMessages();

    setQuantity((current) => {
      if (current <= 1) {
        return 1;
      }

      return current - 1;
    });
  };

  /* -------------------------------------------------------
     IMAGE ERROR HANDLER
  ------------------------------------------------------- */

  const handleImageError = (event) => {
    const currentSrc = event.currentTarget.src;

    const currentIndex = productImages.findIndex(
      (image) => getImageUrl(image.image_url) === currentSrc
    );

    if (
      currentIndex !== -1 &&
      currentIndex + 1 < productImages.length
    ) {
      const nextImage =
        productImages[currentIndex + 1].image_url;

      setSelectedImage(nextImage);
      return;
    }

    event.currentTarget.src = "/images/wine.png";
  };

  /* -------------------------------------------------------
     REVIEW HELPERS
  ------------------------------------------------------- */

  const getReviewRating = (review) => {
    return Math.min(
      5,
      Math.max(
        0,
        Number(review?.rating || 0)
      )
    );
  };

  const getReviewCustomerName = (review) => {
    return (
      review?.customer_name ||
      review?.customerName ||
      review?.customer?.name ||
      "VINEORA Customer"
    );
  };

  const getReviewTitle = (review) => {
    return (
      review?.review_title ||
      review?.reviewTitle ||
      ""
    );
  };

  const getReviewText = (review) => {
    return (
      review?.review_text ||
      review?.reviewText ||
      ""
    );
  };

  const isVerifiedPurchase = (review) => {
    return (
      review?.is_verified_purchase === true ||
      review?.isVerifiedPurchase === true
    );
  };

  const getReviewDate = (review) => {
    const date =
      review?.created_at ||
      review?.createdAt;

    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  /* -------------------------------------------------------
     PRODUCT DATA
     
     IMPORTANT:
     These declarations must come BEFORE
     displayReviewAverage below.
  ------------------------------------------------------- */

  const mrp = Number(
    variant?.mrp || 0
  );

  const sellingPrice = Number(
    variant?.selling_price || 0
  );

  const rating = Number(
    product?.average_rating || 0
  );

  const reviewCount = Number(
    product?.review_count || 0
  );

  const discount =
    mrp > sellingPrice
      ? Math.round(
          ((mrp - sellingPrice) / mrp) * 100
        )
      : 0;

  /* -------------------------------------------------------
     REVIEW STATISTICS
  ------------------------------------------------------- */

  const publicReviewCount = reviews.length;

  const calculatedReviewAverage =
    publicReviewCount > 0
      ? reviews.reduce(
          (total, review) =>
            total + getReviewRating(review),
          0
        ) / publicReviewCount
      : 0;

  /*
    Use the product-level rating when available.
    Otherwise calculate it from the reviews returned
    by the public review API.
  */

  const displayReviewAverage =
    reviewCount > 0
      ? rating
      : calculatedReviewAverage;

  /* -------------------------------------------------------
     LOADING
  ------------------------------------------------------- */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3e8d7] px-5 py-20">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[#8f6d32]">
            Loading Wine
          </p>

          <div className="mx-auto mt-6 h-10 w-10 animate-spin rounded-full border-2 border-[#c9a45c] border-t-transparent" />
        </div>
      </main>
    );
  }

  /* -------------------------------------------------------
     ERROR
  ------------------------------------------------------- */

  if (error || !product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3e8d7] px-5">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[#8f6d32]">
            Wine Not Found
          </p>

          <h1 className="mt-4 font-serif text-4xl text-[#351716]">
            This wine is unavailable
          </h1>

          <p className="mt-4 text-sm text-[#351716]/60">
            We could not find the wine you are looking for.
          </p>

          <Link
            to="/shop"
            className="
              mt-8
              inline-block
              rounded-md
              bg-[#351716]
              px-7
              py-3
              text-xs
              font-medium
              uppercase
              tracking-[0.18em]
              text-[#f3e8d7]
              transition-all
              duration-300
              hover:bg-[#4a211d]
            "
          >
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3e8d7]">

      {/* =====================================
          BREADCRUMB
      ====================================== */}

      <section className="border-b border-[#c9a45c]/20 bg-[#eee1ce] px-5 py-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#351716]/50">

            <Link
              to="/"
              className="transition-colors hover:text-[#8f6d32]"
            >
              Home
            </Link>

            <span>/</span>

            <Link
              to="/shop"
              className="transition-colors hover:text-[#8f6d32]"
            >
              Shop
            </Link>

            <span>/</span>

            <span className="text-[#351716]">
              {product.name}
            </span>

          </div>
        </div>
      </section>

      {/* =====================================
          PRODUCT MAIN SECTION
      ====================================== */}

      <section className="px-5 py-10 md:px-8 md:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:gap-16">

          {/* =====================================
              PRODUCT IMAGE
          ====================================== */}

          <div className="relative">

            <div
              className="
                relative
                flex
                aspect-square
                items-center
                justify-center
                overflow-hidden
                rounded-2xl
                border
                border-[#c9a45c]/60
                bg-[#e8dbc7]
                shadow-[0_15px_40px_rgba(53,23,22,0.10)]
              "
            >

              {/* INNER FRAME */}

              <div
                className="
                  pointer-events-none
                  absolute
                  inset-4
                  rounded-xl
                  border
                  border-[#c9a45c]/70
                  md:inset-6
                "
              />

              {/* DISCOUNT */}

              {discount > 0 && (
                <span
                  className="
                    absolute
                    left-7
                    top-7
                    z-20
                    rounded-sm
                    bg-[#351716]
                    px-4
                    py-2
                    text-[10px]
                    font-medium
                    uppercase
                    tracking-[0.16em]
                    text-[#f3e8d7]
                  "
                >
                  {discount}% Off
                </span>
              )}

              {/* WISHLIST */}

              <button
                type="button"
                onClick={() =>
                  toggleWishlist(product)
                }
                aria-label={
                  isInWishlist(product.id)
                    ? "Remove from wishlist"
                    : "Add to wishlist"
                }
                className={`absolute right-7 top-7 z-20 flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 active:scale-90 ${
                  isInWishlist(product.id)
                    ? "border-[#c9a45c] bg-[#c9a45c] text-[#351716]"
                    : "border-[#c9a45c]/60 bg-[#f3e8d7] text-[#351716] hover:bg-[#c9a45c]"
                }`}
              >
                <span className="text-xl">
                  {isInWishlist(product.id)
                    ? "♥"
                    : "♡"}
                </span>
              </button>

              {/* MAIN PRODUCT IMAGE */}

              <img
                src={imageUrl}
                alt={product.name}
                onError={handleImageError}
                className="
                  relative
                  z-10
                  h-full
                  w-full
                  object-contain
                  px-12
                  py-12
                  transition-transform
                  duration-700
                  hover:scale-[1.03]
                "
              />

            </div>

            {/* =====================================
                ALTERNATE IMAGES
            ====================================== */}

            {productImages.length > 1 && (
              <div className="mt-5 flex flex-wrap justify-center gap-3">

                {productImages.map(
                  (image, index) => {
                    const thumbnailUrl =
                      getImageUrl(
                        image.image_url
                      );

                    const isSelected =
                      selectedImage ===
                      image.image_url;

                    return (
                      <button
                        key={`${image.image_url}-${index}`}
                        type="button"
                        onClick={() =>
                          setSelectedImage(
                            image.image_url
                          )
                        }
                        className={`relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border bg-[#e8dbc7] transition-all duration-300 ${
                          isSelected
                            ? "border-[#c9a45c] ring-1 ring-[#c9a45c]"
                            : "border-[#351716]/15 hover:border-[#c9a45c]/70"
                        }`}
                        aria-label={`View image ${
                          index + 1
                        }`}
                      >
                        <img
                          src={thumbnailUrl}
                          alt={`${product.name} ${
                            index + 1
                          }`}
                          onError={(event) => {
                            event.currentTarget.src =
                              "/images/wine.png";
                          }}
                          className="h-full w-full object-contain p-2"
                        />
                      </button>
                    );
                  }
                )}

              </div>
            )}

            {/* REFLECTION */}

            <div
              className="
                pointer-events-none
                mx-auto
                mt-3
                h-8
                w-[65%]
                rounded-full
                bg-[#351716]/10
                blur-xl
              "
            />

          </div>

          {/* =====================================
              PRODUCT INFORMATION
          ====================================== */}

          <div className="flex flex-col justify-center">

            {/* CATEGORY */}

            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#8f6d32]">
              {product.category_name || "Wine"}
            </p>

            {/* NAME */}

            <h1
              className="
                mt-3
                max-w-2xl
                font-serif
                text-4xl
                font-semibold
                leading-tight
                text-[#351716]
                md:text-5xl
              "
            >
              {product.name}
            </h1>

            {/* WINERY */}

            {product.winery_name && (
              <p className="mt-3 text-sm text-[#351716]/55">
                {product.winery_name}
              </p>
            )}

            {/* DESCRIPTION */}

            {product.description && (
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#351716]/65">
                {product.description}
              </p>
            )}

            {/* RATING */}

            <div className="mt-5 flex items-center">

              {reviewCount > 0 ||
              publicReviewCount > 0 ? (
                <>
                  <span className="text-sm tracking-wide text-[#a88342]">
                    {"★".repeat(
                      Math.round(
                        displayReviewAverage
                      )
                    )}

                    {"☆".repeat(
                      5 -
                        Math.round(
                          displayReviewAverage
                        )
                    )}
                  </span>

                  <span className="ml-3 text-xs text-[#351716]/55">
                    {displayReviewAverage.toFixed(
                      1
                    )}{" "}
                    (
                    {reviewCount ||
                      publicReviewCount}{" "}
                    {reviewCount ||
                    publicReviewCount ===
                      1
                      ? "review"
                      : "reviews"}
                    )
                  </span>
                </>
              ) : (
                <span className="text-xs text-[#351716]/50">
                  No reviews yet
                </span>
              )}

            </div>

            {/* DIVIDER */}

            <div className="my-6 h-px bg-[#c9a45c]/35" />

            {/* PRICE */}

            <div className="flex items-baseline gap-4">

              <span className="font-serif text-3xl font-semibold text-[#351716]">
                ₹
                {sellingPrice.toLocaleString(
                  "en-IN"
                )}
              </span>

              {mrp > sellingPrice && (
                <span className="text-sm text-[#351716]/40 line-through">
                  ₹
                  {mrp.toLocaleString(
                    "en-IN"
                  )}
                </span>
              )}

            </div>

            {/* BOTTLE SIZE */}

            {variant?.bottle_size && (
              <p className="mt-2 text-xs text-[#351716]/55">
                Bottle Size:{" "}
                {variant.bottle_size}
              </p>
            )}

            {/* STOCK */}

            <p
              className={`mt-3 text-[10px] font-medium uppercase tracking-[0.18em] ${
                isInStock
                  ? "text-green-800"
                  : "text-red-800"
              }`}
            >
              {isInStock
                ? `${stock} bottles available`
                : "Currently out of stock"}
            </p>

            {/* QUANTITY */}

            {isInStock && (
              <div className="mt-7">

                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[#351716]/55">
                  Quantity
                </p>

                <div className="flex h-12 w-32 items-center rounded-md border border-[#351716]/20">

                  <button
                    type="button"
                    onClick={
                      decreaseQuantity
                    }
                    disabled={
                      cartLoading ||
                      buyingNow
                    }
                    className="
                      flex
                      h-full
                      w-10
                      items-center
                      justify-center
                      text-lg
                      text-[#351716]
                      transition-colors
                      hover:text-[#8f6d32]
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    −
                  </button>

                  <span className="flex-1 text-center text-sm text-[#351716]">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={
                      increaseQuantity
                    }
                    disabled={
                      cartLoading ||
                      buyingNow ||
                      quantity >= stock
                    }
                    className="
                      flex
                      h-full
                      w-10
                      items-center
                      justify-center
                      text-lg
                      text-[#351716]
                      transition-colors
                      hover:text-[#8f6d32]
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    +
                  </button>

                </div>

                {quantity >= stock && (
                  <p className="mt-2 text-[10px] text-[#8f6d32]">
                    Maximum available quantity selected.
                  </p>
                )}

              </div>
            )}

            {/* ACTION MESSAGES */}

            {actionMessage && (
              <div className="mt-5 border border-green-800/20 bg-green-900/5 px-4 py-3">
                <p className="text-xs leading-5 text-green-900">
                  ✓ {actionMessage}
                </p>
              </div>
            )}

            {actionError && (
              <div className="mt-5 border border-red-800/20 bg-red-900/5 px-4 py-3">
                <p className="text-xs leading-5 text-red-900">
                  {actionError}
                </p>
              </div>
            )}

            {/* ACTION BUTTONS */}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">

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
                className="
                  flex-1
                  rounded-md
                  border
                  border-[#351716]
                  px-6
                  py-3.5
                  text-[10px]
                  font-medium
                  uppercase
                  tracking-[0.18em]
                  text-[#351716]
                  transition-all
                  duration-300
                  active:scale-[0.98]
                  hover:bg-[#351716]
                  hover:text-[#f3e8d7]
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                {cartLoading
                  ? "Updating..."
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
                  px-6
                  py-3.5
                  text-[10px]
                  font-medium
                  uppercase
                  tracking-[0.18em]
                  text-[#f3e8d7]
                  transition-all
                  duration-300
                  hover:bg-[#4a211d]
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                {buyingNow
                  ? "Preparing Checkout..."
                  : "Buy Now"}
              </button>

            </div>

            {/* TRUST DETAILS */}

            <div className="mt-7 grid grid-cols-3 border-y border-[#c9a45c]/20 py-5">

              <div className="px-3 text-center first:pl-0">
                <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-[#8f6d32]">
                  Authentic
                </p>

                <p className="mt-2 text-[10px] leading-4 text-[#351716]/55">
                  Carefully selected wines
                </p>
              </div>

              <div className="border-x border-[#c9a45c]/20 px-3 text-center">
                <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-[#8f6d32]">
                  Quality
                </p>

                <p className="mt-2 text-[10px] leading-4 text-[#351716]/55">
                  Premium collection
                </p>
              </div>

              <div className="px-3 text-center last:pr-0">
                <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-[#8f6d32]">
                  Secure
                </p>

                <p className="mt-2 text-[10px] leading-4 text-[#351716]/55">
                  Safe checkout
                </p>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* =====================================
          WINE DETAILS
      ====================================== */}

      <section className="border-t border-[#c9a45c]/20 bg-[#eee1ce] px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-7xl">

          <div className="mb-8">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#8f6d32]">
              Discover the Wine
            </p>

            <h2 className="mt-2 font-serif text-3xl text-[#351716]">
              Wine Details
            </h2>
          </div>

          <div className="grid gap-px overflow-hidden rounded-xl border border-[#c9a45c]/30 bg-[#c9a45c]/20 sm:grid-cols-2 lg:grid-cols-4">

            <div className="bg-[#f3e8d7] p-6">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#8f6d32]">
                Region
              </p>
              <p className="mt-2 text-sm text-[#351716]">
                {product.region || "—"}
              </p>
            </div>

            <div className="bg-[#f3e8d7] p-6">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#8f6d32]">
                Country
              </p>
              <p className="mt-2 text-sm text-[#351716]">
                {product.country || "—"}
              </p>
            </div>

            <div className="bg-[#f3e8d7] p-6">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#8f6d32]">
                Grape
              </p>
              <p className="mt-2 text-sm text-[#351716]">
                {product.grape_variety || "—"}
              </p>
            </div>

            <div className="bg-[#f3e8d7] p-6">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#8f6d32]">
                Vintage
              </p>
              <p className="mt-2 text-sm text-[#351716]">
                {product.vintage || "—"}
              </p>
            </div>

            <div className="bg-[#f3e8d7] p-6">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#8f6d32]">
                Body
              </p>
              <p className="mt-2 text-sm text-[#351716]">
                {product.body || "—"}
              </p>
            </div>

            <div className="bg-[#f3e8d7] p-6">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#8f6d32]">
                Sweetness
              </p>
              <p className="mt-2 text-sm text-[#351716]">
                {product.sweetness || "—"}
              </p>
            </div>

            <div className="bg-[#f3e8d7] p-6">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#8f6d32]">
                Acidity
              </p>
              <p className="mt-2 text-sm text-[#351716]">
                {product.acidity || "—"}
              </p>
            </div>

            <div className="bg-[#f3e8d7] p-6">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#8f6d32]">
                Alcohol
              </p>
              <p className="mt-2 text-sm text-[#351716]">
                {product.alcohol_percentage
                  ? `${product.alcohol_percentage}% ABV`
                  : "—"}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================
          TASTING NOTES
      ====================================== */}

      <section className="bg-[#f3e8d7] px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">

          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#8f6d32]">
              Aroma
            </p>

            <h3 className="mt-3 font-serif text-2xl text-[#351716]">
              The Nose
            </h3>

            <p className="mt-4 text-sm leading-7 text-[#351716]/60">
              {product.aroma ||
                "Tasting notes coming soon."}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#8f6d32]">
              Taste
            </p>

            <h3 className="mt-3 font-serif text-2xl text-[#351716]">
              On the Palate
            </h3>

            <p className="mt-4 text-sm leading-7 text-[#351716]/60">
              {product.taste_profile ||
                product.tasting_notes ||
                "Tasting notes coming soon."}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#8f6d32]">
              Pairing
            </p>

            <h3 className="mt-3 font-serif text-2xl text-[#351716]">
              Food Pairing
            </h3>

            <p className="mt-4 text-sm leading-7 text-[#351716]/60">
              {product.food_pairing ||
                "Pairing suggestions coming soon."}
            </p>
          </div>

        </div>
      </section>

      {/* =====================================
          CUSTOMER REVIEWS
      ====================================== */}

      <section className="border-t border-[#c9a45c]/20 bg-[#eee1ce] px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-7xl">

          {/* SECTION HEADER */}

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

            <div>

              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#8f6d32]">
                Customer Experience
              </p>

              <h2 className="mt-2 font-serif text-3xl text-[#351716] md:text-4xl">
                Customer Reviews
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#351716]/60">
                Discover what wine lovers have shared about this bottle.
              </p>

            </div>

            {/* RATING SUMMARY */}

            {(reviewCount > 0 ||
              publicReviewCount > 0) && (
              <div className="flex items-center gap-4 border border-[#c9a45c]/30 bg-[#f3e8d7] px-5 py-4">

                <div className="text-center">

                  <p className="font-serif text-3xl text-[#351716]">
                    {displayReviewAverage.toFixed(
                      1
                    )}
                  </p>

                  <div className="mt-1 text-sm tracking-wide text-[#a88342]">
                    {"★".repeat(
                      Math.round(
                        displayReviewAverage
                      )
                    )}

                    {"☆".repeat(
                      5 -
                        Math.round(
                          displayReviewAverage
                        )
                    )}
                  </div>

                </div>

                <div className="h-10 w-px bg-[#c9a45c]/30" />

                <div>

                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#8f6d32]">
                    Reviews
                  </p>

                  <p className="mt-1 text-sm text-[#351716]">
                    {reviewCount ||
                      publicReviewCount}
                  </p>

                </div>

              </div>
            )}

          </div>

          {/* REVIEW ERROR */}

          {reviewsError && (
            <div className="mt-8 border border-red-800/15 bg-red-900/5 px-5 py-4">
              <p className="text-xs text-red-900">
                {reviewsError}
              </p>
            </div>
          )}

          {/* REVIEW LOADING */}

          {reviewsLoading && (
            <div className="mt-10 grid gap-5 md:grid-cols-2">

              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="animate-pulse border border-[#351716]/10 bg-[#f3e8d7] p-6 md:p-8"
                >
                  <div className="h-4 w-28 rounded bg-[#351716]/10" />

                  <div className="mt-5 h-5 w-40 rounded bg-[#351716]/10" />

                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-full rounded bg-[#351716]/10" />
                    <div className="h-3 w-5/6 rounded bg-[#351716]/10" />
                    <div className="h-3 w-2/3 rounded bg-[#351716]/10" />
                  </div>
                </div>
              ))}

            </div>
          )}

          {/* NO REVIEWS */}

          {!reviewsLoading &&
            !reviewsError &&
            reviews.length === 0 && (
              <div className="mt-10 border border-[#c9a45c]/25 bg-[#f3e8d7] px-6 py-12 text-center">

                <div className="text-2xl tracking-wide text-[#c9a45c]">
                  ☆☆☆☆☆
                </div>

                <h3 className="mt-4 font-serif text-2xl text-[#351716]">
                  No reviews yet
                </h3>

                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#351716]/55">
                  Be among the first to share your experience with this wine after enjoying it.
                </p>

              </div>
            )}

          {/* REVIEW LIST */}

          {!reviewsLoading &&
            reviews.length > 0 && (
              <div className="mt-10 grid gap-5 md:grid-cols-2">

                {reviews.map(
                  (review, index) => {

                    const reviewRating =
                      getReviewRating(
                        review
                      );

                    const reviewTitle =
                      getReviewTitle(
                        review
                      );

                    const reviewText =
                      getReviewText(
                        review
                      );

                    const customerName =
                      getReviewCustomerName(
                        review
                      );

                    const verified =
                      isVerifiedPurchase(
                        review
                      );

                    const reviewDate =
                      getReviewDate(
                        review
                      );

                    return (
                      <article
                        key={
                          review.id ||
                          `${review.product_id}-${index}`
                        }
                        className="border border-[#351716]/10 bg-[#f3e8d7] p-6 md:p-8"
                      >

                        {/* RATING + DATE */}

                        <div className="flex flex-wrap items-center justify-between gap-3">

                          <div className="text-sm tracking-wide text-[#a88342]">
                            {"★".repeat(
                              Math.round(
                                reviewRating
                              )
                            )}

                            {"☆".repeat(
                              5 -
                                Math.round(
                                  reviewRating
                                )
                            )}
                          </div>

                          {reviewDate && (
                            <span className="text-[10px] uppercase tracking-[0.12em] text-[#351716]/35">
                              {reviewDate}
                            </span>
                          )}

                        </div>

                        {/* TITLE */}

                        {reviewTitle && (
                          <h3 className="mt-5 font-serif text-xl text-[#351716]">
                            {reviewTitle}
                          </h3>
                        )}

                        {/* TEXT */}

                        {reviewText && (
                          <p className="mt-4 text-sm leading-7 text-[#351716]/65">
                            “{reviewText}”
                          </p>
                        )}

                        {/* CUSTOMER */}

                        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#351716]/10 pt-5">

                          <span className="text-xs font-medium text-[#351716]">
                            {customerName}
                          </span>

                          {verified && (
                            <span className="inline-flex items-center gap-1 border border-green-800/20 bg-green-900/5 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-green-800">
                              ✓ Verified Purchase
                            </span>
                          )}

                        </div>

                      </article>
                    );
                  }
                )}

              </div>
            )}

        </div>
      </section>

      {/* =====================================
          SERVING & STORAGE
      ====================================== */}

      <section className="border-t border-[#c9a45c]/20 bg-[#351716] px-5 py-12 text-[#f3e8d7] md:px-8 md:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2">

          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#c9a45c]">
              Serving
            </p>

            <h3 className="mt-3 font-serif text-2xl">
              Best Served
            </h3>

            <p className="mt-4 text-sm leading-7 text-[#f3e8d7]/65">
              {product.serving_temperature ||
                product.serving_temp ||
                "Serve at the recommended temperature."}
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#c9a45c]">
              Storage
            </p>

            <h3 className="mt-3 font-serif text-2xl">
              Preserve the Character
            </h3>

            <p className="mt-4 text-sm leading-7 text-[#f3e8d7]/65">
              {product.storage_instructions ||
                product.storage ||
                "Store in a cool, dark place away from direct sunlight."}
            </p>
          </div>

        </div>
      </section>

      {/* =====================================
          BACK TO SHOP
      ====================================== */}

      <section className="bg-[#f3e8d7] px-5 py-10 text-center">

        <Link
          to="/shop"
          className="
            inline-block
            rounded-md
            border
            border-[#351716]
            px-7
            py-3
            text-[10px]
            font-medium
            uppercase
            tracking-[0.18em]
            text-[#351716]
            transition-all
            duration-300
            hover:bg-[#351716]
            hover:text-[#f3e8d7]
          "
        >
          Continue Shopping
        </Link>

      </section>

    </main>
  );
}

export default ProductDetails;