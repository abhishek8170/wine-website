import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE_URL = "http://localhost:5000/api";

function Checkout() {
  const navigate = useNavigate();

  const {
    cartItems,
    cartTotal,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    loading: cartLoading,
  } = useCart();

  const {
    customer,
    token,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  // =========================================================
  // STATE
  // =========================================================

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  const [addressError, setAddressError] = useState("");
  const [orderError, setOrderError] = useState("");

  const [orderSuccess, setOrderSuccess] = useState(null);

  const [newAddress, setNewAddress] = useState({
    label: "Home",
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
  });

  // =========================================================
  // CUSTOMER NAME
  // =========================================================

  const customerName = useMemo(() => {
    if (!customer) {
      return "";
    }

    return (
      [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      customer.name ||
      ""
    );
  }, [customer]);

  // =========================================================
  // LOAD SAVED ADDRESSES
  // =========================================================

  useEffect(() => {
    const loadAddresses = async () => {
      if (authLoading) {
        return;
      }

      if (!isAuthenticated || !token) {
        setLoadingAddresses(false);
        return;
      }

      try {
        setLoadingAddresses(true);
        setAddressError("");

        const response = await fetch(`${API_BASE_URL}/addresses`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
          setAddressError(
            "Your login session has expired. Please log in again."
          );
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load your saved addresses."
          );
        }

        const loadedAddresses = Array.isArray(data)
          ? data
          : data.addresses || data.data || [];

        setAddresses(loadedAddresses);

        const defaultAddress =
          loadedAddresses.find(
            (address) =>
              address.is_default === true ||
              address.isDefault === true
          ) || loadedAddresses[0];

        if (defaultAddress) {
          setSelectedAddressId(String(defaultAddress.id));
          setShowNewAddressForm(false);
        } else {
          setShowNewAddressForm(true);
        }
      } catch (error) {
        console.error("Load addresses error:", error);

        setAddressError(
          error.message || "Unable to load your saved addresses."
        );

        setShowNewAddressForm(true);
      } finally {
        setLoadingAddresses(false);
      }
    };

    loadAddresses();
  }, [token, isAuthenticated, authLoading]);

  // =========================================================
  // NEW ADDRESS INPUT
  // =========================================================

  const handleAddressChange = (event) => {
    const { name, value } = event.target;

    setNewAddress((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (addressError) {
      setAddressError("");
    }
  };

  // =========================================================
  // VALIDATE NEW ADDRESS
  // =========================================================

  const validateAddress = () => {
    if (!newAddress.full_name.trim()) {
      return "Please enter your full name.";
    }

    if (!newAddress.phone.trim()) {
      return "Please enter your phone number.";
    }

    if (!newAddress.address_line1.trim()) {
      return "Please enter your delivery address.";
    }

    if (!newAddress.city.trim()) {
      return "Please enter your city.";
    }

    if (!newAddress.state.trim()) {
      return "Please enter your state.";
    }

    if (!/^\d{6}$/.test(newAddress.pincode.trim())) {
      return "Please enter a valid 6-digit PIN code.";
    }

    return "";
  };

  // =========================================================
  // SAVE NEW ADDRESS
  // =========================================================

  const handleSaveAddress = async (event) => {
    event.preventDefault();

    setAddressError("");

    if (!isAuthenticated || !token) {
      setAddressError(
        "Please log in before adding a delivery address."
      );
      return;
    }

    const validationError = validateAddress();

    if (validationError) {
      setAddressError(validationError);
      return;
    }

    try {
      setSavingAddress(true);

      const response = await fetch(`${API_BASE_URL}/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          label: newAddress.label,
          full_name: newAddress.full_name.trim(),
          phone: newAddress.phone.trim(),
          address_line1: newAddress.address_line1.trim(),
          address_line2: newAddress.address_line2.trim(),
          city: newAddress.city.trim(),
          state: newAddress.state.trim(),
          pincode: newAddress.pincode.trim(),
        }),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Your login session has expired. Please log in again."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save this delivery address."
        );
      }

      const savedAddress = data.address || data.data || data;

      if (!savedAddress?.id) {
        throw new Error(
          "Address was saved, but the server did not return the address."
        );
      }

      setAddresses((previous) => [...previous, savedAddress]);

      setSelectedAddressId(String(savedAddress.id));

      setShowNewAddressForm(false);

      setNewAddress({
        label: "Home",
        full_name: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        pincode: "",
      });
    } catch (error) {
      console.error("Save address error:", error);

      setAddressError(
        error.message || "Unable to save your delivery address."
      );
    } finally {
      setSavingAddress(false);
    }
  };

  // =========================================================
  // PLACE ORDER
  // =========================================================

  const handlePlaceOrder = async () => {
    setOrderError("");

    if (!isAuthenticated || !token) {
      setOrderError("Please log in to place your order.");
      return;
    }

    if (!selectedAddressId) {
      setOrderError("Please select a delivery address.");
      return;
    }

    if (showNewAddressForm) {
      setOrderError("Please save your delivery address first.");
      return;
    }

    if (cartItems.length === 0) {
      setOrderError("Your cart is empty.");
      return;
    }

    try {
      setPlacingOrder(true);

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          address_id: Number(selectedAddressId),
        }),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Your login session has expired. Please log in again."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to place your order."
        );
      }

      const createdOrder = data.order || data.data || data;

      const orderId =
        createdOrder?.id ||
        createdOrder?.order_id ||
        createdOrder?.orderId ||
        data.order_id ||
        data.orderId ||
        null;

      const orderNumber =
        createdOrder?.order_number ||
        createdOrder?.orderNumber ||
        data.order_number ||
        data.orderNumber ||
        "Your order";

      // -------------------------------------------------------
      // IMPORTANT:
      // Order has successfully been created in PostgreSQL.
      // Clear the customer's cart after successful creation.
      // -------------------------------------------------------

      try {
        await clearCart();
      } catch (cartError) {
        console.error(
          "Order created but cart could not be cleared:",
          cartError
        );
      }

      setOrderSuccess({
        orderId,
        orderNumber,
      });
    } catch (error) {
      console.error("Place order error:", error);

      setOrderError(
        error.message ||
          "Unable to place your order. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  // =========================================================
  // TOTAL ITEMS
  // =========================================================

  const totalItems = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  // =========================================================
  // EMPTY CART
  // =========================================================

  if (!cartLoading && cartItems.length === 0 && !orderSuccess) {
    return (
      <main className="min-h-screen bg-[#f3e8d7] px-5 py-16 md:px-10 lg:px-[7.5%]">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-[#d9c19b] bg-[#eee1ce] px-6 py-16 text-center shadow-[0_12px_40px_rgba(53,23,22,0.06)] md:px-10">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-[#8f6d32]">
            Checkout
          </p>

          <h1 className="font-serif text-4xl font-semibold text-[#351716] md:text-5xl">
            Your cart is empty
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#765f50]">
            There are currently no wines in your selection.
            Explore our collection and discover something
            worthy of your table.
          </p>

          <Link
            to="/shop"
            className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-[8px] bg-[#351716] px-8 text-[11px] font-medium uppercase tracking-[0.2em] text-[#f8eddd] transition duration-300 hover:bg-[#4a211d]"
          >
            Explore Collection
          </Link>
        </div>
      </main>
    );
  }

  // =========================================================
  // ORDER SUCCESS
  // =========================================================

  if (orderSuccess) {
    return (
      <main className="min-h-screen bg-[#f3e8d7] px-5 py-16 md:px-10 lg:px-[7.5%]">
        <div className="mx-auto flex min-h-[65vh] max-w-3xl items-center justify-center">
          <section className="w-full rounded-[28px] border border-[#d9c19b] bg-[#eee1ce] px-6 py-16 text-center shadow-[0_18px_55px_rgba(53,23,22,0.08)] md:px-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#a88342] text-2xl text-[#8f6d32]">
              ✓
            </div>

            <p className="mt-8 text-[10px] font-medium uppercase tracking-[0.3em] text-[#8f6d32]">
              Order Confirmed
            </p>

            <h1 className="mt-3 font-serif text-4xl font-semibold text-[#351716] md:text-5xl">
              Thank you, {customerName || "Customer"}.
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#765f50]">
              Your wine selection has been received successfully.
              We will prepare your order with care.
            </p>

            <div className="mx-auto mt-8 max-w-md rounded-[16px] border border-[#d9c19b] bg-[#f5e9d8] px-6 py-5">
              <p className="text-[9px] uppercase tracking-[0.22em] text-[#8f6d32]">
                Order Number
              </p>

              <p className="mt-2 break-words font-serif text-2xl font-semibold text-[#351716]">
                {orderSuccess.orderNumber}
              </p>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {orderSuccess.orderId && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/orders/${orderSuccess.orderId}`)
                  }
                  className="inline-flex min-h-[52px] items-center justify-center rounded-[8px] bg-[#351716] px-8 text-[10px] font-medium uppercase tracking-[0.2em] text-[#f8eddd] transition hover:bg-[#4a211d]"
                >
                  View Order Details
                </button>
              )}

              <Link
                to="/account"
                className="inline-flex min-h-[52px] items-center justify-center rounded-[8px] border border-[#cdb99b] px-8 text-[10px] font-medium uppercase tracking-[0.2em] text-[#351716] transition hover:bg-[#e8dbc7]"
              >
                My Account
              </Link>

              <Link
                to="/shop"
                className="inline-flex min-h-[52px] items-center justify-center rounded-[8px] border border-[#cdb99b] px-8 text-[10px] font-medium uppercase tracking-[0.2em] text-[#351716] transition hover:bg-[#e8dbc7]"
              >
                Continue Shopping
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // =========================================================
  // MAIN CHECKOUT
  // =========================================================

  return (
    <main className="min-h-screen bg-[#f3e8d7] px-5 pb-20 pt-10 md:px-10 lg:px-[7.5%]">
      <section className="mx-auto max-w-[1450px]">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#8f6d32]">
            VINEORA • CHECKOUT
          </p>

          <h1 className="mt-3 font-serif text-4xl font-semibold text-[#351716] md:text-5xl">
            Complete Your Selection
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#765f50]">
            Review your wines and confirm your delivery details.
            Your selection will be prepared with care.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
            {isAuthenticated ? (
              <>
                <span className="rounded-full border border-[#cdb99b] bg-[#eee1ce] px-4 py-2 text-[#5e453c]">
                  Signed in as{" "}
                  <strong className="font-medium text-[#351716]">
                    {customerName || customer?.email}
                  </strong>
                </span>

                <span className="text-[#8f6d32]">
                  ✓ Saved checkout details available
                </span>
              </>
            ) : (
              <span className="text-[#8f6d32]">
                Please sign in to use your saved addresses.
              </span>
            )}
          </div>
        </div>

        {/* =================================================
            CHECKOUT GRID
        ================================================= */}

        <div className="grid gap-7 lg:grid-cols-[1.45fr_0.85fr]">

          {/* =================================================
              LEFT
          ================================================= */}

          <div className="space-y-7">

            {/* =================================================
                DELIVERY DETAILS
            ================================================= */}

            <section className="rounded-[24px] border border-[#d9c19b] bg-[#eee1ce] p-6 shadow-[0_12px_35px_rgba(53,23,22,0.05)] md:p-8">

              <div className="mb-7">
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#8f6d32]">
                  01
                </p>

                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#351716]">
                  Delivery Details
                </h2>

                <p className="mt-2 text-sm text-[#765f50]">
                  Select where you would like us to deliver
                  your wine.
                </p>
              </div>

              {authLoading || loadingAddresses ? (
                <div className="rounded-[16px] border border-[#d9c19b] bg-[#f5e9d8] px-5 py-6">
                  <p className="text-sm text-[#765f50]">
                    Loading your saved delivery details...
                  </p>
                </div>
              ) : !isAuthenticated || !token ? (
                <div className="rounded-[16px] border border-[#d9c19b] bg-[#f5e9d8] px-5 py-6">
                  <p className="text-sm leading-6 text-[#765f50]">
                    Please log in to use your saved addresses
                    and continue with checkout.
                  </p>

                  <Link
                    to="/login"
                    className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-[8px] bg-[#351716] px-7 text-[10px] font-medium uppercase tracking-[0.2em] text-[#f8eddd] transition hover:bg-[#4a211d]"
                  >
                    Log In
                  </Link>
                </div>
              ) : (
                <>
                  {/* SAVED ADDRESSES */}

                  {addresses.length > 0 && (
                    <div className="space-y-3">

                      <div className="flex items-center justify-between gap-4">
                        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#765f50]">
                          Saved Addresses
                        </p>

                        <span className="text-[10px] text-[#947d6b]">
                          {addresses.length}{" "}
                          {addresses.length === 1
                            ? "address"
                            : "addresses"}
                        </span>
                      </div>

                      {addresses.map((address) => {
                        const addressId = String(address.id);

                        const isSelected =
                          selectedAddressId === addressId;

                        return (
                          <button
                            key={address.id}
                            type="button"
                            onClick={() => {
                              setSelectedAddressId(addressId);
                              setOrderError("");
                            }}
                            className={`w-full rounded-[16px] border p-5 text-left transition duration-200 ${
                              isSelected
                                ? "border-[#a88342] bg-[#f5e9d8] shadow-[0_8px_25px_rgba(53,23,22,0.05)]"
                                : "border-[#d9c19b] bg-[#f7ecdc] hover:border-[#bda06c]"
                            }`}
                          >
                            <div className="flex items-start gap-4">

                              <div
                                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                  isSelected
                                    ? "border-[#8f6d32]"
                                    : "border-[#bda98c]"
                                }`}
                              >
                                {isSelected && (
                                  <span className="h-2.5 w-2.5 rounded-full bg-[#8f6d32]" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">

                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-[#351716]">
                                    {address.label || "Address"}
                                  </p>

                                  {(address.is_default ||
                                    address.isDefault) && (
                                    <span className="rounded-full border border-[#d0b77f] px-2 py-1 text-[8px] uppercase tracking-[0.16em] text-[#8f6d32]">
                                      Default
                                    </span>
                                  )}
                                </div>

                                <p className="mt-2 text-sm text-[#5f4a40]">
                                  {address.full_name ||
                                    address.fullName}
                                </p>

                                <p className="mt-1 text-sm leading-6 text-[#765f50]">
                                  {address.address_line1 ||
                                    address.addressLine1}

                                  {(address.address_line2 ||
                                    address.addressLine2) && (
                                    <>
                                      <br />
                                      {address.address_line2 ||
                                        address.addressLine2}
                                    </>
                                  )}

                                  <br />

                                  {address.city},{" "}
                                  {address.state}{" "}
                                  {address.pincode ||
                                    address.pin_code}
                                </p>

                                {(address.phone ||
                                  address.mobile) && (
                                  <p className="mt-2 text-xs text-[#947d6b]">
                                    {address.phone ||
                                      address.mobile}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* ADD NEW ADDRESS */}

                  {!showNewAddressForm && (
                    <button
                      type="button"
                      onClick={() => {
                        setAddressError("");
                        setShowNewAddressForm(true);
                      }}
                      className="mt-5 flex min-h-[50px] w-full items-center justify-center rounded-[8px] border border-[#cdb99b] text-[10px] font-medium uppercase tracking-[0.2em] text-[#351716] transition hover:bg-[#e8dbc7]"
                    >
                      + Add New Address
                    </button>
                  )}

                  {/* NEW ADDRESS FORM */}

                  {showNewAddressForm && (
                    <form
                      onSubmit={handleSaveAddress}
                      className="mt-6 border-t border-[#d9c19b] pt-6"
                    >
                      <div className="mb-5">
                        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#8f6d32]">
                          New Delivery Address
                        </p>

                        <p className="mt-2 text-xs leading-5 text-[#765f50]">
                          Add a delivery address to your account
                          for future orders.
                        </p>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">

                        {/* LABEL */}

                        <div>
                          <label
                            htmlFor="label"
                            className="mb-2 block text-[10px] font-medium uppercase tracking-[0.2em] text-[#765f50]"
                          >
                            Address Label
                          </label>

                          <select
                            id="label"
                            name="label"
                            value={newAddress.label}
                            onChange={handleAddressChange}
                            className="h-[52px] w-full rounded-[8px] border border-[#d5bea0] bg-[#f7ecdc] px-4 text-sm text-[#351716] outline-none focus:border-[#a88342] focus:ring-1 focus:ring-[#a88342]"
                          >
                            <option value="Home">Home</option>
                            <option value="Work">Work</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* FULL NAME */}

                        <div>
                          <label
                            htmlFor="full_name"
                            className="mb-2 block text-[10px] font-medium uppercase tracking-[0.2em] text-[#765f50]"
                          >
                            Full Name
                          </label>

                          <input
                            id="full_name"
                            name="full_name"
                            type="text"
                            value={newAddress.full_name}
                            onChange={handleAddressChange}
                            placeholder={
                              customerName || "Your full name"
                            }
                            className="h-[52px] w-full rounded-[8px] border border-[#d5bea0] bg-[#f7ecdc] px-4 text-sm text-[#351716] outline-none placeholder:text-[#a28d7a] focus:border-[#a88342] focus:ring-1 focus:ring-[#a88342]"
                          />
                        </div>

                        {/* PHONE */}

                        <div>
                          <label
                            htmlFor="phone"
                            className="mb-2 block text-[10px] font-medium uppercase tracking-[0.2em] text-[#765f50]"
                          >
                            Phone Number
                          </label>

                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={newAddress.phone}
                            onChange={handleAddressChange}
                            placeholder={
                              customer?.phone ||
                              "+91 00000 00000"
                            }
                            className="h-[52px] w-full rounded-[8px] border border-[#d5bea0] bg-[#f7ecdc] px-4 text-sm text-[#351716] outline-none placeholder:text-[#a28d7a] focus:border-[#a88342] focus:ring-1 focus:ring-[#a88342]"
                          />
                        </div>

                        {/* CITY */}

                        <div>
                          <label
                            htmlFor="city"
                            className="mb-2 block text-[10px] font-medium uppercase tracking-[0.2em] text-[#765f50]"
                          >
                            City
                          </label>

                          <input
                            id="city"
                            name="city"
                            type="text"
                            value={newAddress.city}
                            onChange={handleAddressChange}
                            placeholder="City"
                            className="h-[52px] w-full rounded-[8px] border border-[#d5bea0] bg-[#f7ecdc] px-4 text-sm text-[#351716] outline-none placeholder:text-[#a28d7a] focus:border-[#a88342] focus:ring-1 focus:ring-[#a88342]"
                          />
                        </div>

                        {/* STATE */}

                        <div>
                          <label
                            htmlFor="state"
                            className="mb-2 block text-[10px] font-medium uppercase tracking-[0.2em] text-[#765f50]"
                          >
                            State
                          </label>

                          <input
                            id="state"
                            name="state"
                            type="text"
                            value={newAddress.state}
                            onChange={handleAddressChange}
                            placeholder="State"
                            className="h-[52px] w-full rounded-[8px] border border-[#d5bea0] bg-[#f7ecdc] px-4 text-sm text-[#351716] outline-none placeholder:text-[#a28d7a] focus:border-[#a88342] focus:ring-1 focus:ring-[#a88342]"
                          />
                        </div>

                        {/* PINCODE */}

                        <div>
                          <label
                            htmlFor="pincode"
                            className="mb-2 block text-[10px] font-medium uppercase tracking-[0.2em] text-[#765f50]"
                          >
                            PIN Code
                          </label>

                          <input
                            id="pincode"
                            name="pincode"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={newAddress.pincode}
                            onChange={handleAddressChange}
                            placeholder="000000"
                            className="h-[52px] w-full rounded-[8px] border border-[#d5bea0] bg-[#f7ecdc] px-4 text-sm text-[#351716] outline-none placeholder:text-[#a28d7a] focus:border-[#a88342] focus:ring-1 focus:ring-[#a88342]"
                          />
                        </div>

                        {/* ADDRESS LINE 1 */}

                        <div className="md:col-span-2">
                          <label
                            htmlFor="address_line1"
                            className="mb-2 block text-[10px] font-medium uppercase tracking-[0.2em] text-[#765f50]"
                          >
                            Address
                          </label>

                          <input
                            id="address_line1"
                            name="address_line1"
                            type="text"
                            value={newAddress.address_line1}
                            onChange={handleAddressChange}
                            placeholder="House / Flat / Building, Street and Area"
                            className="h-[52px] w-full rounded-[8px] border border-[#d5bea0] bg-[#f7ecdc] px-4 text-sm text-[#351716] outline-none placeholder:text-[#a28d7a] focus:border-[#a88342] focus:ring-1 focus:ring-[#a88342]"
                          />
                        </div>

                        {/* ADDRESS LINE 2 */}

                        <div className="md:col-span-2">
                          <label
                            htmlFor="address_line2"
                            className="mb-2 block text-[10px] font-medium uppercase tracking-[0.2em] text-[#765f50]"
                          >
                            Apartment / Landmark
                            <span className="ml-2 normal-case tracking-normal text-[#a28d7a]">
                              Optional
                            </span>
                          </label>

                          <input
                            id="address_line2"
                            name="address_line2"
                            type="text"
                            value={newAddress.address_line2}
                            onChange={handleAddressChange}
                            placeholder="Apartment, landmark, etc."
                            className="h-[52px] w-full rounded-[8px] border border-[#d5bea0] bg-[#f7ecdc] px-4 text-sm text-[#351716] outline-none placeholder:text-[#a28d7a] focus:border-[#a88342] focus:ring-1 focus:ring-[#a88342]"
                          />
                        </div>
                      </div>

                      {addressError && (
                        <div className="mt-5 rounded-[10px] border border-[#b77a6e] bg-[#f4ddd7] px-4 py-3">
                          <p className="text-xs leading-5 text-[#7d3328]">
                            {addressError}
                          </p>
                        </div>
                      )}

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <button
                          type="submit"
                          disabled={savingAddress}
                          className="flex min-h-[52px] flex-1 items-center justify-center rounded-[8px] bg-[#351716] px-6 text-[10px] font-medium uppercase tracking-[0.2em] text-[#f8eddd] transition hover:bg-[#4a211d] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingAddress
                            ? "Saving Address..."
                            : "Save Address"}
                        </button>

                        {addresses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setAddressError("");
                              setShowNewAddressForm(false);
                            }}
                            className="flex min-h-[52px] flex-1 items-center justify-center rounded-[8px] border border-[#cdb99b] px-6 text-[10px] font-medium uppercase tracking-[0.2em] text-[#351716] transition hover:bg-[#e8dbc7]"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  )}

                  {addressError && !showNewAddressForm && (
                    <div className="mt-5 rounded-[10px] border border-[#b77a6e] bg-[#f4ddd7] px-4 py-3">
                      <p className="text-xs leading-5 text-[#7d3328]">
                        {addressError}
                      </p>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* =================================================
                ORDER ITEMS
            ================================================= */}

            <section className="rounded-[24px] border border-[#d9c19b] bg-[#eee1ce] p-6 shadow-[0_12px_35px_rgba(53,23,22,0.05)] md:p-8">

              <div className="mb-7">
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#8f6d32]">
                  02
                </p>

                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#351716]">
                  Your Wines
                </h2>

                <p className="mt-2 text-sm text-[#765f50]">
                  Adjust your selection before placing your
                  order.
                </p>
              </div>

              <div className="space-y-5">
                {cartItems.map((item) => {
                  const itemPrice = Number(item.price) || 0;
                  const itemQuantity = Number(item.quantity) || 0;
                  const itemTotal = itemPrice * itemQuantity;

                  return (
                    <article
                      key={`${item.productId}-${item.variantId}`}
                      className="rounded-[18px] border border-[#d9c19b] bg-[#f5e9d8] p-4 md:p-5"
                    >
                      <div className="flex gap-4">

                        {/* IMAGE */}

                        <div className="flex h-[105px] w-[82px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#e8dbc7] p-2 md:h-[120px] md:w-[92px]">
                          <img
                            src={
                              item.image ||
                              "/images/wine.png"
                            }
                            alt={item.name}
                            className="h-full w-full object-contain"
                          />
                        </div>

                        {/* INFO */}

                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-[#a88342]">
                            {item.category || "WINE"}
                          </p>

                          <h3 className="mt-1 font-serif text-lg font-semibold leading-tight text-[#351716] md:text-xl">
                            {item.name}
                          </h3>

                          {item.bottleSize && (
                            <p className="mt-1 text-xs text-[#765f50]">
                              {item.bottleSize}
                            </p>
                          )}

                          <p className="mt-3 text-sm font-semibold text-[#351716]">
                            ₹
                            {itemPrice.toLocaleString("en-IN")}
                            <span className="ml-1 text-xs font-normal text-[#8f7665]">
                              each
                            </span>
                          </p>
                        </div>

                        {/* TOTAL */}

                        <div className="hidden text-right sm:block">
                          <p className="font-serif text-xl font-semibold text-[#351716]">
                            ₹
                            {itemTotal.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>

                      {/* CONTROLS */}

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#dcc7a9] pt-4">

                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#765f50]">
                            Quantity
                          </span>

                          <div className="flex h-[42px] overflow-hidden rounded-[8px] border border-[#cdb99b] bg-[#f8eddd]">

                            <button
                              type="button"
                              aria-label={`Decrease quantity of ${item.name}`}
                              disabled={itemQuantity <= 1}
                              onClick={() =>
                                decreaseQuantity(
                                  item.productId,
                                  item.variantId
                                )
                              }
                              className="flex w-[40px] items-center justify-center text-lg text-[#351716] transition hover:bg-[#ead9c2] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              −
                            </button>

                            <div className="flex w-[42px] items-center justify-center border-x border-[#cdb99b] text-sm font-medium text-[#351716]">
                              {itemQuantity}
                            </div>

                            <button
                              type="button"
                              aria-label={`Increase quantity of ${item.name}`}
                              onClick={() =>
                                increaseQuantity(
                                  item.productId,
                                  item.variantId
                                )
                              }
                              className="flex w-[40px] items-center justify-center text-lg text-[#351716] transition hover:bg-[#ead9c2]"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(
                              item.productId,
                              item.variantId
                            )
                          }
                          className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#8f6d32] transition hover:text-[#351716]"
                        >
                          Remove
                        </button>

                        <p className="w-full text-right font-serif text-lg font-semibold text-[#351716] sm:hidden">
                          ₹
                          {itemTotal.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          {/* =================================================
              RIGHT — SUMMARY
          ================================================= */}

          <aside className="lg:sticky lg:top-6 lg:self-start">

            <section className="rounded-[24px] border border-[#d9c19b] bg-[#eee1ce] p-6 shadow-[0_12px_35px_rgba(53,23,22,0.05)] md:p-8">

              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#8f6d32]">
                03
              </p>

              <h2 className="mt-2 font-serif text-3xl font-semibold text-[#351716]">
                Order Summary
              </h2>

              <div className="my-7 h-px bg-[#d9c19b]" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#765f50]">
                  Items
                </span>

                <span className="font-medium text-[#351716]">
                  {totalItems}
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="text-[#765f50]">
                  Subtotal
                </span>

                <span className="font-medium text-[#351716]">
                  ₹
                  {cartTotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-5 text-sm">
                <span className="text-[#765f50]">
                  Delivery
                </span>

                <span className="text-right font-medium text-[#351716]">
                  Calculated at confirmation
                </span>
              </div>

              <div className="my-7 h-px bg-[#d9c19b]" />

              <div className="flex items-end justify-between">
                <span className="text-sm font-medium text-[#351716]">
                  Total
                </span>

                <span className="font-serif text-3xl font-semibold text-[#351716]">
                  ₹
                  {cartTotal.toLocaleString("en-IN")}
                </span>
              </div>

              {/* ORDER ERROR */}

              {orderError && (
                <div className="mt-6 rounded-[10px] border border-[#b77a6e] bg-[#f4ddd7] px-4 py-3">
                  <p className="text-xs leading-5 text-[#7d3328]">
                    {orderError}
                  </p>
                </div>
              )}

              {/* PLACE ORDER */}

              <button
                type="button"
                disabled={
                  placingOrder ||
                  !isAuthenticated ||
                  !token ||
                  !selectedAddressId ||
                  showNewAddressForm ||
                  cartItems.length === 0
                }
                onClick={handlePlaceOrder}
                className="mt-6 flex h-[54px] w-full items-center justify-center rounded-[8px] bg-[#351716] text-[10px] font-medium uppercase tracking-[0.22em] text-[#f8eddd] transition duration-300 hover:bg-[#4a211d] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {placingOrder
                  ? "Placing Order..."
                  : !isAuthenticated
                  ? "Log In to Continue"
                  : showNewAddressForm
                  ? "Save Address to Continue"
                  : !selectedAddressId
                  ? "Select Delivery Address"
                  : "Place Order"}
              </button>

              <Link
                to="/shop"
                className="mt-3 flex h-[54px] w-full items-center justify-center rounded-[8px] border border-[#cdb99b] text-[10px] font-medium uppercase tracking-[0.22em] text-[#351716] transition duration-300 hover:bg-[#e8dbc7]"
              >
                Continue Shopping
              </Link>

              <p className="mt-5 text-center text-[9px] uppercase tracking-[0.16em] text-[#947d6b]">
                Secure checkout • VINEORA
              </p>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default Checkout;