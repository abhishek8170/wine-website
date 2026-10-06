import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Clock3,
  Eye,
  Mail,
  Package,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  User,
  X,
} from "lucide-react";

import {
  getAdminOrderById,
  getAdminOrders,
  updateAdminOrderStatus,
  updateAdminPaymentStatus,
} from "../services/api";

import { useAdminAuth } from "../context/AdminAuthContext";


// =====================================
// CONSTANTS
// =====================================

const ORDER_STATUSES = [
  "New Order",
  "Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const PAYMENT_STATUSES = [
  "Pending",
  "Paid",
  "Completed",
  "Failed",
  "Refunded",
];


// =====================================
// HELPERS
// =====================================

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const formatDateTime = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

const getInitials = (name) => {
  if (!name) return "C";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};


// =====================================
// STATUS STYLES
// =====================================

const getOrderStatusClass = (status) => {
  const value = String(status || "")
    .toLowerCase();

  if (value === "delivered") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (
    value === "cancelled" ||
    value === "canceled"
  ) {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (
    value === "shipped" ||
    value === "out for delivery"
  ) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  if (
    value === "processing" ||
    value === "packed" ||
    value === "confirmed"
  ) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-[#f5eee4] text-[#6c5850] border-[#dfd1bf]";
};

const getPaymentStatusClass = (status) => {
  const value = String(status || "")
    .toLowerCase();

  if (
    value === "paid" ||
    value === "completed" ||
    value === "success" ||
    value === "successful"
  ) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (value === "failed") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (value === "refunded") {
    return "bg-purple-50 text-purple-700 border-purple-200";
  }

  return "bg-amber-50 text-amber-700 border-amber-200";
};


// =====================================
// MAIN COMPONENT
// =====================================

const Orders = () => {
  const { token } = useAdminAuth();

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [paymentFilter, setPaymentFilter] =
    useState("All");

  const [refreshing, setRefreshing] =
    useState(false);

  const [updatingOrderStatus, setUpdatingOrderStatus] =
    useState(false);

  const [updatingPaymentStatus, setUpdatingPaymentStatus] =
    useState(false);

  const [mobileExpandedOrder, setMobileExpandedOrder] =
    useState(null);


  // =====================================
  // LOAD ORDERS
  // =====================================

  const loadOrders = async (
    showRefresh = false
  ) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response =
        await getAdminOrders(token);

      setOrders(
        Array.isArray(response.orders)
          ? response.orders
          : []
      );
    } catch (err) {
      console.error(
        "Admin orders loading error:",
        err
      );

      setError(
        err.message ||
          "Failed to load orders"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    if (token) {
      loadOrders();
    }
  }, [token]);


  // =====================================
  // FILTER ORDERS
  // =====================================

  const filteredOrders = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !searchValue ||
        String(order.orderNumber || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(
          order.customer?.name || ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        String(
          order.customer?.email || ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        String(
          order.customer?.phone || ""
        )
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        order.orderStatus === statusFilter;

      const matchesPayment =
        paymentFilter === "All" ||
        order.paymentStatus === paymentFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment
      );
    });
  }, [
    orders,
    search,
    statusFilter,
    paymentFilter,
  ]);


  // =====================================
  // OPEN ORDER
  // =====================================

  const openOrder = async (orderId) => {
    try {
      setDetailsLoading(true);
      setActionError("");
      setSuccessMessage("");

      const response =
        await getAdminOrderById(
          token,
          orderId
        );

      setSelectedOrder(
        response.order || null
      );
    } catch (err) {
      console.error(
        "Order details error:",
        err
      );

      setActionError(
        err.message ||
          "Failed to load order details"
      );
    } finally {
      setDetailsLoading(false);
    }
  };


  // =====================================
  // CLOSE ORDER
  // =====================================

  const closeOrder = () => {
    setSelectedOrder(null);
    setActionError("");
    setSuccessMessage("");
  };


  // =====================================
  // UPDATE ORDER STATUS
  // =====================================

  const handleOrderStatusChange = async (
    event
  ) => {
    const newStatus =
      event.target.value;

    if (!selectedOrder) return;

    try {
      setUpdatingOrderStatus(true);
      setActionError("");
      setSuccessMessage("");

      const response =
        await updateAdminOrderStatus(
          token,
          selectedOrder.id,
          {
            order_status: newStatus,
            notes:
              `Order status changed to ${newStatus} by admin`,
          }
        );

      setSelectedOrder((current) => ({
        ...current,
        orderStatus:
          response.order?.orderStatus ||
          newStatus,
      }));

      setOrders((current) =>
        current.map((order) =>
          order.id === selectedOrder.id
            ? {
                ...order,
                orderStatus:
                  response.order
                    ?.orderStatus ||
                  newStatus,
              }
            : order
        )
      );

      setSuccessMessage(
        "Order status updated successfully."
      );
    } catch (err) {
      console.error(
        "Order status update error:",
        err
      );

      setActionError(
        err.message ||
          "Failed to update order status"
      );
    } finally {
      setUpdatingOrderStatus(false);
    }
  };


  // =====================================
  // UPDATE PAYMENT STATUS
  // =====================================

  const handlePaymentStatusChange = async (
    event
  ) => {
    const newStatus =
      event.target.value;

    if (!selectedOrder) return;

    try {
      setUpdatingPaymentStatus(true);
      setActionError("");
      setSuccessMessage("");

      const response =
        await updateAdminPaymentStatus(
          token,
          selectedOrder.id,
          {
            payment_status: newStatus,
          }
        );

      setSelectedOrder((current) => ({
        ...current,
        paymentStatus:
          response.order
            ?.paymentStatus ||
          newStatus,
      }));

      setOrders((current) =>
        current.map((order) =>
          order.id === selectedOrder.id
            ? {
                ...order,
                paymentStatus:
                  response.order
                    ?.paymentStatus ||
                  newStatus,
              }
            : order
        )
      );

      setSuccessMessage(
        "Payment status updated successfully."
      );
    } catch (err) {
      console.error(
        "Payment status update error:",
        err
      );

      setActionError(
        err.message ||
          "Failed to update payment status"
      );
    } finally {
      setUpdatingPaymentStatus(false);
    }
  };


  // =====================================
  // SUMMARY
  // =====================================

  const summary = useMemo(() => {
    return {
      total: orders.length,

      pending: orders.filter((order) =>
        [
          "New Order",
          "Confirmed",
          "Processing",
          "Packed",
          "Shipped",
          "Out for Delivery",
        ].includes(order.orderStatus)
      ).length,

      delivered: orders.filter(
        (order) =>
          order.orderStatus ===
          "Delivered"
      ).length,

      cancelled: orders.filter((order) =>
        [
          "Cancelled",
          "Canceled",
        ].includes(order.orderStatus)
      ).length,
    };
  }, [orders]);


  // =====================================
  // LOADING
  // =====================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f1e8] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">

          <div className="mb-8">
            <div className="h-3 w-28 animate-pulse rounded bg-[#e5d8c7]" />

            <div className="mt-4 h-9 w-52 animate-pulse rounded bg-[#e5d8c7]" />

            <div className="mt-3 h-4 w-80 animate-pulse rounded bg-[#e5d8c7]" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl border border-[#e5d8c7] bg-[#fbf8f3]"
              />
            ))}
          </div>

          <div className="mt-6 h-96 animate-pulse rounded-2xl border border-[#e5d8c7] bg-[#fbf8f3]" />
        </div>
      </div>
    );
  }


  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="min-h-screen bg-[#f7f1e8] text-[#351716]">

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a88342]">
              VINEORA ADMIN
            </p>

            <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight sm:text-4xl">
              Orders
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#6c5850]">
              Manage customer orders, payment
              status and order fulfilment from
              one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d9c8b4] bg-[#fbf8f3] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#351716] transition hover:border-[#c9a45c] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>


        {/* ================================= */}
        {/* ERROR */}
        {/* ================================= */}

        {error && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                loadOrders()
              }
              className="w-fit rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider"
            >
              Try Again
            </button>
          </div>
        )}


        {/* ================================= */}
        {/* SUMMARY CARDS */}
        {/* ================================= */}

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <SummaryCard
            icon={ShoppingBag}
            label="Total Orders"
            value={summary.total}
          />

          <SummaryCard
            icon={Clock3}
            label="Active Orders"
            value={summary.pending}
          />

          <SummaryCard
            icon={Truck}
            label="Delivered"
            value={summary.delivered}
          />

          <SummaryCard
            icon={Package}
            label="Cancelled"
            value={summary.cancelled}
          />

        </div>


        {/* ================================= */}
        {/* FILTERS */}
        {/* ================================= */}

        <div className="mt-6 rounded-2xl border border-[#e1d5c7] bg-[#fbf8f3] p-4 shadow-[0_10px_30px_rgba(53,23,22,0.04)]">

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">

            {/* SEARCH */}

            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9b887c]"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search order number, customer, email or phone..."
                className="h-12 w-full rounded-xl border border-[#dfd2c4] bg-white pl-11 pr-4 text-sm text-[#351716] outline-none transition placeholder:text-[#aa9b90] focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/10"
              />
            </div>


            {/* ORDER STATUS */}

            <FilterSelect
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              options={[
                "All",
                ...ORDER_STATUSES,
              ]}
            />


            {/* PAYMENT */}

            <FilterSelect
              value={paymentFilter}
              onChange={(event) =>
                setPaymentFilter(
                  event.target.value
                )
              }
              options={[
                "All",
                ...PAYMENT_STATUSES,
              ]}
            />

          </div>


          <div className="mt-3 flex items-center justify-between text-xs text-[#8b786c]">
            <span>
              Showing{" "}
              <strong className="text-[#351716]">
                {filteredOrders.length}
              </strong>{" "}
              of{" "}
              <strong className="text-[#351716]">
                {orders.length}
              </strong>{" "}
              orders
            </span>

            {(search ||
              statusFilter !== "All" ||
              paymentFilter !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setPaymentFilter("All");
                }}
                className="font-semibold text-[#8d6b2c] hover:text-[#351716]"
              >
                Clear filters
              </button>
            )}
          </div>

        </div>


        {/* ================================= */}
        {/* EMPTY */}
        {/* ================================= */}

        {filteredOrders.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[#d9c8b4] bg-[#fbf8f3] px-6 py-16 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f0e5d7] text-[#8d6b2c]">
              <ShoppingBag size={23} />
            </div>

            <h2 className="mt-5 font-serif text-xl">
              No orders found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#78665d]">
              Try changing your search or
              removing one of the filters.
            </p>

          </div>
        ) : (

          <>
            {/* ================================= */}
            {/* DESKTOP TABLE */}
            {/* ================================= */}

            <div className="mt-6 hidden overflow-hidden rounded-2xl border border-[#e1d5c7] bg-[#fbf8f3] shadow-[0_10px_30px_rgba(53,23,22,0.04)] lg:block">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1050px]">

                  <thead>
                    <tr className="border-b border-[#e5dacf] bg-[#f7f0e7]">

                      <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8c786d]">
                        Order
                      </th>

                      <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8c786d]">
                        Customer
                      </th>

                      <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8c786d]">
                        Date
                      </th>

                      <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8c786d]">
                        Items
                      </th>

                      <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8c786d]">
                        Total
                      </th>

                      <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8c786d]">
                        Order Status
                      </th>

                      <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8c786d]">
                        Payment
                      </th>

                      <th className="px-5 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8c786d]">
                        Action
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#eee5da]">

                    {filteredOrders.map(
                      (order) => (
                        <tr
                          key={order.id}
                          className="transition hover:bg-white"
                        >

                          <td className="px-5 py-5">
                            <p className="font-semibold text-[#351716]">
                              {order.orderNumber}
                            </p>

                            <p className="mt-1 text-xs text-[#9a887d]">
                              #{order.id}
                            </p>
                          </td>


                          <td className="px-5 py-5">

                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eee1d1] text-[11px] font-semibold text-[#6f4e42]">
                                {getInitials(
                                  order.customer
                                    ?.name
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-medium text-[#351716]">
                                  {order.customer
                                    ?.name ||
                                    "Guest"}
                                </p>

                                <p className="mt-1 truncate text-xs text-[#9a887d]">
                                  {order.customer
                                    ?.email ||
                                    "—"}
                                </p>
                              </div>

                            </div>

                          </td>


                          <td className="px-5 py-5 text-sm text-[#6c5850]">
                            {formatDate(
                              order.createdAt
                            )}
                          </td>


                          <td className="px-5 py-5 text-sm text-[#6c5850]">
                            {order.itemCount}{" "}
                            {order.itemCount ===
                            1
                              ? "item"
                              : "items"}
                          </td>


                          <td className="px-5 py-5 font-semibold text-[#351716]">
                            {formatCurrency(
                              order.totalAmount
                            )}
                          </td>


                          <td className="px-5 py-5">
                            <StatusBadge
                              status={
                                order.orderStatus
                              }
                              type="order"
                            />
                          </td>


                          <td className="px-5 py-5">
                            <StatusBadge
                              status={
                                order.paymentStatus
                              }
                              type="payment"
                            />
                          </td>


                          <td className="px-5 py-5 text-right">

                            <button
                              type="button"
                              onClick={() =>
                                openOrder(
                                  order.id
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-full border border-[#d8c7b3] bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#5b3b34] transition hover:border-[#c9a45c] hover:text-[#351716]"
                            >
                              <Eye size={14} />
                              View
                            </button>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>


            {/* ================================= */}
            {/* MOBILE ORDERS */}
            {/* ================================= */}

            <div className="mt-6 space-y-3 lg:hidden">

              {filteredOrders.map(
                (order) => {
                  const expanded =
                    mobileExpandedOrder ===
                    order.id;

                  return (
                    <div
                      key={order.id}
                      className="overflow-hidden rounded-2xl border border-[#e1d5c7] bg-[#fbf8f3] shadow-[0_8px_25px_rgba(53,23,22,0.04)]"
                    >

                      <button
                        type="button"
                        onClick={() =>
                          setMobileExpandedOrder(
                            expanded
                              ? null
                              : order.id
                          )
                        }
                        className="flex w-full items-center gap-3 p-4 text-left"
                      >

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eee1d1] text-xs font-semibold text-[#6f4e42]">
                          {getInitials(
                            order.customer
                              ?.name
                          )}
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-center justify-between gap-3">

                            <p className="truncate font-semibold text-[#351716]">
                              {order.orderNumber}
                            </p>

                            <span className="shrink-0 font-semibold text-[#351716]">
                              {formatCurrency(
                                order.totalAmount
                              )}
                            </span>

                          </div>

                          <p className="mt-1 truncate text-xs text-[#8f7b70]">
                            {order.customer
                              ?.name ||
                              "Guest"}{" "}
                            ·{" "}
                            {formatDate(
                              order.createdAt
                            )}
                          </p>

                        </div>

                        {expanded ? (
                          <ChevronDown
                            size={17}
                            className="shrink-0 text-[#8c786d]"
                          />
                        ) : (
                          <ChevronRight
                            size={17}
                            className="shrink-0 text-[#8c786d]"
                          />
                        )}

                      </button>


                      {expanded && (
                        <div className="border-t border-[#e8ddd1] px-4 pb-4 pt-4">

                          <div className="grid grid-cols-2 gap-3">

                            <MobileInfo
                              label="Items"
                              value={`${order.itemCount}`}
                            />

                            <MobileInfo
                              label="Order Date"
                              value={formatDate(
                                order.createdAt
                              )}
                            />

                            <div>
                              <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#9a887d]">
                                Order status
                              </p>

                              <StatusBadge
                                status={
                                  order.orderStatus
                                }
                                type="order"
                              />
                            </div>

                            <div>
                              <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#9a887d]">
                                Payment
                              </p>

                              <StatusBadge
                                status={
                                  order.paymentStatus
                                }
                                type="payment"
                              />
                            </div>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              openOrder(
                                order.id
                              )
                            }
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#351716] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#f8f1e8] transition hover:bg-[#4b2422]"
                          >
                            <Eye size={15} />
                            View Order Details
                          </button>

                        </div>
                      )}

                    </div>
                  );
                }
              )}

            </div>

          </>
        )}

      </div>


      {/* =================================== */}
      {/* ORDER DETAIL MODAL */}
      {/* =================================== */}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={closeOrder}
          onOrderStatusChange={
            handleOrderStatusChange
          }
          onPaymentStatusChange={
            handlePaymentStatusChange
          }
          updatingOrderStatus={
            updatingOrderStatus
          }
          updatingPaymentStatus={
            updatingPaymentStatus
          }
          actionError={actionError}
          successMessage={
            successMessage
          }
        />
      )}


      {/* =================================== */}
      {/* DETAIL LOADING */}
      {/* =================================== */}

      {detailsLoading && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#351716]/30 px-4 backdrop-blur-sm">

          <div className="rounded-2xl border border-[#e2d5c7] bg-[#fbf8f3] px-7 py-6 text-center shadow-2xl">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#c9a45c] border-t-transparent" />

            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#6c5850]">
              Loading order
            </p>

          </div>

        </div>
      )}

    </div>
  );
};


// =====================================
// SUMMARY CARD
// =====================================

const SummaryCard = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div className="rounded-2xl border border-[#e1d5c7] bg-[#fbf8f3] p-5 shadow-[0_8px_25px_rgba(53,23,22,0.035)]">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#927f73]">
            {label}
          </p>

          <p className="mt-3 font-serif text-3xl text-[#351716]">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#efe3d3] text-[#8d6b2c]">
          <Icon size={18} />
        </div>

      </div>

    </div>
  );
};


// =====================================
// FILTER SELECT
// =====================================

const FilterSelect = ({
  value,
  onChange,
  options,
}) => {
  return (
    <div className="relative w-full xl:w-52">

      <select
        value={value}
        onChange={onChange}
        className="h-12 w-full appearance-none rounded-xl border border-[#dfd2c4] bg-white px-4 pr-10 text-sm text-[#351716] outline-none transition focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/10"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8f7b70]"
      />

    </div>
  );
};


// =====================================
// STATUS BADGE
// =====================================

const StatusBadge = ({
  status,
  type,
}) => {
  const className =
    type === "payment"
      ? getPaymentStatusClass(status)
      : getOrderStatusClass(status);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${className}`}
    >
      {status || "—"}
    </span>
  );
};


// =====================================
// MOBILE INFO
// =====================================

const MobileInfo = ({
  label,
  value,
}) => {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#9a887d]">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-[#4f3832]">
        {value}
      </p>
    </div>
  );
};


// =====================================
// ORDER DETAIL MODAL
// =====================================

const OrderDetailModal = ({
  order,
  onClose,
  onOrderStatusChange,
  onPaymentStatusChange,
  updatingOrderStatus,
  updatingPaymentStatus,
  actionError,
  successMessage,
}) => {
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#351716]/40 px-3 py-4 backdrop-blur-sm sm:px-6 sm:py-8">

      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-[#e1d5c7] bg-[#fbf8f3] shadow-2xl">

        {/* ================================= */}
        {/* MODAL HEADER */}
        {/* ================================= */}

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e5dacf] bg-[#fbf8f3]/95 px-5 py-4 backdrop-blur sm:px-7">

          <div className="min-w-0">

            <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#a88342]">
              ORDER DETAILS
            </p>

            <div className="mt-1 flex items-center gap-3">

              <h2 className="truncate font-serif text-xl text-[#351716] sm:text-2xl">
                {order.orderNumber}
              </h2>

              <span className="hidden text-xs text-[#9b887d] sm:inline">
                #{order.id}
              </span>

            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dfd2c4] text-[#6c5850] transition hover:border-[#c9a45c] hover:text-[#351716]"
          >
            <X size={18} />
          </button>

        </div>


        <div className="p-5 sm:p-7">

          {/* ================================= */}
          {/* ALERTS */}
          {/* ================================= */}

          {actionError && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {actionError}
            </div>
          )}

          {successMessage && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          )}


          {/* ================================= */}
          {/* TOP GRID */}
          {/* ================================= */}

          <div className="grid gap-4 lg:grid-cols-3">

            {/* CUSTOMER */}

            <DetailCard
              icon={User}
              title="Customer"
            >

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eee1d1] text-xs font-semibold text-[#6f4e42]">
                  {getInitials(
                    order.customer?.name
                  )}
                </div>

                <div className="min-w-0">

                  <p className="font-medium text-[#351716]">
                    {order.customer
                      ?.name ||
                      "Guest"}
                  </p>

                  <p className="mt-1 break-all text-xs text-[#8f7b70]">
                    {order.customer
                      ?.email ||
                      "—"}
                  </p>

                </div>

              </div>

              {order.customer?.phone && (
                <div className="mt-4 flex items-center gap-2 text-xs text-[#6c5850]">
                  <Phone size={14} />
                  {order.customer.phone}
                </div>
              )}

              {order.customer?.email && (
                <div className="mt-2 flex items-center gap-2 text-xs text-[#6c5850]">
                  <Mail size={14} />
                  <span className="break-all">
                    {order.customer.email}
                  </span>
                </div>
              )}

            </DetailCard>


            {/* ORDER STATUS */}

            <DetailCard
              icon={Package}
              title="Order Status"
            >

              <p className="mb-3 text-xs text-[#8f7b70]">
                Current order stage
              </p>

              <div className="relative">

                <select
                  value={
                    order.orderStatus || ""
                  }
                  onChange={
                    onOrderStatusChange
                  }
                  disabled={
                    updatingOrderStatus
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-[#dfd2c4] bg-white px-3 pr-9 text-sm font-medium text-[#351716] outline-none focus:border-[#c9a45c] disabled:opacity-60"
                >
                  {ORDER_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8f7b70]"
                />

              </div>

              {updatingOrderStatus && (
                <p className="mt-2 text-[10px] uppercase tracking-wider text-[#8d6b2c]">
                  Updating...
                </p>
              )}

            </DetailCard>


            {/* PAYMENT */}

            <DetailCard
              icon={ShoppingBag}
              title="Payment"
            >

              <p className="mb-3 text-xs text-[#8f7b70]">
                Current payment status
              </p>

              <div className="relative">

                <select
                  value={
                    order.paymentStatus || ""
                  }
                  onChange={
                    onPaymentStatusChange
                  }
                  disabled={
                    updatingPaymentStatus
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-[#dfd2c4] bg-white px-3 pr-9 text-sm font-medium text-[#351716] outline-none focus:border-[#c9a45c] disabled:opacity-60"
                >
                  {PAYMENT_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8f7b70]"
                />

              </div>

              {updatingPaymentStatus && (
                <p className="mt-2 text-[10px] uppercase tracking-wider text-[#8d6b2c]">
                  Updating...
                </p>
              )}

            </DetailCard>

          </div>


          {/* ================================= */}
          {/* ITEMS */}
          {/* ================================= */}

          <div className="mt-5 overflow-hidden rounded-2xl border border-[#e1d5c7]">

            <div className="border-b border-[#e5dacf] bg-[#f7f0e7] px-5 py-4">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#a88342]">
                    PURCHASE
                  </p>

                  <h3 className="mt-1 font-serif text-lg text-[#351716]">
                    Order Items
                  </h3>
                </div>

                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#6c5850]">
                  {order.items?.length || 0}{" "}
                  {order.items?.length ===
                  1
                    ? "item"
                    : "items"}
                </span>

              </div>

            </div>


            <div className="divide-y divide-[#eee5da]">

              {(order.items || []).map(
                (item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                  >

                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-[#e2d5c7] bg-white">

                      {item.imageUrl ? (
                        <img
                          src={
                            item.imageUrl
                          }
                          alt={
                            item.imageAlt ||
                            item.productName
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[#b5a398]">
                          <Package
                            size={20}
                          />
                        </div>
                      )}

                    </div>


                    <div className="min-w-0 flex-1">

                      <h4 className="font-medium text-[#351716]">
                        {item.productName}
                      </h4>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8f7b70]">

                        <span>
                          Size:{" "}
                          <strong className="text-[#5b443d]">
                            {item.bottleSize ||
                              "—"}
                          </strong>
                        </span>

                        <span>
                          Vintage:{" "}
                          <strong className="text-[#5b443d]">
                            {item.vintage ||
                              "—"}
                          </strong>
                        </span>

                        <span>
                          Qty:{" "}
                          <strong className="text-[#5b443d]">
                            {item.quantity}
                          </strong>
                        </span>

                      </div>

                    </div>


                    <div className="text-left sm:text-right">

                      <p className="text-xs text-[#9b887d]">
                        {formatCurrency(
                          item.unitPrice
                        )}{" "}
                        / bottle
                      </p>

                      <p className="mt-1 font-semibold text-[#351716]">
                        {formatCurrency(
                          item.subtotal
                        )}
                      </p>

                    </div>

                  </div>
                )
              )}

            </div>

          </div>


          {/* ================================= */}
          {/* BOTTOM GRID */}
          {/* ================================= */}

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">

            {/* ADDRESS */}

            <div className="rounded-2xl border border-[#e1d5c7] bg-white p-5">

              <div className="flex items-center gap-2">
                <Truck
                  size={16}
                  className="text-[#8d6b2c]"
                />

                <h3 className="font-serif text-lg text-[#351716]">
                  Delivery Information
                </h3>
              </div>

              {order.address ? (
                <div className="mt-4 text-sm leading-6 text-[#6c5850]">

                  <p className="font-medium text-[#351716]">
                    {order.address.addressLine1}
                  </p>

                  {order.address.addressLine2 && (
                    <p>
                      {order.address.addressLine2}
                    </p>
                  )}

                  <p>
                    {order.address.city},{" "}
                    {order.address.state}
                  </p>

                  <p>
                    {order.address.postalCode},{" "}
                    {order.address.country}
                  </p>

                  {order.deliveryInstructions && (
                    <div className="mt-4 rounded-xl bg-[#f7f0e7] p-3">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#927f73]">
                        Delivery instructions
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#6c5850]">
                        {
                          order.deliveryInstructions
                        }
                      </p>
                    </div>
                  )}

                </div>
              ) : (
                <p className="mt-4 text-sm text-[#8f7b70]">
                  No delivery address
                  available.
                </p>
              )}

            </div>


            {/* TOTALS */}

            <div className="rounded-2xl border border-[#e1d5c7] bg-white p-5">

              <h3 className="font-serif text-lg text-[#351716]">
                Order Summary
              </h3>

              <div className="mt-4 space-y-3 text-sm">

                <PriceRow
                  label="Subtotal"
                  value={formatCurrency(
                    order.subtotal
                  )}
                />

                <PriceRow
                  label="Discount"
                  value={formatCurrency(
                    order.discountAmount
                  )}
                />

                <PriceRow
                  label="Shipping"
                  value={formatCurrency(
                    order.shippingAmount
                  )}
                />

                <PriceRow
                  label="Tax"
                  value={formatCurrency(
                    order.taxAmount
                  )}
                />

                <div className="border-t border-[#e7ddd2] pt-4">

                  <div className="flex items-end justify-between gap-4">

                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6c5850]">
                      Total
                    </span>

                    <span className="font-serif text-2xl text-[#351716]">
                      {formatCurrency(
                        order.totalAmount
                      )}
                    </span>

                  </div>

                </div>

              </div>

              {order.couponCode && (
                <div className="mt-4 rounded-xl bg-[#f7f0e7] px-3 py-2 text-xs text-[#6c5850]">
                  Coupon:{" "}
                  <strong>
                    {order.couponCode}
                  </strong>
                </div>
              )}

            </div>

          </div>


          {/* ================================= */}
          {/* STATUS HISTORY */}
          {/* ================================= */}

          <div className="mt-5 rounded-2xl border border-[#e1d5c7] bg-white p-5">

            <div className="flex items-center gap-2">
              <Clock3
                size={16}
                className="text-[#8d6b2c]"
              />

              <h3 className="font-serif text-lg text-[#351716]">
                Order History
              </h3>
            </div>

            {order.statusHistory?.length ? (
              <div className="mt-5 space-y-4">

                {order.statusHistory.map(
                  (history, index) => (
                    <div
                      key={
                        history.id ||
                        index
                      }
                      className="flex gap-3"
                    >

                      <div className="flex flex-col items-center">

                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#c9a45c]" />

                        {index !==
                          order
                            .statusHistory
                            .length -
                            1 && (
                          <span className="mt-1 h-full w-px bg-[#e1d5c7]" />
                        )}

                      </div>

                      <div className="pb-2">

                        <p className="text-sm font-semibold text-[#351716]">
                          {history.status}
                        </p>

                        <p className="mt-1 text-xs text-[#9b887d]">
                          {formatDateTime(
                            history.createdAt
                          )}
                        </p>

                        {history.notes && (
                          <p className="mt-2 text-xs leading-5 text-[#6c5850]">
                            {history.notes}
                          </p>
                        )}

                      </div>

                    </div>
                  )
                )}

              </div>
            ) : (
              <p className="mt-4 text-sm text-[#8f7b70]">
                No status history recorded
                yet.
              </p>
            )}

          </div>


          {/* ================================= */}
          {/* ORDER DATE */}
          {/* ================================= */}

          <div className="mt-5 flex flex-col gap-2 border-t border-[#e5dacf] pt-5 text-xs text-[#9b887d] sm:flex-row sm:items-center sm:justify-between">

            <span>
              Created:{" "}
              {formatDateTime(
                order.createdAt
              )}
            </span>

            <span>
              Last updated:{" "}
              {formatDateTime(
                order.updatedAt
              )}
            </span>

          </div>

        </div>

      </div>

    </div>
  );
};


// =====================================
// DETAIL CARD
// =====================================

const DetailCard = ({
  icon: Icon,
  title,
  children,
}) => {
  return (
    <div className="rounded-2xl border border-[#e1d5c7] bg-white p-5">

      <div className="flex items-center gap-2">

        <Icon
          size={16}
          className="text-[#8d6b2c]"
        />

        <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6c5850]">
          {title}
        </h3>

      </div>

      <div className="mt-4">
        {children}
      </div>

    </div>
  );
};


// =====================================
// PRICE ROW
// =====================================

const PriceRow = ({
  label,
  value,
}) => {
  return (
    <div className="flex items-center justify-between gap-4">

      <span className="text-[#8b786d]">
        {label}
      </span>

      <span className="font-medium text-[#4f3832]">
        {value}
      </span>

    </div>
  );
};


export default Orders;