import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock3,
  DollarSign,
  RefreshCw,
  Settings,
  ShoppingBag,
  TrendingUp,
  Users,
  Wine,
  XCircle,
  Check,
} from "lucide-react";

import { useAdminAuth } from "../context/AdminAuthContext";

import {
  getDashboardStats,
  getAdminOrders,
  getAdminUnreadNotificationCount,
  getAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  deleteAdminNotification,
  deleteAllAdminNotifications,
} from "../services/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

const SOCKET_BASE_URL =
  API_BASE_URL.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

const Dashboard = () => {
  const navigate = useNavigate();

  const { admin, token, logout } =
    useAdminAuth();

  /* =========================================================
     DASHBOARD STATE
  ========================================================= */

  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [brandName, setBrandName] =
    useState("VineWinbe");

  const [adminOrders, setAdminOrders] =
    useState([]);

  /* =========================================================
     NOTIFICATION STATE
  ========================================================= */

  const [
    unreadNotifications,
    setUnreadNotifications,
  ] = useState(0);

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    showNotificationDropdown,
    setShowNotificationDropdown,
  ] = useState(false);

  const [
    notificationPopup,
    setNotificationPopup,
  ] = useState(null);

  const [
    notificationLoading,
    setNotificationLoading,
  ] = useState(false);

  const [
    markingAllRead,
    setMarkingAllRead,
  ] = useState(false);

  const [
    deletingNotificationId,
    setDeletingNotificationId,
  ] = useState(null);

  const [
    clearingAllNotifications,
    setClearingAllNotifications,
  ] = useState(false);

  const notificationDropdownRef =
    useRef(null);

  const popupTimerRef =
    useRef(null);

  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  const loadDashboard = async () => {
    if (!token) {
      setLoading(false);
      setError(
        "Authentication token is missing."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await getDashboardStats(token);

      if (!response?.success) {
        throw new Error(
          response?.message ||
          "Failed to load dashboard"
        );
      }

      setDashboard(response);
    } catch (err) {
      console.error(
        "Dashboard loading error:",
        err
      );

      setError(
        err?.message ||
        "Unable to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     LOAD ADMIN ORDERS
  ========================================================= */

  const loadAdminOrders = async () => {
    if (!token) {
      return;
    }

    try {
      const response =
        await getAdminOrders(token);

      const orders =
        response?.orders ||
        response?.data?.orders ||
        response?.data ||
        [];

      if (Array.isArray(orders)) {
        setAdminOrders(orders);
      }
    } catch (err) {
      console.warn(
        "Admin orders could not be loaded:",
        err
      );
    }
  };

  /* =========================================================
     LOAD STORE SETTINGS
  ========================================================= */

  const loadSettings = async () => {
    if (!token) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/admin/settings`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (!response.ok) {
        throw new Error(
          "Failed to load store settings"
        );
      }

      const data =
        await response.json();

      const settings =
        data?.settings || data;

      if (settings?.brand_name) {
        setBrandName(
          settings.brand_name
        );
      }
    } catch (err) {
      console.error(
        "Store settings loading error:",
        err
      );

      setBrandName("VineWinbe");
    }
  };

  /* =========================================================
     NORMALIZE NOTIFICATION RESPONSE
  ========================================================= */

  const extractNotifications = (
    response
  ) => {
    const list =
      response?.notifications ||
      response?.data?.notifications ||
      response?.data ||
      [];

    return Array.isArray(list)
      ? list
      : [];
  };

  /* =========================================================
     LOAD UNREAD NOTIFICATION COUNT
  ========================================================= */

  const loadUnreadNotifications =
    async () => {
      if (!token) {
        return;
      }

      try {
        const response =
          await getAdminUnreadNotificationCount(
            token
          );

        const count = Number(
          response?.count ??
          response?.unreadCount ??
          response?.data?.count ??
          0
        );

        setUnreadNotifications(
          Number.isFinite(count)
            ? count
            : 0
        );
      } catch (err) {
        console.warn(
          "Admin notification count could not be loaded:",
          err
        );
      }
    };

  /* =========================================================
     LOAD ADMIN NOTIFICATIONS
  ========================================================= */

  const loadAdminNotifications =
    async (
      showLoading = false
    ) => {
      if (!token) {
        return [];
      }

      try {
        if (showLoading) {
          setNotificationLoading(true);
        }

        const response =
          await getAdminNotifications(
            token
          );

        const notificationList =
          extractNotifications(
            response
          );

        setNotifications(
          notificationList
        );

        return notificationList;
      } catch (err) {
        console.warn(
          "Admin notifications could not be loaded:",
          err
        );

        return [];
      } finally {
        if (showLoading) {
          setNotificationLoading(false);
        }
      }
    };

  /* =========================================================
     SHOW NOTIFICATION POPUP
  ========================================================= */

  const showNewNotificationPopup = (
    notification
  ) => {
    if (!notification) {
      return;
    }

    if (popupTimerRef.current) {
      clearTimeout(
        popupTimerRef.current
      );
    }

    setNotificationPopup(
      notification
    );

    popupTimerRef.current =
      setTimeout(() => {
        setNotificationPopup(null);
      }, 4000);
  };

  /* =========================================================
     MARK SINGLE NOTIFICATION AS READ
  ========================================================= */

  const handleMarkNotificationAsRead =
    async (
      notification
    ) => {
      if (!token || !notification?.id) {
        return;
      }

      if (
        notification.isRead === true ||
        notification.is_read === true
      ) {
        return;
      }

      try {
        await markAdminNotificationAsRead(
          token,
          notification.id
        );

        setNotifications(
          (current) =>
            current.map(
              (item) =>
                Number(item.id) ===
                  Number(
                    notification.id
                  )
                  ? {
                    ...item,
                    isRead: true,
                    is_read: true,
                  }
                  : item
            )
        );

        setUnreadNotifications(
          (current) =>
            Math.max(
              0,
              current - 1
            )
        );
      } catch (err) {
        console.error(
          "Failed to mark notification as read:",
          err
        );
      }
    };

  /* =========================================================
     MARK ALL NOTIFICATIONS AS READ
  ========================================================= */

  const handleMarkAllNotificationsAsRead =
    async () => {
      if (
        !token ||
        unreadNotifications === 0
      ) {
        return;
      }

      try {
        setMarkingAllRead(true);

        await markAllAdminNotificationsAsRead(
          token
        );

        setNotifications(
          (current) =>
            current.map(
              (notification) => ({
                ...notification,
                isRead: true,
                is_read: true,
              })
            )
        );

        setUnreadNotifications(0);
      } catch (err) {
        console.error(
          "Failed to mark all notifications as read:",
          err
        );
      } finally {
        setMarkingAllRead(false);
      }
    };

  /* =========================================================
 DELETE SINGLE NOTIFICATION
========================================================= */

  const handleDeleteNotification = async (
    notificationId
  ) => {
    if (
      !token ||
      !notificationId ||
      deletingNotificationId
    ) {
      return;
    }

    const notificationToDelete =
      notifications.find(
        (notification) =>
          Number(notification.id) ===
          Number(notificationId)
      );

    try {
      setDeletingNotificationId(
        notificationId
      );

      await deleteAdminNotification(
        token,
        notificationId
      );

      setNotifications(
        (current) =>
          current.filter(
            (notification) =>
              Number(notification.id) !==
              Number(notificationId)
          )
      );

      if (
        notificationToDelete &&
        !(
          notificationToDelete.isRead === true ||
          notificationToDelete.is_read === true
        )
      ) {
        setUnreadNotifications(
          (current) =>
            Math.max(0, current - 1)
        );
      }

      if (
        notificationPopup &&
        Number(notificationPopup.id) ===
        Number(notificationId)
      ) {
        setNotificationPopup(null);
      }
    } catch (err) {
      console.error(
        "Failed to delete admin notification:",
        err
      );
    } finally {
      setDeletingNotificationId(null);
    }
  };


  /* =========================================================
     DELETE ALL NOTIFICATIONS
  ========================================================= */

  const handleDeleteAllNotifications =
    async () => {
      if (
        !token ||
        clearingAllNotifications ||
        notifications.length === 0
      ) {
        return;
      }

      try {
        setClearingAllNotifications(true);

        await deleteAllAdminNotifications(
          token
        );

        setNotifications([]);
        setUnreadNotifications(0);
        setNotificationPopup(null);
      } catch (err) {
        console.error(
          "Failed to clear admin notifications:",
          err
        );
      } finally {
        setClearingAllNotifications(false);
      }
    };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    if (!token) {
      return;
    }

    loadDashboard();
    loadAdminOrders();
    loadSettings();
    loadUnreadNotifications();
    loadAdminNotifications();
  }, [token]);

  /* =========================================================
     REAL-TIME ADMIN NOTIFICATIONS
  ========================================================= */

useEffect(() => {
  if (!token) {
    return;
  }

  console.log(
    "Starting admin notification socket:",
    SOCKET_BASE_URL
  );

  const socket = io(SOCKET_BASE_URL, {
    transports: ["polling", "websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log(
      "Connected to admin notification server:",
      socket.id
    );
  });

  socket.on("connect_error", (error) => {
    console.error(
      "Admin notification socket connection error:",
      error.message
    );
  });

  socket.on(
    "admin:notification-created",
    async (data) => {
      console.log(
        "New admin notification received:",
        data
      );

      try {
        const notificationList =
          await loadAdminNotifications();

        const newNotification =
          notificationList.find(
            (notification) =>
              Number(notification?.id) ===
              Number(data?.notificationId)
          ) ||
          notificationList[0];

        if (newNotification) {
          showNewNotificationPopup(
            newNotification
          );
        }

        await loadUnreadNotifications();

        // Also refresh orders because a new order
        // should immediately appear in dashboard data.
        await loadAdminOrders();
      } catch (err) {
        console.error(
          "Failed to process real-time notification:",
          err
        );
      }
    }
  );

  socket.on("disconnect", (reason) => {
    console.log(
      "Disconnected from admin notification server:",
      reason
    );
  });

  return () => {
    console.log(
      "Cleaning up admin notification socket"
    );

    socket.removeAllListeners();
    socket.disconnect();
  };
}, [token]);

  /* =========================================================
     POPUP CLEANUP
  ========================================================= */

  useEffect(() => {
    return () => {
      if (popupTimerRef.current) {
        clearTimeout(
          popupTimerRef.current
        );
      }
    };
  }, []);

  /* =========================================================
     CLOSE NOTIFICATION DROPDOWN
     WHEN CLICKING OUTSIDE
  ========================================================= */

  useEffect(() => {
    const handleOutsideClick = (
      event
    ) => {
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(
          event.target
        )
      ) {
        setShowNotificationDropdown(
          false
        );
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /* =========================================================
     LOGOUT
  ========================================================= */



  /* =========================================================
     REFRESH EVERYTHING
  ========================================================= */

  const handleRefresh = async () => {
    await Promise.all([
      loadDashboard(),
      loadAdminOrders(),
      loadSettings(),
      loadUnreadNotifications(),
      loadAdminNotifications(),
    ]);
  };

  /* =========================================================
     DATA
  ========================================================= */

  const stats =
    dashboard?.stats || {};

  const bestSellingWines =
    dashboard?.bestSellingWines || [];

  const lowStockWines =
    dashboard?.lowStockWines || [];

  const revenueChart =
    dashboard?.revenueChart || [];

  const recentOrders =
    adminOrders.slice(0, 5);

  const recentCustomers = useMemo(() => {
    const seen = new Set();

    return adminOrders
      .filter((order) => {
        const customerId =
          order?.customer?.id ??
          order?.customer_id ??
          order?.customer?.email ??
          order?.customer_email;

        if (!customerId || seen.has(customerId)) {
          return false;
        }

        seen.add(customerId);
        return true;
      })
      .slice(0, 5);
  }, [adminOrders]);

  const getOrderStatusClass = (status) => {
    const normalized = String(status || "")
      .trim()
      .toLowerCase();

    if (normalized === "delivered") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (normalized === "cancelled" || normalized === "canceled") {
      return "border-red-200 bg-red-50 text-red-700";
    }

    if (normalized === "processing" || normalized === "confirmed") {
      return "border-blue-200 bg-blue-50 text-blue-700";
    }

    return "border-[#e4d4b9] bg-[#fbf4e7] text-[#80622f]";
  };

  /* =========================================================
     CURRENCY
  ========================================================= */

  const formatCurrency = (
    value
  ) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(
      Number(value || 0)
    );
  };

  /* =========================================================
     SALES CALCULATION
  ========================================================= */

  const salesData = useMemo(() => {
    const deliveredOrders =
      adminOrders.filter(
        (order) => {
          const status =
            String(
              order?.orderStatus ??
              order?.order_status ??
              ""
            )
              .trim()
              .toLowerCase();

          return (
            status === "delivered"
          );
        }
      );

    const totalDeliveredSales =
      deliveredOrders.reduce(
        (total, order) => {
          const amount =
            Number(
              order?.totalAmount ??
              order?.total_amount ??
              0
            );

          return (
            total + amount
          );
        },
        0
      );

    const now =
      new Date();

    const todayDeliveredSales =
      deliveredOrders.reduce(
        (total, order) => {
          const createdAt =
            order?.createdAt ??
            order?.created_at;

          if (!createdAt) {
            return total;
          }

          const orderDate =
            new Date(
              createdAt
            );

          if (
            Number.isNaN(
              orderDate.getTime()
            )
          ) {
            return total;
          }

          const sameDay =
            orderDate.getFullYear() ===
            now.getFullYear() &&
            orderDate.getMonth() ===
            now.getMonth() &&
            orderDate.getDate() ===
            now.getDate();

          if (!sameDay) {
            return total;
          }

          return (
            total +
            Number(
              order?.totalAmount ??
              order?.total_amount ??
              0
            )
          );
        },
        0
      );

    return {
      total:
        adminOrders.length > 0
          ? totalDeliveredSales
          : Number(
            stats.totalSales || 0
          ),

      today:
        adminOrders.length > 0
          ? todayDeliveredSales
          : Number(
            stats.todaySales || 0
          ),
    };
  }, [
    adminOrders,
    stats.totalSales,
    stats.todaySales,
  ]);

  /* =========================================================
     REVENUE CHART
  ========================================================= */

  const maxRevenue = useMemo(() => {
    if (!revenueChart.length) {
      return 0;
    }

    return Math.max(
      ...revenueChart.map(
        (item) =>
          Number(
            item.revenue || 0
          )
      )
    );
  }, [revenueChart]);

  const getRevenueHeight = (
    revenue
  ) => {
    if (!maxRevenue) {
      return 4;
    }

    const percentage =
      (Number(revenue || 0) /
        maxRevenue) *
      100;

    return Math.max(
      percentage,
      4
    );
  };

  /* =========================================================
     DASHBOARD CARDS
  ========================================================= */

  const cards = [
    {
      title: "Total Sales",
      value: formatCurrency(
        salesData.total
      ),
      icon: DollarSign,
      description:
        "Delivered order revenue",
      dark: true,
    },
    {
      title: "Today's Sales",
      value: formatCurrency(
        salesData.today
      ),
      icon: TrendingUp,
      description:
        "Delivered sales today",
    },
    {
      title: "Total Orders",
      value:
        stats.totalOrders ?? 0,
      icon: ShoppingBag,
      description:
        "All customer orders",
    },
    {
      title: "Total Customers",
      value:
        stats.totalCustomers ?? 0,
      icon: Users,
      description:
        "Registered customers",
    },
    {
      title: "Pending Orders",
      value:
        stats.pendingOrders ?? 0,
      icon: Clock3,
      description:
        "Orders awaiting processing",
    },
    {
      title: "Delivered Orders",
      value:
        stats.deliveredOrders ?? 0,
      icon: CheckCircle2,
      description:
        "Successfully delivered",
    },
    {
      title: "Cancelled Orders",
      value:
        stats.cancelledOrders ?? 0,
      icon: XCircle,
      description:
        "Cancelled customer orders",
    },
    {
      title: "Total Products",
      value:
        stats.totalProducts ?? 0,
      icon: Wine,
      description:
        "Active wines in catalogue",
    },
  ];

  /* =========================================================
     LOADING SCREEN
  ========================================================= */

  if (
    loading &&
    !dashboard
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5eee4] px-6 text-[#351716]">
        <div className="text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#c9a45c]/50 bg-[#351716] text-[#c9a45c]">

            <RefreshCw
              size={22}
              className="animate-spin"
            />

          </div>

          <p className="mt-5 text-[9px] uppercase tracking-[0.38em] text-[#9b7741] sm:text-[10px]">
            {brandName}
          </p>

          <h1 className="mt-2 text-xl font-semibold">
            Loading dashboard
          </h1>

          <p className="mt-2 text-sm text-[#6c5850]">
            Preparing your store overview...
          </p>

        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN
  ========================================================= */

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f5eee4] text-[#351716]">

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mx-auto w-full max-w-[1600px] px-4 py-7 sm:px-6 sm:py-8 lg:px-10 lg:py-10">

        {/* ===================================================
            INTRO
        =================================================== */}

        <section className="mb-7 lg:mb-10">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div className="min-w-0">

              <p className="text-[9px] uppercase tracking-[0.3em] text-[#9b7741] sm:text-xs">
                Store Overview
              </p>

              <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Welcome back
                {admin?.name
                  ? `, ${admin.name}`
                  : ""}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6c5850] sm:text-base">
                Monitor your wine catalogue,
                orders, customers, inventory
                and revenue from one place.
              </p>

            </div>

            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={loading}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-[#c9a45c]/60 bg-white/50 px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#6d5230] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs"
            >

              <RefreshCw
                size={15}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              {loading
                ? "Refreshing"
                : "Refresh"}

            </button>

          </div>

        </section>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="mb-7 flex min-w-0 flex-col gap-4 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">

            <div className="min-w-0">

              <p className="font-medium">
                Dashboard could not be refreshed
              </p>

              <p className="mt-1 break-words text-xs text-red-600">
                {error}
              </p>

            </div>

            <button
              type="button"
              onClick={() => {
                loadDashboard();
                loadAdminOrders();
              }}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-red-300 px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] transition hover:bg-red-100"
            >

              <RefreshCw
                size={14}
              />

              Retry

            </button>

          </div>
        )}

        {/* ===================================================
            STAT CARDS
        =================================================== */}

        <section className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">

          {cards.map((card) => {
            const Icon =
              card.icon;

            return (
              <div
                key={card.title}
                className={[
                  "group relative min-w-0 overflow-hidden rounded-[20px] border p-3.5 shadow-[0_12px_35px_rgba(53,23,22,0.06)] transition duration-300 hover:-translate-y-1 sm:rounded-[26px] sm:p-6",
                  card.dark
                    ? "border-[#5a3935] bg-[#351716] text-[#f8efe2]"
                    : "border-[#ded0bd] bg-white/65 backdrop-blur-xl",
                ].join(" ")}
              >

                <div className="absolute left-0 top-0 h-[2px] w-0 bg-[#c9a45c] transition-all duration-500 group-hover:w-full" />

                <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-4">

                  <div className="min-w-0 flex-1">

                    <p
                      className={[
                        "truncate text-[8px] uppercase tracking-[0.13em] sm:text-[10px] sm:tracking-[0.16em]",
                        card.dark
                          ? "text-[#d9cbb9]"
                          : "text-[#806b60]",
                      ].join(" ")}
                    >
                      {card.title}
                    </p>

                    <p
                      className={[
                        "mt-3 truncate text-xl font-semibold tracking-tight sm:mt-4 sm:text-3xl lg:text-4xl",
                        card.dark
                          ? "text-[#f8efe2]"
                          : "text-[#351716]",
                      ].join(" ")}
                    >
                      {loading
                        ? "—"
                        : card.value}
                    </p>

                    <p
                      className={[
                        "mt-2 text-[9px] leading-4 sm:text-xs sm:leading-5",
                        card.dark
                          ? "text-[#cdbfb0]"
                          : "text-[#806b60]",
                      ].join(" ")}
                    >
                      {
                        card.description
                      }
                    </p>

                  </div>

                  <div
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border sm:h-11 sm:w-11",
                      card.dark
                        ? "border-[#c9a45c]/50 bg-[#472624] text-[#c9a45c]"
                        : "border-[#c9a45c]/40 bg-[#f7efe3] text-[#9b7741]",
                    ].join(" ")}
                  >

                    <Icon
                      size={16}
                      strokeWidth={1.6}
                      className="sm:h-5 sm:w-5"
                    />

                  </div>

                </div>

              </div>
            );
          })}

        </section>

        {/* ===================================================
            REVENUE + LOW STOCK
        =================================================== */}

        <section className="mt-7 grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,0.8fr)]">

          {/* REVENUE */}

          <div className="min-w-0 overflow-hidden rounded-[28px] border border-[#ded0bd] bg-white/65 p-5 shadow-[0_15px_45px_rgba(53,23,22,0.06)] backdrop-blur-xl sm:p-7">

            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

              <div className="min-w-0">

                <div className="flex items-center gap-2">

                  <BarChart3
                    size={17}
                    className="text-[#9b7741]"
                  />

                  <p className="text-[9px] uppercase tracking-[0.25em] text-[#9b7741] sm:text-[10px]">
                    Revenue
                  </p>

                </div>

                <h3 className="mt-2 text-xl font-semibold sm:text-2xl">
                  Last 7 days
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#806b60]">
                  Revenue from paid and completed orders.
                </p>

              </div>

              <div className="w-fit rounded-full border border-[#d9cbb9] bg-[#f8f0e5] px-3 py-1.5 text-[9px] uppercase tracking-[0.13em] text-[#806b60]">
                7 Day Overview
              </div>

            </div>

            <div className="mt-7 w-full">

              {revenueChart.length ===
                0 ? (

                <div className="flex min-h-[230px] items-center justify-center rounded-2xl border border-dashed border-[#d9cbb9] bg-[#faf6ef]">

                  <div className="px-5 text-center">

                    <BarChart3
                      size={28}
                      className="mx-auto text-[#b39a79]"
                    />

                    <p className="mt-3 text-sm font-medium">
                      No revenue data available
                    </p>

                    <p className="mt-1 text-xs text-[#806b60]">
                      Revenue will appear once orders are paid and completed.
                    </p>

                  </div>

                </div>

              ) : (

                <div className="grid w-full grid-cols-7 items-end gap-1.5 sm:gap-3">

                  {revenueChart.map(
                    (
                      item,
                      index
                    ) => {

                      const revenue =
                        Number(
                          item.revenue ||
                          0
                        );

                      const height =
                        getRevenueHeight(
                          revenue
                        );

                      return (
                        <div
                          key={`${item.date}-${index}`}
                          className="min-w-0"
                        >

                          <p className="mb-2 truncate text-center text-[7px] font-medium text-[#806b60] sm:text-[10px]">
                            {formatCurrency(
                              revenue
                            )}
                          </p>

                          <div className="flex h-[170px] w-full items-end justify-center rounded-t-xl bg-[#f7efe3] px-1 pt-3 sm:h-[210px] sm:px-2">

                            <div
                              className="w-full max-w-[42px] rounded-t-xl bg-[#351716] transition-all duration-700"
                              style={{
                                height: `${height}%`,
                              }}
                            />

                          </div>

                          <p className="mt-2 truncate text-center text-[7px] font-medium uppercase tracking-[0.04em] text-[#806b60] sm:mt-3 sm:text-[10px]">
                            {
                              item.date
                            }
                          </p>

                        </div>
                      );
                    }
                  )}

                </div>

              )}

            </div>

          </div>

          {/* LOW STOCK */}

          <div className="min-w-0 overflow-hidden rounded-[28px] border border-[#5a3935] bg-[#351716] p-5 text-[#f8efe2] shadow-[0_15px_45px_rgba(53,23,22,0.12)] sm:p-7">

            <div className="flex items-start justify-between gap-4">

              <div className="min-w-0">

                <div className="flex items-center gap-2">

                  <AlertTriangle
                    size={17}
                    className="shrink-0 text-[#c9a45c]"
                  />

                  <p className="truncate text-[9px] uppercase tracking-[0.22em] text-[#c9a45c] sm:text-[10px]">
                    Inventory Alert
                  </p>

                </div>

                <h3 className="mt-2 text-xl font-semibold sm:text-2xl">
                  Low stock
                </h3>

              </div>

              <div className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full border border-[#c9a45c]/40 bg-[#472624] px-2.5 text-sm font-semibold text-[#c9a45c]">
                {
                  stats.lowStockCount ??
                  0
                }
              </div>

            </div>

            {lowStockWines.length ===
              0 ? (

              <div className="mt-7 rounded-2xl border border-[#624441] bg-[#412220] p-5">

                <CheckCircle2
                  size={24}
                  className="text-[#c9a45c]"
                />

                <p className="mt-4 text-sm font-medium">
                  Inventory looks healthy
                </p>

                <p className="mt-1 text-xs leading-5 text-[#cdbfb0]">
                  No active wine variants are currently below the low-stock threshold.
                </p>

              </div>

            ) : (

              <div className="mt-6 space-y-3">

                {lowStockWines
                  .slice(0, 5)
                  .map(
                    (wine) => (
                      <div
                        key={
                          wine.variantId
                        }
                        className="min-w-0 rounded-2xl border border-[#624441] bg-[#412220] p-4"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <p className="truncate text-sm font-medium">
                              {
                                wine.productName
                              }
                            </p>

                            <p className="mt-1 truncate text-[10px] uppercase tracking-[0.1em] text-[#cdbfb0]">

                              {
                                wine.bottleSize ||
                                "Bottle"
                              }

                              {wine.vintage
                                ? ` • ${wine.vintage}`
                                : ""}

                            </p>

                          </div>

                          <span className="shrink-0 rounded-full border border-[#c9a45c]/40 px-2 py-1 text-[9px] font-semibold text-[#c9a45c]">

                            {
                              wine.stockQuantity
                            }{" "}
                            left

                          </span>

                        </div>

                      </div>
                    )
                  )}

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/inventory"
                    )
                  }
                  className="mt-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-[#c9a45c] transition hover:gap-3"
                >

                  Manage inventory

                  <ArrowRight
                    size={14}
                  />

                </button>

              </div>

            )}

          </div>

        </section>

        {/* ===================================================
            BEST SELLING WINES
        =================================================== */}

        <section className="mt-7 min-w-0 overflow-hidden rounded-[28px] border border-[#ded0bd] bg-white/65 p-5 shadow-[0_15px_45px_rgba(53,23,22,0.06)] backdrop-blur-xl sm:p-7">

          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div className="min-w-0">

              <div className="flex items-center gap-2">

                <TrendingUp
                  size={17}
                  className="text-[#9b7741]"
                />

                <p className="text-[9px] uppercase tracking-[0.25em] text-[#9b7741] sm:text-[10px]">
                  Performance
                </p>

              </div>

              <h3 className="mt-2 text-xl font-semibold sm:text-2xl">
                Best selling wines
              </h3>

              <p className="mt-1 text-xs leading-5 text-[#806b60]">
                Wines ranked by quantity ordered.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/products"
                )
              }
              className="inline-flex w-fit shrink-0 items-center gap-2 text-xs uppercase tracking-[0.15em] text-[#9b7741] transition hover:gap-3"
            >

              View products

              <ArrowRight
                size={14}
              />

            </button>

          </div>

          {bestSellingWines.length ===
            0 ? (

            <div className="mt-7 rounded-2xl border border-dashed border-[#d9cbb9] bg-[#faf6ef] p-8 text-center">

              <Wine
                size={28}
                className="mx-auto text-[#b39a79]"
              />

              <p className="mt-3 text-sm font-medium">
                No product sales yet
              </p>

              <p className="mt-1 text-xs text-[#806b60]">
                Best-selling wines will appear here once customers place orders.
              </p>

            </div>

          ) : (

            <>

              {/* DESKTOP */}

              <div className="mt-7 hidden overflow-hidden rounded-2xl border border-[#ded0bd] md:block">

                <div className="grid grid-cols-[70px_minmax(0,1fr)_150px_150px] border-b border-[#ded0bd] bg-[#f8f0e5] px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-[#806b60]">

                  <span>
                    Rank
                  </span>

                  <span>
                    Wine
                  </span>

                  <span>
                    Units Ordered
                  </span>

                  <span className="text-right">
                    Revenue
                  </span>

                </div>

                {bestSellingWines.map(
                  (
                    wine,
                    index
                  ) => (

                    <div
                      key={`${wine.productId}-${wine.bottleSize}-${wine.vintage}`}
                      className="grid grid-cols-[70px_minmax(0,1fr)_150px_150px] items-center border-b border-[#eee5d9] px-5 py-4 last:border-b-0"
                    >

                      <div>

                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c9a45c]/40 bg-[#f8f0e5] text-xs font-semibold text-[#9b7741]">
                          {index + 1}
                        </span>

                      </div>

                      <div className="min-w-0 pr-5">

                        <p className="truncate text-sm font-medium">
                          {
                            wine.productName
                          }
                        </p>

                        <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-[#806b60]">

                          {
                            wine.bottleSize ||
                            "Bottle"
                          }

                          {wine.vintage
                            ? ` • Vintage ${wine.vintage}`
                            : ""}

                        </p>

                      </div>

                      <p className="text-sm font-medium">
                        {
                          wine.totalQuantitySold
                        }
                      </p>

                      <p className="text-right text-sm font-semibold">
                        {formatCurrency(
                          wine.totalRevenue
                        )}
                      </p>

                    </div>

                  )
                )}

              </div>

              {/* MOBILE */}

              <div className="mt-7 space-y-3 md:hidden">

                {bestSellingWines.map(
                  (
                    wine,
                    index
                  ) => (

                    <div
                      key={`${wine.productId}-${wine.bottleSize}-${wine.vintage}`}
                      className="min-w-0 rounded-2xl border border-[#ded0bd] bg-[#faf6ef] p-4"
                    >

                      <div className="flex items-start gap-3">

                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#c9a45c]/40 bg-[#f8f0e5] text-xs font-semibold text-[#9b7741]">
                          {index + 1}
                        </span>

                        <div className="min-w-0 flex-1">

                          <p className="break-words text-sm font-medium">
                            {
                              wine.productName
                            }
                          </p>

                          <p className="mt-1 truncate text-[10px] uppercase tracking-[0.1em] text-[#806b60]">

                            {
                              wine.bottleSize ||
                              "Bottle"
                            }

                            {wine.vintage
                              ? ` • ${wine.vintage}`
                              : ""}

                          </p>

                        </div>

                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#e6dccf] pt-3">

                        <div>

                          <p className="text-[9px] uppercase tracking-[0.13em] text-[#806b60]">
                            Units
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {
                              wine.totalQuantitySold
                            }
                          </p>

                        </div>

                        <div className="text-right">

                          <p className="text-[9px] uppercase tracking-[0.13em] text-[#806b60]">
                            Revenue
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {formatCurrency(
                              wine.totalRevenue
                            )}
                          </p>

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            </>

          )}

        </section>

        {/* ===================================================
            RECENT ACTIVITY
        =================================================== */}

        <section className="mt-7 grid min-w-0 gap-7 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">

          {/* RECENT ORDERS */}
          <div className="min-w-0 overflow-hidden rounded-[28px] border border-[#ded0bd] bg-white/70 shadow-[0_15px_45px_rgba(53,23,22,0.06)] backdrop-blur-xl">

            <div className="flex flex-col gap-3 border-b border-[#e7dccd] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
              <div>
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#9b7741] sm:text-[10px]">
                  Store activity
                </p>
                <h3 className="mt-2 text-xl font-semibold sm:text-2xl">
                  Recent orders
                </h3>
                <p className="mt-1 text-xs text-[#806b60]">
                  The latest customer orders requiring attention.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/orders")}
                className="inline-flex w-fit items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-[#9b7741] transition hover:gap-3"
              >
                View all orders
                <ArrowRight size={14} />
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <ShoppingBag size={28} className="mx-auto text-[#b39a79]" />
                <p className="mt-3 text-sm font-medium">No orders yet</p>
                <p className="mt-1 text-xs text-[#806b60]">
                  New customer orders will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#eee2d4]">
                {recentOrders.map((order) => {
                  const customerName =
                    order?.customer?.name || "Guest customer";
                  const status =
                    order?.orderStatus ?? order?.order_status ?? "Pending";

                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => navigate("/orders")}
                      className="group grid w-full grid-cols-[minmax(0,1fr)_auto] gap-4 px-5 py-4 text-left transition hover:bg-[#fbf6ee] sm:grid-cols-[minmax(0,1.5fr)_110px_130px_120px] sm:items-center sm:px-7"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#351716]">
                          {order?.orderNumber || `Order #${order?.id}`}
                        </p>
                        <p className="mt-1 truncate text-xs text-[#806b60]">
                          {customerName}
                        </p>
                      </div>

                      <div className="hidden sm:block">
                        <p className="text-[9px] uppercase tracking-[0.12em] text-[#a18d7c]">
                          Amount
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {formatCurrency(order?.totalAmount ?? order?.total_amount)}
                        </p>
                      </div>

                      <div className="hidden sm:block">
                        <p className="text-[9px] uppercase tracking-[0.12em] text-[#a18d7c]">
                          Payment
                        </p>
                        <p className="mt-1 text-xs font-medium capitalize text-[#5f4a42]">
                          {String(order?.paymentStatus ?? order?.payment_status ?? "Pending").toLowerCase()}
                        </p>
                      </div>

                      <div className="flex items-center justify-end">
                        <span className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${getOrderStatusClass(status)}`}>
                          {String(status).replace(/_/g, " ")}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RECENT CUSTOMERS */}
          <div className="min-w-0 overflow-hidden rounded-[28px] border border-[#ded0bd] bg-white/70 shadow-[0_15px_45px_rgba(53,23,22,0.06)] backdrop-blur-xl">

            <div className="flex items-end justify-between gap-3 border-b border-[#e7dccd] px-5 py-5 sm:px-7">
              <div>
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#9b7741] sm:text-[10px]">
                  Customer activity
                </p>
                <h3 className="mt-2 text-xl font-semibold sm:text-2xl">
                  Recent customers
                </h3>
                <p className="mt-1 text-xs text-[#806b60]">
                  Customers from the latest orders.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/customers")}
                className="hidden shrink-0 items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-[#9b7741] transition hover:gap-3 sm:inline-flex"
              >
                View all
                <ArrowRight size={14} />
              </button>
            </div>

            {recentCustomers.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Users size={28} className="mx-auto text-[#b39a79]" />
                <p className="mt-3 text-sm font-medium">No customer activity</p>
                <p className="mt-1 text-xs text-[#806b60]">
                  Recent shoppers will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#eee2d4]">
                {recentCustomers.map((order) => {
                  const customer = order?.customer || {};
                  const name = customer?.name || "Customer";
                  const email = customer?.email || "No email available";
                  const initials = name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join("") || "C";

                  return (
                    <button
                      key={customer?.id ?? customer?.email ?? order.id}
                      type="button"
                      onClick={() => navigate("/customers")}
                      className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-[#fbf6ee] sm:px-7"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#c9a45c]/30 bg-[#f8f0e5] text-xs font-semibold text-[#80622f]">
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#351716]">
                          {name}
                        </p>
                        <p className="mt-1 truncate text-xs text-[#806b60]">
                          {email}
                        </p>
                      </div>

                      <ArrowRight
                        size={15}
                        className="shrink-0 text-[#b39a79] transition group-hover:translate-x-0.5"
                      />
                    </button>
                  );
                })}
              </div>
            )}

            <div className="border-t border-[#eee2d4] px-5 py-4 sm:hidden">
              <button
                type="button"
                onClick={() => navigate("/customers")}
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-[#9b7741]"
              >
                View all customers
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

        </section>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="mt-8 border-t border-[#ded0bd] pt-6">

          <div className="flex flex-col gap-2 text-xs text-[#806b60] sm:flex-row sm:items-center sm:justify-between">

            <p>
              {brandName} Admin Panel
            </p>

            <p>
              Store management &amp;
              analytics
            </p>

          </div>

        </div>

      </main>

    </div>
  );
};

export default Dashboard;
