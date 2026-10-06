import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    token,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================
  // REVIEW STATE
  // =====================================

  const [reviewingProductId, setReviewingProductId] =
    useState(null);

  const [reviewRating, setReviewRating] = useState(5);

  const [reviewTitle, setReviewTitle] = useState("");

  const [reviewText, setReviewText] = useState("");

  const [reviewSubmitting, setReviewSubmitting] =
    useState(false);

  const [reviewMessage, setReviewMessage] =
    useState("");

  const [reviewError, setReviewError] =
    useState("");

  // =====================================
  // CANCEL ORDER STATE
  // =====================================

  const [cancelling, setCancelling] =
    useState(false);

  const [cancelMessage, setCancelMessage] =
    useState("");

  const [cancelError, setCancelError] =
    useState("");

  // =====================================
  // LOAD ORDER
  // =====================================

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !token) {
      navigate("/login");
      return;
    }

    const loadOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/orders/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load order details"
          );
        }

        console.log(
          "ORDER DETAILS API RESPONSE:",
          data
        );

        console.log(
          "ORDER ITEMS:",
          data.order?.items
        );

        setOrder(data.order);
      } catch (err) {
        console.error(
          "Order details error:",
          err
        );

        setError(
          err.message ||
            "Unable to load order details"
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [
    id,
    token,
    isAuthenticated,
    authLoading,
    navigate,
  ]);

  // =====================================
  // CANCEL ORDER
  // =====================================

  const canCancelOrder = ["new order", "processing"].includes(
    String(order?.orderStatus || "").trim().toLowerCase()
  );

  const handleCancelOrder = async () => {
    if (!order || cancelling) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this order? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      setCancelling(true);
      setCancelError("");
      setCancelMessage("");

      const response = await fetch(
        `/api/orders/${id}/cancel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to cancel order"
        );
      }

      setOrder((previous) => ({
        ...previous,
        orderStatus: "Cancelled",
      }));

      setCancelMessage(
        data.message || "Your order has been cancelled."
      );
    } catch (err) {
      setCancelError(
        err.message || "Unable to cancel order"
      );
    } finally {
      setCancelling(false);
    }
  };

  // =====================================
  // LOADING
  // =====================================

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[#f3e8d7] px-5 py-32 text-[#351716]">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-8">
            <div className="h-4 w-32 rounded bg-[#351716]/10" />

            <div className="h-14 w-80 rounded bg-[#351716]/10" />

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="h-64 rounded-3xl bg-[#351716]/5 lg:col-span-2" />

              <div className="h-64 rounded-3xl bg-[#351716]/5" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // =====================================
  // ERROR
  // =====================================

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#f3e8d7] px-5 py-32 text-[#351716]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#a88342]">
            Order unavailable
          </p>

          <h1 className="font-serif text-4xl leading-tight text-[#351716] md:text-6xl">
            We couldn't find this order.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-[#351716]/60">
            {error ||
              "The order may no longer be available or you may not have permission to view it."}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/orders"
              className="border border-[#c9a45c] bg-[#c9a45c] px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#351716] transition hover:bg-[#a88342] hover:text-white"
            >
              Back to Orders
            </Link>

            <Link
              to="/shop"
              className="border border-[#351716]/20 px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#351716] transition hover:border-[#c9a45c] hover:text-[#8b1e2d]"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // =====================================
  // HELPERS
  // =====================================

  const formatPrice = (value) => {
    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN")}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const getStatusClass = (status) => {
    const value = String(
      status || ""
    ).toLowerCase();

    if (
      value.includes("deliver") ||
      value.includes("complete")
    ) {
      return "border-green-700/20 bg-green-700/10 text-green-800";
    }

    if (
      value.includes("cancel") ||
      value.includes("fail")
    ) {
      return "border-red-700/20 bg-red-700/10 text-red-800";
    }

    if (
      value.includes("process") ||
      value.includes("ship")
    ) {
      return "border-blue-700/20 bg-blue-700/10 text-blue-800";
    }

    return "border-[#c9a45c]/40 bg-[#c9a45c]/10 text-[#8b6a2e]";
  };

  // =====================================
  // GET PRODUCT IMAGE
  // =====================================

  const getProductImage = (item) => {
    const image =
      item?.imageUrl ||
      item?.image_url ||
      item?.imageurl ||
      "";

    if (!image) {
      return "/images/wine.png";
    }

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    return `${
      image.startsWith("/")
        ? image
        : `/${image}`
    }`;
  };

  // =====================================
  // OPEN REVIEW FORM
  // =====================================

  const openReviewForm = (productId) => {
    setReviewingProductId(productId);

    setReviewRating(5);

    setReviewTitle("");

    setReviewText("");

    setReviewMessage("");

    setReviewError("");
  };

  // =====================================
  // CLOSE REVIEW FORM
  // =====================================

  const closeReviewForm = () => {
    if (reviewSubmitting) return;

    setReviewingProductId(null);

    setReviewRating(5);

    setReviewTitle("");

    setReviewText("");

    setReviewMessage("");

    setReviewError("");
  };

  // =====================================
  // SUBMIT REVIEW
  // =====================================

  const handleSubmitReview = async (
    productId
  ) => {
    try {
      if (!reviewText.trim()) {
        setReviewError(
          "Please write your review before submitting."
        );
        return;
      }

      if (
        !Number.isInteger(
          Number(reviewRating)
        )
      ) {
        setReviewError(
          "Please select a rating."
        );
        return;
      }

      setReviewSubmitting(true);

      setReviewError("");

      setReviewMessage("");

      const response = await fetch(
        "/api/reviews",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            product_id: productId,

            rating: Number(reviewRating),

            review_title:
              reviewTitle.trim() || null,

            review_text:
              reviewText.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to submit review"
        );
      }

      console.log(
        "REVIEW SUBMISSION RESPONSE:",
        data
      );

      setReviewMessage(
        "Your review has been submitted and is waiting for approval."
      );

      // Update current order item immediately
      setOrder((previousOrder) => {
        if (!previousOrder) {
          return previousOrder;
        }

        return {
          ...previousOrder,

          items:
            previousOrder.items?.map(
              (item) =>
                Number(item.productId) ===
                Number(productId)
                  ? {
                      ...item,
                      hasReviewed: true,
                    }
                  : item
            ),
        };
      });

      // Close form after a short delay
      setTimeout(() => {
        setReviewingProductId(null);

        setReviewRating(5);

        setReviewTitle("");

        setReviewText("");

        setReviewMessage("");
      }, 1800);
    } catch (err) {
      console.error(
        "Submit review error:",
        err
      );

      setReviewError(
        err.message ||
          "Failed to submit review"
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f3e8d7] text-[#351716]">

      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <section className="border-b border-[#351716]/10 px-5 pb-12 pt-32 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">

          <Link
            to="/orders"
            className="group inline-flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-[#351716]/50 transition hover:text-[#8b1e2d]"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              ←
            </span>

            Back to Orders
          </Link>

          <div className="mt-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">

            <div>

              <p className="text-xs uppercase tracking-[0.35em] text-[#a88342]">
                Order Confirmation
              </p>

              <h1 className="mt-4 font-serif text-4xl leading-tight text-[#351716] md:text-6xl">
                Order Details
              </h1>

              <p className="mt-5 text-sm text-[#351716]/55">
                Order #{order.orderNumber}
              </p>

            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">

              <span
                className={`inline-flex border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] ${getStatusClass(
                  order.orderStatus
                )}`}
              >
                {order.orderStatus}
              </span>

              <p className="text-xs text-[#351716]/45">
                Placed on{" "}
                {formatDate(
                  order.createdAt
                )}{" "}
                at{" "}
                {formatTime(
                  order.createdAt
                )}
              </p>

            </div>

          </div>
        </div>
      </section>

      {/* =====================================
          MAIN CONTENT
      ===================================== */}

      <section className="px-5 py-12 md:px-10 lg:px-16 lg:py-16">

        <div className="mx-auto max-w-7xl">

          <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">

            {/* =================================
                LEFT
            ================================= */}

            <div className="space-y-8">

              {/* ITEMS */}

              <section className="border border-[#351716]/10 bg-[#f8f1e6] shadow-[0_15px_50px_rgba(53,23,22,0.06)]">

                <div className="flex items-center justify-between border-b border-[#351716]/10 px-6 py-6 md:px-8">

                  <div>

                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#a88342]">
                      Your Selection
                    </p>

                    <h2 className="mt-2 font-serif text-2xl text-[#351716] md:text-3xl">
                      Wine Collection
                    </h2>

                  </div>

                  <span className="text-xs text-[#351716]/45">
                    {order.items?.length ||
                      0}{" "}
                    {order.items?.length ===
                    1
                      ? "item"
                      : "items"}
                  </span>

                </div>

                <div>

                  {order.items?.map(
                    (item, index) => {

                      const productImage =
                        getProductImage(
                          item
                        );

                      const canReview =
                        item.canReview ===
                        true;

                      const hasReviewed =
                        item.hasReviewed ===
                        true;

                      const isReviewing =
                        Number(
                          reviewingProductId
                        ) ===
                        Number(
                          item.productId
                        );

                      return (
                        <div
                          key={item.id}
                          className={`px-6 py-7 md:px-8 ${
                            index !==
                            order.items
                              .length -
                              1
                              ? "border-b border-[#351716]/10"
                              : ""
                          }`}
                        >

                          <div className="flex gap-5">

                            {/* =========================
                                WINE IMAGE
                            ========================= */}

                            <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden border border-[#c9a45c]/30 bg-[#f3e8d7]">

                              {productImage ? (
                                <img
                                  src={
                                    productImage
                                  }
                                  alt={
                                    item.imageAlt ||
                                    item.image_alt ||
                                    item.productName
                                  }
                                  className="h-full w-full object-contain p-2"
                                  onLoad={() => {
                                    console.log(
                                      "ORDER IMAGE LOADED:",
                                      productImage
                                    );
                                  }}
                                  onError={(
                                    event
                                  ) => {
                                    console.error(
                                      "ORDER IMAGE FAILED:",
                                      productImage
                                    );

                                    event.currentTarget.style.display =
                                      "none";

                                    event.currentTarget.parentElement.innerHTML = `
                                      <span style="
                                        font-family: serif;
                                        font-size: 24px;
                                        color: #a88342;
                                      ">
                                        V
                                      </span>
                                    `;
                                  }}
                                />
                              ) : (
                                <span className="font-serif text-2xl text-[#a88342]">
                                  V
                                </span>
                              )}

                            </div>

                            {/* =========================
                                DETAILS
                            ========================= */}

                            <div className="min-w-0 flex-1">

                              <div className="flex flex-col justify-between gap-3 md:flex-row">

                                <div>

                                  <h3 className="font-serif text-xl text-[#351716]">
                                    {
                                      item.productName
                                    }
                                  </h3>

                                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.15em] text-[#351716]/45">

                                    {item.bottleSize && (
                                      <span>
                                        {
                                          item.bottleSize
                                        }
                                      </span>
                                    )}

                                    {item.vintage && (
                                      <span>
                                        Vintage{" "}
                                        {
                                          item.vintage
                                        }
                                      </span>
                                    )}

                                  </div>

                                </div>

                                <p className="font-serif text-lg text-[#a88342]">
                                  {formatPrice(
                                    item.subtotal
                                  )}
                                </p>

                              </div>

                              <div className="mt-5 flex items-center justify-between border-t border-[#351716]/10 pt-4 text-xs">

                                <span className="text-[#351716]/45">

                                  Quantity{" "}

                                  <span className="ml-2 text-[#351716]">
                                    {
                                      item.quantity
                                    }
                                  </span>

                                </span>

                                <span className="text-[#351716]/45">

                                  {formatPrice(
                                    item.unitPrice
                                  )}{" "}
                                  / bottle

                                </span>

                              </div>

                              {/* =================================
                                  REVIEW ACTION
                              ================================= */}

                              {canReview &&
                                !hasReviewed &&
                                !isReviewing && (
                                  <div className="mt-5 border-t border-[#351716]/10 pt-5">

                                    <button
                                      type="button"
                                      onClick={() =>
                                        openReviewForm(
                                          item.productId
                                        )
                                      }
                                      className="inline-flex items-center justify-center border border-[#c9a45c] bg-transparent px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8b6a2e] transition hover:bg-[#c9a45c] hover:text-[#351716]"
                                    >
                                      Write a Review
                                    </button>

                                  </div>
                                )}

                              {/* =================================
                                  REVIEW SUBMITTED
                              ================================= */}

                              {canReview &&
                                hasReviewed && (
                                  <div className="mt-5 border-t border-[#351716]/10 pt-5">

                                    <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-green-700">

                                      <span>
                                        ✓
                                      </span>

                                      Review Submitted

                                    </span>

                                  </div>
                                )}

                            </div>

                          </div>

                          {/* =================================
                              REVIEW FORM
                          ================================= */}

                          {isReviewing && (
                            <div className="mt-7 border-t border-[#c9a45c]/30 pt-7">

                              <div className="max-w-2xl">

                                <p className="text-[10px] uppercase tracking-[0.3em] text-[#a88342]">
                                  Share Your Experience
                                </p>

                                <h4 className="mt-2 font-serif text-2xl text-[#351716]">
                                  Review{" "}
                                  {
                                    item.productName
                                  }
                                </h4>

                                {/* RATING */}

                                <div className="mt-6">

                                  <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#351716]/45">
                                    Your Rating
                                  </p>

                                  <div className="flex gap-2">

                                    {[1, 2, 3, 4, 5].map(
                                      (star) => (
                                        <button
                                          key={
                                            star
                                          }
                                          type="button"
                                          onClick={() =>
                                            setReviewRating(
                                              star
                                            )
                                          }
                                          className={`text-2xl transition ${
                                            star <=
                                            reviewRating
                                              ? "text-[#c9a45c]"
                                              : "text-[#351716]/15"
                                          }`}
                                          aria-label={`${star} star rating`}
                                        >
                                          ★
                                        </button>
                                      )
                                    )}

                                  </div>

                                </div>

                                {/* TITLE */}

                                <div className="mt-6">

                                  <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-[#351716]/45">
                                    Review Title
                                  </label>

                                  <input
                                    type="text"
                                    value={
                                      reviewTitle
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      setReviewTitle(
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    placeholder="Give your review a title"
                                    maxLength={120}
                                    className="w-full border border-[#351716]/15 bg-[#f3e8d7] px-4 py-3 text-sm text-[#351716] outline-none transition placeholder:text-[#351716]/30 focus:border-[#c9a45c]"
                                  />

                                </div>

                                {/* REVIEW TEXT */}

                                <div className="mt-6">

                                  <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-[#351716]/45">
                                    Your Review
                                  </label>

                                  <textarea
                                    value={
                                      reviewText
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      setReviewText(
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    placeholder="Tell us about your wine experience..."
                                    rows={5}
                                    maxLength={2000}
                                    className="w-full resize-none border border-[#351716]/15 bg-[#f3e8d7] px-4 py-3 text-sm leading-6 text-[#351716] outline-none transition placeholder:text-[#351716]/30 focus:border-[#c9a45c]"
                                  />

                                  <p className="mt-2 text-right text-[10px] text-[#351716]/35">
                                    {
                                      reviewText.length
                                    }{" "}
                                    / 2000
                                  </p>

                                </div>

                                {/* ERROR */}

                                {reviewError && (
                                  <div className="mt-5 border border-red-700/20 bg-red-700/5 px-4 py-3 text-xs text-red-800">
                                    {
                                      reviewError
                                    }
                                  </div>
                                )}

                                {/* SUCCESS */}

                                {reviewMessage && (
                                  <div className="mt-5 border border-green-700/20 bg-green-700/5 px-4 py-3 text-xs leading-6 text-green-800">
                                    {
                                      reviewMessage
                                    }
                                  </div>
                                )}

                                {/* BUTTONS */}

                                <div className="mt-6 flex flex-wrap gap-3">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSubmitReview(
                                        item.productId
                                      )
                                    }
                                    disabled={
                                      reviewSubmitting
                                    }
                                    className="border border-[#c9a45c] bg-[#c9a45c] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#351716] transition hover:bg-[#a88342] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {reviewSubmitting
                                      ? "Submitting..."
                                      : "Submit Review"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={
                                      closeReviewForm
                                    }
                                    disabled={
                                      reviewSubmitting
                                    }
                                    className="border border-[#351716]/20 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#351716] transition hover:border-[#c9a45c] hover:text-[#8b1e2d] disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>

                                </div>

                                <p className="mt-4 text-[10px] leading-5 text-[#351716]/40">
                                  Your review will be visible after it has been approved.
                                </p>

                              </div>

                            </div>
                          )}

                        </div>
                      );
                    }
                  )}

                </div>

              </section>

              {/* =====================================
                  DELIVERY ADDRESS
              ===================================== */}

              {order.address && (
                <section className="border border-[#351716]/10 bg-[#f8f1e6] p-6 shadow-[0_15px_50px_rgba(53,23,22,0.05)] md:p-8">

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#a88342]">
                        Delivery
                      </p>

                      <h2 className="mt-2 font-serif text-2xl text-[#351716] md:text-3xl">
                        Shipping Address
                      </h2>

                    </div>

                    <span className="border border-[#351716]/10 px-3 py-2 text-[9px] uppercase tracking-[0.2em] text-[#351716]/45">
                      {order.address.country ||
                        "India"}
                    </span>

                  </div>

                  <div className="mt-7 border-t border-[#351716]/10 pt-6 text-sm leading-7 text-[#351716]/65">

                    <p>
                      {
                        order.address
                          .addressLine1
                      }
                    </p>

                    {order.address
                      .addressLine2 && (
                      <p>
                        {
                          order.address
                            .addressLine2
                        }
                      </p>
                    )}

                    <p>
                      {
                        order.address.city
                      }
                      ,{" "}
                      {
                        order.address.state
                      }
                    </p>

                    <p>
                      {
                        order.address
                          .postalCode
                      }
                    </p>

                    {order.deliveryInstructions && (
                      <div className="mt-6 border-t border-[#351716]/10 pt-5">

                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#a88342]">
                          Delivery Instructions
                        </p>

                        <p className="mt-2">
                          {
                            order.deliveryInstructions
                          }
                        </p>

                      </div>
                    )}

                  </div>

                </section>
              )}

            </div>

            {/* =================================
                RIGHT — SUMMARY
            ================================= */}

            <aside className="lg:sticky lg:top-8 lg:self-start">

              <section className="border border-[#c9a45c]/30 bg-[#f8f1e6] p-6 shadow-[0_20px_60px_rgba(53,23,22,0.08)] md:p-8">

                <p className="text-[10px] uppercase tracking-[0.3em] text-[#a88342]">
                  Order Summary
                </p>

                <h2 className="mt-3 font-serif text-3xl text-[#351716]">
                  Your Purchase
                </h2>

                <div className="my-7 border-t border-[#351716]/10" />

                <div className="space-y-5 text-sm">

                  <div className="flex justify-between gap-5">
                    <span className="text-[#351716]/50">
                      Subtotal
                    </span>

                    <span className="text-[#351716]">
                      {formatPrice(
                        order.subtotal
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between gap-5">
                    <span className="text-[#351716]/50">
                      Discount
                    </span>

                    <span className="text-[#351716]">
                      {order.discountAmount >
                      0
                        ? `-${formatPrice(
                            order.discountAmount
                          )}`
                        : "—"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-5">
                    <span className="text-[#351716]/50">
                      Shipping
                    </span>

                    <span className="text-[#351716]">
                      {order.shippingAmount >
                      0
                        ? formatPrice(
                            order.shippingAmount
                          )
                        : "Free"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-5">
                    <span className="text-[#351716]/50">
                      Tax
                    </span>

                    <span className="text-[#351716]">
                      {order.taxAmount > 0
                        ? formatPrice(
                            order.taxAmount
                          )
                        : "—"}
                    </span>
                  </div>

                </div>

                <div className="my-7 border-t border-[#351716]/10" />

                <div className="flex items-end justify-between gap-5">

                  <div>

                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#351716]/40">
                      Total
                    </p>

                    <p className="mt-2 font-serif text-3xl text-[#8b1e2d]">
                      {formatPrice(
                        order.totalAmount
                      )}
                    </p>

                  </div>

                  <span className="text-[10px] uppercase tracking-[0.15em] text-[#351716]/35">
                    INR
                  </span>

                </div>

                {/* PAYMENT */}

                <div className="mt-8 border border-[#351716]/10 bg-[#f3e8d7] p-5">

                  <div className="flex items-center justify-between">

                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#351716]/40">
                      Payment
                    </span>

                    <span
                      className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${
                        String(
                          order.paymentStatus ||
                            ""
                        ).toLowerCase() ===
                        "paid"
                          ? "text-green-700"
                          : "text-[#8b6a2e]"
                      }`}
                    >
                      {
                        order.paymentStatus
                      }
                    </span>

                  </div>

                </div>

                {/* ORDER NUMBER */}

                <div className="mt-5">

                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#351716]/35">
                    Order Number
                  </p>

                  <p className="mt-2 break-all text-xs text-[#351716]/65">
                    {
                      order.orderNumber
                    }
                  </p>

                </div>

              </section>

              {/* ACTIONS */}

              <div className="mt-5 space-y-3">

                {cancelMessage && (
                  <p className="border border-green-700/20 bg-green-50 px-4 py-3 text-xs text-green-800">
                    {cancelMessage}
                  </p>
                )}

                {cancelError && (
                  <p className="border border-[#8b1e2d]/20 bg-[#8b1e2d]/5 px-4 py-3 text-xs text-[#8b1e2d]">
                    {cancelError}
                  </p>
                )}

                {canCancelOrder && (
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="flex w-full items-center justify-center border border-[#8b1e2d] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8b1e2d] transition hover:bg-[#8b1e2d] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cancelling ? "Cancelling..." : "Cancel Order"}
                  </button>
                )}

                <Link
                  to="/shop"
                  className="flex w-full items-center justify-center border border-[#c9a45c] bg-[#c9a45c] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#351716] transition hover:bg-[#a88342] hover:text-white"
                >
                  Continue Shopping
                </Link>

                <Link
                  to="/orders"
                  className="flex w-full items-center justify-center border border-[#351716]/20 px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#351716] transition hover:border-[#c9a45c] hover:text-[#8b1e2d]"
                >
                  View All Orders
                </Link>

              </div>

            </aside>

          </div>

        </div>

      </section>

    </main>
  );
};
export default OrderDetails;