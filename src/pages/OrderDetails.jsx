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
          `http://localhost:5000/api/orders/${id}`,
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

        console.log("ORDER DETAILS API RESPONSE:", data);
        console.log("ORDER ITEMS:", data.order?.items);

        setOrder(data.order);
      } catch (err) {
        console.error("Order details error:", err);

        setError(
          err.message || "Unable to load order details"
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
  // LOADING
  // =====================================

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[#241311] px-5 py-32 text-[#f3e9d8]">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-8">
            <div className="h-4 w-32 rounded bg-white/10" />

            <div className="h-14 w-80 rounded bg-white/10" />

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="h-64 rounded-3xl bg-white/5 lg:col-span-2" />
              <div className="h-64 rounded-3xl bg-white/5" />
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
      <main className="min-h-screen bg-[#241311] px-5 py-32 text-[#f3e9d8]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#c9a96e]">
            Order unavailable
          </p>

          <h1 className="font-serif text-4xl md:text-6xl">
            We couldn't find this order.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-[#f3e9d8]/60">
            {error ||
              "The order may no longer be available or you may not have permission to view it."}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/orders"
              className="border border-[#c9a96e]/50 bg-[#c9a96e] px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#241311] transition hover:bg-[#e0c38b]"
            >
              Back to Orders
            </Link>

            <Link
              to="/shop"
              className="border border-white/20 px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#f3e9d8] transition hover:border-[#c9a96e]/60 hover:text-[#c9a96e]"
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
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = (status) => {
    const value = String(status || "").toLowerCase();

    if (
      value.includes("deliver") ||
      value.includes("complete")
    ) {
      return "border-green-400/30 bg-green-400/10 text-green-300";
    }

    if (
      value.includes("cancel") ||
      value.includes("fail")
    ) {
      return "border-red-400/30 bg-red-400/10 text-red-300";
    }

    if (
      value.includes("process") ||
      value.includes("ship")
    ) {
      return "border-blue-400/30 bg-blue-400/10 text-blue-300";
    }

    return "border-[#c9a96e]/30 bg-[#c9a96e]/10 text-[#e0c38b]";
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
      return "";
    }

    // If database already returns a complete URL
    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    // Database path such as /images/wine.png
    if (image.startsWith("/")) {
      return image;
    }

    // Database path without leading slash
    return `/${image}`;
  };

  return (
    <main className="min-h-screen bg-[#241311] text-[#f3e9d8]">
      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <section className="border-b border-white/10 px-5 pb-12 pt-32 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <Link
            to="/orders"
            className="group inline-flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-[#f3e9d8]/50 transition hover:text-[#c9a96e]"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              ←
            </span>

            Back to Orders
          </Link>

          <div className="mt-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#c9a96e]">
                Order Confirmation
              </p>

              <h1 className="mt-4 font-serif text-4xl leading-tight md:text-6xl">
                Order Details
              </h1>

              <p className="mt-5 text-sm text-[#f3e9d8]/55">
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

              <p className="text-xs text-[#f3e9d8]/45">
                Placed on {formatDate(order.createdAt)} at{" "}
                {formatTime(order.createdAt)}
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

              <section className="border border-white/10 bg-white/[0.025] backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-6 md:px-8">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">
                      Your Selection
                    </p>

                    <h2 className="mt-2 font-serif text-2xl md:text-3xl">
                      Wine Collection
                    </h2>
                  </div>

                  <span className="text-xs text-[#f3e9d8]/45">
                    {order.items?.length || 0}{" "}
                    {order.items?.length === 1
                      ? "item"
                      : "items"}
                  </span>
                </div>

                <div>
                  {order.items?.map((item, index) => {
                    const productImage =
                      getProductImage(item);

                    return (
                      <div
                        key={item.id}
                        className={`px-6 py-7 md:px-8 ${
                          index !== order.items.length - 1
                            ? "border-b border-white/10"
                            : ""
                        }`}
                      >
                        <div className="flex gap-5">

                          {/* =========================
                              WINE IMAGE
                          ========================= */}

                          <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden border border-[#c9a96e]/20 bg-[#f3e9d8]/5">

                            {productImage ? (
                              <img
                                src={productImage}
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
                                onError={(event) => {
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
                                      color: rgba(201,169,110,0.7);
                                    ">
                                      V
                                    </span>
                                  `;
                                }}
                              />
                            ) : (
                              <span className="font-serif text-2xl text-[#c9a96e]/70">
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
                                <h3 className="font-serif text-xl text-[#f3e9d8]">
                                  {item.productName}
                                </h3>

                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.15em] text-[#f3e9d8]/45">
                                  {item.bottleSize && (
                                    <span>
                                      {item.bottleSize}
                                    </span>
                                  )}

                                  {item.vintage && (
                                    <span>
                                      Vintage {item.vintage}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <p className="font-serif text-lg text-[#c9a96e]">
                                {formatPrice(item.subtotal)}
                              </p>
                            </div>

                            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
                              <span className="text-[#f3e9d8]/45">
                                Quantity{" "}
                                <span className="ml-2 text-[#f3e9d8]">
                                  {item.quantity}
                                </span>
                              </span>

                              <span className="text-[#f3e9d8]/45">
                                {formatPrice(item.unitPrice)}{" "}
                                / bottle
                              </span>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* DELIVERY ADDRESS */}

              {order.address && (
                <section className="border border-white/10 bg-white/[0.025] p-6 backdrop-blur-md md:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">
                        Delivery
                      </p>

                      <h2 className="mt-2 font-serif text-2xl md:text-3xl">
                        Shipping Address
                      </h2>
                    </div>

                    <span className="border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[0.2em] text-[#f3e9d8]/45">
                      {order.address.country || "India"}
                    </span>
                  </div>

                  <div className="mt-7 border-t border-white/10 pt-6 text-sm leading-7 text-[#f3e9d8]/65">
                    <p>{order.address.addressLine1}</p>

                    {order.address.addressLine2 && (
                      <p>{order.address.addressLine2}</p>
                    )}

                    <p>
                      {order.address.city},{" "}
                      {order.address.state}
                    </p>

                    <p>{order.address.postalCode}</p>

                    {order.deliveryInstructions && (
                      <div className="mt-6 border-t border-white/10 pt-5">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#c9a96e]">
                          Delivery Instructions
                        </p>

                        <p className="mt-2">
                          {order.deliveryInstructions}
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
              <section className="border border-[#c9a96e]/20 bg-[#3a1b17]/70 p-6 backdrop-blur-xl md:p-8">

                <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">
                  Order Summary
                </p>

                <h2 className="mt-3 font-serif text-3xl">
                  Your Purchase
                </h2>

                <div className="my-7 border-t border-white/10" />

                <div className="space-y-5 text-sm">

                  <div className="flex justify-between gap-5">
                    <span className="text-[#f3e9d8]/50">
                      Subtotal
                    </span>

                    <span>
                      {formatPrice(order.subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-5">
                    <span className="text-[#f3e9d8]/50">
                      Discount
                    </span>

                    <span>
                      {order.discountAmount > 0
                        ? `-${formatPrice(
                            order.discountAmount
                          )}`
                        : "—"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-5">
                    <span className="text-[#f3e9d8]/50">
                      Shipping
                    </span>

                    <span>
                      {order.shippingAmount > 0
                        ? formatPrice(
                            order.shippingAmount
                          )
                        : "Free"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-5">
                    <span className="text-[#f3e9d8]/50">
                      Tax
                    </span>

                    <span>
                      {order.taxAmount > 0
                        ? formatPrice(order.taxAmount)
                        : "—"}
                    </span>
                  </div>

                </div>

                <div className="my-7 border-t border-white/10" />

                <div className="flex items-end justify-between gap-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#f3e9d8]/40">
                      Total
                    </p>

                    <p className="mt-2 font-serif text-3xl text-[#c9a96e]">
                      {formatPrice(order.totalAmount)}
                    </p>
                  </div>

                  <span className="text-[10px] uppercase tracking-[0.15em] text-[#f3e9d8]/35">
                    INR
                  </span>
                </div>

                {/* PAYMENT */}

                <div className="mt-8 border border-white/10 bg-black/10 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#f3e9d8]/40">
                      Payment
                    </span>

                    <span
                      className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${
                        String(
                          order.paymentStatus || ""
                        ).toLowerCase() === "paid"
                          ? "text-green-300"
                          : "text-[#e0c38b]"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* ORDER NUMBER */}

                <div className="mt-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#f3e9d8]/35">
                    Order Number
                  </p>

                  <p className="mt-2 break-all text-xs text-[#f3e9d8]/65">
                    {order.orderNumber}
                  </p>
                </div>

              </section>

              {/* ACTIONS */}

              <div className="mt-5 space-y-3">
                <Link
                  to="/shop"
                  className="flex w-full items-center justify-center border border-[#c9a96e] bg-[#c9a96e] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#241311] transition hover:bg-[#e0c38b]"
                >
                  Continue Shopping
                </Link>

                <Link
                  to="/orders"
                  className="flex w-full items-center justify-center border border-white/15 px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f3e9d8] transition hover:border-[#c9a96e]/50 hover:text-[#c9a96e]"
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