import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const EMPTY_FORM = {
  name: "",
  state: "",
  city: "",
  postal_code: "",
  country: "India",
  delivery_available: true,
  delivery_charge: 0,
  estimated_delivery_days: 1,
};

const DeliveryManagement = () => {
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const adminToken = sessionStorage.getItem("adminToken");

  const fetchZones = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/delivery-zones`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch delivery zones"
        );
      }

      setZones(data.zones || []);
    } catch (err) {
      console.error("Fetch delivery zones error:", err);
      setError(err.message || "Failed to fetch delivery zones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Zone name is required.");
      return;
    }

    if (!form.postal_code.trim()) {
      setError("Postal code is required.");
      return;
    }

    if (!/^\d{6}$/.test(form.postal_code.trim())) {
      setError("Please enter a valid 6-digit Indian pincode.");
      return;
    }

    try {
      setSaving(true);

      const url = editingId
        ? `${API_BASE_URL}/admin/delivery-zones/${editingId}`
        : `${API_BASE_URL}/admin/delivery-zones`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          state: form.state.trim(),
          city: form.city.trim(),
          postal_code: form.postal_code.trim(),
          country: form.country.trim() || "India",
          delivery_charge: Number(form.delivery_charge) || 0,
          estimated_delivery_days:
            Number(form.estimated_delivery_days) || 1,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            `Failed to ${editingId ? "update" : "create"} delivery zone`
        );
      }

      setSuccess(
        editingId
          ? "Delivery zone updated successfully."
          : "Delivery zone created successfully."
      );

      resetForm();
      await fetchZones();
    } catch (err) {
      console.error("Save delivery zone error:", err);
      setError(err.message || "Failed to save delivery zone");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (zone) => {
    setEditingId(zone.id);

    setForm({
      name: zone.name || "",
      state: zone.state || "",
      city: zone.city || "",
      postal_code: zone.postal_code || "",
      country: zone.country || "India",
      delivery_available: Boolean(zone.delivery_available),
      delivery_charge: zone.delivery_charge ?? 0,
      estimated_delivery_days:
        zone.estimated_delivery_days ?? 1,
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this delivery zone?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_BASE_URL}/admin/delivery-zones/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete delivery zone"
        );
      }

      setSuccess("Delivery zone deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      await fetchZones();
    } catch (err) {
      console.error("Delete delivery zone error:", err);
      setError(err.message || "Failed to delete delivery zone");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f1e8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#a88342]">
            Delivery
          </p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#351716] sm:text-4xl">
                Delivery Management
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c5850]">
                Manage delivery zones, pincode availability, delivery
                charges and estimated delivery times.
              </p>
            </div>

            <div className="rounded-full border border-[#d8c9b5] bg-[#fffaf2] px-4 py-2 text-sm text-[#6c5850]">
              {zones.length}{" "}
              {zones.length === 1 ? "zone" : "zones"}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">

          {/* Form */}
          <section className="h-fit rounded-2xl border border-[#ded1c0] bg-[#fffaf2] p-5 shadow-[0_12px_35px_rgba(53,23,22,0.06)] sm:p-6">
            <div className="mb-6">
              <h2 className="font-serif text-xl font-semibold text-[#351716]">
                {editingId
                  ? "Edit Delivery Zone"
                  : "Add Delivery Zone"}
              </h2>

              <p className="mt-1 text-sm text-[#806f66]">
                Configure where VineWinbe can deliver.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Zone Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4d3b35]">
                  Zone Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Pune City"
                  className="w-full rounded-xl border border-[#d9cbb9] bg-white px-4 py-3 text-sm text-[#351716] outline-none transition focus:border-[#a88342] focus:ring-2 focus:ring-[#a88342]/15"
                />
              </div>

              {/* State */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4d3b35]">
                  State
                </label>

                <input
                  type="text"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="e.g. Maharashtra"
                  className="w-full rounded-xl border border-[#d9cbb9] bg-white px-4 py-3 text-sm text-[#351716] outline-none transition focus:border-[#a88342] focus:ring-2 focus:ring-[#a88342]/15"
                />
              </div>

              {/* City */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4d3b35]">
                  City
                </label>

                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Pune"
                  className="w-full rounded-xl border border-[#d9cbb9] bg-white px-4 py-3 text-sm text-[#351716] outline-none transition focus:border-[#a88342] focus:ring-2 focus:ring-[#a88342]/15"
                />
              </div>

              {/* Pincode */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4d3b35]">
                  Pincode
                </label>

                <input
                  type="text"
                  name="postal_code"
                  value={form.postal_code}
                  onChange={handleChange}
                  placeholder="6-digit pincode"
                  maxLength={6}
                  inputMode="numeric"
                  className="w-full rounded-xl border border-[#d9cbb9] bg-white px-4 py-3 text-sm tracking-wider text-[#351716] outline-none transition focus:border-[#a88342] focus:ring-2 focus:ring-[#a88342]/15"
                />
              </div>

              {/* Country */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4d3b35]">
                  Country
                </label>

                <input
                  type="text"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#d9cbb9] bg-white px-4 py-3 text-sm text-[#351716] outline-none transition focus:border-[#a88342] focus:ring-2 focus:ring-[#a88342]/15"
                />
              </div>

              {/* Charge + Days */}
              <div className="grid grid-cols-2 gap-3">

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#4d3b35]">
                    Delivery Charge
                  </label>

                  <input
                    type="number"
                    name="delivery_charge"
                    value={form.delivery_charge}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-[#d9cbb9] bg-white px-4 py-3 text-sm text-[#351716] outline-none transition focus:border-[#a88342] focus:ring-2 focus:ring-[#a88342]/15"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#4d3b35]">
                    Delivery Days
                  </label>

                  <input
                    type="number"
                    name="estimated_delivery_days"
                    value={form.estimated_delivery_days}
                    onChange={handleChange}
                    min="1"
                    className="w-full rounded-xl border border-[#d9cbb9] bg-white px-4 py-3 text-sm text-[#351716] outline-none transition focus:border-[#a88342] focus:ring-2 focus:ring-[#a88342]/15"
                  />
                </div>
              </div>

              {/* Availability */}
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#ded1c0] bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#351716]">
                    Delivery Available
                  </p>

                  <p className="mt-0.5 text-xs text-[#806f66]">
                    Allow orders for this pincode.
                  </p>
                </div>

                <input
                  type="checkbox"
                  name="delivery_available"
                  checked={form.delivery_available}
                  onChange={handleChange}
                  className="h-5 w-5 accent-[#a88342]"
                />
              </label>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-[#351716] px-4 py-3 text-sm font-semibold text-[#fffaf2] transition hover:bg-[#4b2422] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Zone"
                    : "Add Zone"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-[#cdbda9] px-4 py-3 text-sm font-semibold text-[#5d4941] transition hover:bg-[#f3eadf]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Zones list */}
          <section className="rounded-2xl border border-[#ded1c0] bg-[#fffaf2] shadow-[0_12px_35px_rgba(53,23,22,0.06)]">

            <div className="border-b border-[#e3d8ca] px-5 py-5 sm:px-6">
              <h2 className="font-serif text-xl font-semibold text-[#351716]">
                Delivery Zones
              </h2>

              <p className="mt-1 text-sm text-[#806f66]">
                All configured delivery locations.
              </p>
            </div>

            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center px-6">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#d8c9b5] border-t-[#a88342]" />

                  <p className="text-sm text-[#806f66]">
                    Loading delivery zones...
                  </p>
                </div>
              </div>
            ) : zones.length === 0 ? (
              <div className="flex min-h-[300px] items-center justify-center px-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f0e5d7] text-2xl">
                    ♧
                  </div>

                  <h3 className="font-serif text-lg font-semibold text-[#351716]">
                    No delivery zones yet
                  </h3>

                  <p className="mt-1 text-sm text-[#806f66]">
                    Add your first delivery zone using the form.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#e3d8ca]">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="p-5 transition hover:bg-[#fcf7ef] sm:p-6"
                  >
                    <div className="flex flex-col gap-4">

                      {/* Top */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-serif text-lg font-semibold text-[#351716]">
                              {zone.name}
                            </h3>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                zone.delivery_available
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {zone.delivery_available
                                ? "Available"
                                : "Unavailable"}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-[#806f66]">
                            {[
                              zone.city,
                              zone.state,
                              zone.country,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(zone)}
                            className="rounded-lg border border-[#cdbda9] px-3 py-2 text-xs font-semibold text-[#5d4941] transition hover:bg-[#f3eadf]"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(zone.id)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

                        <div className="rounded-xl bg-[#f7f0e6] px-4 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a88342]">
                            Pincode
                          </p>

                          <p className="mt-1 text-sm font-semibold tracking-wider text-[#351716]">
                            {zone.postal_code}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#f7f0e6] px-4 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a88342]">
                            Delivery
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#351716]">
                            ₹{Number(zone.delivery_charge || 0).toFixed(2)}
                          </p>
                        </div>

                        <div className="col-span-2 rounded-xl bg-[#f7f0e6] px-4 py-3 sm:col-span-1">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a88342]">
                            ETA
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#351716]">
                            {zone.estimated_delivery_days}{" "}
                            {Number(zone.estimated_delivery_days) === 1
                              ? "day"
                              : "days"}
                          </p>
                        </div>

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default DeliveryManagement;