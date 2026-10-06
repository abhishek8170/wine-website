import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const getImageUrl = (imageUrl) => {
  if (!imageUrl) {
    return "/images/wine.png";
  }

  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }

  return `http://localhost:5000${
    imageUrl.startsWith("/")
      ? imageUrl
      : `/${imageUrl}`
  }`;
};

const Orders = () => {
  const navigate = useNavigate();

  const {
    token,
    loading: authLoading,
    logout,
  } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      if (authLoading) {
        return;
      }

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5000/api/orders",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          if (
            response.status === 401 ||
            response.status === 403
          ) {
            logout();
            navigate("/login");
            return;
          }

          throw new Error(
            data.message ||
              "Failed to load orders."
          );
        }

        const receivedOrders =
          Array.isArray(data.orders)
            ? data.orders
            : Array.isArray(data.data)
            ? data.data
            : Array.isArray(data)
            ? data
            : [];

        setOrders(receivedOrders);
      } catch (err) {
        console.error(
          "Orders loading error:",
          err
        );

        setError(
          err.message ||
            "Unable to load your orders."
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [
    token,
    authLoading,
    navigate,
    logout,
  ]);

  // =====================================
  // FORMAT DATE
  // =====================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =====================================
  // FORMAT AMOUNT
  // =====================================

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    );
  };

  // =====================================
  // STATUS STYLE
  // =====================================

  const getStatusClass = (status) => {
    const value = String(
      status || ""
    ).toLowerCase();

    if (
      value.includes("delivered") ||
      value.includes("completed")
    ) {
      return "border-green-800/20 bg-green-800/5 text-green-800";
    }

    if (
      value.includes("cancel") ||
      value.includes("failed")
    ) {
      return "border-red-800/20 bg-red-800/5 text-red-800";
    }

    if (
      value.includes("ship") ||
      value.includes("process")
    ) {
      return "border-[#94774c]/30 bg-[#94774c]/5 text-[#80602c]";
    }

    return "border-[#94774c]/20 bg-[#94774c]/5 text-[#80602c]";
  };

  // =====================================
  // LOADING
  // =====================================

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[#f2e8d8] text-[#321817]">
        <section className="flex min-h-screen flex-col items-center justify-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#c6a56a]/50 bg-[#4a2020]">
            <span className="font-serif text-xl text-[#c6a56a]">
              V
            </span>
          </div>

          <p className="text-[10px] uppercase tracking-[0.3em] text-[#94774c]">
            Preparing your orders
          </p>

          <div className="mt-6 h-8 w-8 animate-spin rounded-full border-2 border-[#c6a56a]/30 border-t-[#4a2020]" />
        </section>
      </main>
    );
  }

  // =====================================
  // ERROR
  // =====================================

  if (error) {
    return (
      <main className="min-h-screen bg-[#f2e8d8] text-[#321817]">
        <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <span className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#94774c]">
            VINEORA MEMBER AREA
          </span>

          <h1 className="font-serif text-4xl font-normal sm:text-5xl">
            Unable to load orders
          </h1>

          <p className="mt-5 max-w-md text-sm leading-7 text-[#755d56]">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-8 bg-[#4a2020] px-7 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f5ecdc] transition hover:bg-[#321515]"
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  // =====================================
  // EMPTY ORDERS
  // =====================================

  if (orders.length === 0) {
    return (
      <main className="min-h-screen bg-[#f2e8d8] text-[#321817]">
        <section className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
          <div className="border-b border-[#5b332e]/15 pb-8">
            <Link
              to="/account"
              className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#94774c] transition hover:text-[#4a2020]"
            >
              ← Back to Account
            </Link>

            <div className="mt-8">
              <span className="mb-3 block text-[9px] font-semibold uppercase tracking-[0.25em] text-[#94774c]">
                VINEORA
              </span>

              <h1 className="font-serif text-4xl font-normal sm:text-5xl lg:text-6xl">
                My Orders
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[#755d56]">
                Your wine purchases and
                order history will appear
                here.
              </p>
            </div>
          </div>

          <div className="mt-10 border border-dashed border-[#5b332e]/20 bg-[#fffaf2]/50 px-6 py-16 text-center backdrop-blur-xl sm:py-24">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#c6a56a]/40 bg-[#4a2020]">
              <span className="font-serif text-xl text-[#c6a56a]">
                V
              </span>
            </div>

            <h2 className="mt-7 font-serif text-3xl font-normal">
              Your wine journey begins here
            </h2>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#755d56]">
              You haven't placed an order
              yet. Explore our collection
              and discover something
              exceptional.
            </p>

            <Link
              to="/shop"
              className="mt-8 inline-flex bg-[#4a2020] px-8 py-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#f5ecdc] transition hover:bg-[#321515]"
            >
              Explore Wines
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // =====================================
  // ORDERS PAGE
  // =====================================

  return (
    <main className="min-h-screen bg-[#f2e8d8] text-[#321817]">
      {/* =====================================
          HERO
      ===================================== */}

      <section className="relative overflow-hidden bg-[#321414]">
        <div className="absolute -right-40 -top-40 h-[450px] w-[450px] rounded-full bg-[#8c6249]/20 blur-[120px]" />

        <div className="absolute -bottom-40 left-1/4 h-[350px] w-[350px] rounded-full bg-[#7b2929]/20 blur-[100px]" />

        <div className="relative mx-auto max-w-[1280px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
          <Link
            to="/account"
            className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#c6a56a] transition hover:text-[#f5ecdc]"
          >
            ← Back to Account
          </Link>

          <div className="mt-10">
            <div className="mb-5 flex items-center gap-4">
              <span className="h-px w-10 bg-[#c6a56a]/70" />

              <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#c6a56a]">
                VINEORA MEMBER
              </span>
            </div>

            <h1 className="font-serif text-4xl font-normal leading-none tracking-[-0.03em] text-[#f7eee1] sm:text-5xl md:text-6xl">
              My Orders
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-[#f5ecdc]/55 sm:text-base">
              A record of your VINEORA
              wine selections, purchases
              and deliveries.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================
          CONTENT
      ===================================== */}

      <section className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-20">
        {/* TOP BAR */}

        <div className="mb-8 flex flex-col gap-4 border-b border-[#5b332e]/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#94774c]">
              Order History
            </span>

            <h2 className="mt-2 font-serif text-3xl font-normal sm:text-4xl">
              Your Purchases
            </h2>
          </div>

          <p className="text-xs text-[#755d56]">
            {orders.length}{" "}
            {orders.length === 1
              ? "order"
              : "orders"}
          </p>
        </div>

        {/* =====================================
            ORDER LIST
        ===================================== */}

        <div className="space-y-5">
          {orders.map((order) => {
            const orderNumber =
              order.order_number ||
              order.orderNumber ||
              `Order #${order.id}`;

            const orderStatus =
              order.order_status ||
              order.orderStatus ||
              "New Order";

            const paymentStatus =
              order.payment_status ||
              order.paymentStatus ||
              "Pending";

            const total =
              order.total_amount ??
              order.totalAmount ??
              0;

            const createdAt =
              order.created_at ||
              order.createdAt;

            const itemCount =
              order.item_count ??
              order.itemCount ??
              order.total_items ??
              order.totalItems ??
              null;

            const orderItems =
              Array.isArray(order.items)
                ? order.items
                : [];

            const visibleItems =
              orderItems.slice(0, 3);

            const remainingItems =
              Math.max(
                orderItems.length - 3,
                0
              );

            return (
              <article
                key={
                  order.id ||
                  orderNumber
                }
                className="group overflow-hidden border border-[#5b332e]/10 bg-[#fffaf2]/65 shadow-[0_20px_60px_rgba(48,23,19,0.05)] backdrop-blur-xl transition duration-300 hover:border-[#94774c]/25 hover:shadow-[0_25px_70px_rgba(48,23,19,0.08)]"
              >
                {/* =====================================
                    ORDER HEADER
                ===================================== */}

                <div className="flex flex-col gap-5 border-b border-[#5b332e]/10 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                  <div>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#94774c]">
                      Order Number
                    </span>

                    <h3 className="mt-2 break-all font-serif text-xl text-[#321817] sm:text-2xl">
                      {orderNumber}
                    </h3>
                  </div>

                  <div
                    className={`w-fit border px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] ${getStatusClass(
                      orderStatus
                    )}`}
                  >
                    {orderStatus}
                  </div>
                </div>

                {/* =====================================
                    PRODUCT PREVIEW
                ===================================== */}

                <div className="border-b border-[#5b332e]/10 px-6 py-6 sm:px-8">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#94774c]">
                      Your Wines
                    </span>

                    {itemCount !== null && (
                      <span className="text-[10px] text-[#755d56]">
                        {itemCount}{" "}
                        {Number(itemCount) === 1
                          ? "item"
                          : "items"}
                      </span>
                    )}
                  </div>

                  {visibleItems.length > 0 ? (
                    <div className="mt-5 space-y-3">
                      {visibleItems.map(
                        (item) => {
                          const image =
                            getImageUrl(
                              item.imageUrl ||
                                item.image_url
                            );

                          const productName =
                            item.productName ||
                            item.product_name ||
                            "Wine Selection";

                          const bottleSize =
                            item.bottleSize ||
                            item.bottle_size;

                          const quantity =
                            Number(
                              item.quantity || 0
                            );

                          return (
                            <div
                              key={
                                item.id ||
                                `${productName}-${quantity}`
                              }
                              className="flex items-center gap-4 border border-[#5b332e]/10 bg-[#f8efe2]/55 p-3 sm:p-4"
                            >
                              {/* WINE IMAGE */}

                              <div className="flex h-[76px] w-[62px] shrink-0 items-center justify-center overflow-hidden bg-[#eee1d1] p-1 sm:h-[88px] sm:w-[72px]">
                                <img
                                  src={image}
                                  alt={
                                    item.imageAlt ||
                                    item.image_alt ||
                                    productName
                                  }
                                  className="h-full w-full object-contain"
                                  onError={(
                                    event
                                  ) => {
                                    if (
                                      event
                                        .currentTarget
                                        .src
                                        .includes(
                                          "/images/wine.png"
                                        )
                                    ) {
                                      return;
                                    }

                                    event.currentTarget.src =
                                      "/images/wine.png";
                                  }}
                                />
                              </div>

                              {/* PRODUCT INFO */}

                              <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#94774c]">
                                  WINE SELECTION
                                </p>

                                <h4 className="mt-1 font-serif text-lg leading-tight text-[#321817] sm:text-xl">
                                  {productName}
                                </h4>

                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#755d56]">
                                  {bottleSize && (
                                    <span>
                                      {bottleSize}
                                    </span>
                                  )}

                                  {bottleSize &&
                                    quantity > 0 && (
                                      <span className="text-[#b39b7a]">
                                        •
                                      </span>
                                    )}

                                  {quantity > 0 && (
                                    <span>
                                      Qty{" "}
                                      {quantity}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}

                      {/* MORE ITEMS */}

                      {remainingItems > 0 && (
                        <p className="pt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#94774c]">
                          +{" "}
                          {remainingItems} more{" "}
                          {remainingItems === 1
                            ? "item"
                            : "items"}{" "}
                          in this order
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 border border-dashed border-[#5b332e]/15 px-4 py-5">
                      <p className="text-xs text-[#755d56]">
                        View order details to
                        see the wines included
                        in this order.
                      </p>
                    </div>
                  )}
                </div>

                {/* =====================================
                    ORDER INFORMATION
                ===================================== */}

                <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="border-b border-[#5b332e]/10 px-6 py-5 sm:border-r sm:px-8 lg:border-b-0">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#94774c]">
                      Order Date
                    </span>

                    <p className="mt-2 text-sm font-medium text-[#43221f]">
                      {formatDate(
                        createdAt
                      )}
                    </p>
                  </div>

                  <div className="border-b border-[#5b332e]/10 px-6 py-5 sm:px-8 lg:border-b-0 lg:border-r">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#94774c]">
                      Payment
                    </span>

                    <p className="mt-2 text-sm font-medium text-[#43221f]">
                      {paymentStatus}
                    </p>
                  </div>

                  <div className="border-b border-[#5b332e]/10 px-6 py-5 sm:border-r sm:px-8 lg:border-b-0">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#94774c]">
                      Items
                    </span>

                    <p className="mt-2 text-sm font-medium text-[#43221f]">
                      {itemCount !==
                      null
                        ? itemCount
                        : "View details"}
                    </p>
                  </div>

                  <div className="px-6 py-5 sm:px-8">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#94774c]">
                      Total
                    </span>

                    <p className="mt-2 font-serif text-2xl text-[#321817]">
                      ₹
                      {formatAmount(
                        total
                      )}
                    </p>
                  </div>
                </div>

                {/* =====================================
                    FOOTER
                ===================================== */}

                <div className="flex flex-col gap-4 border-t border-[#5b332e]/10 bg-[#f8efe2]/45 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                  <div>
                    <span className="text-[9px] uppercase tracking-[0.15em] text-[#755d56]">
                      Payment Status
                    </span>

                    <p className="mt-1 text-xs font-medium text-[#43221f]">
                      {paymentStatus}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/orders/${order.id}`
                      )
                    }
                    className="inline-flex items-center justify-center border border-[#5b332e]/25 px-6 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#43221f] transition hover:border-[#94774c] hover:bg-[#4a2020] hover:text-[#f5ecdc]"
                  >
                    View Order Details

                    <span className="ml-3 transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* =====================================
            BOTTOM
        ===================================== */}

        <div className="mt-10 flex flex-col gap-4 border-t border-[#5b332e]/15 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/shop"
            className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#755d56] transition hover:text-[#4a2020]"
          >
            Continue Shopping →
          </Link>

          <Link
            to="/account"
            className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#755d56] transition hover:text-[#4a2020]"
          >
            Back to Account →
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Orders;