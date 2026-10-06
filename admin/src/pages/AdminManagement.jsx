import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldOff,
  KeyRound,
  X,
  Check,
  AlertCircle,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

const getToken = () => {
  return (
    sessionStorage.getItem("adminToken") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token")
  );
};

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const token = getToken();

  const showMessage = (type, text) => {
    setMessage({ type, text });

    setTimeout(() => {
      setMessage({
        type: "",
        text: "",
      });
    }, 4000);
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/admin/admins`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load admins");
      }

      setAdmins(data.admins || []);
    } catch (error) {
      console.error("Fetch admins error:", error);
      showMessage("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      password: "",
    });
  };

  const openAddModal = () => {
    resetForm();
    setSelectedAdmin(null);
    setModal("add");
  };

  const openEditModal = (admin) => {
    setSelectedAdmin(admin);

    setForm({
      name: admin.name || "",
      email: admin.email || "",
      password: "",
    });

    setModal("edit");
  };

  const openPasswordModal = (admin) => {
    setSelectedAdmin(admin);

    setForm({
      name: "",
      email: "",
      password: "",
    });

    setModal("password");
  };

  const closeModal = () => {
    if (saving) return;

    setModal(null);
    setSelectedAdmin(null);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      showMessage(
        "error",
        "Name, email and password are required."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_URL}/admin/admins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create admin"
        );
      }

      showMessage(
        "success",
        "Admin account created successfully."
      );

      closeModal();
      fetchAdmins();
    } catch (error) {
      console.error("Create admin error:", error);
      showMessage("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      showMessage(
        "error",
        "Name and email are required."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/admin/admins/${selectedAdmin.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update admin"
        );
      }

      showMessage(
        "success",
        "Admin details updated successfully."
      );

      closeModal();
      fetchAdmins();
    } catch (error) {
      console.error("Update admin error:", error);
      showMessage("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    if (!form.password) {
      showMessage("error", "Password is required.");
      return;
    }

    if (form.password.length < 8) {
      showMessage(
        "error",
        "Password must be at least 8 characters."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/admin/admins/${selectedAdmin.id}/password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            password: form.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to change password"
        );
      }

      showMessage(
        "success",
        "Admin password changed successfully."
      );

      closeModal();
    } catch (error) {
      console.error("Password change error:", error);
      showMessage("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (admin) => {
    const newStatus = !admin.is_active;

    try {
      const response = await fetch(
        `${API_URL}/admin/admins/${admin.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            is_active: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update admin status"
        );
      }

      showMessage(
        "success",
        newStatus
          ? "Admin activated successfully."
          : "Admin deactivated successfully."
      );

      fetchAdmins();
    } catch (error) {
      console.error("Status change error:", error);
      showMessage("error", error.message);
    }
  };

  const handleDelete = async (admin) => {
    const confirmed = window.confirm(
      `Delete admin "${admin.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/admin/admins/${admin.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete admin"
        );
      }

      showMessage(
        "success",
        "Admin deleted successfully."
      );

      fetchAdmins();
    } catch (error) {
      console.error("Delete admin error:", error);
      showMessage("error", error.message);
    }
  };

  const filteredAdmins = admins.filter((admin) => {
    const searchValue = search.toLowerCase().trim();

    if (!searchValue) return true;

    return (
      admin.name?.toLowerCase().includes(searchValue) ||
      admin.email?.toLowerCase().includes(searchValue)
    );
  });

  const formatDate = (date) => {
    if (!date) return "Never";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[#f3e8d7] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#a88342]">
            Administration
          </p>

          <h1 className="text-2xl font-semibold text-[#351716] sm:text-3xl">
            Admin Management
          </h1>

          <p className="mt-1 text-sm text-[#6c5850]">
            Manage administrator accounts and account access.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#351716] px-5 py-3 text-sm font-semibold text-[#f3e8d7] shadow-sm transition hover:bg-[#4a211f]"
        >
          <Plus size={18} />
          Add Admin
        </button>
      </div>

      {/* Notification */}
      {message.text && (
        <div
          className={`mb-5 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-[#c9a45c]/40 bg-[#f8f1e6] text-[#351716]"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <Check size={18} />
          ) : (
            <AlertCircle size={18} />
          )}

          <span>{message.text}</span>
        </div>
      )}

      {/* Search */}
      <div className="mb-5 rounded-2xl border border-[#c9a45c]/20 bg-[#f8f1e6] p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a88342]"
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-[#c9a45c]/30 bg-[#fffaf3] py-3 pl-10 pr-4 text-sm text-[#351716] outline-none transition placeholder:text-[#9b8980] focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/20"
          />
        </div>
      </div>

      {/* Admin Table */}
      <div className="overflow-hidden rounded-2xl border border-[#c9a45c]/20 bg-[#f8f1e6] shadow-sm">
        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <div className="text-sm text-[#6c5850]">
              Loading administrators...
            </div>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center px-6 text-center">
            <ShieldCheck
              size={42}
              className="mb-3 text-[#c9a45c]"
            />

            <h3 className="text-lg font-semibold text-[#351716]">
              No administrators found
            </h3>

            <p className="mt-1 text-sm text-[#6c5850]">
              {search
                ? "Try a different search."
                : "Add your first administrator."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead>
                <tr className="border-b border-[#c9a45c]/20 bg-[#efe2d0]">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6c5850]">
                    Administrator
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6c5850]">
                    Email
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6c5850]">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6c5850]">
                    Last Login
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6c5850]">
                    Created
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#6c5850]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredAdmins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="border-b border-[#c9a45c]/10 last:border-0 hover:bg-[#fffaf3]/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#351716] text-sm font-semibold text-[#f3e8d7]">
                          {admin.name
                            ?.charAt(0)
                            ?.toUpperCase() || "A"}
                        </div>

                        <div>
                          <p className="font-semibold text-[#351716]">
                            {admin.name}
                          </p>

                          <p className="text-xs text-[#a88342]">
                            Administrator
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#6c5850]">
                      {admin.email}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          admin.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {admin.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#6c5850]">
                      {formatDate(admin.last_login_at)}
                    </td>

                    <td className="px-5 py-4 text-sm text-[#6c5850]">
                      {formatDate(admin.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(admin)}
                          title="Edit admin"
                          className="rounded-lg border border-[#c9a45c]/30 p-2 text-[#351716] transition hover:bg-[#efe2d0]"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() =>
                            openPasswordModal(admin)
                          }
                          title="Change password"
                          className="rounded-lg border border-[#c9a45c]/30 p-2 text-[#351716] transition hover:bg-[#efe2d0]"
                        >
                          <KeyRound size={16} />
                        </button>

                        <button
                          onClick={() =>
                            handleStatusChange(admin)
                          }
                          title={
                            admin.is_active
                              ? "Deactivate admin"
                              : "Activate admin"
                          }
                          className={`rounded-lg border p-2 transition ${
                            admin.is_active
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-green-200 text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {admin.is_active ? (
                            <ShieldOff size={16} />
                          ) : (
                            <ShieldCheck size={16} />
                          )}
                        </button>

                        <button
                          onClick={() => handleDelete(admin)}
                          title="Delete admin"
                          className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#c9a45c]/20 bg-[#f8f1e6] shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#c9a45c]/20 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-[#351716]">
                  {modal === "add" && "Add New Admin"}
                  {modal === "edit" && "Edit Admin"}
                  {modal === "password" &&
                    "Change Admin Password"}
                </h2>

                {modal === "password" && (
                  <p className="mt-1 text-sm text-[#6c5850]">
                    {selectedAdmin?.name}
                  </p>
                )}
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-[#6c5850] transition hover:bg-[#efe2d0] hover:text-[#351716]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Add */}
            {modal === "add" && (
              <form
                onSubmit={handleCreate}
                className="space-y-5 p-6"
              >
                <InputField
                  label="Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter admin name"
                />

                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter admin email"
                />

                <InputField
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                />

                <ModalButtons
                  closeModal={closeModal}
                  saving={saving}
                  submitText="Create Admin"
                />
              </form>
            )}

            {/* Edit */}
            {modal === "edit" && (
              <form
                onSubmit={handleUpdate}
                className="space-y-5 p-6"
              >
                <InputField
                  label="Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter admin name"
                />

                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter admin email"
                />

                <ModalButtons
                  closeModal={closeModal}
                  saving={saving}
                  submitText="Save Changes"
                />
              </form>
            )}

            {/* Password */}
            {modal === "password" && (
              <form
                onSubmit={handlePasswordChange}
                className="space-y-5 p-6"
              >
                <InputField
                  label="New Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                />

                <ModalButtons
                  closeModal={closeModal}
                  saving={saving}
                  submitText="Change Password"
                />
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#351716]">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#c9a45c]/30 bg-[#fffaf3] px-4 py-3 text-sm text-[#351716] outline-none transition placeholder:text-[#9b8980] focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/20"
      />
    </div>
  );
};

const ModalButtons = ({
  closeModal,
  saving,
  submitText,
}) => {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={closeModal}
        disabled={saving}
        className="rounded-xl border border-[#c9a45c]/30 px-5 py-3 text-sm font-semibold text-[#6c5850] transition hover:bg-[#efe2d0] disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-[#351716] px-5 py-3 text-sm font-semibold text-[#f3e8d7] transition hover:bg-[#4a211f] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving..." : submitText}
      </button>
    </div>
  );
};

export default AdminManagement;