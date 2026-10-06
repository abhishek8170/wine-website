
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getImageUrl } from "../utils/image";

const API_BASE_URL = "http://localhost:5000/api";

const EMPTY_ADDRESS = {
  label: "Home",
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  pincode: "",
};

function Checkout() {
  const navigate = useNavigate();

  const {
    cartItems,
    cartTotal,

    increaseQuantity,
    decreaseQuantity,

    increaseGiftSetQuantity,
    decreaseGiftSetQuantity,

    removeFromCart,
    removeGiftSetFromCart,

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
  const [deletingAddressId, setDeletingAddressId] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const [addressError, setAddressError] = useState("");
  const [orderError, setOrderError] = useState("");

  const [orderSuccess, setOrderSuccess] = useState(null);

  // =========================================================
  // DELIVERY STATE
  // =========================================================

  const [deliveryAvailability, setDeliveryAvailability] = useState({
    checking: false,
    available: null,
    message: "",
    charge: 0,
    estimatedDeliveryDays: null,
    zone: null,
  });

  // =========================================================
  // COUPON STATE
  // =========================================================

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // =========================================================
  // ADDRESS FORM
  // =========================================================

  const [newAddress, setNewAddress] = useState({
    ...EMPTY_ADDRESS,
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
  // HELPER — NORMALIZE PINCODE
  // =========================================================

  const getAddressPincode = (address) => {
    return String(
      address?.pincode ??
        address?.pin_code ??
        address?.postal_code ??
        address?.postalCode ??
        ""
    ).trim();
  };

  // =========================================================
  // RESET DELIVERY STATE
  // =========================================================

  const resetDeliveryAvailability = () => {
    setDeliveryAvailability({
      checking: false,
      available: null,
      message: "",
      charge: 0,
      estimatedDeliveryDays: null,
      zone: null,
    });
  };

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
  // SELECTED ADDRESS
  // =========================================================

  const selectedAddress = useMemo(() => {
    if (!selectedAddressId) {
      return null;
    }

    return (
      addresses.find(
        (address) =>
          String(address.id) === String(selectedAddressId)
      ) || null
    );
  }, [addresses, selectedAddressId]);

  // =========================================================
  // SELECTED ADDRESS PINCODE
  // =========================================================

  const selectedAddressPincode = useMemo(() => {
    return getAddressPincode(selectedAddress);
  }, [selectedAddress]);

  // =========================================================
  // CHECK DELIVERY AVAILABILITY
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const checkDelivery = async () => {
      if (
        !selectedAddressId ||
        !selectedAddress ||
        showNewAddressForm ||
        editingAddressId
      ) {
        resetDeliveryAvailability();
        return;
      }

      const pincode = selectedAddressPincode;

      if (!/^\d{6}$/.test(pincode)) {
        setDeliveryAvailability({
          checking: false,
          available: false,
          message: "Delivery is not available for this PIN code.",
          charge: 0,
          estimatedDeliveryDays: null,
          zone: null,
        });

        return;
      }

      try {
        setDeliveryAvailability({
          checking: true,
          available: null,
          message: "",
          charge: 0,
          estimatedDeliveryDays: null,
          zone: null,
        });

        setOrderError("");

        const response = await fetch(
          `${API_BASE_URL}/delivery/check?pincode=${encodeURIComponent(
            pincode
          )}`,
          {
            method: "GET",
          }
        );

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok || !data.success) {
          setDeliveryAvailability({
            checking: false,
            available: false,
            message:
              "Delivery is not available for this PIN code.",
            charge: 0,
            estimatedDeliveryDays: null,
            zone: data.zone || null,
          });

          return;
        }

        if (data.available !== true) {
          setDeliveryAvailability({
            checking: false,
            available: false,
            message:
              "Delivery is not available for this PIN code.",
            charge: 0,
            estimatedDeliveryDays: null,
            zone: data.zone || null,
          });

          return;
        }

        setDeliveryAvailability({
          checking: false,
          available: true,
          message: "Delivery is available for this PIN code.",
          charge:
            Number(
              data.deliveryCharge ??
                data.delivery_charge ??
                data.zone?.delivery_charge ??
                0
            ) || 0,
          estimatedDeliveryDays:
            data.estimatedDeliveryDays != null
              ? Number(data.estimatedDeliveryDays)
              : data.zone?.estimated_delivery_days != null
                ? Number(data.zone.estimated_delivery_days)
                : null,
          zone: data.zone || null,
        });
      } catch (error) {
        console.error(
          "Delivery availability check error:",
          error
        );

        if (cancelled) {
          return;
        }

        setDeliveryAvailability({
          checking: false,
          available: false,
          message:
            "Delivery is not available for this PIN code.",
          charge: 0,
          estimatedDeliveryDays: null,
          zone: null,
        });
      }
    };

    checkDelivery();

    return () => {
      cancelled = true;
    };
  }, [
    selectedAddressId,
    selectedAddress,
    selectedAddressPincode,
    showNewAddressForm,
    editingAddressId,
  ]);

  // =========================================================
  // ADDRESS FORM INPUT
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
  // VALIDATE ADDRESS
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
  // OPEN ADD NEW ADDRESS
  // =========================================================

  const handleOpenNewAddress = () => {
    setAddressError("");
    setOrderError("");
    setEditingAddressId(null);

    setNewAddress({
      ...EMPTY_ADDRESS,
      full_name: customerName || "",
      phone: customer?.phone || "",
    });

    setShowNewAddressForm(true);

    resetDeliveryAvailability();
  };

  // =========================================================
  // OPEN EDIT ADDRESS
  // =========================================================

  const handleEditAddress = (address) => {
    setAddressError("");
    setOrderError("");

    setEditingAddressId(String(address.id));
    setShowNewAddressForm(true);

    setNewAddress({
      label:
        address.address_type ||
        address.label ||
        "Home",

      full_name:
        address.full_name ||
        address.fullName ||
        customerName ||
        "",

      phone:
        address.phone ||
        address.mobile ||
        customer?.phone ||
        "",

      address_line1:
        address.address_line_1 ||
        address.address_line1 ||
        address.addressLine1 ||
        "",

      address_line2:
        address.address_line_2 ||
        address.address_line2 ||
        address.addressLine2 ||
        "",

      city: address.city || "",

      state: address.state || "",

      pincode: getAddressPincode(address),
    });

    resetDeliveryAvailability();
  };

  // =========================================================
  // CANCEL ADDRESS FORM
  // =========================================================

  const handleCancelAddressForm = () => {
    setAddressError("");
    setEditingAddressId(null);

    setNewAddress({
      ...EMPTY_ADDRESS,
    });

    setShowNewAddressForm(false);

    resetDeliveryAvailability();
  };

  // =========================================================
  // SAVE / UPDATE ADDRESS
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

      const isEditing = Boolean(editingAddressId);

      const endpoint = isEditing
        ? `${API_BASE_URL}/addresses/${editingAddressId}`
        : `${API_BASE_URL}/addresses`;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          label: newAddress.label,
          full_name: newAddress.full_name.trim(),
          phone: newAddress.phone.trim(),
          address_line_1: newAddress.address_line1.trim(),
          address_line_2: newAddress.address_line2.trim(),
          city: newAddress.city.trim(),
          state: newAddress.state.trim(),
          postal_code: newAddress.pincode.trim(),
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
          data.message ||
            (isEditing
              ? "Unable to update this delivery address."
              : "Unable to save this delivery address.")
        );
      }

      const savedAddress =
        data.address ||
        data.data ||
        data.updatedAddress ||
        data;

      if (!savedAddress?.id) {
        throw new Error(
          isEditing
            ? "Address was updated, but the server did not return the address."
            : "Address was saved, but the server did not return the address."
        );
      }

      if (isEditing) {
        setAddresses((previous) =>
          previous.map((address) =>
            String(address.id) === String(savedAddress.id)
              ? {
                  ...address,
                  ...savedAddress,
                }
              : address
          )
        );
      } else {
        setAddresses((previous) => [
          ...previous,
          savedAddress,
        ]);
      }

      setSelectedAddressId(String(savedAddress.id));

      setEditingAddressId(null);
      setShowNewAddressForm(false);

      setNewAddress({
        ...EMPTY_ADDRESS,
      });

      resetDeliveryAvailability();

      setOrderError("");
    } catch (error) {
      console.error(
        "Save/update address error:",
        error
      );

      setAddressError(
        error.message ||
          "Unable to save your delivery address."
      );
    } finally {
      setSavingAddress(false);
    }
  };

  // =========================================================
  // DELETE ADDRESS
  // =========================================================

  const handleDeleteAddress = async (addressId) => {
    if (!isAuthenticated || !token) {
      setAddressError(
        "Please log in to manage your addresses."
      );
      return;
    }

    const addressToDelete = addresses.find(
      (address) =>
        String(address.id) === String(addressId)
    );

    if (!addressToDelete) {
      return;
    }

    const confirmed = window.confirm(
      `Delete this ${addressToDelete.label || "delivery"} address?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingAddressId(String(addressId));
      setAddressError("");
      setOrderError("");

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

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Your login session has expired. Please log in again."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to delete this delivery address."
        );
      }

      const remainingAddresses = addresses.filter(
        (address) =>
          String(address.id) !== String(addressId)
      );

      setAddresses(remainingAddresses);

      if (
        String(selectedAddressId) ===
        String(addressId)
      ) {
        if (remainingAddresses.length > 0) {
          const nextAddress =
            remainingAddresses.find(
              (address) =>
                address.is_default === true ||
                address.isDefault === true
            ) || remainingAddresses[0];

          setSelectedAddressId(String(nextAddress.id));
        } else {
          setSelectedAddressId("");
          setShowNewAddressForm(true);
        }

        resetDeliveryAvailability();
      }

      if (
        String(editingAddressId) ===
        String(addressId)
      ) {
        setEditingAddressId(null);
        setShowNewAddressForm(false);
        setNewAddress({
          ...EMPTY_ADDRESS,
        });
      }
    } catch (error) {
      console.error("Delete address error:", error);

      setAddressError(
        error.message ||
          "Unable to delete this delivery address."
      );
    } finally {
      setDeletingAddressId(null);
    }
  };

  // =========================================================
  // SELECT ADDRESS
  // =========================================================

  const handleSelectAddress = (addressId) => {
    setSelectedAddressId(String(addressId));

    setShowNewAddressForm(false);
    setEditingAddressId(null);

    setAddressError("");
    setOrderError("");

    resetDeliveryAvailability();
  };

  // =========================================================
  // COUPON
  // =========================================================

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();

    setCouponError("");

    if (!isAuthenticated || !token) {
      setCouponError("Please log in to apply a coupon.");
      return;
    }

    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    try {
      setCouponLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/coupons/validate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code }),
        }
      );

      const data = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        throw new Error(
          "Your login session has expired. Please log in again."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "This coupon cannot be applied."
        );
      }

      setAppliedCoupon(data);

      setCouponCode(
        data.coupon?.code ||
          data.code ||
          code
      );
    } catch (error) {
      console.error("Apply coupon error:", error);

      setAppliedCoupon(null);

      setCouponError(
        error.message ||
          "Unable to apply this coupon."
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  // =========================================================
  // TOTALS
  // =========================================================

  const couponDiscount =
    Number(
      appliedCoupon?.discountAmount ??
        appliedCoupon?.discount_amount ??
        0
    ) || 0;

  const checkoutSubtotal =
    Number(cartTotal) || 0;

  const deliveryCharge =
    deliveryAvailability.available === true
      ? Number(deliveryAvailability.charge || 0)
      : 0;

  const checkoutTotal = Math.max(
    0,
    checkoutSubtotal +
      deliveryCharge -
      couponDiscount
  );

  // =========================================================
  // DELIVERY STATUS
  // =========================================================

  const deliveryChecking =
    deliveryAvailability.checking;

  const deliveryUnavailable =
    Boolean(selectedAddressId) &&
    !showNewAddressForm &&
    deliveryAvailability.available === false;

  // =========================================================
  // CAN PLACE ORDER
  // =========================================================

  const canPlaceOrder =
    !placingOrder &&
    isAuthenticated &&
    Boolean(token) &&
    Boolean(selectedAddressId) &&
    !showNewAddressForm &&
    !editingAddressId &&
    cartItems.length > 0 &&
    !deliveryChecking &&
    deliveryAvailability.available === true;

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
      setOrderError(
        "Please select a delivery address."
      );
      return;
    }

    if (showNewAddressForm || editingAddressId) {
      setOrderError(
        "Please save your delivery address first."
      );
      return;
    }

    if (cartItems.length === 0) {
      setOrderError("Your cart is empty.");
      return;
    }

    if (deliveryChecking) {
      setOrderError(
        "Please wait while we check delivery availability."
      );
      return;
    }

    if (deliveryAvailability.available !== true) {
      setOrderError(
        "Delivery is not available for this PIN code."
      );
      return;
    }

    try {
      setPlacingOrder(true);

      const response = await fetch(
        `${API_BASE_URL}/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            address_id: Number(selectedAddressId),
            coupon_code:
              appliedCoupon?.coupon?.code ||
              appliedCoupon?.code ||
              couponCode.trim() ||
              null,
          }),
        }
      );

      const data = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        throw new Error(
          "Your login session has expired. Please log in again."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to place your order."
        );
      }

      const createdOrder =
        data.order ||
        data.data ||
        data;

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

      setAppliedCoupon(null);
      setCouponCode("");
    } catch (error) {
      console.error(
        "Place order error:",
        error
      );

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
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

  // =========================================================
  // EMPTY CART
  // =========================================================

  if (
    !cartLoading &&
    cartItems.length === 0 &&
    !orderSuccess
  ) {
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
                    navigate(
                      `/orders/${orderSuccess.orderId}`
                    )
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

        {/* HEADER */}

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

        {/* CHECKOUT GRID */}

        <div className="grid gap-7 lg:grid-cols-[1.45fr_0.85fr]">

          {/* LEFT */}

          <div className="space-y-7">

            {/* DELIVERY DETAILS */}

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
                        const addressId =
                          String(address.id);

                        const isSelected =
                          selectedAddressId ===
                          addressId;

                        const isDeleting =
                          deletingAddressId ===
                          addressId;

                        return (
                          <div
                            key={address.id}
                            className={`rounded-[16px] border p-5 transition duration-200 ${
                              isSelected
                                ? "border-[#a88342] bg-[#f5e9d8] shadow-[0_8px_25px_rgba(53,23,22,0.05)]"
                                : "border-[#d9c19b] bg-[#f7ecdc]"
                            }`}
                          >
                            <div className="flex items-start gap-4">

                              {/* RADIO */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleSelectAddress(
                                    address.id
                                  )
                                }
                                aria-label={`Select ${
                                  address.label ||
                                  "address"
                                }`}
                                className="mt-1 shrink-0"
                              >
                                <div
                                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                    isSelected
                                      ? "border-[#8f6d32]"
                                      : "border-[#bda98c]"
                                  }`}
                                >
                                  {isSelected && (
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#8f6d32]" />
                                  )}
                                </div>
                              </button>

                              {/* ADDRESS */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleSelectAddress(
                                    address.id
                                  )
                                }
                                className="min-w-0 flex-1 text-left"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-[#351716]">
                                    {address.label ||
                                      "Address"}
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
                                  {getAddressPincode(
                                    address
                                  )}
                                </p>

                                {(address.phone ||
                                  address.mobile) && (
                                  <p className="mt-2 text-xs text-[#947d6b]">
                                    {address.phone ||
                                      address.mobile}
                                  </p>
                                )}
                              </button>

                              {/* ACTIONS */}

                              <div className="flex shrink-0 items-start gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditAddress(
                                      address
                                    )
                                  }
                                  disabled={
                                    savingAddress ||
                                    placingOrder ||
                                    isDeleting
                                  }
                                  className="rounded-[7px] border border-[#cdb99b] px-3 py-2 text-[9px] font-medium uppercase tracking-[0.14em] text-[#351716] transition hover:bg-[#e8dbc7] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteAddress(
                                      address.id
                                    )
                                  }
                                  disabled={
                                    savingAddress ||
                                    placingOrder ||
                                    isDeleting
                                  }
                                  className="rounded-[7px] border border-[#d2aaa1] px-3 py-2 text-[9px] font-medium uppercase tracking-[0.14em] text-[#8a4136] transition hover:bg-[#f1dcd7] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {isDeleting
                                    ? "..."
                                    : "Delete"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* DELIVERY STATUS */}

                      {selectedAddressId &&
                        !showNewAddressForm &&
                        !editingAddressId && (
                          <div className="pt-2">

                            {deliveryChecking && (
                              <div className="rounded-[12px] border border-[#d9c19b] bg-[#f5e9d8] px-4 py-3">
                                <p className="text-xs text-[#765f50]">
                                  Checking delivery availability...
                                </p>
                              </div>
                            )}

                            {!deliveryChecking &&
                              deliveryAvailability.available ===
                                false && (
                                <div className="rounded-[12px] border border-[#b77a6e] bg-[#f4ddd7] px-4 py-3">
                                  <p className="text-sm font-medium text-[#7d3328]">
                                    Delivery is not available
                                    for this PIN code.
                                  </p>

                                  <p className="mt-1 text-xs leading-5 text-[#8c554c]">
                                    Please edit the address
                                    and enter a deliverable
                                    PIN code.
                                  </p>
                                </div>
                              )}

                            {!deliveryChecking &&
                              deliveryAvailability.available ===
                                true && (
                                <div className="rounded-[12px] border border-[#cdb77f] bg-[#efe3ca] px-4 py-3">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-sm font-medium text-[#5e453c]">
                                      ✓ Delivery available
                                    </p>

                                    <p className="text-sm font-semibold text-[#351716]">
                                      ₹
                                      {deliveryCharge.toLocaleString(
                                        "en-IN"
                                      )}
                                    </p>
                                  </div>

                                  {deliveryAvailability
                                    .estimatedDeliveryDays !=
                                    null && (
                                    <p className="mt-1 text-xs text-[#765f50]">
                                      Estimated delivery:{" "}
                                      {
                                        deliveryAvailability
                                          .estimatedDeliveryDays
                                      }{" "}
                                      {deliveryAvailability
                                        .estimatedDeliveryDays ===
                                      1
                                        ? "day"
                                        : "days"}
                                    </p>
                                  )}
                                </div>
                              )}
                          </div>
                        )}
                    </div>
                  )}

                  {/* ADD NEW ADDRESS */}

                  {!showNewAddressForm && (
                    <button
                      type="button"
                      onClick={handleOpenNewAddress}
                      className="mt-5 flex min-h-[50px] w-full items-center justify-center rounded-[8px] border border-[#cdb99b] text-[10px] font-medium uppercase tracking-[0.2em] text-[#351716] transition hover:bg-[#e8dbc7]"
                    >
                      + Add New Address
                    </button>
                  )}

                  {/* ADDRESS FORM */}

                  {showNewAddressForm && (
                    <form
                      onSubmit={handleSaveAddress}
                      className="mt-6 border-t border-[#d9c19b] pt-6"
                    >
                      <div className="mb-5">
                        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#8f6d32]">
                          {editingAddressId
                            ? "Edit Delivery Address"
                            : "New Delivery Address"}
                        </p>

                        <p className="mt-2 text-xs leading-5 text-[#765f50]">
                          {editingAddressId
                            ? "Update your existing delivery address and PIN code."
                            : "Add a delivery address to your account for future orders."}
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
                            <option value="Home">
                              Home
                            </option>

                            <option value="Work">
                              Work
                            </option>

                            <option value="Other">
                              Other
                            </option>
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
                              customerName ||
                              "Your full name"
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

                      {/* FORM ERROR */}

                      {addressError && (
                        <div className="mt-5 rounded-[10px] border border-[#b77a6e] bg-[#f4ddd7] px-4 py-3">
                          <p className="text-xs leading-5 text-[#7d3328]">
                            {addressError}
                          </p>
                        </div>
                      )}

                      {/* BUTTONS */}

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <button
                          type="submit"
                          disabled={savingAddress}
                          className="flex min-h-[52px] flex-1 items-center justify-center rounded-[8px] bg-[#351716] px-6 text-[10px] font-medium uppercase tracking-[0.2em] text-[#f8eddd] transition hover:bg-[#4a211d] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingAddress
                            ? editingAddressId
                              ? "Updating Address..."
                              : "Saving Address..."
                            : editingAddressId
                              ? "Update Address"
                              : "Save Address"}
                        </button>

                        <button
                          type="button"
                          onClick={
                            handleCancelAddressForm
                          }
                          className="flex min-h-[52px] flex-1 items-center justify-center rounded-[8px] border border-[#cdb99b] px-6 text-[10px] font-medium uppercase tracking-[0.2em] text-[#351716] transition hover:bg-[#e8dbc7]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ADDRESS ERROR OUTSIDE FORM */}

                  {addressError &&
                    !showNewAddressForm && (
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
                  Your Selection
                </h2>

                <p className="mt-2 text-sm text-[#765f50]">
                  Adjust your selection before placing your
                  order.
                </p>
              </div>

              <div className="space-y-5">
                {cartItems.map((item) => {
                  const isGiftSet =
                    item.isGiftSet === true;

                  const itemPrice =
                    Number(item.price) || 0;

                  const itemQuantity =
                    Number(item.quantity) || 0;

                  const itemTotal =
                    itemPrice * itemQuantity;

                  const itemKey = isGiftSet
                    ? `gift-set-${item.giftSetId}`
                    : `product-${item.productId}-${item.variantId}`;

                  return (
                    <article
                      key={itemKey}
                      className="rounded-[18px] border border-[#d9c19b] bg-[#f5e9d8] p-4 md:p-5"
                    >
                      <div className="flex gap-4">

                        {/* IMAGE */}

                        <div className="flex h-[105px] w-[82px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#e8dbc7] p-2 md:h-[120px] md:w-[92px]">
                          <img
                            src={getImageUrl(item.image)}
                            alt={
                              item.name ||
                              "Wine"
                            }
                            onError={(event) => {
                              event.currentTarget.src =
                                "/images/wine.png";
                            }}
                            className="h-full w-full object-contain"
                          />
                        </div>

                        {/* INFO */}

                        <div className="min-w-0 flex-1">

                          <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-[#a88342]">
                            {isGiftSet
                              ? "GIFT SET"
                              : item.category || "WINE"}
                          </p>

                          <h3 className="mt-1 font-serif text-lg font-semibold leading-tight text-[#351716] md:text-xl">
                            {item.name}
                          </h3>

                          {!isGiftSet &&
                            item.bottleSize && (
                              <p className="mt-1 text-xs text-[#765f50]">
                                {item.bottleSize}
                              </p>
                            )}

                          {isGiftSet &&
                            item.giftSetDescription && (
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#765f50]">
                                {item.giftSetDescription}
                              </p>
                            )}

                          <p className="mt-3 text-sm font-semibold text-[#351716]">
                            ₹
                            {itemPrice.toLocaleString(
                              "en-IN"
                            )}

                            <span className="ml-1 text-xs font-normal text-[#8f7665]">
                              each
                            </span>
                          </p>
                        </div>

                        {/* DESKTOP TOTAL */}

                        <div className="hidden text-right sm:block">
                          <p className="font-serif text-xl font-semibold text-[#351716]">
                            ₹
                            {itemTotal.toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>
                      </div>

                      {/* QUANTITY / REMOVE */}

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#dcc7a9] pt-4">

                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#765f50]">
                            Quantity
                          </span>

                          <div className="flex h-[42px] overflow-hidden rounded-[8px] border border-[#cdb99b] bg-[#f8eddd]">

                            {/* MINUS */}

                            <button
                              type="button"
                              aria-label={`Decrease quantity of ${item.name}`}
                              disabled={
                                cartLoading ||
                                itemQuantity <= 1
                              }
                              onClick={() => {
                                if (isGiftSet) {
                                  decreaseGiftSetQuantity(
                                    item.giftSetId
                                  );
                                } else {
                                  decreaseQuantity(
                                    item.productId,
                                    item.variantId
                                  );
                                }
                              }}
                              className="flex w-[40px] items-center justify-center text-lg text-[#351716] transition hover:bg-[#ead9c2] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              −
                            </button>

                            {/* QUANTITY */}

                            <div className="flex w-[42px] items-center justify-center border-x border-[#cdb99b] text-sm font-medium text-[#351716]">
                              {itemQuantity}
                            </div>

                            {/* PLUS */}

                            <button
                              type="button"
                              aria-label={`Increase quantity of ${item.name}`}
                              disabled={cartLoading}
                              onClick={() => {
                                if (isGiftSet) {
                                  increaseGiftSetQuantity(
                                    item.giftSetId
                                  );
                                } else {
                                  increaseQuantity(
                                    item.productId,
                                    item.variantId
                                  );
                                }
                              }}
                              className="flex w-[40px] items-center justify-center text-lg text-[#351716] transition hover:bg-[#ead9c2] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* REMOVE */}

                        <button
                          type="button"
                          disabled={cartLoading}
                          onClick={() => {
                            if (isGiftSet) {
                              removeGiftSetFromCart(
                                item.giftSetId
                              );
                            } else {
                              removeFromCart(
                                item.productId,
                                item.variantId
                              );
                            }
                          }}
                          className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#8f6d32] transition hover:text-[#351716] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Remove
                        </button>

                        {/* MOBILE TOTAL */}

                        <p className="w-full text-right font-serif text-lg font-semibold text-[#351716] sm:hidden">
                          ₹
                          {itemTotal.toLocaleString(
                            "en-IN"
                          )}
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
                  {checkoutSubtotal.toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>

              {/* COUPON */}

              <div className="mt-6 rounded-[16px] border border-[#d9c19b] bg-[#f5e9d8] p-4">

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8f6d32]">
                      Coupon Code
                    </p>

                    <p className="mt-1 text-xs text-[#765f50]">
                      Apply an eligible offer to this order.
                    </p>
                  </div>

                  {appliedCoupon && (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      disabled={
                        couponLoading ||
                        placingOrder
                      }
                      className="text-[9px] font-medium uppercase tracking-[0.16em] text-[#8f6d32] transition hover:text-[#351716] disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(
                        event.target.value.toUpperCase()
                      );

                      if (couponError) {
                        setCouponError("");
                      }

                      if (appliedCoupon) {
                        setAppliedCoupon(null);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                    placeholder="ENTER COUPON CODE"
                    disabled={
                      couponLoading ||
                      placingOrder ||
                      Boolean(appliedCoupon)
                    }
                    className="h-[48px] min-w-0 flex-1 rounded-[8px] border border-[#d5bea0] bg-[#f8eddd] px-4 text-xs font-medium tracking-[0.08em] text-[#351716] outline-none placeholder:text-[#a28d7a] focus:border-[#a88342] focus:ring-1 focus:ring-[#a88342] disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  {!appliedCoupon && (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={
                        couponLoading ||
                        placingOrder ||
                        !couponCode.trim()
                      }
                      className="h-[48px] rounded-[8px] bg-[#351716] px-6 text-[10px] font-medium uppercase tracking-[0.18em] text-[#f8eddd] transition hover:bg-[#4a211d] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {couponLoading
                        ? "Checking..."
                        : "Apply"}
                    </button>
                  )}
                </div>

                {couponError && (
                  <div className="mt-3 rounded-[10px] border border-[#b77a6e] bg-[#f4ddd7] px-3 py-2">
                    <p className="text-xs leading-5 text-[#7d3328]">
                      {couponError}
                    </p>
                  </div>
                )}

                {appliedCoupon && (
                  <div className="mt-3 rounded-[10px] border border-[#cdb77f] bg-[#efe3ca] px-3 py-2">
                    <p className="text-xs leading-5 text-[#5e453c]">
                      ✓ Coupon{" "}
                      <strong className="font-semibold text-[#351716]">
                        {appliedCoupon.coupon?.code ||
                          appliedCoupon.code}
                      </strong>{" "}
                      applied successfully.
                    </p>
                  </div>
                )}
              </div>

              {/* DISCOUNT */}

              {appliedCoupon &&
                couponDiscount > 0 && (
                  <div className="mt-5 flex items-center justify-between text-sm">
                    <span className="text-[#765f50]">
                      Discount
                    </span>

                    <span className="font-medium text-[#6f3329]">
                      -₹
                      {couponDiscount.toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </div>
                )}

              {/* DELIVERY */}

              <div className="mt-5 flex items-start justify-between gap-5 text-sm">
                <span className="text-[#765f50]">
                  Delivery
                </span>

                <div className="text-right">
                  {deliveryChecking ? (
                    <span className="font-medium text-[#765f50]">
                      Checking...
                    </span>
                  ) : deliveryAvailability.available ===
                    true ? (
                    <>
                      <span className="font-medium text-[#351716]">
                        ₹
                        {deliveryCharge.toLocaleString(
                          "en-IN"
                        )}
                      </span>

                      {deliveryAvailability
                        .estimatedDeliveryDays !=
                        null && (
                        <p className="mt-1 text-[10px] leading-4 text-[#947d6b]">
                          {
                            deliveryAvailability
                              .estimatedDeliveryDays
                          }{" "}
                          {deliveryAvailability
                            .estimatedDeliveryDays ===
                          1
                            ? "day"
                            : "days"}
                        </p>
                      )}
                    </>
                  ) : deliveryUnavailable ? (
                    <span className="font-medium text-[#7d3328]">
                      Not available
                    </span>
                  ) : (
                    <span className="font-medium text-[#947d6b]">
                      Select address
                    </span>
                  )}
                </div>
              </div>

              <div className="my-7 h-px bg-[#d9c19b]" />

              {/* TOTAL */}

              <div className="flex items-end justify-between">
                <span className="text-sm font-medium text-[#351716]">
                  Total
                </span>

                <span className="font-serif text-3xl font-semibold text-[#351716]">
                  ₹
                  {checkoutTotal.toLocaleString(
                    "en-IN"
                  )}
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

              {/* DELIVERY ERROR */}

              {deliveryUnavailable &&
                !orderError && (
                  <div className="mt-6 rounded-[10px] border border-[#b77a6e] bg-[#f4ddd7] px-4 py-3">
                    <p className="text-xs leading-5 text-[#7d3328]">
                      Delivery is not available for this
                      PIN code. Please edit your address
                      and enter a deliverable PIN code.
                    </p>
                  </div>
                )}

              {/* PLACE ORDER */}

              <button
                type="button"
                disabled={!canPlaceOrder}
                onClick={handlePlaceOrder}
                className="mt-6 flex h-[54px] w-full items-center justify-center rounded-[8px] bg-[#351716] text-[10px] font-medium uppercase tracking-[0.22em] text-[#f8eddd] transition duration-300 hover:bg-[#4a211d] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {placingOrder
                  ? "Placing Order..."
                  : !isAuthenticated
                    ? "Log In to Continue"
                    : showNewAddressForm ||
                        editingAddressId
                      ? editingAddressId
                        ? "Update Address to Continue"
                        : "Save Address to Continue"
                      : !selectedAddressId
                        ? "Select Delivery Address"
                        : deliveryChecking
                          ? "Checking Delivery..."
                          : deliveryAvailability.available !==
                              true
                            ? "Delivery Not Available"
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
