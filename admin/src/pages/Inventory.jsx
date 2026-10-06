import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  History,
  Package,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import {
  getAdminInventory,
  addAdminStock,
  removeAdminStock,
  getAdminInventoryHistory,
} from "../services/api";

import { useAdminAuth } from "../context/AdminAuthContext";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStockStatus = (quantity) => {
  const stock = Number(quantity || 0);

  if (stock <= 0) {
    return {
      label: "Out of Stock",
      className:
        "bg-red-50 text-red-700 border-red-200",
    };
  }

  if (stock <= 10) {
    return {
      label: "Low Stock",
      className:
        "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  return {
    label: "In Stock",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
};

export default function Inventory() {
  const { token } = useAdminAuth();

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedVariant, setSelectedVariant] = useState(null);

  const [stockAction, setStockAction] = useState(null);

  const [quantity, setQuantity] = useState("");
  const [batchLot, setBatchLot] = useState("");
  const [notes, setNotes] = useState("");

  const [historyVariant, setHistoryVariant] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // =====================================
  // LOAD INVENTORY
  // =====================================

  const loadInventory = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const response = await getAdminInventory(token);

      if (response.success) {
        setInventory(response.inventory || []);
      } else {
        throw new Error(
          response.message || "Failed to load inventory"
        );
      }
    } catch (err) {
      console.error("Inventory loading error:", err);

      setError(
        err.message || "Failed to load inventory"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [token]);

  // =====================================
  // FILTER INVENTORY
  // =====================================

  const filteredInventory = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return inventory.filter((item) => {
      const matchesSearch =
        !search ||
        item.productName
          ?.toLowerCase()
          .includes(search) ||
        item.sku
          ?.toLowerCase()
          .includes(search) ||
        item.bottleSize
          ?.toLowerCase()
          .includes(search) ||
        item.vintage
          ?.toLowerCase()
          .includes(search) ||
        item.batchLot
          ?.toLowerCase()
          .includes(search);

      const stock = Number(item.stockQuantity || 0);

      let matchesStatus = true;

      if (statusFilter === "in-stock") {
        matchesStatus = stock > 10;
      }

      if (statusFilter === "low-stock") {
        matchesStatus =
          stock > 0 && stock <= 10;
      }

      if (statusFilter === "out-of-stock") {
        matchesStatus = stock <= 0;
      }

      return matchesSearch && matchesStatus;
    });
  }, [
    inventory,
    searchTerm,
    statusFilter,
  ]);

  // =====================================
  // INVENTORY SUMMARY
  // =====================================

  const summary = useMemo(() => {
    let totalVariants = inventory.length;
    let totalStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    inventory.forEach((item) => {
      const stock = Number(
        item.stockQuantity || 0
      );

      totalStock += stock;

      if (stock <= 0) {
        outOfStock++;
      } else if (stock <= 10) {
        lowStock++;
      }
    });

    return {
      totalVariants,
      totalStock,
      lowStock,
      outOfStock,
    };
  }, [inventory]);

  // =====================================
  // OPEN STOCK ACTION
  // =====================================

  const openStockAction = (variant, action) => {
    setSelectedVariant(variant);
    setStockAction(action);

    setQuantity("");
    setBatchLot(variant.batchLot || "");
    setNotes("");

    setError("");
    setSuccessMessage("");
  };

  // =====================================
  // CLOSE STOCK ACTION
  // =====================================

  const closeStockAction = () => {
    if (actionLoading) return;

    setSelectedVariant(null);
    setStockAction(null);
    setQuantity("");
    setBatchLot("");
    setNotes("");
  };

  // =====================================
  // SUBMIT STOCK ACTION
  // =====================================

  const handleStockAction = async (event) => {
    event.preventDefault();

    if (!selectedVariant) return;

    const parsedQuantity = Number(quantity);

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setError(
        "Please enter a valid positive whole number."
      );
      return;
    }

    if (
      stockAction === "remove" &&
      parsedQuantity >
        Number(selectedVariant.stockQuantity || 0)
    ) {
      setError(
        `Cannot remove ${parsedQuantity} bottles. Current stock is ${selectedVariant.stockQuantity}.`
      );
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      let response;

      if (stockAction === "add") {
        response = await addAdminStock(
          token,
          selectedVariant.variantId,
          {
            quantity: parsedQuantity,
            batch_lot: batchLot || null,
            notes,
          }
        );
      } else {
        response = await removeAdminStock(
          token,
          selectedVariant.variantId,
          {
            quantity: parsedQuantity,
            notes,
          }
        );
      }

      if (!response.success) {
        throw new Error(
          response.message ||
            "Stock update failed"
        );
      }

      setSuccessMessage(
        stockAction === "add"
          ? "Stock added successfully."
          : "Stock removed successfully."
      );

      closeStockAction();

      await loadInventory();
    } catch (err) {
      console.error(
        "Stock action error:",
        err
      );

      setError(
        err.message ||
          "Failed to update stock."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================
  // LOAD HISTORY
  // =====================================

  const openHistory = async (variant) => {
    setHistoryVariant(variant);
    setHistory([]);
    setHistoryLoading(true);
    setError("");

    try {
      const response =
        await getAdminInventoryHistory(
          token,
          variant.variantId
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to load history"
        );
      }

      setHistory(response.history || []);
    } catch (err) {
      console.error(
        "Inventory history error:",
        err
      );

      setError(
        err.message ||
          "Failed to load stock history."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // =====================================
  // CLEAR MESSAGES
  // =====================================

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  return (
    <div className="min-h-full bg-[#f8f2e8] text-[#351716]">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="border-b border-[#d9c6a4] bg-[#fbf7ef]">
        <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#a88342]">
                VINEORA ADMIN
              </p>

              <h1 className="font-serif text-2xl font-semibold sm:text-3xl">
                Inventory Management
              </h1>

              <p className="mt-1 text-sm text-[#6c5850]">
                Monitor wine stock, variants and inventory movements.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                clearMessages();
                loadInventory();
              }}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#c9a45c] bg-white px-5 py-2.5 text-sm font-semibold text-[#351716] transition hover:bg-[#f4ead8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* =====================================
          CONTENT
      ===================================== */}

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">

        {/* =====================================
            MESSAGES
        ===================================== */}

        {error && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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

        {successMessage && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <span>{successMessage}</span>

            <button
              type="button"
              onClick={() =>
                setSuccessMessage("")
              }
              className="shrink-0"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* =====================================
            SUMMARY CARDS
        ===================================== */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <SummaryCard
            icon={<Boxes size={19} />}
            label="Total Variants"
            value={summary.totalVariants}
          />

          <SummaryCard
            icon={<Package size={19} />}
            label="Total Stock"
            value={summary.totalStock}
          />

          <SummaryCard
            icon={<AlertTriangle size={19} />}
            label="Low Stock"
            value={summary.lowStock}
            warning
          />

          <SummaryCard
            icon={<Package size={19} />}
            label="Out of Stock"
            value={summary.outOfStock}
            danger
          />

        </div>

        {/* =====================================
            FILTERS
        ===================================== */}

        <section className="mt-6 rounded-3xl border border-[#decdb0] bg-[#fffdf8] p-4 shadow-[0_15px_45px_rgba(53,23,22,0.05)] sm:p-5">

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

            <div className="relative w-full xl:max-w-xl">

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c7770]"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search wine, SKU, bottle size, vintage or batch..."
                className="w-full rounded-2xl border border-[#d9c6a4] bg-[#fbf7ef] py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#a88342] focus:ring-2 focus:ring-[#c9a45c]/20"
              />

            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">

              <FilterButton
                active={
                  statusFilter === "all"
                }
                onClick={() =>
                  setStatusFilter("all")
                }
              >
                All
              </FilterButton>

              <FilterButton
                active={
                  statusFilter === "in-stock"
                }
                onClick={() =>
                  setStatusFilter("in-stock")
                }
              >
                In Stock
              </FilterButton>

              <FilterButton
                active={
                  statusFilter === "low-stock"
                }
                onClick={() =>
                  setStatusFilter("low-stock")
                }
              >
                Low Stock
              </FilterButton>

              <FilterButton
                active={
                  statusFilter === "out-of-stock"
                }
                onClick={() =>
                  setStatusFilter(
                    "out-of-stock"
                  )
                }
              >
                Out of Stock
              </FilterButton>

            </div>
          </div>
        </section>

        {/* =====================================
            INVENTORY TABLE
        ===================================== */}

        <section className="mt-5 overflow-hidden rounded-3xl border border-[#decdb0] bg-[#fffdf8] shadow-[0_15px_45px_rgba(53,23,22,0.05)]">

          <div className="flex items-center justify-between border-b border-[#eadcc5] px-4 py-4 sm:px-5">

            <div>
              <h2 className="font-serif text-xl font-semibold">
                Wine Inventory
              </h2>

              <p className="mt-0.5 text-xs text-[#8a756d]">
                {filteredInventory.length} variant
                {filteredInventory.length !== 1
                  ? "s"
                  : ""}
              </p>
            </div>

          </div>

          {loading ? (
            <InventorySkeleton />
          ) : filteredInventory.length ===
            0 ? (
            <div className="px-6 py-16 text-center">

              <Boxes
                size={38}
                className="mx-auto text-[#b99d70]"
              />

              <h3 className="mt-4 font-serif text-xl font-semibold">
                No inventory found
              </h3>

              <p className="mt-1 text-sm text-[#7d6961]">
                Try changing your search or stock filter.
              </p>

            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}

              <div className="hidden overflow-x-auto lg:block">

                <table className="w-full min-w-[1200px] text-left">

                  <thead className="bg-[#f8f0e3] text-[11px] uppercase tracking-[0.16em] text-[#806b63]">

                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        Wine
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Variant
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        SKU
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Batch / Lot
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Price
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Stock
                      </th>

                      <th className="px-5 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>

                  </thead>

                  <tbody className="divide-y divide-[#eee2cf]">

                    {filteredInventory.map(
                      (item) => {
                        const status =
                          getStockStatus(
                            item.stockQuantity
                          );

                        return (
                          <tr
                            key={
                              item.variantId
                            }
                            className="transition hover:bg-[#fcf8f0]"
                          >

                            <td className="px-5 py-5">

                              <div>
                                <p className="max-w-[260px] font-medium text-[#351716]">
                                  {
                                    item.productName
                                  }
                                </p>

                                <p className="mt-1 text-xs text-[#8a756d]">
                                  {
                                    item.categoryName ||
                                    "Wine"
                                  }
                                </p>
                              </div>

                            </td>

                            <td className="px-5 py-5">

                              <div className="space-y-1 text-sm">

                                <p className="font-medium">
                                  {item.bottleSize ||
                                    "-"}
                                </p>

                                <p className="text-xs text-[#8a756d]">
                                  Vintage:{" "}
                                  {item.vintage ||
                                    "-"}
                                </p>

                              </div>

                            </td>

                            <td className="px-5 py-5">

                              <span className="rounded-lg bg-[#f4ead8] px-2.5 py-1 text-xs font-medium text-[#614b3e]">
                                {item.sku ||
                                  "-"}
                              </span>

                            </td>

                            <td className="px-5 py-5">

                              <span className="text-sm text-[#6c5850]">
                                {item.batchLot ||
                                  "-"}
                              </span>

                            </td>

                            <td className="px-5 py-5">

                              <div>
                                <p className="text-sm font-semibold">
                                  {formatCurrency(
                                    item.sellingPrice
                                  )}
                                </p>

                                {Number(
                                  item.mrp
                                ) >
                                  Number(
                                    item.sellingPrice
                                  ) && (
                                  <p className="mt-0.5 text-xs text-[#99877e] line-through">
                                    {formatCurrency(
                                      item.mrp
                                    )}
                                  </p>
                                )}
                              </div>

                            </td>

                            <td className="px-5 py-5">

                              <div className="flex items-center gap-2">

                                <span className="text-lg font-semibold">
                                  {
                                    item.stockQuantity
                                  }
                                </span>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${status.className}`}
                                >
                                  {status.label}
                                </span>

                              </div>

                            </td>

                            <td className="px-5 py-5">

                              <div className="flex justify-end gap-2">

                                <ActionButton
                                  title="Add stock"
                                  onClick={() =>
                                    openStockAction(
                                      item,
                                      "add"
                                    )
                                  }
                                >
                                  <ArrowUpFromLine
                                    size={16}
                                  />
                                </ActionButton>

                                <ActionButton
                                  title="Remove stock"
                                  onClick={() =>
                                    openStockAction(
                                      item,
                                      "remove"
                                    )
                                  }
                                >
                                  <ArrowDownToLine
                                    size={16}
                                  />
                                </ActionButton>

                                <ActionButton
                                  title="Stock history"
                                  onClick={() =>
                                    openHistory(
                                      item
                                    )
                                  }
                                >
                                  <History
                                    size={16}
                                  />
                                </ActionButton>

                              </div>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

              {/* MOBILE CARDS */}

              <div className="divide-y divide-[#eee2cf] lg:hidden">

                {filteredInventory.map(
                  (item) => {
                    const status =
                      getStockStatus(
                        item.stockQuantity
                      );

                    return (
                      <div
                        key={
                          item.variantId
                        }
                        className="p-4 sm:p-5"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <h3 className="font-serif text-lg font-semibold">
                              {
                                item.productName
                              }
                            </h3>

                            <p className="mt-1 text-xs text-[#8a756d]">
                              {
                                item.categoryName ||
                                "Wine"
                              }
                            </p>

                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide ${status.className}`}
                          >
                            {status.label}
                          </span>

                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">

                          <InfoItem
                            label="Bottle"
                            value={
                              item.bottleSize ||
                              "-"
                            }
                          />

                          <InfoItem
                            label="Vintage"
                            value={
                              item.vintage ||
                              "-"
                            }
                          />

                          <InfoItem
                            label="SKU"
                            value={
                              item.sku || "-"
                            }
                          />

                          <InfoItem
                            label="Batch / Lot"
                            value={
                              item.batchLot ||
                              "-"
                            }
                          />

                          <InfoItem
                            label="Selling Price"
                            value={formatCurrency(
                              item.sellingPrice
                            )}
                          />

                          <InfoItem
                            label="Current Stock"
                            value={
                              item.stockQuantity
                            }
                          />

                        </div>

                        <div className="mt-4 flex gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              openStockAction(
                                item,
                                "add"
                              )
                            }
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#c9a45c] bg-[#fffaf0] px-3 py-2.5 text-xs font-semibold text-[#614b3e] transition hover:bg-[#f4ead8]"
                          >
                            <ArrowUpFromLine
                              size={15}
                            />
                            Add
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openStockAction(
                                item,
                                "remove"
                              )
                            }
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#d7b8b3] bg-white px-3 py-2.5 text-xs font-semibold text-[#75443e] transition hover:bg-[#fbefed]"
                          >
                            <ArrowDownToLine
                              size={15}
                            />
                            Remove
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openHistory(
                                item
                              )
                            }
                            className="flex items-center justify-center rounded-xl border border-[#d9c6a4] bg-white px-3 py-2.5 text-[#614b3e] transition hover:bg-[#f4ead8]"
                          >
                            <History
                              size={15}
                            />
                          </button>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            </>
          )}

        </section>

      </main>

      {/* =====================================
          STOCK ACTION MODAL
      ===================================== */}

      {stockAction && selectedVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25100f]/55 p-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#decdb0] bg-[#fffdf8] shadow-2xl">

            <div className="border-b border-[#eadcc5] px-5 py-5 sm:px-6">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a88342]">
                    Inventory
                  </p>

                  <h2 className="mt-1 font-serif text-2xl font-semibold">
                    {stockAction === "add"
                      ? "Add Stock"
                      : "Remove Stock"}
                  </h2>

                  <p className="mt-1 text-sm text-[#7c6961]">
                    {selectedVariant.productName}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={closeStockAction}
                  className="rounded-full p-2 text-[#6c5850] transition hover:bg-[#f4ead8]"
                >
                  <X size={20} />
                </button>

              </div>

            </div>

            <form
              onSubmit={handleStockAction}
              className="space-y-5 p-5 sm:p-6"
            >

              <div className="grid grid-cols-2 gap-3">

                <InfoBox
                  label="Current Stock"
                  value={
                    selectedVariant.stockQuantity
                  }
                />

                <InfoBox
                  label="SKU"
                  value={
                    selectedVariant.sku ||
                    "-"
                  }
                />

              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value
                    )
                  }
                  placeholder="Enter quantity"
                  autoFocus
                  className="w-full rounded-xl border border-[#d9c6a4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a88342] focus:ring-2 focus:ring-[#c9a45c]/20"
                />
              </div>

              {stockAction === "add" && (
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Batch / Lot
                  </label>

                  <input
                    type="text"
                    value={batchLot}
                    onChange={(event) =>
                      setBatchLot(
                        event.target.value
                      )
                    }
                    placeholder="e.g. LOT-2026-001"
                    className="w-full rounded-xl border border-[#d9c6a4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a88342] focus:ring-2 focus:ring-[#c9a45c]/20"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Notes
                </label>

                <textarea
                  rows="3"
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target.value
                    )
                  }
                  placeholder={
                    stockAction === "add"
                      ? "Optional note about this stock receipt..."
                      : "Reason for removing stock..."
                  }
                  className="w-full resize-none rounded-xl border border-[#d9c6a4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a88342] focus:ring-2 focus:ring-[#c9a45c]/20"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeStockAction}
                  disabled={actionLoading}
                  className="rounded-xl border border-[#d9c6a4] bg-white px-5 py-3 text-sm font-semibold text-[#614b3e] transition hover:bg-[#f4ead8]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#351716] px-5 py-3 text-sm font-semibold text-[#f8f0e3] transition hover:bg-[#4b211f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading && (
                    <RefreshCw
                      size={15}
                      className="animate-spin"
                    />
                  )}

                  {stockAction === "add"
                    ? "Add Stock"
                    : "Remove Stock"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* =====================================
          HISTORY MODAL
      ===================================== */}

      {historyVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25100f]/55 p-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-[#decdb0] bg-[#fffdf8] shadow-2xl">

            <div className="flex items-start justify-between gap-4 border-b border-[#eadcc5] px-5 py-5 sm:px-6">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a88342]">
                  Stock History
                </p>

                <h2 className="mt-1 font-serif text-xl font-semibold sm:text-2xl">
                  {historyVariant.productName}
                </h2>

                <p className="mt-1 text-xs text-[#7c6961]">
                  {historyVariant.sku || "-"} •{" "}
                  {historyVariant.bottleSize ||
                    "-"}{" "}
                  • Vintage{" "}
                  {historyVariant.vintage ||
                    "-"}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setHistoryVariant(null)
                }
                className="rounded-full p-2 text-[#6c5850] transition hover:bg-[#f4ead8]"
              >
                <X size={20} />
              </button>

            </div>

            <div className="max-h-[65vh] overflow-y-auto">

              {historyLoading ? (
                <div className="flex items-center justify-center py-16">

                  <RefreshCw
                    size={25}
                    className="animate-spin text-[#a88342]"
                  />

                </div>
              ) : history.length ===
                0 ? (
                <div className="px-6 py-16 text-center">

                  <History
                    size={35}
                    className="mx-auto text-[#b99d70]"
                  />

                  <p className="mt-3 font-serif text-lg font-semibold">
                    No movements yet
                  </p>

                  <p className="mt-1 text-sm text-[#7d6961]">
                    Inventory movements will appear here.
                  </p>

                </div>
              ) : (
                <div className="divide-y divide-[#eee2cf]">

                  {history.map((movement) => {

                    const isStockIn =
                      movement.movementType ===
                      "Stock In";

                    return (
                      <div
                        key={movement.id}
                        className="p-4 sm:p-5"
                      >

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                          <div className="flex items-start gap-3">

                            <div
                              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                isStockIn
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {isStockIn ? (
                                <ArrowUpFromLine
                                  size={17}
                                />
                              ) : (
                                <ArrowDownToLine
                                  size={17}
                                />
                              )}
                            </div>

                            <div>

                              <div className="flex flex-wrap items-center gap-2">

                                <p className="text-sm font-semibold">
                                  {
                                    movement.movementType
                                  }
                                </p>

                                <span className="rounded-full bg-[#f4ead8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#725d50]">
                                  {
                                    movement.referenceType
                                  }
                                </span>

                              </div>

                              <p className="mt-1 text-xs text-[#8a756d]">
                                {
                                  formatDate(
                                    movement.createdAt
                                  )
                                }
                              </p>

                            </div>

                          </div>

                          <p
                            className={`text-lg font-semibold ${
                              isStockIn
                                ? "text-emerald-700"
                                : "text-red-700"
                            }`}
                          >
                            {isStockIn
                              ? "+"
                              : "-"}
                            {movement.quantity}
                          </p>

                        </div>

                        {(movement.orderNumber ||
                          movement.notes) && (
                          <div className="mt-3 rounded-xl bg-[#faf4e9] px-4 py-3 text-xs text-[#6c5850]">

                            {movement.orderNumber && (
                              <p>
                                Order:{" "}
                                <span className="font-semibold">
                                  {
                                    movement.orderNumber
                                  }
                                </span>
                              </p>
                            )}

                            {movement.notes && (
                              <p
                                className={
                                  movement.orderNumber
                                    ? "mt-1"
                                    : ""
                                }
                              >
                                {
                                  movement.notes
                                }
                              </p>
                            )}

                          </div>
                        )}

                      </div>
                    );
                  })}

                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// =====================================
// SUMMARY CARD
// =====================================

function SummaryCard({
  icon,
  label,
  value,
  warning = false,
  danger = false,
}) {
  return (
    <div className="rounded-2xl border border-[#decdb0] bg-[#fffdf8] p-4 shadow-[0_10px_30px_rgba(53,23,22,0.04)] sm:p-5">

      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          danger
            ? "bg-red-50 text-red-700"
            : warning
            ? "bg-amber-50 text-amber-700"
            : "bg-[#f4ead8] text-[#8a6b38]"
        }`}
      >
        {icon}
      </div>

      <p className="mt-4 text-xs font-medium text-[#806b63]">
        {label}
      </p>

      <p className="mt-1 font-serif text-2xl font-semibold sm:text-3xl">
        {value}
      </p>

    </div>
  );
}

// =====================================
// FILTER BUTTON
// =====================================

function FilterButton({
  active,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition ${
        active
          ? "border-[#351716] bg-[#351716] text-[#f8f0e3]"
          : "border-[#d9c6a4] bg-white text-[#6c5850] hover:bg-[#f4ead8]"
      }`}
    >
      {children}
    </button>
  );
}

// =====================================
// ACTION BUTTON
// =====================================

function ActionButton({
  title,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d9c6a4] bg-white text-[#614b3e] transition hover:border-[#c9a45c] hover:bg-[#f4ead8]"
    >
      {children}
    </button>
  );
}

// =====================================
// INFO ITEM
// =====================================

function InfoItem({ label, value }) {
  return (
    <div className="rounded-xl bg-[#faf4e9] p-3">

      <p className="text-[10px] uppercase tracking-wide text-[#927e74]">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-[#4a302b]">
        {value}
      </p>

    </div>
  );
}

// =====================================
// INFO BOX
// =====================================

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl bg-[#faf4e9] p-3">

      <p className="text-[10px] uppercase tracking-wide text-[#927e74]">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-[#4a302b]">
        {value}
      </p>

    </div>
  );
}

// =====================================
// SKELETON
// =====================================

function InventorySkeleton() {
  return (
    <div className="divide-y divide-[#eee2cf]">

      {Array.from({
        length: 6,
      }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse p-5"
        >
          <div className="h-4 w-1/3 rounded bg-[#eadcc5]" />

          <div className="mt-3 h-3 w-1/5 rounded bg-[#f0e6d5]" />

          <div className="mt-4 h-10 w-full rounded bg-[#f5eee3]" />
        </div>
      ))}

    </div>
  );
}