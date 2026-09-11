import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext.jsx";

const API_BASE_URL = "http://localhost:5000/api";

const emptyAddressForm = {
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
  address_type: "Home",
  is_default: false,
};

const Account = () => {
  const navigate = useNavigate();

  const { wishlistCount } = useWishlist();

  const {
    customer: authCustomer,
    token,
    loading: authLoading,
    logout,
  } = useAuth();

  const [customer, setCustomer] = useState(authCustomer);

  const [summary, setSummary] = useState({
    orders: 0,
    addresses: 0,
    wishlist: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================================================
     ADDRESS STATE
  ===================================================== */

  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressError, setAddressError] = useState("");

  const [isAddressModalOpen, setIsAddressModalOpen] =
    useState(false);

  const [editingAddressId, setEditingAddressId] =
    useState(null);

  const [addressForm, setAddressForm] =
    useState(emptyAddressForm);

  const [savingAddress, setSavingAddress] = useState(false);

  const [addressFormError, setAddressFormError] =
    useState("");

  const [addressSuccess, setAddressSuccess] =
    useState("");

  const [deletingAddressId, setDeletingAddressId] =
    useState(null);

  const [settingDefaultId, setSettingDefaultId] =
    useState(null);

  /* =====================================================
     EDIT PROFILE STATE
  ===================================================== */

  const [isEditOpen, setIsEditOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  /* =====================================================
     LOAD ACCOUNT
  ===================================================== */

  useEffect(() => {
    const loadAccount = async () => {
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
          `${API_BASE_URL}/auth/me`,
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
            data.message || "Failed to load account"
          );
        }

        setCustomer(data.customer);

        /*
          IMPORTANT:
          Wishlist count is NOT set here.

          Wishlist count is controlled by WishlistContext
          and synchronized separately below.
        */

        setSummary((previous) => ({
          ...previous,
          orders: data.summary?.orders ?? 0,
          addresses: data.summary?.addresses ?? 0,
        }));
      } catch (err) {
        console.error("Account loading error:", err);

        setError(
          err.message ||
            "Unable to load your account information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAccount();
  }, [token, authLoading, navigate, logout]);

  /* =====================================================
     SYNC WISHLIST COUNT
  ===================================================== */

  useEffect(() => {
    setSummary((previous) => ({
      ...previous,
      wishlist: wishlistCount,
    }));
  }, [wishlistCount]);

  /* =====================================================
     LOAD ADDRESSES
  ===================================================== */

  const loadAddresses = async () => {
    if (!token) {
      return;
    }

    try {
      setAddressesLoading(true);
      setAddressError("");

      const response = await fetch(
        `${API_BASE_URL}/addresses`,
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
          data.message || "Failed to load addresses"
        );
      }

      setAddresses(data.addresses || []);

      setSummary((previous) => ({
        ...previous,
        addresses: (data.addresses || []).length,
      }));
    } catch (err) {
      console.error("Address loading error:", err);

      setAddressError(
        err.message || "Unable to load your addresses."
      );
    } finally {
      setAddressesLoading(false);
    }
  };

  /* =====================================================
     LOAD ADDRESSES WHEN ACCOUNT LOADS
  ===================================================== */

  useEffect(() => {
    if (!authLoading && token) {
      loadAddresses();
    }
  }, [authLoading, token]);

  /* =====================================================
     OPEN ADD ADDRESS
  ===================================================== */

  const openAddAddress = () => {
    setEditingAddressId(null);

    setAddressForm({
      ...emptyAddressForm,
      is_default: addresses.length === 0,
    });

    setAddressFormError("");
    setAddressSuccess("");
    setIsAddressModalOpen(true);
  };

  /* =====================================================
     OPEN EDIT ADDRESS
  ===================================================== */

  const openEditAddress = (address) => {
    setEditingAddressId(address.id);

    setAddressForm({
      address_line_1: address.address_line_1 || "",
      address_line_2: address.address_line_2 || "",
      city: address.city || "",
      state: address.state || "",
      postal_code: address.postal_code || "",
      country: address.country || "India",
      address_type: address.address_type || "Home",
      is_default: Boolean(address.is_default),
    });

    setAddressFormError("");
    setAddressSuccess("");
    setIsAddressModalOpen(true);
  };

  /* =====================================================
     CLOSE ADDRESS MODAL
  ===================================================== */

  const closeAddressModal = () => {
    if (savingAddress) {
      return;
    }

    setIsAddressModalOpen(false);
    setEditingAddressId(null);
    setAddressForm(emptyAddressForm);
    setAddressFormError("");
    setAddressSuccess("");
  };

  /* =====================================================
     ADDRESS FORM CHANGE
  ===================================================== */

  const handleAddressChange = (event) => {
    const { name, value, type, checked } = event.target;

    setAddressForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* =====================================================
     SAVE ADDRESS
  ===================================================== */

  const handleSaveAddress = async (event) => {
    event.preventDefault();

    setAddressFormError("");
    setAddressSuccess("");

    if (
      !addressForm.address_line_1.trim() ||
      !addressForm.city.trim() ||
      !addressForm.state.trim() ||
      !addressForm.postal_code.trim()
    ) {
      setAddressFormError(
        "Address line 1, city, state and postal code are required."
      );

      return;
    }

    try {
      setSavingAddress(true);

      const isEditing = Boolean(editingAddressId);

      const url = isEditing
        ? `${API_BASE_URL}/addresses/${editingAddressId}`
        : `${API_BASE_URL}/addresses`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          address_line_1:
            addressForm.address_line_1.trim(),

          address_line_2:
            addressForm.address_line_2.trim(),

          city: addressForm.city.trim(),

          state: addressForm.state.trim(),

          postal_code:
            addressForm.postal_code.trim(),

          country:
            addressForm.country.trim() || "India",

          address_type:
            addressForm.address_type.trim() || "Home",

          is_default: Boolean(addressForm.is_default),
        }),
      });

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
            `Failed to ${
              isEditing ? "update" : "add"
            } address`
        );
      }

      setAddressSuccess(
        isEditing
          ? "Address updated successfully."
          : "Address added successfully."
      );

      await loadAddresses();

      setTimeout(() => {
        setIsAddressModalOpen(false);
        setEditingAddressId(null);
        setAddressForm(emptyAddressForm);
        setAddressSuccess("");
      }, 900);
    } catch (err) {
      console.error("Address save error:", err);

      setAddressFormError(
        err.message ||
          "Unable to save your address."
      );
    } finally {
      setSavingAddress(false);
    }
  };

  /* =====================================================
     DELETE ADDRESS
  ===================================================== */

  const handleDeleteAddress = async (addressId) => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this address?"
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingAddressId(addressId);
      setAddressError("");

      const response = await fetch(
        `${API_BASE_URL}/addresses/${addressId}`,
        {
          method: "DELETE",
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
          data.message || "Failed to delete address"
        );
      }

      await loadAddresses();
    } catch (err) {
      console.error("Delete address error:", err);

      setAddressError(
        err.message ||
          "Unable to delete this address."
      );
    } finally {
      setDeletingAddressId(null);
    }
  };

  /* =====================================================
     SET DEFAULT ADDRESS
  ===================================================== */

  const handleSetDefault = async (addressId) => {
    try {
      setSettingDefaultId(addressId);
      setAddressError("");

      const response = await fetch(
        `${API_BASE_URL}/addresses/${addressId}/default`,
        {
          method: "PATCH",
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
            "Failed to update default address"
        );
      }

      await loadAddresses();
    } catch (err) {
      console.error(
        "Set default address error:",
        err
      );

      setAddressError(
        err.message ||
          "Unable to set this address as default."
      );
    } finally {
      setSettingDefaultId(null);
    }
  };

  /* =====================================================
     OPEN EDIT PROFILE
  ===================================================== */

  const openEditProfile = () => {
    setEditForm({
      first_name: customer?.first_name || "",
      last_name: customer?.last_name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
    });

    setProfileError("");
    setProfileSuccess("");
    setIsEditOpen(true);
  };

  /* =====================================================
     CLOSE EDIT PROFILE
  ===================================================== */

  const closeEditProfile = () => {
    if (savingProfile) {
      return;
    }

    setIsEditOpen(false);
    setProfileError("");
    setProfileSuccess("");
  };

  /* =====================================================
     PROFILE FORM CHANGE
  ===================================================== */

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =====================================================
     SAVE PROFILE
  ===================================================== */

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    setProfileError("");
    setProfileSuccess("");

    if (
      !editForm.first_name.trim() ||
      !editForm.email.trim() ||
      !editForm.phone.trim()
    ) {
      setProfileError(
        "First name, email and phone number are required."
      );

      return;
    }

    try {
      setSavingProfile(true);

      const response = await fetch(
        `${API_BASE_URL}/auth/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            first_name: editForm.first_name,
            last_name: editForm.last_name,
            email: editForm.email,
            phone: editForm.phone,
          }),
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
            "Failed to update profile"
        );
      }

      setCustomer(data.customer);

      localStorage.setItem(
        "wine_customer",
        JSON.stringify(data.customer)
      );

      setProfileSuccess(
        "Your profile has been updated successfully."
      );

      setTimeout(() => {
        setIsEditOpen(false);
        setProfileSuccess("");
      }, 1200);
    } catch (err) {
      console.error(
        "Profile update error:",
        err
      );

      setProfileError(
        err.message ||
          "Unable to update your profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[#241311] text-[#f3e9d8]">
        <section className="flex min-h-screen flex-col items-center justify-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#c6a56a]/50">
            <span className="font-serif text-xl text-[#c6a56a]">
              V
            </span>
          </div>

          <p className="text-[10px] uppercase tracking-[0.3em] text-[#c6a56a]">
            Preparing your account
          </p>
        </section>
      </main>
    );
  }

  /* =====================================================
     ACCOUNT ERROR
  ===================================================== */

  if (error) {
    return (
      <main className="min-h-screen bg-[#f3eadb] text-[#321817]">
        <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <span className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#94774c]">
            VINEORA MEMBER AREA
          </span>

          <h1 className="font-serif text-4xl font-normal sm:text-5xl">
            Something went wrong
          </h1>

          <p className="mt-5 max-w-md text-sm leading-7 text-[#755d56]">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-8 bg-[#4a2020] px-7 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f5ecdc] transition hover:bg-[#321515]"
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  if (!customer) {
    return null;
  }

  const fullName = [
    customer.first_name,
    customer.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const initials = `${customer.first_name?.charAt(0) || ""}${
    customer.last_name?.charAt(0) || ""
  }`;

  const memberYear = customer.created_at
    ? new Date(customer.created_at).getFullYear()
    : "—";

  return (
    <main className="min-h-screen bg-[#f2e8d8] text-[#321817]">

      {/* ==================================================
          HERO
      ================================================== */}

      <section className="relative overflow-hidden bg-[#321414]">

        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#8c6249]/20 blur-[120px]" />

        <div className="absolute -bottom-48 left-1/4 h-[400px] w-[400px] rounded-full bg-[#7b2929]/20 blur-[100px]" />

        <div className="absolute right-[12%] top-1/2 hidden h-40 w-40 -translate-y-1/2 rounded-full border border-[#c6a56a]/10 lg:block" />

        <div className="absolute right-[14%] top-1/2 hidden h-28 w-28 -translate-y-1/2 rounded-full border border-[#c6a56a]/10 lg:block" />

        <div className="relative mx-auto max-w-[1280px] px-5 pb-9 pt-14 sm:px-8 sm:pb-11 sm:pt-16 lg:px-12 lg:pb-14 lg:pt-18">

          <div className="grid items-end gap-12 lg:grid-cols-[1fr_auto]">

            <div>

              <div className="mb-6 flex items-center gap-4">
                <span className="h-px w-10 bg-[#c6a56a]/70" />

                <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#c6a56a]">
                  VINEORA PRIVATE MEMBER
                </span>
              </div>

              <h1 className="max-w-4xl font-serif text-4xl font-normal leading-[0.95] tracking-[-0.04em] text-[#f7eee1] sm:text-5xl md:text-6xl lg:text-7xl">
                Welcome back,
                <br />
                <span className="text-[#cdb783]">
                  {customer.first_name}.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-6 text-[#f5ecdc]/55 sm:text-base">
                Your wines, orders and personal collection —
                all in one place.
              </p>

            </div>

            <div className="hidden border border-[#c6a56a]/20 bg-white/[0.04] p-6 backdrop-blur-xl lg:block">

              <span className="block text-[9px] uppercase tracking-[0.2em] text-[#c6a56a]">
                Membership
              </span>

              <div className="mt-4 flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#c6a56a]/40">
                  <span className="font-serif text-lg text-[#c6a56a]">
                    V
                  </span>
                </div>

                <div>

                  <p className="font-serif text-xl text-[#f5ecdc]">
                    VINEORA
                  </p>

                  <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-[#f5ecdc]/40">
                    Since {memberYear}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ==================================================
          DASHBOARD
      ================================================== */}

      <section className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-20">

        {/* PROFILE + MEMBER */}

        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">

          {/* PROFILE CARD */}

          <div className="relative overflow-hidden border border-[#5b332e]/10 bg-[#fffaf2]/65 p-7 shadow-[0_25px_70px_rgba(48,23,19,0.07)] backdrop-blur-2xl sm:p-9">

            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#c6a56a]/10 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-8 sm:flex-row sm:items-center">

              <div className="flex items-center gap-5">

                <div className="relative">

                  {customer.profile_image_url ? (
                    <img
                      src={customer.profile_image_url}
                      alt={fullName}
                      className="h-20 w-20 rounded-full border border-[#c6a56a]/50 object-cover sm:h-24 sm:w-24"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#c6a56a]/50 bg-[#4a2020] sm:h-24 sm:w-24">
                      <span className="font-serif text-2xl tracking-wide text-[#dfc58e]">
                        {initials}
                      </span>
                    </div>
                  )}

                  <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-[#fffaf2] bg-[#6d8a5b]" />

                </div>

                <div>

                  <span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.22em] text-[#94774c]">
                    Member Profile
                  </span>

                  <h2 className="font-serif text-2xl font-normal text-[#321817] sm:text-3xl">
                    {fullName}
                  </h2>

                  <p className="mt-1 text-xs text-[#755d56] sm:text-sm">
                    {customer.email}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={openEditProfile}
                className="self-start border border-[#5b332e]/30 px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.17em] text-[#4a2421] transition hover:bg-[#4a2020] hover:text-[#f5ecdc] sm:self-auto"
              >
                Edit Profile
              </button>

            </div>

          </div>

          {/* MEMBER CARD */}

          <div className="border border-[#5b332e]/10 bg-[#4a2020] p-7 text-[#f5ecdc] shadow-[0_25px_70px_rgba(48,23,19,0.10)] sm:p-9">

            <div className="flex h-full flex-col justify-between">

              <div className="flex items-start justify-between">

                <div>

                  <span className="text-[9px] uppercase tracking-[0.22em] text-[#c6a56a]">
                    VINEORA
                  </span>

                  <h3 className="mt-3 font-serif text-2xl font-normal">
                    Your Collection
                  </h3>

                </div>

                <span className="font-serif text-3xl text-[#c6a56a]/50">
                  V
                </span>

              </div>

              <div className="mt-10 grid grid-cols-2 gap-6">

                <div>

                  <span className="text-[9px] uppercase tracking-[0.16em] text-[#f5ecdc]/40">
                    Member Since
                  </span>

                  <p className="mt-2 font-serif text-3xl">
                    {memberYear}
                  </p>

                </div>

                <div>

                  <span className="text-[9px] uppercase tracking-[0.16em] text-[#f5ecdc]/40">
                    Status
                  </span>

                  <p className="mt-2 font-serif text-2xl text-[#d9c28c]">
                    Active
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ==================================================
            STATISTICS
        ================================================== */}

        <div className="mt-5 grid gap-4 sm:grid-cols-3">

          <Link
            to="/orders"
            className="group border border-[#5b332e]/10 bg-[#fffaf2]/60 p-6 shadow-[0_18px_50px_rgba(48,23,19,0.05)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#94774c]/30 hover:shadow-[0_25px_60px_rgba(48,23,19,0.10)] sm:p-7"
          >

            <div className="flex items-start justify-between">

              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#94774c]">
                Orders
              </span>

              <span className="text-lg text-[#94774c]/50 transition group-hover:translate-x-1 group-hover:text-[#94774c]">
                ↗
              </span>

            </div>

            <p className="mt-8 font-serif text-5xl font-normal text-[#321817]">
              {summary.orders}
            </p>

            <p className="mt-3 text-[9px] uppercase tracking-[0.15em] text-[#755d56]">
              View your orders
            </p>

          </Link>

          <button
            type="button"
            onClick={() => {
              document
                .getElementById("account-addresses")
                ?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
            }}
            className="group border border-[#5b332e]/10 bg-[#fffaf2]/60 p-6 text-left shadow-[0_18px_50px_rgba(48,23,19,0.05)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#94774c]/30 hover:shadow-[0_25px_60px_rgba(48,23,19,0.10)] sm:p-7"
          >

            <div className="flex items-start justify-between">

              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#94774c]">
                Addresses
              </span>

              <span className="text-lg text-[#94774c]/50 transition group-hover:translate-x-1 group-hover:text-[#94774c]">
                ↘
              </span>

            </div>

            <p className="mt-8 font-serif text-5xl font-normal text-[#321817]">
              {addresses.length}
            </p>

            <p className="mt-3 text-[9px] uppercase tracking-[0.15em] text-[#755d56]">
              Manage delivery addresses
            </p>

          </button>

          <Link
            to="/wishlist"
            className="group border border-[#5b332e]/10 bg-[#fffaf2]/60 p-6 shadow-[0_18px_50px_rgba(48,23,19,0.05)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#94774c]/30 hover:shadow-[0_25px_60px_rgba(48,23,19,0.10)] sm:p-7"
          >

            <div className="flex items-start justify-between">

              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#94774c]">
                Wishlist
              </span>

              <span className="text-lg text-[#94774c]/50 transition group-hover:translate-x-1 group-hover:text-[#94774c]">
                ↗
              </span>

            </div>

            <p className="mt-8 font-serif text-5xl font-normal text-[#321817]">
              {summary.wishlist}
            </p>

            <p className="mt-3 text-[9px] uppercase tracking-[0.15em] text-[#755d56]">
              Your saved wines
            </p>

          </Link>

        </div>

        {/* ==================================================
            RECENT ORDERS
        ================================================== */}

        <section className="mt-16 sm:mt-20">

          <div className="mb-7 flex items-end justify-between">

            <div>

              <span className="mb-3 block text-[9px] font-semibold uppercase tracking-[0.22em] text-[#94774c]">
                Your Activity
              </span>

              <h2 className="font-serif text-3xl font-normal text-[#321817] sm:text-4xl">
                Recent Orders
              </h2>

            </div>

            <Link
              to="/orders"
              className="hidden text-[9px] font-semibold uppercase tracking-[0.17em] text-[#5b332e] transition hover:text-[#94774c] sm:block"
            >
              View All Orders →
            </Link>

          </div>

          {summary.orders === 0 ? (
            <div className="border border-dashed border-[#5b332e]/20 bg-[#fffaf2]/35 px-6 py-14 text-center backdrop-blur-xl sm:py-20">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#c6a56a]/40 bg-[#4a2020]">
                <span className="font-serif text-lg text-[#c6a56a]">
                  V
                </span>
              </div>

              <h3 className="mt-6 font-serif text-2xl font-normal text-[#321817]">
                Your wine journey begins here
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#755d56]">
                You haven't placed an order yet. Explore our
                collection and discover your next exceptional wine.
              </p>

              <Link
                to="/shop"
                className="mt-7 inline-flex bg-[#4a2020] px-7 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#f5ecdc] transition hover:bg-[#321515]"
              >
                Explore Wines
              </Link>

            </div>
          ) : (
            <div className="border border-[#5b332e]/10 bg-[#fffaf2]/50 p-8 backdrop-blur-xl">

              <Link
                to="/orders"
                className="flex items-center justify-between"
              >

                <div>

                  <span className="text-[9px] uppercase tracking-[0.18em] text-[#94774c]">
                    Orders
                  </span>

                  <p className="mt-2 font-serif text-2xl">
                    {summary.orders} order
                    {summary.orders !== 1 ? "s" : ""}
                  </p>

                </div>

                <span className="text-xl">
                  →
                </span>

              </Link>

            </div>
          )}

        </section>

        {/* ==================================================
            ADDRESSES
        ================================================== */}

        <section
          id="account-addresses"
          className="scroll-mt-24 mt-16 sm:mt-20"
        >

          <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <span className="mb-3 block text-[9px] font-semibold uppercase tracking-[0.22em] text-[#94774c]">
                Delivery
              </span>

              <h2 className="font-serif text-3xl font-normal text-[#321817] sm:text-4xl">
                Your Addresses
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[#755d56]">
                Manage the addresses used for your wine deliveries.
              </p>

            </div>

            <button
              type="button"
              onClick={openAddAddress}
              className="inline-flex self-start bg-[#4a2020] px-6 py-3.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#f5ecdc] transition hover:bg-[#321515] sm:self-auto"
            >
              + Add Address
            </button>

          </div>

          {/* ADDRESS ERROR */}

          {addressError && (
            <div className="mb-6 flex flex-col gap-3 border border-red-900/15 bg-red-50 px-5 py-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">

              <span>
                {addressError}
              </span>

              <button
                type="button"
                onClick={loadAddresses}
                className="self-start text-[9px] font-semibold uppercase tracking-[0.16em] text-red-900 underline underline-offset-4"
              >
                Try Again
              </button>

            </div>
          )}

          {/* ADDRESS LOADING */}

          {addressesLoading ? (
            <div className="grid gap-5 lg:grid-cols-2">

              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="animate-pulse border border-[#5b332e]/10 bg-[#fffaf2]/55 p-7"
                >

                  <div className="h-3 w-20 bg-[#5b332e]/10" />

                  <div className="mt-6 h-4 w-3/4 bg-[#5b332e]/10" />

                  <div className="mt-3 h-4 w-1/2 bg-[#5b332e]/10" />

                  <div className="mt-8 h-10 w-full bg-[#5b332e]/10" />

                </div>
              ))}

            </div>
          ) : addresses.length === 0 ? (
            <div className="border border-dashed border-[#5b332e]/20 bg-[#fffaf2]/35 px-6 py-14 text-center backdrop-blur-xl sm:py-18">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#c6a56a]/40 bg-[#4a2020]">
                <span className="font-serif text-lg text-[#c6a56a]">
                  V
                </span>
              </div>

              <h3 className="mt-6 font-serif text-2xl font-normal text-[#321817]">
                No delivery addresses yet
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#755d56]">
                Add an address so your future wine orders can
                be delivered with ease.
              </p>

              <button
                type="button"
                onClick={openAddAddress}
                className="mt-7 bg-[#4a2020] px-7 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#f5ecdc] transition hover:bg-[#321515]"
              >
                Add Your First Address
              </button>

            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">

              {addresses.map((address) => (
                <article
                  key={address.id}
                  className={`relative overflow-hidden border p-6 shadow-[0_18px_50px_rgba(48,23,19,0.05)] backdrop-blur-xl transition sm:p-7 ${
                    address.is_default
                      ? "border-[#94774c]/40 bg-[#fffaf2]/80"
                      : "border-[#5b332e]/10 bg-[#fffaf2]/55"
                  }`}
                >

                  {/* DEFAULT ACCENT */}

                  {address.is_default && (
                    <div className="absolute left-0 top-0 h-full w-1 bg-[#94774c]" />
                  )}

                  <div className="flex items-start justify-between gap-5">

                    <div>

                      <div className="flex flex-wrap items-center gap-3">

                        <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#94774c]">
                          {address.address_type || "Home"}
                        </span>

                        {address.is_default && (
                          <span className="border border-[#94774c]/30 bg-[#94774c]/10 px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-[#765b30]">
                            Default
                          </span>
                        )}

                      </div>

                      <h3 className="mt-5 font-serif text-2xl font-normal text-[#321817]">
                        {address.city}
                      </h3>

                    </div>

                    <span className="font-serif text-2xl text-[#c6a56a]/40">
                      V
                    </span>

                  </div>

                  <div className="mt-6 border-t border-[#5b332e]/10 pt-5">

                    <p className="text-sm leading-6 text-[#43221f]">
                      {address.address_line_1}
                    </p>

                    {address.address_line_2 && (
                      <p className="mt-1 text-sm leading-6 text-[#755d56]">
                        {address.address_line_2}
                      </p>
                    )}

                    <p className="mt-1 text-sm leading-6 text-[#755d56]">
                      {address.city}, {address.state}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-[#755d56]">
                      {address.postal_code}
                      {address.country
                        ? `, ${address.country}`
                        : ""}
                    </p>

                  </div>

                  {/* ACTIONS */}

                  <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-[#5b332e]/10 pt-5">

                    <button
                      type="button"
                      onClick={() =>
                        openEditAddress(address)
                      }
                      className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#4a2421] transition hover:text-[#94774c]"
                    >
                      Edit
                    </button>

                    {!address.is_default && (
                      <button
                        type="button"
                        onClick={() =>
                          handleSetDefault(address.id)
                        }
                        disabled={
                          settingDefaultId === address.id
                        }
                        className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#4a2421] transition hover:text-[#94774c] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {settingDefaultId === address.id
                          ? "Setting..."
                          : "Set as Default"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteAddress(address.id)
                      }
                      disabled={
                        deletingAddressId === address.id
                      }
                      className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#8a4039] transition hover:text-[#5d211c] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {deletingAddressId === address.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>

                  </div>

                </article>
              ))}

            </div>
          )}

        </section>

        {/* ==================================================
            PERSONAL INFORMATION
        ================================================== */}

        <section className="mt-16 sm:mt-20">

          <div className="mb-7">

            <span className="mb-3 block text-[9px] font-semibold uppercase tracking-[0.22em] text-[#94774c]">
              Member Details
            </span>

            <h2 className="font-serif text-3xl font-normal text-[#321817] sm:text-4xl">
              Personal Information
            </h2>

          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_auto]">

            <div className="border border-[#5b332e]/10 bg-[#fffaf2]/55 px-6 shadow-[0_18px_50px_rgba(48,23,19,0.05)] backdrop-blur-xl sm:px-8">

              <div className="flex min-h-[72px] flex-col justify-center gap-1 border-b border-[#43221f]/10 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">

                <span className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#94774c]">
                  Full Name
                </span>

                <strong className="text-sm font-medium text-[#43221f] sm:text-right">
                  {fullName}
                </strong>

              </div>

              <div className="flex min-h-[72px] flex-col justify-center gap-1 border-b border-[#43221f]/10 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">

                <span className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#94774c]">
                  Email
                </span>

                <strong className="break-all text-sm font-medium text-[#43221f] sm:text-right">
                  {customer.email}
                </strong>

              </div>

              <div className="flex min-h-[72px] flex-col justify-center gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">

                <span className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#94774c]">
                  Mobile
                </span>

                <strong className="text-sm font-medium text-[#43221f] sm:text-right">
                  {customer.phone}
                </strong>

              </div>

            </div>

            <div className="flex items-center justify-center border border-[#5b332e]/10 bg-[#4a2020] p-8 lg:w-56">

              <button
                type="button"
                onClick={openEditProfile}
                className="w-full border border-[#c6a56a]/50 px-5 py-4 text-[9px] font-semibold uppercase tracking-[0.17em] text-[#f5ecdc] transition hover:bg-[#c6a56a] hover:text-[#321817]"
              >
                Edit Information
              </button>

            </div>

          </div>

        </section>

        {/* ==================================================
            QUICK ACCESS
        ================================================== */}

        <section className="mt-16 sm:mt-20">

          <div className="mb-7">

            <span className="mb-3 block text-[9px] font-semibold uppercase tracking-[0.22em] text-[#94774c]">
              Account
            </span>

            <h2 className="font-serif text-3xl font-normal text-[#321817] sm:text-4xl">
              Quick Access
            </h2>

          </div>

          <div className="grid gap-px overflow-hidden border border-[#5b332e]/10 bg-[#5b332e]/10 sm:grid-cols-2 lg:grid-cols-4">

            <Link
              to="/orders"
              className="group flex min-h-[110px] flex-col justify-between bg-[#fffaf2]/70 p-6 backdrop-blur-xl transition hover:bg-[#4a2020] hover:text-[#f5ecdc]"
            >

              <span className="text-[9px] uppercase tracking-[0.18em] text-[#94774c]">
                01
              </span>

              <div className="flex items-center justify-between">

                <span className="text-sm">
                  My Orders
                </span>

                <span className="transition group-hover:translate-x-1">
                  →
                </span>

              </div>

            </Link>

            <button
              type="button"
              onClick={() => {
                document
                  .getElementById("account-addresses")
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
              }}
              className="group flex min-h-[110px] flex-col justify-between bg-[#fffaf2]/70 p-6 text-left backdrop-blur-xl transition hover:bg-[#4a2020] hover:text-[#f5ecdc]"
            >

              <span className="text-[9px] uppercase tracking-[0.18em] text-[#94774c]">
                02
              </span>

              <div className="flex items-center justify-between">

                <span className="text-sm">
                  Addresses
                </span>

                <span className="transition group-hover:translate-x-1">
                  ↓
                </span>

              </div>

            </button>

            <Link
              to="/wishlist"
              className="group flex min-h-[110px] flex-col justify-between bg-[#fffaf2]/70 p-6 backdrop-blur-xl transition hover:bg-[#4a2020] hover:text-[#f5ecdc]"
            >

              <span className="text-[9px] uppercase tracking-[0.18em] text-[#94774c]">
                03
              </span>

              <div className="flex items-center justify-between">

                <span className="text-sm">
                  Wishlist
                </span>

                <span className="transition group-hover:translate-x-1">
                  →
                </span>

              </div>

            </Link>

            <Link
              to="/shop"
              className="group flex min-h-[110px] flex-col justify-between bg-[#fffaf2]/70 p-6 backdrop-blur-xl transition hover:bg-[#4a2020] hover:text-[#f5ecdc]"
            >

              <span className="text-[9px] uppercase tracking-[0.18em] text-[#94774c]">
                04
              </span>

              <div className="flex items-center justify-between">

                <span className="text-sm">
                  Explore Wines
                </span>

                <span className="transition group-hover:translate-x-1">
                  →
                </span>

              </div>

            </Link>

          </div>

        </section>

        {/* ==================================================
            LOGOUT
        ================================================== */}

        <div className="mt-10 flex justify-end">

          <button
            type="button"
            onClick={handleLogout}
            className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#755d56] transition hover:text-[#4a2020]"
          >
            Sign Out →
          </button>

        </div>

      </section>

      {/* ====================================================
          EDIT PROFILE MODAL
      ==================================================== */}

      {isEditOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#241311]/75 px-4 py-6 backdrop-blur-md">

          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-[#c6a56a]/20 bg-[#f7eee1] shadow-[0_30px_100px_rgba(0,0,0,0.35)]">

            {/* HEADER */}

            <div className="border-b border-[#5b332e]/10 px-6 py-6 sm:px-9 sm:py-8">

              <div className="flex items-start justify-between gap-6">

                <div>

                  <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#94774c]">
                    VINEORA MEMBER
                  </span>

                  <h2 className="mt-3 font-serif text-3xl font-normal text-[#321817] sm:text-4xl">
                    Edit Profile
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#755d56]">
                    Keep your personal information up to date.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={closeEditProfile}
                  disabled={savingProfile}
                  className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#5b332e]/15 text-[#5b332e] transition hover:bg-[#4a2020] hover:text-[#f5ecdc] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ×
                </button>

              </div>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSaveProfile}
              className="px-6 py-7 sm:px-9 sm:py-9"
            >

              {profileError && (
                <div className="mb-6 border border-red-900/15 bg-red-50 px-4 py-4 text-sm text-red-800">
                  {profileError}
                </div>
              )}

              {profileSuccess && (
                <div className="mb-6 border border-green-900/15 bg-green-50 px-4 py-4 text-sm text-green-800">
                  {profileSuccess}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">

                <div>

                  <label
                    htmlFor="first_name"
                    className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-[#94774c]"
                  >
                    First Name
                  </label>

                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    value={editForm.first_name}
                    onChange={handleProfileChange}
                    disabled={savingProfile}
                    autoComplete="given-name"
                    className="w-full border border-[#5b332e]/15 bg-[#fffaf2]/70 px-4 py-3.5 text-sm text-[#321817] outline-none transition placeholder:text-[#755d56]/40 focus:border-[#94774c] disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

                <div>

                  <label
                    htmlFor="last_name"
                    className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-[#94774c]"
                  >
                    Last Name
                  </label>

                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    value={editForm.last_name}
                    onChange={handleProfileChange}
                    disabled={savingProfile}
                    autoComplete="family-name"
                    className="w-full border border-[#5b332e]/15 bg-[#fffaf2]/70 px-4 py-3.5 text-sm text-[#321817] outline-none transition placeholder:text-[#755d56]/40 focus:border-[#94774c] disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-[#94774c]"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={editForm.email}
                    onChange={handleProfileChange}
                    disabled={savingProfile}
                    autoComplete="email"
                    className="w-full border border-[#5b332e]/15 bg-[#fffaf2]/70 px-4 py-3.5 text-sm text-[#321817] outline-none transition placeholder:text-[#755d56]/40 focus:border-[#94774c] disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

                <div>

                  <label
                    htmlFor="phone"
                    className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-[#94774c]"
                  >
                    Mobile Number
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={editForm.phone}
                    onChange={handleProfileChange}
                    disabled={savingProfile}
                    autoComplete="tel"
                    className="w-full border border-[#5b332e]/15 bg-[#fffaf2]/70 px-4 py-3.5 text-sm text-[#321817] outline-none transition placeholder:text-[#755d56]/40 focus:border-[#94774c] disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#5b332e]/10 pt-7 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeEditProfile}
                  disabled={savingProfile}
                  className="border border-[#5b332e]/20 px-6 py-3.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#4a2421] transition hover:bg-[#4a2020] hover:text-[#f5ecdc] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-[#4a2020] px-7 py-3.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#f5ecdc] transition hover:bg-[#321515] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProfile
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ====================================================
          ADD / EDIT ADDRESS MODAL
      ==================================================== */}

      {isAddressModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#241311]/75 px-4 py-5 backdrop-blur-md sm:py-8">

          <div className="relative z-[10000] flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden border border-[#c6a56a]/20 bg-[#f7eee1] shadow-[0_30px_100px_rgba(0,0,0,0.35)]">

            {/* HEADER */}

{/* HEADER */}

<div className="sticky top-0 z-20 border-b border-[#5b332e]/10 bg-[#f7eee1] px-6 py-6 sm:px-9 sm:py-8">

  <div className="flex items-start justify-between gap-6">

    <div className="min-w-0">

      <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#94774c]">
        DELIVERY DETAILS
      </span>

      <h2 className="mt-3 font-serif text-3xl font-normal text-[#321817] sm:text-4xl">
        {editingAddressId
          ? "Edit Address"
          : "Add Address"}
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#755d56]">
        {editingAddressId
          ? "Update your delivery information."
          : "Add a trusted delivery address for your wine orders."}
      </p>

    </div>

    {/* CLOSE BUTTON */}

    <button
      type="button"
      onClick={closeAddressModal}
      disabled={savingAddress}
      aria-label="Close address form"
      className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#5b332e]/20 bg-[#fffaf2] text-xl leading-none text-[#5b332e] transition hover:border-[#4a2020] hover:bg-[#4a2020] hover:text-[#f5ecdc] disabled:cursor-not-allowed disabled:opacity-40"
    >
      ×
    </button>

  </div>

</div>

            {/* FORM */}

            <form
              onSubmit={handleSaveAddress}
              className="min-h-0 overflow-y-auto px-6 py-7 sm:px-9 sm:py-9"
            >

              {/* ERROR */}

              {addressFormError && (
                <div className="mb-6 border border-red-900/15 bg-red-50 px-4 py-4 text-sm leading-6 text-red-800">
                  {addressFormError}
                </div>
              )}

              {/* SUCCESS */}

              {addressSuccess && (
                <div className="mb-6 border border-green-900/15 bg-green-50 px-4 py-4 text-sm leading-6 text-green-800">
                  {addressSuccess}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">

                {/* ADDRESS TYPE */}

                <div>

                  <label
                    htmlFor="address_type"
                    className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-[#94774c]"
                  >
                    Address Type
                  </label>

                  <select
                    id="address_type"
                    name="address_type"
                    value={addressForm.address_type}
                    onChange={handleAddressChange}
                    disabled={savingAddress}
                    className="w-full border border-[#5b332e]/15 bg-[#fffaf2]/70 px-4 py-3.5 text-sm text-[#321817] outline-none transition focus:border-[#94774c] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="Home">
                      Home
                    </option>

                    <option value="Office">
                      Office
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>

                </div>

                {/* COUNTRY */}

                <div>

                  <label
                    htmlFor="country"
                    className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-[#94774c]"
                  >
                    Country
                  </label>

                  <input
                    id="country"
                    name="country"
                    type="text"
                    value={addressForm.country}
                    onChange={handleAddressChange}
                    disabled={savingAddress}
                    autoComplete="country-name"
                    className="w-full border border-[#5b332e]/15 bg-[#fffaf2]/70 px-4 py-3.5 text-sm text-[#321817] outline-none transition focus:border-[#94774c] disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

                {/* ADDRESS LINE 1 */}

                <div className="sm:col-span-2">

                  <label
                    htmlFor="address_line_1"
                    className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-[#94774c]"
                  >
                    Address Line 1
                  </label>

                  <input
                    id="address_line_1"
                    name="address_line_1"
                    type="text"
                    value={addressForm.address_line_1}
                    onChange={handleAddressChange}
                    disabled={savingAddress}
                    autoComplete="address-line1"
                    placeholder="House number, building, street"
                    className="w-full border border-[#5b332e]/15 bg-[#fffaf2]/70 px-4 py-3.5 text-sm text-[#321817] outline-none transition placeholder:text-[#755d56]/40 focus:border-[#94774c] disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

                {/* ADDRESS LINE 2 */}

                <div className="sm:col-span-2">

                  <label
                    htmlFor="address_line_2"
                    className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-[#94774c]"
                  >
                    Address Line 2
                    <span className="ml-2 font-normal normal-case tracking-normal text-[#755d56]/60">
                      Optional
                    </span>
                  </label>

                  <input
                    id="address_line_2"
                    name="address_line_2"
                    type="text"
                    value={addressForm.address_line_2}
                    onChange={handleAddressChange}
                    disabled={savingAddress}
                    autoComplete="address-line2"
                    placeholder="Apartment, landmark, area"
                    className="w-full border border-[#5b332e]/15 bg-[#fffaf2]/70 px-4 py-3.5 text-sm text-[#321817] outline-none transition placeholder:text-[#755d56]/40 focus:border-[#94774c] disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

                {/* CITY */}

                <div>

                  <label
                    htmlFor="city"
                    className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-[#94774c]"
                  >
                    City
                  </label>

                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={addressForm.city}
                    onChange={handleAddressChange}
                    disabled={savingAddress}
                    autoComplete="address-level2"
                    className="w-full border border-[#5b332e]/15 bg-[#fffaf2]/70 px-4 py-3.5 text-sm text-[#321817] outline-none transition focus:border-[#94774c] disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

                {/* STATE */}

                <div>

                  <label
                    htmlFor="state"
                    className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-[#94774c]"
                  >
                    State
                  </label>

                  <input
                    id="state"
                    name="state"
                    type="text"
                    value={addressForm.state}
                    onChange={handleAddressChange}
                    disabled={savingAddress}
                    autoComplete="address-level1"
                    className="w-full border border-[#5b332e]/15 bg-[#fffaf2]/70 px-4 py-3.5 text-sm text-[#321817] outline-none transition focus:border-[#94774c] disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

                {/* POSTAL CODE */}

                <div>

                  <label
                    htmlFor="postal_code"
                    className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-[#94774c]"
                  >
                    Postal Code
                  </label>

                  <input
                    id="postal_code"
                    name="postal_code"
                    type="text"
                    inputMode="numeric"
                    value={addressForm.postal_code}
                    onChange={handleAddressChange}
                    disabled={savingAddress}
                    autoComplete="postal-code"
                    className="w-full border border-[#5b332e]/15 bg-[#fffaf2]/70 px-4 py-3.5 text-sm text-[#321817] outline-none transition focus:border-[#94774c] disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

              </div>

              {/* DEFAULT CHECKBOX */}

              <label className="mt-6 flex cursor-pointer items-start gap-3 border border-[#5b332e]/10 bg-[#fffaf2]/50 px-4 py-4">

                <input
                  type="checkbox"
                  name="is_default"
                  checked={addressForm.is_default}
                  onChange={handleAddressChange}
                  disabled={savingAddress}
                  className="mt-0.5 h-4 w-4 accent-[#4a2020]"
                />

                <span>

                  <span className="block text-sm font-medium text-[#43221f]">
                    Make this my default address
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-[#755d56]">
                    Your default address will be used as the preferred
                    delivery address during checkout.
                  </span>

                </span>

              </label>

              {/* ACTIONS */}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#5b332e]/10 pt-7 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeAddressModal}
                  disabled={savingAddress}
                  className="border border-[#5b332e]/20 px-6 py-3.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#4a2421] transition hover:bg-[#4a2020] hover:text-[#f5ecdc] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingAddress}
                  className="bg-[#4a2020] px-7 py-3.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#f5ecdc] transition hover:bg-[#321515] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingAddress
                    ? "Saving..."
                    : editingAddressId
                    ? "Update Address"
                    : "Save Address"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </main>
  );
};

export default Account;