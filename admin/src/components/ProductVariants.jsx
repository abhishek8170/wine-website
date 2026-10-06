import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Package,
  X,
  Save,
  AlertCircle,
} from "lucide-react";

import { useAdminAuth } from "../context/AdminAuthContext";

import {
  getAdminProductVariants,
  createAdminProductVariant,
  updateAdminProductVariant,
  deleteAdminProductVariant,
  activateAdminProductVariant,
} from "../services/api";

const emptyForm = {
  bottle_size: "",
  vintage: "",
  sku: "",
  batch_lot: "",
  mrp: "",
  selling_price: "",
  stock_quantity: "",
};

const ProductVariants = ({ productId, productName }) => {
  const { token } = useAdminAuth();

  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================================================
     LOAD VARIANTS
  ========================================================= */

  const loadVariants = async () => {
    if (!productId || !token) return;

    try {
      setLoading(true);
      setError("");

      const response = await getAdminProductVariants(
        token,
        productId
      );

      if (response.success) {
        setVariants(response.variants || []);
      } else {
        setError(
          response.message || "Failed to load variants"
        );
      }
    } catch (err) {
      console.error("Load variants error:", err);

      setError(
        err.message || "Failed to load product variants"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVariants();
  }, [productId, token]);

  /* =========================================================
     FORM HELPERS
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddModal = () => {
    setEditingVariant(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const openEditModal = (variant) => {
    setEditingVariant(variant);

    setForm({
      bottle_size: variant.bottle_size || "",
      vintage: variant.vintage || "",
      sku: variant.sku || "",
      batch_lot: variant.batch_lot || "",
      mrp: variant.mrp ?? "",
      selling_price: variant.selling_price ?? "",
      stock_quantity: variant.stock_quantity ?? "",
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingVariant(null);
    setForm(emptyForm);
  };

  /* =========================================================
     SAVE VARIANT
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.bottle_size.trim()) {
      setError("Bottle size is required.");
      return;
    }

    if (!form.sku.trim()) {
      setError("SKU is required.");
      return;
    }

    if (form.mrp === "" || form.mrp === null) {
      setError("MRP is required.");
      return;
    }

    if (
      form.selling_price === "" ||
      form.selling_price === null
    ) {
      setError("Selling price is required.");
      return;
    }

    if (
      form.stock_quantity === "" ||
      form.stock_quantity === null
    ) {
      setError("Stock quantity is required.");
      return;
    }

    const mrp = Number(form.mrp);
    const sellingPrice = Number(form.selling_price);
    const stock = Number(form.stock_quantity);

    if (!Number.isFinite(mrp) || mrp < 0) {
      setError("Please enter a valid MRP.");
      return;
    }

    if (
      !Number.isFinite(sellingPrice) ||
      sellingPrice < 0
    ) {
      setError("Please enter a valid selling price.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setError("Stock quantity must be a whole number.");
      return;
    }

    if (sellingPrice > mrp) {
      setError(
        "Selling price cannot be greater than MRP."
      );
      return;
    }

    const payload = {
      bottle_size: form.bottle_size.trim(),
      vintage: form.vintage.trim() || null,
      sku: form.sku.trim(),
      batch_lot: form.batch_lot.trim() || null,
      mrp,
      selling_price: sellingPrice,
      stock_quantity: stock,
    };

    try {
      setSaving(true);

      let response;

      if (editingVariant) {
        response = await updateAdminProductVariant(
          token,
          productId,
          editingVariant.id,
          payload
        );
      } else {
        response = await createAdminProductVariant(
          token,
          productId,
          payload
        );
      }

      if (!response.success) {
        throw new Error(
          response.message || "Failed to save variant"
        );
      }

      setSuccess(
        editingVariant
          ? "Variant updated successfully."
          : "Variant added successfully."
      );

      setModalOpen(false);
      setEditingVariant(null);
      setForm(emptyForm);

      await loadVariants();
    } catch (err) {
      console.error("Save variant error:", err);

      setError(
        err.message || "Failed to save variant."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DEACTIVATE VARIANT
  ========================================================= */

  const handleDeactivate = async (variant) => {
    const confirmed = window.confirm(
      `Deactivate the ${variant.bottle_size}${
        variant.vintage
          ? ` (${variant.vintage})`
          : ""
      } variant?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response =
        await deleteAdminProductVariant(
          token,
          productId,
          variant.id
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to deactivate variant"
        );
      }

      setSuccess(
        "Variant deactivated successfully."
      );

      await loadVariants();
    } catch (err) {
      console.error(
        "Deactivate variant error:",
        err
      );

      setError(
        err.message ||
          "Failed to deactivate variant."
      );
    }
  };

  /* =========================================================
     ACTIVATE VARIANT
  ========================================================= */

  const handleActivate = async (variant) => {
    try {
      setError("");
      setSuccess("");

      const response =
        await activateAdminProductVariant(
          token,
          productId,
          variant.id
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to activate variant"
        );
      }

      setSuccess(
        "Variant activated successfully."
      );

      await loadVariants();
    } catch (err) {
      console.error(
        "Activate variant error:",
        err
      );

      setError(
        err.message ||
          "Failed to activate variant."
      );
    }
  };

  /* =========================================================
     STOCK STATUS
  ========================================================= */

  const getStockStatus = (quantity) => {
    const stock = Number(quantity);

    if (stock === 0) {
      return {
        label: "Out of stock",
        className:
          "bg-red-50 text-red-700 border-red-200",
      };
    }

    if (stock <= 5) {
      return {
        label: "Low stock",
        className:
          "bg-amber-50 text-amber-700 border-amber-200",
      };
    }

    return {
      label: "In stock",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="rounded-3xl border border-[#eadfce] bg-[#fffdf9] p-8">
        <div className="flex items-center justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4b77a] border-t-transparent" />
        </div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 rounded-3xl border border-[#eadfce] bg-[#fffdf9] p-6 shadow-[0_15px_45px_rgba(70,35,25,0.05)] sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="mb-2 flex items-center gap-2">
            <Package
              size={18}
              className="text-[#a88342]"
            />

            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a88342]">
              Inventory & Variants
            </span>
          </div>

          <h2 className="text-xl font-semibold text-[#351716]">
            Product Variants
          </h2>

          <p className="mt-1 text-sm text-[#7b6b63]">
            Manage bottle sizes, vintages, SKUs,
            batches, pricing and stock for{" "}
            <span className="font-medium text-[#351716]">
              {productName}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#351716] px-5 py-3 text-sm font-medium text-[#f8eddd] transition hover:bg-[#4a211f]"
        >
          <Plus size={17} />
          Add Variant
        </button>
      </div>

      {/* =====================================================
          MESSAGES
      ===================================================== */}

      {error && !modalOpen && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* =====================================================
          DESKTOP TABLE
      ===================================================== */}

      <div className="hidden overflow-hidden rounded-3xl border border-[#eadfce] bg-[#fffdf9] shadow-[0_15px_45px_rgba(70,35,25,0.05)] md:block">

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">

            <thead>
              <tr className="border-b border-[#eadfce] bg-[#f8f1e6]">

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#806d63]">
                  Bottle Size
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#806d63]">
                  Vintage
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#806d63]">
                  SKU
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#806d63]">
                  Batch / Lot
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#806d63]">
                  MRP
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#806d63]">
                  Selling Price
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#806d63]">
                  Stock
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.15em] text-[#806d63]">
                  Actions
                </th>

              </tr>
            </thead>

            <tbody>

              {variants.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-14 text-center"
                  >
                    <Package
                      size={32}
                      className="mx-auto mb-3 text-[#b8a99c]"
                    />

                    <p className="font-medium text-[#351716]">
                      No variants found
                    </p>

                    <p className="mt-1 text-sm text-[#8b7b72]">
                      Add a bottle size to start
                      managing inventory.
                    </p>
                  </td>
                </tr>
              ) : (
                variants.map((variant) => {
                  const stockStatus =
                    getStockStatus(
                      variant.stock_quantity
                    );

                  return (
                    <tr
                      key={variant.id}
                      className="border-b border-[#f0e7db] last:border-b-0"
                    >

                      {/* Bottle Size */}

                      <td className="px-5 py-5">
                        <div className="font-medium text-[#351716]">
                          {variant.bottle_size}
                        </div>

                        {!variant.is_active && (
                          <span className="mt-1 inline-block text-xs text-red-600">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Vintage */}

                      <td className="px-5 py-5">
                        <span className="text-sm text-[#5f5049]">
                          {variant.vintage || "—"}
                        </span>
                      </td>

                      {/* SKU */}

                      <td className="px-5 py-5">
                        <span className="rounded-lg bg-[#f5eee3] px-2.5 py-1 font-mono text-xs text-[#66564e]">
                          {variant.sku}
                        </span>
                      </td>

                      {/* Batch */}

                      <td className="px-5 py-5">
                        <span className="text-sm text-[#5f5049]">
                          {variant.batch_lot || "—"}
                        </span>
                      </td>

                      {/* MRP */}

                      <td className="px-5 py-5 text-sm text-[#806d63]">
                        ₹
                        {Number(
                          variant.mrp
                        ).toLocaleString("en-IN")}
                      </td>

                      {/* Selling Price */}

                      <td className="px-5 py-5">
                        <span className="font-semibold text-[#351716]">
                          ₹
                          {Number(
                            variant.selling_price
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </span>
                      </td>

                      {/* Stock */}

                      <td className="px-5 py-5">
                        <div className="flex flex-col items-start gap-2">

                          <span className="font-medium text-[#351716]">
                            {variant.stock_quantity}
                          </span>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${stockStatus.className}`}
                          >
                            {stockStatus.label}
                          </span>

                        </div>
                      </td>

                      {/* Actions */}

                      <td className="px-5 py-5">
                        <div className="flex justify-end gap-2">

                          {variant.is_active ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    variant
                                  )
                                }
                                title="Edit variant"
                                className="rounded-full border border-[#e4d6c4] p-2.5 text-[#6c5850] transition hover:border-[#c9a45c] hover:text-[#351716]"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeactivate(
                                    variant
                                  )
                                }
                                title="Deactivate variant"
                                className="rounded-full border border-[#ecd8d4] p-2.5 text-[#a64b42] transition hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                handleActivate(
                                  variant
                                )
                              }
                              title="Activate variant"
                              className="rounded-full border border-emerald-200 p-2.5 text-emerald-700 transition hover:bg-emerald-50"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          MOBILE CARDS
      ===================================================== */}

      <div className="space-y-4 md:hidden">

        {variants.length === 0 ? (
          <div className="rounded-3xl border border-[#eadfce] bg-[#fffdf9] px-6 py-12 text-center">

            <Package
              size={32}
              className="mx-auto mb-3 text-[#b8a99c]"
            />

            <p className="font-medium text-[#351716]">
              No variants found
            </p>

            <p className="mt-1 text-sm text-[#8b7b72]">
              Add a bottle size to start
              managing inventory.
            </p>

          </div>
        ) : (
          variants.map((variant) => {

            const stockStatus =
              getStockStatus(
                variant.stock_quantity
              );

            return (
              <div
                key={variant.id}
                className="rounded-3xl border border-[#eadfce] bg-[#fffdf9] p-5 shadow-[0_12px_35px_rgba(70,35,25,0.05)]"
              >

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="text-lg font-semibold text-[#351716]">
                      {variant.bottle_size}
                    </p>

                    {variant.vintage && (
                      <p className="mt-1 text-sm text-[#806d63]">
                        Vintage {variant.vintage}
                      </p>
                    )}

                    <span className="mt-2 inline-block rounded-lg bg-[#f5eee3] px-2.5 py-1 font-mono text-xs text-[#66564e]">
                      {variant.sku}
                    </span>

                  </div>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${stockStatus.className}`}
                  >
                    {stockStatus.label}
                  </span>

                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">

                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-[#9a887e]">
                      Vintage
                    </p>

                    <p className="mt-1 text-sm text-[#806d63]">
                      {variant.vintage || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-[#9a887e]">
                      Batch / Lot
                    </p>

                    <p className="mt-1 text-sm text-[#806d63]">
                      {variant.batch_lot || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-[#9a887e]">
                      MRP
                    </p>

                    <p className="mt-1 text-sm text-[#806d63]">
                      ₹
                      {Number(
                        variant.mrp
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-[#9a887e]">
                      Selling Price
                    </p>

                    <p className="mt-1 font-semibold text-[#351716]">
                      ₹
                      {Number(
                        variant.selling_price
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-[#9a887e]">
                      Stock
                    </p>

                    <p className="mt-1 font-semibold text-[#351716]">
                      {variant.stock_quantity}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-[#9a887e]">
                      Status
                    </p>

                    <p
                      className={`mt-1 text-sm ${
                        variant.is_active
                          ? "text-emerald-700"
                          : "text-red-600"
                      }`}
                    >
                      {variant.is_active
                        ? "Active"
                        : "Inactive"}
                    </p>
                  </div>

                </div>

                <div className="mt-5 flex gap-2 border-t border-[#eee4d8] pt-4">

                  {variant.is_active ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(
                            variant
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#e4d6c4] px-4 py-2.5 text-sm font-medium text-[#5f5049] transition hover:border-[#c9a45c] hover:text-[#351716]"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeactivate(
                            variant
                          )
                        }
                        className="rounded-full border border-[#ecd8d4] px-4 py-2.5 text-[#a64b42] transition hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleActivate(
                          variant
                        )
                      }
                      className="flex flex-1 items-center justify-center gap-2 rounded-full border border-emerald-200 px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                    >
                      <RotateCcw size={15} />
                      Activate
                    </button>
                  )}

                </div>

              </div>
            );
          })
        )}

      </div>

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#241311]/60 p-4 backdrop-blur-sm">

          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] border border-[#eadfce] bg-[#fffdf9] shadow-[0_30px_100px_rgba(30,10,5,0.25)]">

            {/* Modal Header */}

            <div className="flex items-start justify-between border-b border-[#eadfce] px-6 py-5 sm:px-8">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a88342]">
                  {editingVariant
                    ? "Edit Variant"
                    : "New Variant"}
                </p>

                <h3 className="mt-1 text-xl font-semibold text-[#351716]">
                  {editingVariant
                    ? "Update inventory"
                    : "Add bottle variant"}
                </h3>

                <p className="mt-1 text-sm text-[#806d63]">
                  {productName}
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-full border border-[#eadfce] p-2 text-[#806d63] transition hover:bg-[#f7efe4] hover:text-[#351716] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>

            </div>

            {/* Modal Body */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 px-6 py-6 sm:px-8"
            >

              {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <span>{error}</span>
                </div>
              )}

              {/* Bottle Size */}

              <div>

                <label className="mb-2 block text-sm font-medium text-[#4d3d36]">
                  Bottle Size *
                </label>

                <input
                  type="text"
                  name="bottle_size"
                  value={form.bottle_size}
                  onChange={handleChange}
                  placeholder="e.g. 750ml"
                  className="w-full rounded-2xl border border-[#dfd1c0] bg-white px-4 py-3 text-sm text-[#351716] outline-none transition placeholder:text-[#b2a399] focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/20"
                />

              </div>

              {/* Vintage */}

              <div>

                <label className="mb-2 block text-sm font-medium text-[#4d3d36]">
                  Vintage
                </label>

                <input
                  type="text"
                  name="vintage"
                  value={form.vintage}
                  onChange={handleChange}
                  placeholder="e.g. 2024"
                  maxLength="20"
                  className="w-full rounded-2xl border border-[#dfd1c0] bg-white px-4 py-3 text-sm text-[#351716] outline-none transition placeholder:text-[#b2a399] focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/20"
                />

                <p className="mt-2 text-xs text-[#95847a]">
                  Enter the wine vintage/year for this variant.
                </p>

              </div>

              {/* SKU */}

              <div>

                <label className="mb-2 block text-sm font-medium text-[#4d3d36]">
                  SKU *
                </label>

                <input
                  type="text"
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  placeholder="e.g. ANG-SHIRAZ-750-2024"
                  className="w-full rounded-2xl border border-[#dfd1c0] bg-white px-4 py-3 font-mono text-sm text-[#351716] outline-none transition placeholder:font-sans placeholder:text-[#b2a399] focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/20"
                />

              </div>

              {/* Batch / Lot */}

              <div>

                <label className="mb-2 block text-sm font-medium text-[#4d3d36]">
                  Batch / Lot
                </label>

                <input
                  type="text"
                  name="batch_lot"
                  value={form.batch_lot}
                  onChange={handleChange}
                  placeholder="e.g. LOT-A24-001"
                  maxLength="100"
                  className="w-full rounded-2xl border border-[#dfd1c0] bg-white px-4 py-3 font-mono text-sm text-[#351716] outline-none transition placeholder:font-sans placeholder:text-[#b2a399] focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/20"
                />

                <p className="mt-2 text-xs text-[#95847a]">
                  Optional batch or lot reference where applicable.
                </p>

              </div>

              {/* Pricing */}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium text-[#4d3d36]">
                    MRP *
                  </label>

                  <div className="relative">

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#8d7c72]">
                      ₹
                    </span>

                    <input
                      type="number"
                      name="mrp"
                      value={form.mrp}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="1500"
                      className="w-full rounded-2xl border border-[#dfd1c0] bg-white py-3 pl-8 pr-4 text-sm text-[#351716] outline-none transition placeholder:text-[#b2a399] focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/20"
                    />

                  </div>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-[#4d3d36]">
                    Selling Price *
                  </label>

                  <div className="relative">

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#8d7c72]">
                      ₹
                    </span>

                    <input
                      type="number"
                      name="selling_price"
                      value={form.selling_price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="1299"
                      className="w-full rounded-2xl border border-[#dfd1c0] bg-white py-3 pl-8 pr-4 text-sm text-[#351716] outline-none transition placeholder:text-[#b2a399] focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/20"
                    />

                  </div>

                </div>

              </div>

              {/* Discount Preview */}

              {form.mrp !== "" &&
                form.selling_price !== "" &&
                Number(form.mrp) > 0 &&
                Number(form.selling_price) <=
                  Number(form.mrp) && (
                  <div className="rounded-2xl border border-[#eadfce] bg-[#f8f1e6] px-4 py-3">

                    <p className="text-xs uppercase tracking-[0.12em] text-[#95847a]">
                      Calculated Discount
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[#351716]">
                      ₹
                      {(
                        Number(form.mrp) -
                        Number(form.selling_price)
                      ).toLocaleString("en-IN")}{" "}
                      (
                      {Math.round(
                        ((Number(form.mrp) -
                          Number(form.selling_price)) /
                          Number(form.mrp)) *
                          100
                      )}
                      %)
                    </p>

                  </div>
                )}

              {/* Stock */}

              <div>

                <label className="mb-2 block text-sm font-medium text-[#4d3d36]">
                  Stock Quantity *
                </label>

                <input
                  type="number"
                  name="stock_quantity"
                  value={form.stock_quantity}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  placeholder="25"
                  className="w-full rounded-2xl border border-[#dfd1c0] bg-white px-4 py-3 text-sm text-[#351716] outline-none transition placeholder:text-[#b2a399] focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/20"
                />

                <p className="mt-2 text-xs text-[#95847a]">
                  Enter the current number of bottles available.
                </p>

              </div>

              {/* Footer */}

              <div className="flex flex-col-reverse gap-3 border-t border-[#eadfce] pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-full border border-[#dfd1c0] px-5 py-3 text-sm font-medium text-[#66564e] transition hover:bg-[#f7efe4] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#351716] px-6 py-3 text-sm font-medium text-[#f8eddd] transition hover:bg-[#4a211f] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#f8eddd] border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />

                      {editingVariant
                        ? "Save Changes"
                        : "Add Variant"}
                    </>
                  )}

                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariants;