import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Eye,
  Mail,
  Phone,
  Search,
  RefreshCw,
  Users,
  ShoppingBag,
  Heart,
  MessageSquare,
  UserCheck,
  UserX,
  X,
  ChevronRight,
} from "lucide-react";

import {
  getAdminCustomers,
  getAdminCustomerById,
  updateAdminCustomerStatus,
} from "../services/api";

import { useAdminAuth } from "../context/AdminAuthContext";


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const formatCurrency = (value) => {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(Number(value || 0));
};


const formatDate = (date) => {
  if (!date) return "—";

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(new Date(date));
};


/*
|--------------------------------------------------------------------------
| SUMMARY CARD
|--------------------------------------------------------------------------
*/

const SummaryCard = ({
  icon: Icon,
  label,
  value,
  description,
}) => {
  return (
    <div className="group rounded-2xl border border-[#e6d8c7] bg-[#fffaf3] p-5 shadow-[0_8px_30px_rgba(53,23,22,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(53,23,22,0.08)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8b766b]">
            {label}
          </p>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-[#351716]">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-[#8b766b]">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d9c49b] bg-[#f8efdf] text-[#a88342] transition duration-300 group-hover:scale-105">
          <Icon size={19} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
};


/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

const StatusBadge = ({
  active,
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${
        active
          ? "bg-[#edf5ec] text-[#55704f]"
          : "bg-[#f7eaea] text-[#8b4d4d]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active
            ? "bg-[#55704f]"
            : "bg-[#8b4d4d]"
        }`}
      />

      {active
        ? "Active"
        : "Inactive"}
    </span>
  );
};


/*
|--------------------------------------------------------------------------
| CUSTOMER AVATAR
|--------------------------------------------------------------------------
*/

const CustomerAvatar = ({
  customer,
  large = false,
}) => {
  const initials =
    `${customer.firstName?.[0] || ""}${
      customer.lastName?.[0] || ""
    }`.toUpperCase();

  if (
    customer.profileImageUrl
  ) {
    return (
      <img
        src={
          customer.profileImageUrl
        }
        alt={
          customer.fullName
        }
        className={`rounded-full object-cover ${
          large
            ? "h-20 w-20"
            : "h-11 w-11"
        }`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full border border-[#d9c49b] bg-[#f4e8d6] font-serif text-[#6e423b] ${
        large
          ? "h-20 w-20 text-2xl"
          : "h-11 w-11 text-sm"
      }`}
    >
      {initials || "C"}
    </div>
  );
};


/*
|--------------------------------------------------------------------------
| INFO ITEM
|--------------------------------------------------------------------------
*/

const InfoItem = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div className="rounded-xl border border-[#eadfce] bg-[#fffaf3] p-4">
      <div className="flex items-center gap-2 text-[#8b766b]">
        <Icon
          size={14}
          strokeWidth={1.5}
        />

        <span className="text-[9px] uppercase tracking-[0.16em]">
          {label}
        </span>
      </div>

      <p className="mt-2 break-words text-sm font-medium text-[#351716]">
        {value || "—"}
      </p>
    </div>
  );
};


/*
|--------------------------------------------------------------------------
| CUSTOMER DETAILS MODAL
|--------------------------------------------------------------------------
*/

const CustomerDetailsModal = ({
  customer,
  details,
  loading,
  onClose,
  onStatusChange,
}) => {
  const [activeTab, setActiveTab] =
    useState("overview");

  if (!customer) {
    return null;
  }

  const detailCustomer =
    details?.customer || customer;

  const addresses =
    details?.addresses || [];

  const orders =
    details?.orders || [];

  const wishlist =
    details?.wishlist || [];

  const reviews =
    details?.reviews || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#241312]/55 p-3 backdrop-blur-sm sm:p-6">
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-[#dfcdb8] bg-[#fdf8f0] shadow-[0_30px_100px_rgba(35,18,17,0.25)]">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[#e6d8c7] px-5 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-4">
            <CustomerAvatar
              customer={detailCustomer}
            />

            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#a88342]">
                Customer Profile
              </p>

              <h2 className="truncate font-serif text-xl text-[#351716] sm:text-2xl">
                {detailCustomer.fullName}
              </h2>

              <p className="truncate text-xs text-[#8b766b]">
                {detailCustomer.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#dfcdb8] text-[#6c5850] transition hover:bg-[#f4e8d6] hover:text-[#351716]"
          >
            <X size={17} />
          </button>
        </div>


        {/* TABS */}
        <div className="overflow-x-auto border-b border-[#e6d8c7]">
          <div className="flex min-w-max px-5 sm:px-7">
            {[
              ["overview", "Overview"],
              ["orders", "Orders"],
              ["addresses", "Addresses"],
              ["wishlist", "Wishlist"],
              ["reviews", "Reviews"],
            ].map(
              ([key, label]) => (
                <button
                  key={key}
                  onClick={() =>
                    setActiveTab(key)
                  }
                  className={`relative px-4 py-4 text-[10px] uppercase tracking-[0.16em] transition first:pl-0 ${
                    activeTab === key
                      ? "text-[#351716]"
                      : "text-[#9a877d] hover:text-[#351716]"
                  }`}
                >
                  {label}

                  {activeTab === key && (
                    <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#c9a45c] first:left-0" />
                  )}
                </button>
              )
            )}
          </div>
        </div>


        {/* BODY */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">

          {loading ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#c9a45c] border-t-transparent" />

                <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-[#8b766b]">
                  Loading customer
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* OVERVIEW */}
              {activeTab ===
                "overview" && (
                <div className="space-y-6">

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoItem
                      icon={Mail}
                      label="Email"
                      value={
                        detailCustomer.email
                      }
                    />

                    <InfoItem
                      icon={Phone}
                      label="Phone"
                      value={
                        detailCustomer.phone
                      }
                    />

                    <InfoItem
                      icon={ShoppingBag}
                      label="Total Orders"
                      value={
                        detailCustomer.totalOrders
                      }
                    />

                    <InfoItem
                      icon={ShoppingBag}
                      label="Total Purchases"
                      value={formatCurrency(
                        detailCustomer.totalPurchases
                      )}
                    />

                    <InfoItem
                      icon={Heart}
                      label="Wishlist"
                      value={
                        detailCustomer.wishlistCount
                      }
                    />

                    <InfoItem
                      icon={MessageSquare}
                      label="Reviews"
                      value={
                        detailCustomer.reviewCount
                      }
                    />

                    <InfoItem
                      icon={UserCheck}
                      label="Joined"
                      value={formatDate(
                        detailCustomer.createdAt
                      )}
                    />

                    <InfoItem
                      icon={UserCheck}
                      label="Last Login"
                      value={formatDate(
                        detailCustomer.lastLoginAt
                      )}
                    />
                  </div>


                  {/* ACCOUNT STATUS */}
                  <div className="rounded-2xl border border-[#e6d8c7] bg-[#fffaf3] p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-[#a88342]">
                          Account Status
                        </p>

                        <div className="mt-2">
                          <StatusBadge
                            active={
                              detailCustomer.isActive
                            }
                          />
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          onStatusChange(
                            detailCustomer.id,
                            !detailCustomer.isActive
                          )
                        }
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.14em] transition ${
                          detailCustomer.isActive
                            ? "border border-[#dcbcbc] bg-[#fff8f8] text-[#8b4d4d] hover:bg-[#f7eaea]"
                            : "bg-[#351716] text-[#fffaf3] hover:bg-[#4a2422]"
                        }`}
                      >
                        {detailCustomer.isActive ? (
                          <>
                            <UserX size={14} />
                            Deactivate Account
                          </>
                        ) : (
                          <>
                            <UserCheck size={14} />
                            Activate Account
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}


              {/* ORDERS */}
              {activeTab ===
                "orders" && (
                <div>
                  <div className="mb-5">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#a88342]">
                      Order History
                    </p>

                    <h3 className="mt-1 font-serif text-2xl text-[#351716]">
                      Previous Orders
                    </h3>
                  </div>

                  {orders.length ===
                  0 ? (
                    <EmptyState
                      icon={
                        ShoppingBag
                      }
                      text="No orders found for this customer."
                    />
                  ) : (
                    <div className="space-y-3">
                      {orders.map(
                        (order) => (
                          <div
                            key={
                              order.id
                            }
                            className="rounded-2xl border border-[#e6d8c7] bg-[#fffaf3] p-4 sm:p-5"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-medium text-[#351716]">
                                  {order.orderNumber ||
                                    `Order #${order.id}`}
                                </p>

                                <p className="mt-1 text-xs text-[#8b766b]">
                                  {formatDate(
                                    order.createdAt
                                  )}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-[#f4e8d6] px-3 py-1 text-[9px] uppercase tracking-[0.12em] text-[#6e423b]">
                                  {order.orderStatus ||
                                    "—"}
                                </span>

                                <span className="rounded-full bg-[#f0eee8] px-3 py-1 text-[9px] uppercase tracking-[0.12em] text-[#6c5850]">
                                  {order.paymentStatus ||
                                    "—"}
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#eadfce] pt-4 sm:grid-cols-4">
                              <InfoItem
                                label="Items"
                                value={
                                  order.itemCount
                                }
                              />

                              <InfoItem
                                label="Subtotal"
                                value={formatCurrency(
                                  order.subtotal
                                )}
                              />

                              <InfoItem
                                label="Discount"
                                value={formatCurrency(
                                  order.discountAmount
                                )}
                              />

                              <InfoItem
                                label="Total"
                                value={formatCurrency(
                                  order.totalAmount
                                )}
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}


              {/* ADDRESSES */}
              {activeTab ===
                "addresses" && (
                <div>
                  <div className="mb-5">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#a88342]">
                      Saved Addresses
                    </p>

                    <h3 className="mt-1 font-serif text-2xl text-[#351716]">
                      Customer Addresses
                    </h3>
                  </div>

                  {addresses.length ===
                  0 ? (
                    <EmptyState
                      text="No saved addresses found."
                    />
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {addresses.map(
                        (address) => (
                          <div
                            key={
                              address.id
                            }
                            className="rounded-2xl border border-[#e6d8c7] bg-[#fffaf3] p-5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] uppercase tracking-[0.18em] text-[#a88342]">
                                {address.addressType ||
                                  "Address"}
                              </span>

                              {address.isDefault && (
                                <span className="rounded-full bg-[#edf5ec] px-2.5 py-1 text-[8px] uppercase tracking-[0.12em] text-[#55704f]">
                                  Default
                                </span>
                              )}
                            </div>

                            <p className="mt-4 text-sm leading-6 text-[#4e3934]">
                              {
                                address.addressLine1
                              }

                              {address.addressLine2 && (
                                <>
                                  <br />
                                  {
                                    address.addressLine2
                                  }
                                </>
                              )}

                              <br />

                              {
                                address.city
                              }
                              ,{" "}
                              {
                                address.state
                              }

                              <br />

                              {
                                address.postalCode
                              }

                              <br />

                              {
                                address.country
                              }
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}


              {/* WISHLIST */}
              {activeTab ===
                "wishlist" && (
                <div>
                  <div className="mb-5">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#a88342]">
                      Saved Wines
                    </p>

                    <h3 className="mt-1 font-serif text-2xl text-[#351716]">
                      Wishlist
                    </h3>
                  </div>

                  {wishlist.length ===
                  0 ? (
                    <EmptyState
                      icon={Heart}
                      text="No wishlist items found."
                    />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {wishlist.map(
                        (item) => (
                          <div
                            key={
                              item.id
                            }
                            className="overflow-hidden rounded-2xl border border-[#e6d8c7] bg-[#fffaf3]"
                          >
                            {item.imageUrl ? (
                              <img
                                src={
                                  item.imageUrl
                                }
                                alt={
                                  item.productName
                                }
                                className="h-44 w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-44 items-center justify-center bg-[#f3e8d7] text-[#a88342]">
                                <Heart
                                  size={28}
                                  strokeWidth={
                                    1.2
                                  }
                                />
                              </div>
                            )}

                            <div className="p-4">
                              <p className="font-serif text-lg text-[#351716]">
                                {
                                  item.productName
                                }
                              </p>

                              <p className="mt-1 text-xs text-[#8b766b]">
                                {[
                                  item.vintage,
                                  item.region,
                                  item.country,
                                ]
                                  .filter(
                                    Boolean
                                  )
                                  .join(
                                    " • "
                                  )}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}


              {/* REVIEWS */}
              {activeTab ===
                "reviews" && (
                <div>
                  <div className="mb-5">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#a88342]">
                      Customer Feedback
                    </p>

                    <h3 className="mt-1 font-serif text-2xl text-[#351716]">
                      Reviews
                    </h3>
                  </div>

                  {reviews.length ===
                  0 ? (
                    <EmptyState
                      icon={
                        MessageSquare
                      }
                      text="No reviews found."
                    />
                  ) : (
                    <div className="space-y-4">
                      {reviews.map(
                        (review) => (
                          <div
                            key={
                              review.id
                            }
                            className="rounded-2xl border border-[#e6d8c7] bg-[#fffaf3] p-5"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-sm font-medium text-[#351716]">
                                  {
                                    review.productName
                                  }
                                </p>

                                <div className="mt-1 flex items-center gap-1">
                                  {Array.from(
                                    {
                                      length: 5,
                                    }
                                  ).map(
                                    (
                                      _,
                                      index
                                    ) => (
                                      <span
                                        key={
                                          index
                                        }
                                        className={
                                          index <
                                          review.rating
                                            ? "text-[#a88342]"
                                            : "text-[#d9cfc2]"
                                        }
                                      >
                                        ★
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {review.isVerifiedPurchase && (
                                  <span className="rounded-full bg-[#edf5ec] px-2.5 py-1 text-[8px] uppercase tracking-[0.1em] text-[#55704f]">
                                    Verified Purchase
                                  </span>
                                )}

                                <span
                                  className={`rounded-full px-2.5 py-1 text-[8px] uppercase tracking-[0.1em] ${
                                    review.isApproved
                                      ? "bg-[#edf5ec] text-[#55704f]"
                                      : "bg-[#f7eaea] text-[#8b4d4d]"
                                  }`}
                                >
                                  {review.isApproved
                                    ? "Approved"
                                    : "Pending"}
                                </span>
                              </div>
                            </div>

                            {review.reviewTitle && (
                              <h4 className="mt-4 text-sm font-medium text-[#351716]">
                                {
                                  review.reviewTitle
                                }
                              </h4>
                            )}

                            {review.reviewText && (
                              <p className="mt-2 text-sm leading-6 text-[#6c5850]">
                                {
                                  review.reviewText
                                }
                              </p>
                            )}

                            <p className="mt-4 text-[10px] text-[#a08d82]">
                              {formatDate(
                                review.createdAt
                              )}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};


/*
|--------------------------------------------------------------------------
| EMPTY STATE
|--------------------------------------------------------------------------
*/

const EmptyState = ({
  icon: Icon,
  text,
}) => {
  return (
    <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#dfcdb8] bg-[#fffaf3] px-5 text-center">
      {Icon && (
        <Icon
          size={28}
          strokeWidth={1.2}
          className="text-[#c9a45c]"
        />
      )}

      <p className="mt-4 text-xs text-[#8b766b]">
        {text}
      </p>
    </div>
  );
};


/*
|--------------------------------------------------------------------------
| MAIN CUSTOMERS PAGE
|--------------------------------------------------------------------------
*/

const Customers = () => {
  const {
    token,
  } = useAdminAuth();

  const [brandName, setBrandName] =
    useState("VINEORA");

  const [
    customers,
    setCustomers,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState(null);

  const [
    customerDetails,
    setCustomerDetails,
  ] = useState(null);

  const [
    detailsLoading,
    setDetailsLoading,
  ] = useState(false);

  const [
    updatingStatus,
    setUpdatingStatus,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | LOAD CUSTOMERS
  |--------------------------------------------------------------------------
  */

  const loadCustomers =
    useCallback(
      async () => {
        if (!token) return;

        try {
          setLoading(true);
          setError("");

          const response =
            await getAdminCustomers(
              token
            );

          if (!response.success) {
            throw new Error(
              response.message ||
                "Failed to load customers"
            );
          }

          setCustomers(
            response.customers ||
              []
          );
        } catch (err) {
          console.error(
            "Customer loading error:",
            err
          );

          setError(
            err.message ||
              "Failed to load customers"
          );
        } finally {
          setLoading(false);
        }
      },
      [token]
    );


  useEffect(() => {
  loadCustomers();

  const loadBrandName = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/settings",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data?.success && data?.settings?.brand_name) {
        setBrandName(data.settings.brand_name);
      }
    } catch (error) {
      console.error(
        "Customer page settings loading error:",
        error
      );
    }
  };

  loadBrandName();
}, [loadCustomers, token]);


  /*
  |--------------------------------------------------------------------------
  | FILTER CUSTOMERS
  |--------------------------------------------------------------------------
  */

  const filteredCustomers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return customers.filter(
        (customer) => {
          const matchesSearch =
            !query ||
            customer.fullName
              ?.toLowerCase()
              .includes(query) ||
            customer.email
              ?.toLowerCase()
              .includes(query) ||
            customer.phone
              ?.toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter ===
              "all" ||
            (statusFilter ===
              "active" &&
              customer.isActive) ||
            (statusFilter ===
              "inactive" &&
              !customer.isActive);

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      customers,
      search,
      statusFilter,
    ]);


  /*
  |--------------------------------------------------------------------------
  | SUMMARY DATA
  |--------------------------------------------------------------------------
  */

  const summary =
    useMemo(() => {
      const active =
        customers.filter(
          (customer) =>
            customer.isActive
        ).length;

      const totalOrders =
        customers.reduce(
          (sum, customer) =>
            sum +
            Number(
              customer.totalOrders ||
                0
            ),
          0
        );

      const totalPurchases =
        customers.reduce(
          (sum, customer) =>
            sum +
            Number(
              customer.totalPurchases ||
                0
            ),
          0
        );

      return {
        total:
          customers.length,
        active,
        inactive:
          customers.length -
          active,
        totalOrders,
        totalPurchases,
      };
    }, [customers]);


  /*
  |--------------------------------------------------------------------------
  | VIEW CUSTOMER
  |--------------------------------------------------------------------------
  */

  const handleViewCustomer =
    async (customer) => {
      setSelectedCustomer(
        customer
      );

      setCustomerDetails(null);
      setDetailsLoading(true);

      try {
        const response =
          await getAdminCustomerById(
            token,
            customer.id
          );

        if (!response.success) {
          throw new Error(
            response.message ||
              "Failed to load customer"
          );
        }

        setCustomerDetails(
          response
        );
      } catch (err) {
        console.error(
          "Customer details error:",
          err
        );

        setError(
          err.message ||
            "Failed to load customer details"
        );
      } finally {
        setDetailsLoading(false);
      }
    };


  /*
  |--------------------------------------------------------------------------
  | UPDATE CUSTOMER STATUS
  |--------------------------------------------------------------------------
  */

  const handleStatusChange =
    async (
      customerId,
      isActive
    ) => {
      try {
        setUpdatingStatus(true);
        setError("");
        setSuccessMessage("");

        const response =
          await updateAdminCustomerStatus(
            token,
            customerId,
            isActive
          );

        if (!response.success) {
          throw new Error(
            response.message ||
              "Failed to update customer"
          );
        }

        /*
        | Update customer in list
        */
        setCustomers(
          (current) =>
            current.map(
              (customer) =>
                customer.id ===
                customerId
                  ? {
                      ...customer,
                      isActive,
                    }
                  : customer
            )
        );

        /*
        | Update selected customer
        */
        setSelectedCustomer(
          (current) =>
            current &&
            current.id ===
              customerId
              ? {
                  ...current,
                  isActive,
                }
              : current
        );

        /*
        | Update detail response
        */
        setCustomerDetails(
          (current) =>
            current
              ? {
                  ...current,
                  customer: {
                    ...current.customer,
                    isActive,
                  },
                }
              : current
        );

        setSuccessMessage(
          isActive
            ? "Customer account activated successfully."
            : "Customer account deactivated successfully."
        );

        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } catch (err) {
        console.error(
          "Customer status error:",
          err
        );

        setError(
          err.message ||
            "Failed to update customer status"
        );
      } finally {
        setUpdatingStatus(false);
      }
    };


  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  if (
    loading &&
    customers.length === 0
  ) {
    return (
      <div className="min-h-screen bg-[#f5eee4] p-5 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-10 w-64 rounded-lg bg-[#eadfce]" />

            <div className="mt-3 h-4 w-96 max-w-full rounded bg-[#eadfce]" />

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({
                length: 4,
              }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-32 rounded-2xl bg-[#eadfce]"
                  />
                )
              )}
            </div>

            <div className="mt-6 h-[500px] rounded-2xl bg-[#eadfce]" />
          </div>
        </div>
      </div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-[#f5eee4] text-[#351716]">

      <div className="mx-auto max-w-7xl p-5 sm:p-7 lg:p-9">

        {/* PAGE HEADER */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-[#c9a45c]" />

              <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#a88342]">
                {brandName} Admin
              </span>
            </div>

            <h1 className="mt-3 font-serif text-3xl tracking-tight text-[#351716] sm:text-4xl">
              Customer Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c5850]">
              Manage customer profiles,
              orders, saved addresses,
              wishlists, reviews and
              account status.
            </p>
          </div>

          <button
            onClick={loadCustomers}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#d9c49b] bg-[#fffaf3] px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#6e423b] transition hover:bg-[#f4e8d6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={14}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>


        {/* GOLD DIVIDER */}
        <div className="my-7 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#e1d2bf]" />

          <span className="h-1.5 w-1.5 rotate-45 border border-[#c9a45c]" />

          <span className="h-px flex-1 bg-[#e1d2bf]" />
        </div>


        {/* SUCCESS */}
        {successMessage && (
          <div className="mb-5 rounded-xl border border-[#c9ddc5] bg-[#f2f8f0] px-4 py-3 text-xs text-[#55704f]">
            {successMessage}
          </div>
        )}


        {/* ERROR */}
        {error && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-[#e0bcbc] bg-[#fff5f5] px-4 py-3 text-xs text-[#8b4d4d]">
            <span>
              {error}
            </span>

            <button
              onClick={() =>
                setError("")
              }
              className="text-[#8b4d4d]"
            >
              <X size={15} />
            </button>
          </div>
        )}


        {/* SUMMARY */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={Users}
            label="Total Customers"
            value={
              summary.total
            }
            description="Registered customer accounts"
          />

          <SummaryCard
            icon={UserCheck}
            label="Active Customers"
            value={
              summary.active
            }
            description="Currently active accounts"
          />

          <SummaryCard
            icon={ShoppingBag}
            label="Total Orders"
            value={
              summary.totalOrders
            }
            description="Orders across customers"
          />

          <SummaryCard
            icon={Heart}
            label="Customer Purchases"
            value={formatCurrency(
              summary.totalPurchases
            )}
            description="Paid and completed order value"
          />
        </div>


        {/* CUSTOMER LIST */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-[#e3d5c3] bg-[#fffaf3] shadow-[0_8px_30px_rgba(53,23,22,0.04)]">

          {/* LIST HEADER */}
          <div className="border-b border-[#e6d8c7] p-5 sm:p-6">

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#a88342]">
                  Customer Directory
                </p>

                <h2 className="mt-1 font-serif text-2xl text-[#351716]">
                  All Customers
                </h2>
              </div>


              <div className="flex flex-col gap-3 sm:flex-row">

                {/* SEARCH */}
                <div className="relative min-w-0 sm:w-72">
                  <Search
                    size={15}
                    strokeWidth={1.6}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9b887d]"
                  />

                  <input
                    value={
                      search
                    }
                    onChange={(event) =>
                      setSearch(
                        event.target
                          .value
                      )
                    }
                    placeholder="Search customer..."
                    className="h-10 w-full rounded-xl border border-[#dfcfbb] bg-[#fdf8f0] pl-9 pr-3 text-xs text-[#351716] outline-none placeholder:text-[#a9988d] focus:border-[#c9a45c]"
                  />
                </div>


                {/* STATUS */}
                <select
                  value={
                    statusFilter
                  }
                  onChange={(event) =>
                    setStatusFilter(
                      event.target
                        .value
                    )
                  }
                  className="h-10 rounded-xl border border-[#dfcfbb] bg-[#fdf8f0] px-3 text-xs text-[#6c5850] outline-none focus:border-[#c9a45c]"
                >
                  <option value="all">
                    All Customers
                  </option>

                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>
                </select>
              </div>
            </div>


            <div className="mt-4 text-[10px] uppercase tracking-[0.14em] text-[#9b887d]">
              Showing{" "}
              <span className="font-semibold text-[#6e423b]">
                {
                  filteredCustomers.length
                }
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#6e423b]">
                {
                  customers.length
                }
              </span>{" "}
              customers
            </div>
          </div>


          {/* DESKTOP TABLE */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[950px]">
              <thead>
                <tr className="border-b border-[#e6d8c7] bg-[#fbf4ea]">
                  <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.16em] text-[#8b766b]">
                    Customer
                  </th>

                  <th className="px-4 py-4 text-left text-[9px] font-medium uppercase tracking-[0.16em] text-[#8b766b]">
                    Contact
                  </th>

                  <th className="px-4 py-4 text-center text-[9px] font-medium uppercase tracking-[0.16em] text-[#8b766b]">
                    Orders
                  </th>

                  <th className="px-4 py-4 text-right text-[9px] font-medium uppercase tracking-[0.16em] text-[#8b766b]">
                    Purchases
                  </th>

                  <th className="px-4 py-4 text-center text-[9px] font-medium uppercase tracking-[0.16em] text-[#8b766b]">
                    Wishlist
                  </th>

                  <th className="px-4 py-4 text-center text-[9px] font-medium uppercase tracking-[0.16em] text-[#8b766b]">
                    Reviews
                  </th>

                  <th className="px-4 py-4 text-center text-[9px] font-medium uppercase tracking-[0.16em] text-[#8b766b]">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-[9px] font-medium uppercase tracking-[0.16em] text-[#8b766b]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map(
                  (customer) => (
                    <tr
                      key={
                        customer.id
                      }
                      className="border-b border-[#eee4d7] transition hover:bg-[#fdf8f0]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <CustomerAvatar
                            customer={
                              customer
                            }
                          />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[#351716]">
                              {
                                customer.fullName
                              }
                            </p>

                            <p className="mt-0.5 text-[10px] text-[#9a877d]">
                              Customer #
                              {
                                customer.id
                              }
                            </p>
                          </div>
                        </div>
                      </td>


                      <td className="px-4 py-4">
                        <p className="max-w-[230px] truncate text-xs text-[#6c5850]">
                          {
                            customer.email
                          }
                        </p>

                        <p className="mt-1 text-[10px] text-[#9a877d]">
                          {
                            customer.phone
                          }
                        </p>
                      </td>


                      <td className="px-4 py-4 text-center text-sm font-medium text-[#351716]">
                        {
                          customer.totalOrders
                        }
                      </td>


                      <td className="px-4 py-4 text-right text-sm font-medium text-[#6e423b]">
                        {formatCurrency(
                          customer.totalPurchases
                        )}
                      </td>


                      <td className="px-4 py-4 text-center text-xs text-[#6c5850]">
                        {
                          customer.wishlistCount
                        }
                      </td>


                      <td className="px-4 py-4 text-center text-xs text-[#6c5850]">
                        {
                          customer.reviewCount
                        }
                      </td>


                      <td className="px-4 py-4 text-center">
                        <StatusBadge
                          active={
                            customer.isActive
                          }
                        />
                      </td>


                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() =>
                            handleViewCustomer(
                              customer
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-[#d9c49b] bg-[#fffaf3] px-3 py-2 text-[9px] font-medium uppercase tracking-[0.12em] text-[#6e423b] transition hover:bg-[#f4e8d6]"
                        >
                          <Eye
                            size={13}
                          />

                          View
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>


          {/* MOBILE / TABLET CARDS */}
          <div className="divide-y divide-[#eee4d7] lg:hidden">

            {filteredCustomers.map(
              (customer) => (
                <div
                  key={
                    customer.id
                  }
                  className="p-4 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <CustomerAvatar
                      customer={
                        customer
                      }
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-lg text-[#351716]">
                          {
                            customer.fullName
                          }
                        </h3>

                        <StatusBadge
                          active={
                            customer.isActive
                          }
                        />
                      </div>

                      <p className="mt-1 truncate text-xs text-[#6c5850]">
                        {
                          customer.email
                        }
                      </p>

                      <p className="mt-1 text-[10px] text-[#9a877d]">
                        {
                          customer.phone
                        }
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        handleViewCustomer(
                          customer
                        )
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#d9c49b] text-[#6e423b]"
                    >
                      <ChevronRight
                        size={16}
                      />
                    </button>
                  </div>


                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <InfoItem
                      icon={
                        ShoppingBag
                      }
                      label="Orders"
                      value={
                        customer.totalOrders
                      }
                    />

                    <InfoItem
                      icon={
                        ShoppingBag
                      }
                      label="Purchases"
                      value={formatCurrency(
                        customer.totalPurchases
                      )}
                    />

                    <InfoItem
                      icon={Heart}
                      label="Wishlist"
                      value={
                        customer.wishlistCount
                      }
                    />

                    <InfoItem
                      icon={
                        MessageSquare
                      }
                      label="Reviews"
                      value={
                        customer.reviewCount
                      }
                    />
                  </div>
                </div>
              )
            )}
          </div>


          {/* NO RESULTS */}
          {!loading &&
            filteredCustomers.length ===
              0 && (
              <div className="p-10">
                <EmptyState
                  icon={Users}
                  text={
                    customers.length ===
                    0
                      ? "No customers found in the database."
                      : "No customers match your search or filter."
                  }
                />
              </div>
            )}
        </div>
      </div>


      {/* DETAILS MODAL */}
      {selectedCustomer && (
        <CustomerDetailsModal
          customer={
            selectedCustomer
          }
          details={
            customerDetails
          }
          loading={
            detailsLoading
          }
          onClose={() => {
            setSelectedCustomer(
              null
            );
            setCustomerDetails(
              null
            );
          }}
          onStatusChange={
            handleStatusChange
          }
        />
      )}


      {/* STATUS UPDATING OVERLAY */}
      {updatingStatus && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#241312]/20 backdrop-blur-[1px]">
          <div className="rounded-2xl border border-[#dfcdb8] bg-[#fffaf3] px-6 py-5 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#c9a45c] border-t-transparent" />

              <span className="text-[10px] uppercase tracking-[0.16em] text-[#6c5850]">
                Updating account
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default Customers;