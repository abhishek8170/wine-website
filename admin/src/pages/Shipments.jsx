import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  Loader2,
  MapPin,
  Package,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  Truck,
  User,
  X,
} from "lucide-react";

import {
  createAdminShipment,
  getAdminShipmentById,
  getAdminShipments,
  updateAdminShipment,
} from "../services/api";

import { useAdminAuth } from "../context/AdminAuthContext";


// =====================================
// CONSTANTS
// =====================================

const SHIPPING_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Failed",
  "Returned",
];


// =====================================
// HELPERS
// =====================================

const formatCurrency = (value) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(number);
};


const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

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


const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(
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


const getStatusClasses = (status) => {
  const normalized =
    String(status || "")
      .toLowerCase();

  if (normalized === "delivered") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (
    normalized === "failed" ||
    normalized === "returned"
  ) {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (
    normalized === "shipped" ||
    normalized === "in transit" ||
    normalized === "out for delivery"
  ) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  if (normalized === "processing") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-[#f5eee4] text-[#6c5850] border-[#dfd0bd]";
};


const getShipmentStatusIcon = (status) => {
  const normalized =
    String(status || "")
      .toLowerCase();

  if (normalized === "delivered") {
    return CheckCircle2;
  }

  if (
    normalized === "shipped" ||
    normalized === "in transit" ||
    normalized === "out for delivery"
  ) {
    return Truck;
  }

  if (
    normalized === "failed" ||
    normalized === "returned"
  ) {
    return AlertCircle;
  }

  return Clock3;
};


// =====================================
// SUMMARY CARD
// =====================================

const SummaryCard = ({
  label,
  value,
  icon: Icon,
  description,
}) => {
  return (
    <div className="group rounded-[24px] border border-[#e5d8c9] bg-[#fffdf9] p-5 shadow-[0_12px_35px_rgba(53,23,22,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(53,23,22,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8b766b]">
            {label}
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight text-[#351716]">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-[#8b766b]">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#351716] text-[#f3e8d7]">
          <Icon size={19} strokeWidth={1.7} />
        </div>
      </div>
    </div>
  );
};


// =====================================
// STATUS BADGE
// =====================================

const StatusBadge = ({ status }) => {
  const Icon =
    getShipmentStatusIcon(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${getStatusClasses(
        status
      )}`}
    >
      <Icon size={12} />
      {status || "Pending"}
    </span>
  );
};


// =====================================
// SKELETON
// =====================================

const ShipmentSkeleton = () => {
  return (
    <div className="animate-pulse rounded-[22px] border border-[#e5d8c9] bg-white p-5">
      <div className="h-4 w-32 rounded bg-[#eee3d5]" />
      <div className="mt-4 h-3 w-48 rounded bg-[#f1e9df]" />
      <div className="mt-3 h-3 w-36 rounded bg-[#f1e9df]" />
    </div>
  );
};


// =====================================
// FORM FIELD
// =====================================

const Field = ({
  label,
  children,
  required = false,
}) => {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#725d54]">
        {label}

        {required && (
          <span className="ml-1 text-[#9b554d]">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
};


const inputClasses =
  "w-full rounded-xl border border-[#ddcfbe] bg-[#fffdfa] px-4 py-3 text-sm text-[#351716] outline-none transition placeholder:text-[#a8978c] focus:border-[#b58a48] focus:ring-2 focus:ring-[#c9a45c]/15";


// =====================================
// SHIPMENT FORM MODAL
// =====================================

const ShipmentFormModal = ({
  mode,
  initialShipment,
  orders,
  onClose,
  onSuccess,
}) => {
  const { token } = useAdminAuth();

  const [form, setForm] = useState({
    order_id:
      initialShipment?.order_id
        ? String(initialShipment.order_id)
        : "",

    tracking_id:
      initialShipment?.tracking_id || "",

    carrier:
      initialShipment?.carrier || "",

    shipping_status:
      initialShipment?.shipping_status ||
      "Pending",

    estimated_delivery_date:
      initialShipment?.estimated_delivery_date
        ? String(
            initialShipment.estimated_delivery_date
          ).slice(0, 10)
        : "",
  });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const isEdit = mode === "edit";


  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !isEdit &&
      !form.order_id
    ) {
      setError(
        "Please select an order."
      );

      return;
    }

    setLoading(true);

    try {
      let response;

      if (isEdit) {
        response =
          await updateAdminShipment(
            token,
            initialShipment.id,
            {
              tracking_id:
                form.tracking_id,
              carrier:
                form.carrier,
              shipping_status:
                form.shipping_status,
              estimated_delivery_date:
                form.estimated_delivery_date ||
                null,
            }
          );
      } else {
        response =
          await createAdminShipment(
            token,
            {
              order_id:
                Number(form.order_id),
              tracking_id:
                form.tracking_id,
              carrier:
                form.carrier,
              shipping_status:
                form.shipping_status,
              estimated_delivery_date:
                form.estimated_delivery_date ||
                null,
            }
          );
      }

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Operation failed"
        );
      }

      setSuccess(
        isEdit
          ? "Shipment updated successfully."
          : "Shipment created successfully."
      );

      setTimeout(() => {
        onSuccess();
      }, 600);
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#241211]/55 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[#e1d2c0] bg-[#fffdf9] shadow-[0_30px_90px_rgba(35,17,15,0.22)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eadfd3] bg-[#fffdf9]/95 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a88342]">
              {isEdit
                ? "Shipment Management"
                : "New Shipment"}
            </p>

            <h2 className="mt-1 text-xl font-semibold text-[#351716]">
              {isEdit
                ? "Update Shipment"
                : "Create Shipment"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e1d4c5] text-[#6c5850] transition hover:bg-[#f5eee4]"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0"
              />

              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2
                size={17}
                className="mt-0.5 shrink-0"
              />

              <span>{success}</span>
            </div>
          )}

          {!isEdit && (
            <Field
              label="Order"
              required
            >
              <div className="relative">
                <select
                  name="order_id"
                  value={form.order_id}
                  onChange={handleChange}
                  className={`${inputClasses} appearance-none pr-10`}
                >
                  <option value="">
                    Select order
                  </option>

                  {orders.map((order) => (
                    <option
                      key={order.id}
                      value={order.id}
                    >
                      {order.order_number ||
                        `Order #${order.id}`}{" "}
                      —{" "}
                      {order.customer_name ||
                        "Customer"}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#806d63]"
                />
              </div>
            </Field>
          )}

          {isEdit && (
            <div className="rounded-2xl border border-[#eadfd3] bg-[#f8f2e9] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b766b]">
                Order
              </p>

              <p className="mt-1 text-sm font-semibold text-[#351716]">
                {initialShipment?.order_number ||
                  `Order #${initialShipment?.order_id}`}
              </p>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Carrier">
              <input
                type="text"
                name="carrier"
                value={form.carrier}
                onChange={handleChange}
                placeholder="e.g. Delhivery"
                className={inputClasses}
              />
            </Field>

            <Field label="Tracking ID">
              <input
                type="text"
                name="tracking_id"
                value={form.tracking_id}
                onChange={handleChange}
                placeholder="Enter tracking number"
                className={inputClasses}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Shipping Status">
              <div className="relative">
                <select
                  name="shipping_status"
                  value={form.shipping_status}
                  onChange={handleChange}
                  className={`${inputClasses} appearance-none pr-10`}
                >
                  {SHIPPING_STATUSES.map(
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
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#806d63]"
                />
              </div>
            </Field>

            <Field label="Estimated Delivery">
              <input
                type="date"
                name="estimated_delivery_date"
                value={
                  form.estimated_delivery_date
                }
                onChange={handleChange}
                className={inputClasses}
              />
            </Field>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#eadfd3] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#d9cbbb] px-5 py-3 text-sm font-medium text-[#6c5850] transition hover:bg-[#f5eee4]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#351716] px-6 py-3 text-sm font-semibold text-[#f8ecdb] transition hover:bg-[#4b211f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  Saving...
                </>
              ) : (
                <>
                  {isEdit
                    ? "Save Changes"
                    : "Create Shipment"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// =====================================
// SHIPMENT DETAIL MODAL
// =====================================

const ShipmentDetailModal = ({
  shipmentId,
  onClose,
  onEdit,
}) => {
  const { token } = useAdminAuth();

  const [shipment, setShipment] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const loadShipment = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await getAdminShipmentById(
            token,
            shipmentId
          );

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Failed to load shipment."
          );
        }

        setShipment(
          response.shipment
        );
      } catch (err) {
        setError(
          err.message ||
            "Failed to load shipment."
        );
      } finally {
        setLoading(false);
      }
    },
    [token, shipmentId]
  );


  useEffect(() => {
    loadShipment();
  }, [loadShipment]);


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#241211]/60 p-3 backdrop-blur-sm sm:p-5">
      <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-[#dfd0bd] bg-[#fffdf9] shadow-[0_30px_100px_rgba(35,17,15,0.25)]">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#eadfd3] bg-[#fffdf9]/95 px-5 py-4 backdrop-blur sm:px-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a88342]">
              Shipment Details
            </p>

            <h2 className="mt-1 text-xl font-semibold text-[#351716]">
              {shipment?.order_number ||
                `Shipment #${shipmentId}`}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {shipment && (
              <button
                type="button"
                onClick={() => onEdit(shipment)}
                className="hidden items-center gap-2 rounded-xl border border-[#d9cbbb] px-4 py-2.5 text-sm font-medium text-[#5e4a43] transition hover:bg-[#f5eee4] sm:inline-flex"
              >
                <Pencil size={15} />
                Edit
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dfd0bd] text-[#6c5850] transition hover:bg-[#f5eee4]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex min-h-[350px] items-center justify-center">
            <div className="text-center">
              <Loader2
                size={28}
                className="mx-auto animate-spin text-[#a88342]"
              />

              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[#8b766b]">
                Loading shipment
              </p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="p-6">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {error}
            </div>
          </div>
        )}

        {!loading &&
          !error &&
          shipment && (
            <div className="space-y-6 p-5 sm:p-7">
              {/* Shipment overview */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-[#eadfd3] bg-[#f8f2e9] p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8b766b]">
                    Status
                  </p>

                  <div className="mt-3">
                    <StatusBadge
                      status={
                        shipment.shipping_status
                      }
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-[#eadfd3] bg-[#f8f2e9] p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8b766b]">
                    Carrier
                  </p>

                  <p className="mt-3 text-sm font-semibold text-[#351716]">
                    {shipment.carrier ||
                      "Not assigned"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#eadfd3] bg-[#f8f2e9] p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8b766b]">
                    Tracking ID
                  </p>

                  <p className="mt-3 break-all text-sm font-semibold text-[#351716]">
                    {shipment.tracking_id ||
                      "Not available"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#eadfd3] bg-[#f8f2e9] p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8b766b]">
                    Estimated Delivery
                  </p>

                  <p className="mt-3 text-sm font-semibold text-[#351716]">
                    {formatDate(
                      shipment.estimated_delivery_date
                    )}
                  </p>
                </div>
              </div>

              {/* Customer + address */}
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-[22px] border border-[#e5d8c9] bg-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#351716] text-[#f5e9d7]">
                      <User size={17} />
                    </div>

                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9b857a]">
                        Customer
                      </p>

                      <h3 className="mt-1 text-base font-semibold text-[#351716]">
                        {shipment.customer_name ||
                          "Customer"}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-[#6c5850]">
                      <span className="text-[#a88342]">
                        @
                      </span>

                      <span className="break-all">
                        {shipment.customer_email ||
                          "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-[#6c5850]">
                      <Phone
                        size={15}
                        className="text-[#a88342]"
                      />

                      <span>
                        {shipment.customer_phone ||
                          "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#e5d8c9] bg-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#351716] text-[#f5e9d7]">
                      <MapPin size={17} />
                    </div>

                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9b857a]">
                        Delivery Address
                      </p>

                      <h3 className="mt-1 text-base font-semibold text-[#351716]">
                        {shipment.address_type ||
                          "Delivery"}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-5 text-sm leading-6 text-[#6c5850]">
                    {shipment.address_line_1 && (
                      <p>
                        {shipment.address_line_1}
                      </p>
                    )}

                    {shipment.address_line_2 && (
                      <p>
                        {shipment.address_line_2}
                      </p>
                    )}

                    <p>
                      {[
                        shipment.city,
                        shipment.state,
                        shipment.postal_code,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>

                    {shipment.country && (
                      <p>
                        {shipment.country}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="rounded-[22px] border border-[#e5d8c9] bg-white p-5">
                <div className="flex items-center gap-3">
                  <CalendarDays
                    size={18}
                    className="text-[#a88342]"
                  />

                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#351716]">
                    Shipment Timeline
                  </h3>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-[#f8f2e9] p-4">
                    <p className="text-[9px] uppercase tracking-[0.15em] text-[#8b766b]">
                      Created
                    </p>

                    <p className="mt-2 text-sm font-medium text-[#351716]">
                      {formatDateTime(
                        shipment.created_at
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#f8f2e9] p-4">
                    <p className="text-[9px] uppercase tracking-[0.15em] text-[#8b766b]">
                      Shipped
                    </p>

                    <p className="mt-2 text-sm font-medium text-[#351716]">
                      {formatDateTime(
                        shipment.shipped_at
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#f8f2e9] p-4">
                    <p className="text-[9px] uppercase tracking-[0.15em] text-[#8b766b]">
                      Delivered
                    </p>

                    <p className="mt-2 text-sm font-medium text-[#351716]">
                      {formatDateTime(
                        shipment.delivered_at
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="rounded-[22px] border border-[#e5d8c9] bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Package
                      size={18}
                      className="text-[#a88342]"
                    />

                    <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#351716]">
                      Order Items
                    </h3>
                  </div>

                  <span className="text-xs text-[#8b766b]">
                    {shipment.items?.length ||
                      0}{" "}
                    item
                    {shipment.items?.length ===
                    1
                      ? ""
                      : "s"}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {shipment.items?.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 rounded-2xl border border-[#eee3d7] bg-[#fffdfa] p-3"
                      >
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f2e9dd]">
                          {item.image_url ? (
                            <img
                              src={
                                item.image_url
                              }
                              alt={
                                item.product_name
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[#9f8d82]">
                              <WineBottleIcon />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#351716]">
                            {
                              item.product_name
                            }
                          </p>

                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#8b766b]">
                            {item.bottle_size && (
                              <span>
                                {
                                  item.bottle_size
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

                            <span>
                              Qty{" "}
                              {
                                item.quantity
                              }
                            </span>
                          </div>

                          <p className="mt-2 text-xs font-medium text-[#6c5850]">
                            {formatCurrency(
                              item.subtotal
                            )}
                          </p>
                        </div>
                      </div>
                    )
                  )}

                  {(!shipment.items ||
                    shipment.items.length ===
                      0) && (
                    <p className="py-5 text-center text-sm text-[#8b766b]">
                      No order items found.
                    </p>
                  )}
                </div>
              </div>

              {/* Order totals */}
              <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
                <div className="rounded-[22px] border border-[#e5d8c9] bg-white p-5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9b857a]">
                    Delivery Instructions
                  </p>

                  <p className="mt-3 text-sm leading-6 text-[#6c5850]">
                    {shipment.delivery_instructions ||
                      "No special delivery instructions."}
                  </p>
                </div>

                <div className="rounded-[22px] bg-[#351716] p-5 text-[#f8ecdb]">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-[#c9a45c]">
                    Order Total
                  </p>

                  <p className="mt-2 text-2xl font-semibold">
                    {formatCurrency(
                      shipment.total_amount
                    )}
                  </p>

                  <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs text-[#eadbc9]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>
                        {formatCurrency(
                          shipment.subtotal
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>
                        {formatCurrency(
                          shipment.shipping_amount
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>
                        {formatCurrency(
                          shipment.tax_amount
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};


// =====================================
// FALLBACK WINE ICON
// =====================================

const WineBottleIcon = () => {
  return (
    <svg
      viewBox="0 0 40 40"
      className="h-8 w-8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M16 5h8" />
      <path d="M17 5v7l-4 6v14c0 1.7 1.3 3 3 3h8c1.7 0 3-1.3 3-3V18l-4-6V5" />
      <path d="M13 20h14" />
      <path d="M16 24h8" />
    </svg>
  );
};


// =====================================
// MAIN PAGE
// =====================================

const Shipments = () => {
  const { token } =
    useAdminAuth();

  const [shipments, setShipments] =
    useState([]);

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [detailShipmentId, setDetailShipmentId] =
    useState(null);

  const [formModal, setFormModal] =
    useState(null);


  const loadShipments = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await getAdminShipments(
            token
          );

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Failed to load shipments."
          );
        }

        setShipments(
          response.shipments || []
        );
      } catch (err) {
        setError(
          err.message ||
            "Failed to load shipments."
        );
      } finally {
        setLoading(false);
      }
    },
    [token]
  );


  const loadOrders = useCallback(
    async () => {
      try {
        /*
         * We intentionally fetch the order list
         * through the existing admin orders endpoint.
         *
         * This lets the create-shipment modal
         * show real database orders.
         */
        const response =
          await fetch(
            "http://localhost:5000/api/admin/orders",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (data?.success) {
          setOrders(
            data.orders || []
          );
        }
      } catch (err) {
        console.error(
          "Failed to load orders for shipment form:",
          err
        );
      }
    },
    [token]
  );


  useEffect(() => {
    loadShipments();
    loadOrders();
  }, [
    loadShipments,
    loadOrders,
  ]);


  const filteredShipments =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return shipments.filter(
        (shipment) => {
          const matchesSearch =
            !query ||
            [
              shipment.order_number,
              shipment.customer_name,
              shipment.customer_email,
              shipment.customer_phone,
              shipment.tracking_id,
              shipment.carrier,
              shipment.city,
              shipment.postal_code,
            ]
              .filter(Boolean)
              .some((value) =>
                String(value)
                  .toLowerCase()
                  .includes(query)
              );

          const matchesStatus =
            statusFilter === "All" ||
            String(
              shipment.shipping_status || ""
            ).toLowerCase() ===
              statusFilter.toLowerCase();

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      shipments,
      search,
      statusFilter,
    ]);


  const summary = useMemo(() => {
    const total =
      shipments.length;

    const delivered =
      shipments.filter(
        (shipment) =>
          String(
            shipment.shipping_status || ""
          ).toLowerCase() ===
          "delivered"
      ).length;

    const inTransit =
      shipments.filter(
        (shipment) =>
          [
            "shipped",
            "in transit",
            "out for delivery",
          ].includes(
            String(
              shipment.shipping_status || ""
            ).toLowerCase()
          )
      ).length;

    const pending =
      shipments.filter(
        (shipment) =>
          [
            "pending",
            "processing",
          ].includes(
            String(
              shipment.shipping_status || ""
            ).toLowerCase()
          )
      ).length;

    return {
      total,
      delivered,
      inTransit,
      pending,
    };
  }, [shipments]);


  const handleRefresh =
    async () => {
      await loadShipments();

      setSuccess(
        "Shipment data refreshed."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    };


  const handleFormSuccess =
    async () => {
      setFormModal(null);

      await loadShipments();

      setSuccess(
        "Shipment saved successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    };


  return (
    <div className="min-h-screen bg-[#f5eee4] text-[#351716]">
      {/* Header */}
      <header className="border-b border-[#e4d7c8] bg-[#fffdf9]">
        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#351716] text-[#f5e8d6]">
                  <Truck
                    size={20}
                    strokeWidth={1.7}
                  />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a88342]">
                    VINEORA Admin
                  </p>

                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#351716]">
                    Shipments
                  </h1>
                </div>
              </div>

              <p className="mt-3 max-w-2xl text-sm text-[#78665e]">
                Manage shipment tracking,
                carriers, delivery dates and
                shipping status from one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d9cbbb] bg-white px-4 py-3 text-sm font-medium text-[#5f4d46] transition hover:bg-[#f8f2e9]"
              >
                <RefreshCw
                  size={15}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormModal({
                    mode: "create",
                    shipment: null,
                  })
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#351716] px-5 py-3 text-sm font-semibold text-[#f7ead8] transition hover:bg-[#4a211f]"
              >
                <Package size={15} />
                Create Shipment
              </button>
            </div>
          </div>
        </div>
      </header>


      <main className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle
              size={17}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              {error}
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2
              size={17}
              className="mt-0.5 shrink-0"
            />

            <span>{success}</span>
          </div>
        )}


        {/* Summary */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Shipments"
            value={summary.total}
            icon={Package}
            description="All shipments"
          />

          <SummaryCard
            label="Pending"
            value={summary.pending}
            icon={Clock3}
            description="Awaiting dispatch"
          />

          <SummaryCard
            label="In Transit"
            value={summary.inTransit}
            icon={Truck}
            description="Currently moving"
          />

          <SummaryCard
            label="Delivered"
            value={summary.delivered}
            icon={CheckCircle2}
            description="Successfully delivered"
          />
        </section>


        {/* Filters */}
        <section className="rounded-[24px] border border-[#e4d7c8] bg-[#fffdf9] p-4 shadow-[0_10px_30px_rgba(53,23,22,0.04)] sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-xl">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#99877d]"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search order, customer, tracking ID, carrier..."
                className={`${inputClasses} pl-11`}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                "All",
                ...SHIPPING_STATUSES,
              ].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      status
                    )
                  }
                  className={`rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] transition ${
                    statusFilter === status
                      ? "border-[#351716] bg-[#351716] text-[#f7ead8]"
                      : "border-[#dccfc0] bg-white text-[#6c5850] hover:bg-[#f8f2e9]"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </section>


        {/* Desktop table */}
        <section className="hidden overflow-hidden rounded-[26px] border border-[#e4d7c8] bg-[#fffdf9] shadow-[0_12px_35px_rgba(53,23,22,0.04)] lg:block">
          <div className="flex items-center justify-between border-b border-[#eadfd3] px-6 py-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a88342]">
                Shipment Registry
              </p>

              <h2 className="mt-1 text-lg font-semibold text-[#351716]">
                All Shipments
              </h2>
            </div>

            <p className="text-xs text-[#8b766b]">
              Showing{" "}
              <span className="font-semibold text-[#351716]">
                {
                  filteredShipments.length
                }
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#351716]">
                {shipments.length}
              </span>
            </p>
          </div>

          {loading ? (
            <div className="grid gap-3 p-6">
              <ShipmentSkeleton />
              <ShipmentSkeleton />
              <ShipmentSkeleton />
            </div>
          ) : filteredShipments.length ===
            0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5eee4] text-[#a88342]">
                <Package size={22} />
              </div>

              <h3 className="mt-4 text-base font-semibold text-[#351716]">
                No shipments found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-[#8b766b]">
                Try changing your search or
                status filter, or create a new
                shipment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-[#eadfd3] bg-[#faf6ef] text-left">
                    <th className="px-6 py-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8b766b]">
                      Order
                    </th>

                    <th className="px-6 py-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8b766b]">
                      Customer
                    </th>

                    <th className="px-6 py-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8b766b]">
                      Carrier / Tracking
                    </th>

                    <th className="px-6 py-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8b766b]">
                      Status
                    </th>

                    <th className="px-6 py-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8b766b]">
                      Delivery
                    </th>

                    <th className="px-6 py-4 text-right text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8b766b]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredShipments.map(
                    (shipment) => (
                      <tr
                        key={shipment.id}
                        className="border-b border-[#f0e7dc] transition hover:bg-[#fffcf7]"
                      >
                        <td className="px-6 py-5">
                          <p className="text-sm font-semibold text-[#351716]">
                            {shipment.order_number ||
                              `Order #${shipment.order_id}`}
                          </p>

                          <p className="mt-1 text-[11px] text-[#9a887e]">
                            Shipment #
                            {shipment.id}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="text-sm font-medium text-[#4d3934]">
                            {shipment.customer_name ||
                              "Customer"}
                          </p>

                          <p className="mt-1 max-w-[200px] truncate text-[11px] text-[#99877d]">
                            {shipment.customer_email ||
                              "—"}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="text-sm font-medium text-[#4d3934]">
                            {shipment.carrier ||
                              "Not assigned"}
                          </p>

                          <p className="mt-1 max-w-[190px] break-all text-[11px] text-[#99877d]">
                            {shipment.tracking_id ||
                              "No tracking ID"}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <StatusBadge
                            status={
                              shipment.shipping_status
                            }
                          />
                        </td>

                        <td className="px-6 py-5">
                          <p className="text-sm font-medium text-[#4d3934]">
                            {formatDate(
                              shipment.estimated_delivery_date
                            )}
                          </p>

                          <p className="mt-1 text-[11px] text-[#99877d]">
                            {shipment.delivered_at
                              ? "Delivered"
                              : shipment.shipped_at
                              ? "Shipped"
                              : "Not shipped"}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setDetailShipmentId(
                                  shipment.id
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#ddd0c1] text-[#6c5850] transition hover:bg-[#f5eee4]"
                              title="View shipment"
                            >
                              <Eye
                                size={15}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setFormModal({
                                  mode: "edit",
                                  shipment,
                                })
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#ddd0c1] text-[#6c5850] transition hover:bg-[#f5eee4]"
                              title="Edit shipment"
                            >
                              <Pencil
                                size={15}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>


        {/* Mobile cards */}
        <section className="space-y-3 lg:hidden">
          {loading ? (
            <>
              <ShipmentSkeleton />
              <ShipmentSkeleton />
              <ShipmentSkeleton />
            </>
          ) : filteredShipments.length ===
            0 ? (
            <div className="rounded-[24px] border border-[#e4d7c8] bg-[#fffdf9] px-5 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5eee4] text-[#a88342]">
                <Package size={22} />
              </div>

              <h3 className="mt-4 text-base font-semibold text-[#351716]">
                No shipments found
              </h3>

              <p className="mt-2 text-sm text-[#8b766b]">
                Try another search or create a
                shipment.
              </p>
            </div>
          ) : (
            filteredShipments.map(
              (shipment) => (
                <article
                  key={shipment.id}
                  className="rounded-[24px] border border-[#e4d7c8] bg-[#fffdf9] p-4 shadow-[0_10px_28px_rgba(53,23,22,0.04)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#351716]">
                        {shipment.order_number ||
                          `Order #${shipment.order_id}`}
                      </p>

                      <p className="mt-1 text-[11px] text-[#9a887e]">
                        Shipment #{shipment.id}
                      </p>
                    </div>

                    <StatusBadge
                      status={
                        shipment.shipping_status
                      }
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#f8f2e9] p-3">
                      <p className="text-[9px] uppercase tracking-[0.14em] text-[#8b766b]">
                        Customer
                      </p>

                      <p className="mt-1 truncate text-xs font-medium text-[#4d3934]">
                        {shipment.customer_name ||
                          "Customer"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#f8f2e9] p-3">
                      <p className="text-[9px] uppercase tracking-[0.14em] text-[#8b766b]">
                        Carrier
                      </p>

                      <p className="mt-1 truncate text-xs font-medium text-[#4d3934]">
                        {shipment.carrier ||
                          "Not assigned"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-[#eee3d7] p-3">
                    <p className="text-[9px] uppercase tracking-[0.14em] text-[#8b766b]">
                      Tracking
                    </p>

                    <p className="mt-1 break-all text-xs font-medium text-[#4d3934]">
                      {shipment.tracking_id ||
                        "No tracking ID"}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.14em] text-[#8b766b]">
                        Estimated Delivery
                      </p>

                      <p className="mt-1 text-xs font-medium text-[#4d3934]">
                        {formatDate(
                          shipment.estimated_delivery_date
                        )}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDetailShipmentId(
                            shipment.id
                          )
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d9cbbb] text-[#6c5850] transition hover:bg-[#f5eee4]"
                      >
                        <Eye
                          size={16}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setFormModal({
                            mode: "edit",
                            shipment,
                          })
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#351716] text-[#f7ead8] transition hover:bg-[#4a211f]"
                      >
                        <Pencil
                          size={16}
                        />
                      </button>
                    </div>
                  </div>
                </article>
              )
            )
          )}
        </section>
      </main>


      {/* Detail modal */}
      {detailShipmentId && (
        <ShipmentDetailModal
          shipmentId={
            detailShipmentId
          }
          onClose={() =>
            setDetailShipmentId(null)
          }
          onEdit={(shipment) => {
            setDetailShipmentId(null);

            setFormModal({
              mode: "edit",
              shipment,
            });
          }}
        />
      )}


      {/* Form modal */}
      {formModal && (
        <ShipmentFormModal
          mode={formModal.mode}
          initialShipment={
            formModal.shipment
          }
          orders={orders}
          onClose={() =>
            setFormModal(null)
          }
          onSuccess={
            handleFormSuccess
          }
        />
      )}
    </div>
  );
};


export default Shipments;