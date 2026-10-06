import { useEffect, useMemo, useState } from "react";

import {
  Check,
  ChevronDown,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  X,
  Users,
  Package,
  Layers3,
} from "lucide-react";

import { useAdminAuth } from "../context/AdminAuthContext";

import {
  getAdminCoupons,
  getAdminCouponById,
  createAdminCoupon,
  updateAdminCoupon,
  updateAdminCouponStatus,
  deleteAdminCoupon,
  getAdminCustomers,
  getAdminProducts,
  getAdminCategories,
} from "../services/api";

const EMPTY_FORM = {
  code: "",
  discount_type: "percentage",
  discount_value: "",
  minimum_order_value: "0",
  maximum_discount: "",
  expiry_date: "",
  usage_limit: "",
  customer_ids: [],
  product_ids: [],
  category_ids: [],
};

const formatCurrency = (value) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(number);
};

const formatDate = (value) => {
  if (!value) return "No expiry";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toDateTimeLocal = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const isExpired = (expiryDate) => {
  if (!expiryDate) return false;

  return new Date(expiryDate).getTime() < Date.now();
};

/*
|--------------------------------------------------------------------------
| STATUS SWITCH
|--------------------------------------------------------------------------
*/

function StatusSwitch({ coupon, changingStatusId, onChange }) {
  const isActive = Boolean(coupon.is_active);
  const isUpdating = changingStatusId === coupon.id;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      aria-label={
        isActive
          ? `Deactivate ${coupon.code}`
          : `Activate ${coupon.code}`
      }
      title={isActive ? "Deactivate coupon" : "Activate coupon"}
      onClick={() => onChange(coupon)}
      disabled={isUpdating}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#a88342]/30 ${
        isActive ? "bg-green-500" : "bg-[#cfc3b6]"
      } ${
        isUpdating
          ? "cursor-wait opacity-60"
          : "cursor-pointer"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
          isActive ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function Coupons() {
  const { token } = useAdminAuth();

  const [coupons, setCoupons] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [changingStatusId, setChangingStatusId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [restrictionType, setRestrictionType] = useState("none");
  const [optionSearch, setOptionSearch] = useState("");

  const loadCoupons = async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const data = await getAdminCoupons(token);

      setCoupons(data?.coupons || []);
    } catch (err) {
      console.error("Load coupons error:", err);
      setError(err.message || "Failed to load coupons.");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);

      const [
        customerResponse,
        productResponse,
        categoryResponse,
      ] = await Promise.all([
        getAdminCustomers(token),
        getAdminProducts(token),
        getAdminCategories(),
      ]);

      setCustomers(customerResponse?.customers || []);
      setProducts(productResponse?.products || []);
      setCategories(categoryResponse?.categories || []);
    } catch (err) {
      console.error("Load coupon options error:", err);
      setError(
        err.message ||
          "Failed to load customers, products or categories."
      );
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    loadCoupons(true);
    loadOptions();
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setRestrictionType("none");
    setOptionSearch("");
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  const openEditForm = async (coupon) => {
    try {
      setError("");
      setSuccess("");

      const data = await getAdminCouponById(token, coupon.id);
      const selectedCoupon = data?.coupon || coupon;

      const customerIds = Array.isArray(selectedCoupon.customer_ids)
        ? selectedCoupon.customer_ids.map(Number)
        : [];

      const productIds = Array.isArray(selectedCoupon.product_ids)
        ? selectedCoupon.product_ids.map(Number)
        : [];

      const categoryIds = Array.isArray(selectedCoupon.category_ids)
        ? selectedCoupon.category_ids.map(Number)
        : [];

      let type = "none";

      if (customerIds.length > 0) {
        type = "customers";
      } else if (productIds.length > 0) {
        type = "products";
      } else if (categoryIds.length > 0) {
        type = "categories";
      }

      setEditingId(selectedCoupon.id);

      setForm({
        code: selectedCoupon.code || "",
        discount_type: selectedCoupon.discount_type || "percentage",
        discount_value: selectedCoupon.discount_value ?? "",
        minimum_order_value: selectedCoupon.minimum_order_value ?? "0",
        maximum_discount: selectedCoupon.maximum_discount ?? "",
        expiry_date: toDateTimeLocal(selectedCoupon.expiry_date),
        usage_limit: selectedCoupon.usage_limit ?? "",
        customer_ids: customerIds,
        product_ids: productIds,
        category_ids: categoryIds,
      });

      setRestrictionType(type);
      setOptionSearch("");
      setIsFormOpen(true);
    } catch (err) {
      console.error("Load coupon error:", err);
      setError(err.message || "Failed to load coupon.");
    }
  };

  const closeForm = () => {
    if (saving) return;

    setIsFormOpen(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setRestrictionType("none");
    setOptionSearch("");
  };

  const toggleSelection = (field, id) => {
    setForm((previous) => {
      const current = Array.isArray(previous[field])
        ? previous[field]
        : [];

      const numericId = Number(id);
      const exists = current.includes(numericId);

      return {
        ...previous,
        [field]: exists
          ? current.filter((item) => item !== numericId)
          : [...current, numericId],
      };
    });
  };

  const handleRestrictionTypeChange = (type) => {
    setRestrictionType(type);
    setOptionSearch("");

    setForm((previous) => ({
      ...previous,
      customer_ids: [],
      product_ids: [],
      category_ids: [],
    }));
  };

  const validateForm = () => {
    const code = form.code.trim();

    if (!code) return "Coupon code is required.";

    if (!/^[A-Za-z0-9_-]+$/.test(code)) {
      return (
        "Coupon code can contain only letters, numbers, hyphens and underscores."
      );
    }

    const discountValue = Number(form.discount_value);

    if (!Number.isFinite(discountValue) || discountValue < 0) {
      return "Please enter a valid discount value.";
    }

    if (
      form.discount_type === "percentage" &&
      discountValue > 100
    ) {
      return "Percentage discount cannot be greater than 100%.";
    }

    const minimumOrder = Number(form.minimum_order_value);

    if (!Number.isFinite(minimumOrder) || minimumOrder < 0) {
      return "Minimum order value cannot be negative.";
    }

    if (form.maximum_discount !== "") {
      const maximumDiscount = Number(form.maximum_discount);

      if (
        !Number.isFinite(maximumDiscount) ||
        maximumDiscount < 0
      ) {
        return "Maximum discount cannot be negative.";
      }
    }

    if (form.usage_limit !== "") {
      const usageLimit = Number(form.usage_limit);

      if (!Number.isInteger(usageLimit) || usageLimit <= 0) {
        return "Usage limit must be a positive whole number.";
      }
    }

    if (
      restrictionType === "customers" &&
      form.customer_ids.length === 0
    ) {
      return "Please select at least one customer.";
    }

    if (
      restrictionType === "products" &&
      form.product_ids.length === 0
    ) {
      return "Please select at least one product.";
    }

    if (
      restrictionType === "categories" &&
      form.category_ids.length === 0
    ) {
      return "Please select at least one category.";
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        code: form.code.trim(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        minimum_order_value:
          Number(form.minimum_order_value) || 0,
        maximum_discount:
          form.maximum_discount === ""
            ? null
            : Number(form.maximum_discount),
        expiry_date: form.expiry_date || null,
        usage_limit:
          form.usage_limit === ""
            ? null
            : Number(form.usage_limit),
        customer_ids:
          restrictionType === "customers"
            ? form.customer_ids
            : [],
        product_ids:
          restrictionType === "products"
            ? form.product_ids
            : [],
        category_ids:
          restrictionType === "categories"
            ? form.category_ids
            : [],
      };

      if (editingId) {
        await updateAdminCoupon(token, editingId, payload);
        setSuccess("Coupon updated successfully.");
      } else {
        await createAdminCoupon(token, payload);
        setSuccess("Coupon created successfully.");
      }

      closeForm();
      await loadCoupons();
    } catch (err) {
      console.error("Save coupon error:", err);
      setError(err.message || "Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (coupon) => {
    try {
      setChangingStatusId(coupon.id);
      setError("");
      setSuccess("");

      await updateAdminCouponStatus(
        token,
        coupon.id,
        !coupon.is_active
      );

      setSuccess(
        coupon.is_active
          ? "Coupon deactivated successfully."
          : "Coupon activated successfully."
      );

      await loadCoupons();
    } catch (err) {
      console.error("Coupon status error:", err);
      setError(
        err.message || "Failed to update coupon status."
      );
    } finally {
      setChangingStatusId(null);
    }
  };

  const handleDelete = async (coupon) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete coupon "${coupon.code}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(coupon.id);
      setError("");
      setSuccess("");

      await deleteAdminCoupon(token, coupon.id);

      setSuccess("Coupon deleted successfully.");
      await loadCoupons();
    } catch (err) {
      console.error("Delete coupon error:", err);
      setError(err.message || "Failed to delete coupon.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCoupons = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return coupons;

    return coupons.filter((coupon) =>
      String(coupon.code || "")
        .toLowerCase()
        .includes(query)
    );
  }, [coupons, search]);

  const filteredCustomers = useMemo(() => {
    const query = optionSearch.trim().toLowerCase();

    if (!query) return customers;

    return customers.filter(
      (customer) =>
        String(customer.fullName || "")
          .toLowerCase()
          .includes(query) ||
        String(customer.email || "")
          .toLowerCase()
          .includes(query)
    );
  }, [customers, optionSearch]);

  const filteredProducts = useMemo(() => {
    const query = optionSearch.trim().toLowerCase();

    if (!query) return products;

    return products.filter(
      (product) =>
        String(product.name || "")
          .toLowerCase()
          .includes(query) ||
        String(product.category_name || "")
          .toLowerCase()
          .includes(query)
    );
  }, [products, optionSearch]);

  const filteredCategories = useMemo(() => {
    const query = optionSearch.trim().toLowerCase();

    if (!query) return categories;

    return categories.filter((category) =>
      String(category.name || "")
        .toLowerCase()
        .includes(query)
    );
  }, [categories, optionSearch]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f1e8]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#d8c9b5] border-t-[#a88342]" />
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[#6c5850]">
            Loading coupons
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f1e8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#a88342]">
            Offers & Promotions
          </p>

          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#351716] text-[#f3e8d7]">
                  <Tag size={20} />
                </div>

                <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#351716] sm:text-4xl">
                  Coupons
                </h1>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6c5850]">
                Create and manage coupon codes, discounts,
                usage limits and targeted offers.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#351716] px-5 py-3 text-sm font-semibold text-[#fffaf2] transition hover:bg-[#4b2422]"
            >
              <Plus size={17} />
              Add Coupon
            </button>
          </div>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <div className="flex items-center gap-2">
              <Check size={17} />
              <span>{success}</span>
            </div>

            <button
              type="button"
              onClick={() => setSuccess("")}
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* SEARCH / SUMMARY */}
        <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-[#ded1c0] bg-[#fffaf2] p-4 shadow-[0_12px_35px_rgba(53,23,22,0.06)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full sm:max-w-md">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#806f66]"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search coupon codes..."
              className="w-full rounded-xl border border-[#d9cbb9] bg-white py-3 pl-11 pr-4 text-sm text-[#351716] outline-none transition placeholder:text-[#a4978e] focus:border-[#a88342] focus:ring-2 focus:ring-[#a88342]/15"
            />
          </div>

          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <div className="rounded-full border border-[#d8c9b5] bg-[#fffaf2] px-4 py-2 text-sm text-[#6c5850]">
              {coupons.length}{" "}
              {coupons.length === 1 ? "coupon" : "coupons"}
            </div>

            <button
              type="button"
              onClick={loadCoupons}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d9cbb9] bg-white text-[#6c5850] transition hover:border-[#a88342] hover:text-[#351716]"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* COUPON LIST */}
        <section className="overflow-hidden rounded-2xl border border-[#ded1c0] bg-[#fffaf2] shadow-[0_12px_35px_rgba(53,23,22,0.06)]">
          <div className="border-b border-[#e3d8ca] px-5 py-5 sm:px-6">
            <h2 className="font-serif text-xl font-semibold text-[#351716]">
              Coupon Codes
            </h2>

            <p className="mt-1 text-sm text-[#806f66]">
              Manage all promotional coupon codes.
            </p>
          </div>

          {filteredCoupons.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center px-6">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f0e5d7] text-[#a88342]">
                  <Tag size={24} />
                </div>

                <h3 className="mt-4 font-serif text-lg font-semibold text-[#351716]">
                  {search ? "No coupons found" : "No coupons yet"}
                </h3>

                <p className="mt-1 text-sm text-[#806f66]">
                  {search
                    ? "Try a different coupon code."
                    : "Create your first coupon to start managing offers."}
                </p>

                {!search && (
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#351716] px-4 py-2.5 text-sm font-semibold text-[#fffaf2] transition hover:bg-[#4b2422]"
                  >
                    <Plus size={16} />
                    Add Coupon
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[950px]">
                  <thead>
                    <tr className="border-b border-[#e3d8ca] bg-[#fcf7ef] text-left">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#806f66]">
                        Coupon
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#806f66]">
                        Discount
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#806f66]">
                        Minimum Order
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#806f66]">
                        Usage
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#806f66]">
                        Expiry
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#806f66]">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-[#806f66]">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#e3d8ca]">
                    {filteredCoupons.map((coupon) => {
                      const expired = isExpired(coupon.expiry_date);

                      return (
                        <tr
                          key={coupon.id}
                          className="transition hover:bg-[#fcf7ef]"
                        >
                          <td className="px-6 py-5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold tracking-wider text-[#351716]">
                                  {coupon.code}
                                </span>

                                {expired && (
                                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                                    Expired
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-xs text-[#806f66]">
                                Created {formatDate(coupon.created_at)}
                              </p>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <span className="font-semibold text-[#351716]">
                              {coupon.discount_type === "percentage"
                                ? `${Number(coupon.discount_value)}%`
                                : formatCurrency(coupon.discount_value)}
                            </span>

                            {coupon.maximum_discount !== null &&
                              coupon.maximum_discount !== undefined && (
                                <p className="mt-1 text-xs text-[#806f66]">
                                  Max{" "}
                                  {formatCurrency(coupon.maximum_discount)}
                                </p>
                              )}
                          </td>

                          <td className="px-6 py-5 text-sm text-[#6c5850]">
                            {formatCurrency(coupon.minimum_order_value)}
                          </td>

                          <td className="px-6 py-5">
                            <span className="text-sm font-medium text-[#351716]">
                              {coupon.used_count || 0} /{" "}
                              {coupon.usage_limit || "∞"}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-sm text-[#6c5850]">
                            {formatDate(coupon.expiry_date)}
                          </td>

                          {/* SWITCH */}
                          <td className="px-6 py-5">
                            <StatusSwitch
                              coupon={coupon}
                              changingStatusId={changingStatusId}
                              onChange={handleStatusChange}
                            />
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditForm(coupon)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d9cbb9] bg-white text-[#6c5850] transition hover:border-[#a88342] hover:text-[#351716]"
                                title="Edit coupon"
                              >
                                <Edit3 size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(coupon)}
                                disabled={deletingId === coupon.id}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                title="Delete coupon"
                              >
                                {deletingId === coupon.id ? (
                                  <RefreshCw
                                    size={15}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2 size={15} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE / TABLET */}
              <div className="divide-y divide-[#e3d8ca] lg:hidden">
                {filteredCoupons.map((coupon) => {
                  const expired = isExpired(coupon.expiry_date);

                  return (
                    <div
                      key={coupon.id}
                      className="p-5 transition hover:bg-[#fcf7ef] sm:p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-bold tracking-wider text-[#351716]">
                              {coupon.code}
                            </span>

                            {expired && (
                              <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-semibold text-red-700">
                                Expired
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-[#806f66]">
                            {coupon.discount_type === "percentage"
                              ? `${Number(coupon.discount_value)}% discount`
                              : `${formatCurrency(
                                  coupon.discount_value
                                )} discount`}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(coupon)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d9cbb9] bg-white text-[#6c5850]"
                            title="Edit coupon"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(coupon)}
                            disabled={deletingId === coupon.id}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 disabled:opacity-50"
                            title="Delete coupon"
                          >
                            {deletingId === coupon.id ? (
                              <RefreshCw
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-xl bg-[#fcf7ef] p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#806f66]">
                            Min Order
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#351716]">
                            {formatCurrency(coupon.minimum_order_value)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#fcf7ef] p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#806f66]">
                            Usage
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#351716]">
                            {coupon.used_count || 0} /{" "}
                            {coupon.usage_limit || "∞"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#fcf7ef] p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#806f66]">
                            Maximum
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#351716]">
                            {coupon.maximum_discount
                              ? formatCurrency(coupon.maximum_discount)
                              : "—"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#fcf7ef] p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#806f66]">
                            Expiry
                          </p>
                          <p className="mt-1 text-xs font-semibold text-[#351716]">
                            {coupon.expiry_date
                              ? new Date(
                                  coupon.expiry_date
                                ).toLocaleDateString("en-IN")
                              : "No expiry"}
                          </p>
                        </div>
                      </div>

                      {/* MOBILE STATUS SWITCH */}
                      <div className="mt-4 flex items-center justify-between rounded-xl border border-[#ded1c0] bg-[#fcf7ef] px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-[#351716]">
                            Coupon Status
                          </p>
                          <p className="mt-0.5 text-xs text-[#806f66]">
                            {coupon.is_active
                              ? "Coupon is active"
                              : "Coupon is inactive"}
                          </p>
                        </div>

                        <StatusSwitch
                          coupon={coupon}
                          changingStatusId={changingStatusId}
                          onChange={handleStatusChange}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#351716]/45 px-4 py-6 backdrop-blur-sm sm:px-6">
          <div className="flex min-h-full items-center justify-center">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#ded1c0] bg-[#fffaf2] shadow-[0_25px_80px_rgba(53,23,22,0.25)]">

              {/* MODAL HEADER */}
              <div className="flex items-start justify-between border-b border-[#e3d8ca] px-5 py-5 sm:px-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a88342]">
                    {editingId ? "Update Offer" : "New Offer"}
                  </p>

                  <h2 className="mt-1 font-serif text-2xl font-semibold text-[#351716]">
                    {editingId ? "Edit Coupon" : "Create Coupon"}
                  </h2>

                  <p className="mt-1 text-sm text-[#806f66]">
                    Configure the discount and its applicability.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d9cbb9] bg-white text-[#6c5850] transition hover:border-[#a88342] hover:text-[#351716]"
                >
                  <X size={17} />
                </button>
              </div>

              {/* MODAL BODY */}
              <form
                onSubmit={handleSubmit}
                className="max-h-[75vh] overflow-y-auto px-5 py-6 sm:px-7"
              >
                <div className="space-y-6">

                  {/* COUPON DETAILS */}
                  <section>
                    <div className="mb-4">
                      <h3 className="font-serif text-lg font-semibold text-[#351716]">
                        Coupon Details
                      </h3>

                      <p className="mt-1 text-xs text-[#806f66]">
                        Set the coupon code and discount.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-[#4d3b35]">
                          Coupon Code
                        </label>

                        <input
                          type="text"
                          name="code"
                          value={form.code}
                          onChange={handleChange}
                          placeholder="e.g. WINE20"
                          maxLength={100}
                          className="w-full rounded-xl border border-[#d9cbb9] bg-white px-4 py-3 font-mono text-sm uppercase tracking-wider text-[#351716] outline-none transition focus:border-[#a88342] focus:ring-2 focus:ring-[#a88342]/15"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#4d3b35]">
                          Discount Type
                        </label>

                        <div className="relative">
                          <select
                            name="discount_type"
                            value={form.discount_type}
                            onChange={handleChange}
                            className="w-full appearance-none rounded-xl border border-[#d9cbb9] bg-white px-4 py-3 pr-10 text-sm text-[#351716] outline-none transition focus:border-[#a88342] focus:ring-2 focus:ring-[#a88342]/15"
                          >
                            <option value="percentage">
                              Percentage
                            </option>
                            <option value="flat">
                              Flat Amount
                            </option>
                          </select>

                          <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#806f66]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#4d3b35]">
                          Discount Value
                        </label>

                        <div className="relative">
                          <input
                            type="number"
                            name="discount_value"
                            value={form.discount_value}
                            onChange={handleChange}
                            min="0"
                            max={
                              form.discount_type === "percentage"
                                ? "100"
                                : undefined
                            }
                            step="0.01"
                            placeholder={
                              form.discount_type === "percentage"
                                ? "20"
                                : "500"
                            }
                            className="w-full rounded-xl border border-[#d9cbb9] bg-white px-4 py-3 pr-12 text-sm text-[#351716] outline-none transition focus:border-[#a88342] focus:ring-2 focus:ring-[#a88342]/15"
                          />

                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#806f66]">
                            {form.discount_type === "percentage"
                              ? "%"
                              : "INR"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#4d3b35]">
                          Minimum Order Value
                        </label>

                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#806f66]">
                            ₹
                          </span>

                          <input
                            type="number"
                            name="minimum_order_value"
                            value={form.minimum_order_value}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            className="w-full rounded-xl border border-[#d9cbb9] bg-white py-3 pl-8 pr-4 text-sm text-[#351716] outline-none transition focus:border-[#a88342] focus:ring-2 focus:ring-[#a88342]/15"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#4d3b35]">
                          Maximum Discount
                        </label>

                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#806f66]">
                            ₹
                          </span>

                          <input
                            type="number"
                            name="maximum_discount"
                            value={form.maximum_discount}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            placeholder="Optional"
                            className="w-full rounded-xl border border-[#d9cbb9] bg-white py-3 pl-8 pr-4 text-sm text-[#351716] outline-none transition focus:border-[#a88342] focus:ring-2 focus:ring-[#a88342]/15"
                          />
                        </div>

                        <p className="mt-1 text-[11px] text-[#806f66]">
                          Leave empty for no maximum.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* VALIDITY */}
                  <section className="border-t border-[#e3d8ca] pt-6">
                    <div className="mb-4">
                      <h3 className="font-serif text-lg font-semibold text-[#351716]">
                        Validity & Usage
                      </h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#4d3b35]">
                          Expiry Date
                        </label>

                        <input
                          type="datetime-local"
                          name="expiry_date"
                          value={form.expiry_date}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-[#d9cbb9] bg-white px-4 py-3 text-sm text-[#351716] outline-none transition focus:border-[#a88342] focus:ring-2 focus:ring-[#a88342]/15"
                        />

                        <p className="mt-1 text-[11px] text-[#806f66]">
                          Leave empty for no expiry.
                        </p>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#4d3b35]">
                          Usage Limit
                        </label>

                        <input
                          type="number"
                          name="usage_limit"
                          value={form.usage_limit}
                          onChange={handleChange}
                          min="1"
                          step="1"
                          placeholder="Unlimited"
                          className="w-full rounded-xl border border-[#d9cbb9] bg-white px-4 py-3 text-sm text-[#351716] outline-none transition focus:border-[#a88342] focus:ring-2 focus:ring-[#a88342]/15"
                        />

                        <p className="mt-1 text-[11px] text-[#806f66]">
                          Leave empty for unlimited usage.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* APPLICABILITY */}
                  <section className="border-t border-[#e3d8ca] pt-6">
                    <div className="mb-4">
                      <h3 className="font-serif text-lg font-semibold text-[#351716]">
                        Coupon Applicability
                      </h3>

                      <p className="mt-1 text-xs text-[#806f66]">
                        Choose who or what this coupon applies to.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleRestrictionTypeChange("none")
                        }
                        className={`rounded-xl border p-4 text-left transition ${
                          restrictionType === "none"
                            ? "border-[#a88342] bg-[#f5ecdf] ring-1 ring-[#a88342]/20"
                            : "border-[#d9cbb9] bg-white hover:border-[#c2ad91]"
                        }`}
                      >
                        <Tag size={18} className="text-[#a88342]" />

                        <p className="mt-2 text-sm font-semibold text-[#351716]">
                          Everyone
                        </p>

                        <p className="mt-1 text-[11px] leading-4 text-[#806f66]">
                          No specific restriction
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRestrictionTypeChange("customers")
                        }
                        className={`rounded-xl border p-4 text-left transition ${
                          restrictionType === "customers"
                            ? "border-[#a88342] bg-[#f5ecdf] ring-1 ring-[#a88342]/20"
                            : "border-[#d9cbb9] bg-white hover:border-[#c2ad91]"
                        }`}
                      >
                        <Users size={18} className="text-[#a88342]" />

                        <p className="mt-2 text-sm font-semibold text-[#351716]">
                          Customers
                        </p>

                        <p className="mt-1 text-[11px] leading-4 text-[#806f66]">
                          Specific customers
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRestrictionTypeChange("products")
                        }
                        className={`rounded-xl border p-4 text-left transition ${
                          restrictionType === "products"
                            ? "border-[#a88342] bg-[#f5ecdf] ring-1 ring-[#a88342]/20"
                            : "border-[#d9cbb9] bg-white hover:border-[#c2ad91]"
                        }`}
                      >
                        <Package size={18} className="text-[#a88342]" />

                        <p className="mt-2 text-sm font-semibold text-[#351716]">
                          Products
                        </p>

                        <p className="mt-1 text-[11px] leading-4 text-[#806f66]">
                          Specific wines
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRestrictionTypeChange("categories")
                        }
                        className={`rounded-xl border p-4 text-left transition ${
                          restrictionType === "categories"
                            ? "border-[#a88342] bg-[#f5ecdf] ring-1 ring-[#a88342]/20"
                            : "border-[#d9cbb9] bg-white hover:border-[#c2ad91]"
                        }`}
                      >
                        <Layers3
                          size={18}
                          className="text-[#a88342]"
                        />

                        <p className="mt-2 text-sm font-semibold text-[#351716]">
                          Categories
                        </p>

                        <p className="mt-1 text-[11px] leading-4 text-[#806f66]">
                          Specific wine types
                        </p>
                      </button>
                    </div>

                    {restrictionType !== "none" && (
                      <div className="mt-4 rounded-xl border border-[#ded1c0] bg-white p-4">
                        <div className="relative mb-4">
                          <Search
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#806f66]"
                          />

                          <input
                            type="text"
                            value={optionSearch}
                            onChange={(event) =>
                              setOptionSearch(event.target.value)
                            }
                            placeholder={
                              restrictionType === "customers"
                                ? "Search customers..."
                                : restrictionType === "products"
                                ? "Search products..."
                                : "Search categories..."
                            }
                            className="w-full rounded-xl border border-[#d9cbb9] bg-[#fcf9f4] py-2.5 pl-10 pr-4 text-sm text-[#351716] outline-none focus:border-[#a88342]"
                          />
                        </div>

                        {loadingOptions ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#d8c9b5] border-t-[#a88342]" />
                          </div>
                        ) : (
                          <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
                            {restrictionType === "customers" &&
                              filteredCustomers.map((customer) => (
                                <label
                                  key={customer.id}
                                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-[#fcf7ef]"
                                >
                                  <input
                                    type="checkbox"
                                    checked={form.customer_ids.includes(
                                      Number(customer.id)
                                    )}
                                    onChange={() =>
                                      toggleSelection(
                                        "customer_ids",
                                        customer.id
                                      )
                                    }
                                    className="h-4 w-4 accent-[#a88342]"
                                  />

                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-[#351716]">
                                      {customer.fullName ||
                                        `${customer.firstName || ""} ${
                                          customer.lastName || ""
                                        }`}
                                    </p>

                                    <p className="truncate text-xs text-[#806f66]">
                                      {customer.email}
                                    </p>
                                  </div>
                                </label>
                              ))}

                            {restrictionType === "products" &&
                              filteredProducts.map((product) => (
                                <label
                                  key={product.id}
                                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-[#fcf7ef]"
                                >
                                  <input
                                    type="checkbox"
                                    checked={form.product_ids.includes(
                                      Number(product.id)
                                    )}
                                    onChange={() =>
                                      toggleSelection(
                                        "product_ids",
                                        product.id
                                      )
                                    }
                                    className="h-4 w-4 accent-[#a88342]"
                                  />

                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-[#351716]">
                                      {product.name}
                                    </p>

                                    {product.category_name && (
                                      <p className="truncate text-xs text-[#806f66]">
                                        {product.category_name}
                                      </p>
                                    )}
                                  </div>
                                </label>
                              ))}

                            {restrictionType === "categories" &&
                              filteredCategories.map((category) => (
                                <label
                                  key={category.id}
                                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-[#fcf7ef]"
                                >
                                  <input
                                    type="checkbox"
                                    checked={form.category_ids.includes(
                                      Number(category.id)
                                    )}
                                    onChange={() =>
                                      toggleSelection(
                                        "category_ids",
                                        category.id
                                      )
                                    }
                                    className="h-4 w-4 accent-[#a88342]"
                                  />

                                  <div>
                                    <p className="text-sm font-medium text-[#351716]">
                                      {category.name}
                                    </p>

                                    {category.slug && (
                                      <p className="text-xs text-[#806f66]">
                                        /{category.slug}
                                      </p>
                                    )}
                                  </div>
                                </label>
                              ))}
                          </div>
                        )}

                        <div className="mt-3 border-t border-[#eee4d8] pt-3 text-xs text-[#806f66]">
                          {restrictionType === "customers" &&
                            `${form.customer_ids.length} customer${
                              form.customer_ids.length === 1 ? "" : "s"
                            } selected`}

                          {restrictionType === "products" &&
                            `${form.product_ids.length} product${
                              form.product_ids.length === 1 ? "" : "s"
                            } selected`}

                          {restrictionType === "categories" &&
                            `${form.category_ids.length} categor${
                              form.category_ids.length === 1 ? "y" : "ies"
                            } selected`}
                        </div>
                      </div>
                    )}
                  </section>
                </div>

                {/* MODAL FOOTER */}
                <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#e3d8ca] pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-xl border border-[#cdbda9] px-5 py-3 text-sm font-semibold text-[#5d4941] transition hover:bg-[#f3eadf] disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#351716] px-6 py-3 text-sm font-semibold text-[#fffaf2] transition hover:bg-[#4b2422] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving && (
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />
                    )}

                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Update Coupon"
                      : "Create Coupon"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
