import {
  Bell,
  Check,
  CheckCheck,
  Menu,
  RefreshCw,
  Wine,
  X,
  Trash2,
  Package,
  ShoppingBag,
  CreditCard,
  Users,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAdminAuth } from "../context/AdminAuthContext";

import {
  getAdminNotifications,
  getAdminUnreadNotificationCount,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  deleteAdminNotification,
  deleteAllAdminNotifications,
} from "../services/api";

import AdminSidebar from "./AdminSidebar";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

const AdminLayout = ({ children }) => {
  const { admin, token, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [brandName, setBrandName] = useState("VineWinbe");

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);

  const [notificationPopup, setNotificationPopup] = useState(null);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const [deletingNotificationId, setDeletingNotificationId] =
    useState(null);

  const [clearingAllNotifications, setClearingAllNotifications] =
    useState(false);

  const notificationRef = useRef(null);
  const popupTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadBrandName = async () => {
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/admin/settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        const settings = data?.settings || data;

        if (!cancelled && settings?.brand_name) {
          setBrandName(settings.brand_name);
        }
      } catch (error) {
        console.warn(
          "Admin brand settings could not be loaded:",
          error
        );
      }
    };

    loadBrandName();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    const loadUnreadCount = async () => {
      if (!token) return;

      try {
        const response =
          await getAdminUnreadNotificationCount(token);

        const count =
          response?.unreadCount ??
          response?.count ??
          response?.data?.unreadCount ??
          0;

        if (!cancelled) {
          setUnreadNotifications(Number(count) || 0);
        }
      } catch (error) {
        console.warn(
          "Admin notification count could not be loaded:",
          error
        );
      }
    };

    loadUnreadCount();

    return () => {
      cancelled = true;
    };
  }, [token, location.pathname]);

  const loadNotifications = async () => {
    if (!token) return [];

    try {
      setNotificationLoading(true);

      const response = await getAdminNotifications(token);

      const list =
        response?.notifications ||
        response?.data?.notifications ||
        response?.data ||
        [];

      const normalized = Array.isArray(list) ? list : [];

      setNotifications(normalized);

      return normalized;
    } catch (error) {
      console.warn(
        "Admin notifications could not be loaded:",
        error
      );

      return [];
    } finally {
      setNotificationLoading(false);
    }
  };

  const showNewNotificationPopup = (notification) => {
    if (!notification) return;

    if (popupTimerRef.current) {
      clearTimeout(popupTimerRef.current);
    }

    setNotificationPopup(notification);

    popupTimerRef.current = setTimeout(() => {
      setNotificationPopup(null);
    }, 4500);
  };

  useEffect(() => {
    return () => {
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotificationDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    const SOCKET_BASE_URL =
      API_BASE_URL.replace(/\/api\/?$/, "") ||
      "http://localhost:5000";

    const socket = io(SOCKET_BASE_URL, {
      transports: ["polling", "websocket"],
      reconnection: true,
    });

    socket.on(
      "admin:notification-created",
      async (data) => {
        const notificationList = await loadNotifications();

        const newNotification =
          notificationList.find(
            (notification) =>
              Number(notification?.id) ===
              Number(data?.notificationId)
          ) || notificationList[0];

        if (newNotification) {
          showNewNotificationPopup(newNotification);
        }

        try {
          const response =
            await getAdminUnreadNotificationCount(token);

          const count =
            response?.unreadCount ??
            response?.count ??
            response?.data?.unreadCount ??
            0;

          setUnreadNotifications(Number(count) || 0);
        } catch (error) {
          setUnreadNotifications(
            (current) => current + 1
          );
        }
      }
    );

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setSidebarOpen(false);
    logout();
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (
      markingAllRead ||
      unreadNotifications === 0 ||
      !token
    ) {
      return;
    }

    try {
      setMarkingAllRead(true);

      await markAllAdminNotificationsAsRead(token);

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          is_read: true,
        }))
      );

      setUnreadNotifications(0);
    } catch (error) {
      console.warn(
        "Failed to mark all notifications as read:",
        error
      );
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleMarkNotificationAsRead = async (
    notification
  ) => {
    const isRead =
      notification?.isRead ??
      notification?.is_read ??
      false;

    if (isRead || !token) return;

    try {
      await markAdminNotificationAsRead(
        token,
        notification.id
      );

      setNotifications((current) =>
        current.map((item) =>
          Number(item.id) === Number(notification.id)
            ? {
                ...item,
                isRead: true,
                is_read: true,
              }
            : item
        )
      );

      setUnreadNotifications((current) =>
        Math.max(0, current - 1)
      );
    } catch (error) {
      console.warn(
        "Failed to mark notification as read:",
        error
      );
    }
  };

  const handleDeleteNotification = async (
    notificationId
  ) => {
    if (!notificationId || deletingNotificationId) {
      return;
    }

    try {
      setDeletingNotificationId(notificationId);

      await deleteAdminNotification(
        token,
        notificationId
      );

      setNotifications((current) =>
        current.filter(
          (item) =>
            Number(item.id) !== Number(notificationId)
        )
      );

      const remainingUnread = notifications.filter(
        (item) =>
          Number(item.id) !== Number(notificationId) &&
          !(item.isRead ?? item.is_read ?? false)
      ).length;

      setUnreadNotifications(remainingUnread);
    } catch (error) {
      console.warn(
        "Failed to delete notification:",
        error
      );
    } finally {
      setDeletingNotificationId(null);
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (
      clearingAllNotifications ||
      !notifications.length ||
      !token
    ) {
      return;
    }

    try {
      setClearingAllNotifications(true);

      await deleteAllAdminNotifications(token);

      setNotifications([]);
      setUnreadNotifications(0);
    } catch (error) {
      console.warn(
        "Failed to clear notifications:",
        error
      );
    } finally {
      setClearingAllNotifications(false);
    }
  };

  const getNotificationIcon = (type) => {
    const value = String(type || "").toLowerCase();

    if (
      value.includes("order") ||
      value.includes("purchase")
    ) {
      return <ShoppingBag size={16} />;
    }

    if (
      value.includes("stock") ||
      value.includes("inventory")
    ) {
      return <Package size={16} />;
    }

    if (
      value.includes("payment") ||
      value.includes("refund")
    ) {
      return <CreditCard size={16} />;
    }

    if (
      value.includes("customer") ||
      value.includes("member")
    ) {
      return <Users size={16} />;
    }

    if (
      value.includes("low") ||
      value.includes("out")
    ) {
      return <AlertTriangle size={16} />;
    }

    return <Bell size={16} />;
  };

  const formatNotificationTime = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const now = Date.now();
    const difference = Math.max(
      0,
      now - date.getTime()
    );

    const minutes = Math.floor(
      difference / 60000
    );

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year:
        date.getFullYear() !==
        new Date().getFullYear()
          ? "numeric"
          : undefined,
    });
  };

  const getPageTitle = () => {
    const titles = {
      "/dashboard": "Admin Dashboard",
      "/products": "Products",
      "/collections": "Collections",
      "/inventory": "Inventory",
      "/orders": "Orders",
      "/shipments": "Shipments",
      "/delivery": "Delivery Management",
      "/customers": "Customers",
      "/notifications": "Notifications",
      "/contact-messages": "Contact Messages",
      "/newsletter": "Newsletter",
      "/reviews": "Reviews",
      "/coupons": "Coupons",
      "/our-story": "Our Story",
      "/settings": "Settings",
      "/admin-management": "Admin Management",
    };

    return titles[location.pathname] || "Admin Panel";
  };

  return (
    <div className="min-h-screen bg-[#f5eee4] text-[#351716]">
      <AdminSidebar
        brandName={brandName}
        admin={admin}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* GLOBAL ADMIN HEADER */}
      <header className="fixed inset-x-0 top-0 z-[50] h-16 border-b border-[#c9a45c]/20 bg-[#2b1413]/95 text-[#f8efe2] shadow-[0_8px_30px_rgba(43,20,19,0.12)] backdrop-blur-xl lg:left-[272px]">
        <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c9a45c]/30 bg-[#c9a45c]/10 text-[#c9a45c] transition hover:bg-[#c9a45c]/20 lg:hidden"
              aria-label="Open admin navigation"
            >
              <Menu
                size={20}
                strokeWidth={1.8}
              />
            </button>

            <div className="flex min-w-0 items-center gap-2 lg:hidden">
              <Wine
                size={17}
                className="shrink-0 text-[#c9a45c]"
                strokeWidth={1.6}
              />

              <span className="truncate text-sm font-semibold tracking-wide">
                {brandName}
              </span>
            </div>

            <div className="hidden min-w-0 lg:block">
              <p className="text-[8px] uppercase tracking-[0.3em] text-[#c9a45c]">
                {brandName}
              </p>

              <h1 className="truncate text-lg font-semibold tracking-wide">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {/* NOTIFICATION CENTER */}
            <div
              ref={notificationRef}
              className="relative"
            >
              {/* BELL */}
              <button
                type="button"
                onClick={() => {
                  const nextState =
                    !showNotificationDropdown;

                  setShowNotificationDropdown(
                    nextState
                  );

                  if (nextState) {
                    loadNotifications();
                  }
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#c9a45c]/40 text-[#c9a45c] transition hover:bg-[#c9a45c] hover:text-[#351716]"
                aria-label="Notifications"
                aria-expanded={
                  showNotificationDropdown
                }
              >
                <Bell
                  size={18}
                  strokeWidth={1.7}
                />

                {unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c9a45c] px-1 text-[9px] font-bold text-[#351716]">
                    {unreadNotifications > 99
                      ? "99+"
                      : unreadNotifications}
                  </span>
                )}
              </button>

              {/* NEW NOTIFICATION TOAST */}
              {notificationPopup && (
                <div className="fixed right-4 top-20 z-[120] w-[calc(100vw-32px)] max-w-[380px] overflow-hidden rounded-2xl border border-[#c9a45c]/40 bg-[#351716] text-[#f8efe2] shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:right-6">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c9a45c]/15 text-[#c9a45c]">
                        {getNotificationIcon(
                          notificationPopup.type
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#c9a45c]">
                            New Notification
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              setNotificationPopup(
                                null
                              )
                            }
                            className="shrink-0 text-[#d9cbb9] transition hover:text-white"
                            aria-label="Close notification"
                          >
                            <X size={15} />
                          </button>
                        </div>

                        <p className="mt-1 text-sm font-semibold">
                          {notificationPopup.title ||
                            "Notification"}
                        </p>

                        <p className="mt-1 line-clamp-3 text-xs leading-5 text-[#d9cbb9]">
                          {notificationPopup.message ||
                            ""}
                        </p>

                        <p className="mt-2 text-[9px] uppercase tracking-[0.12em] text-[#a99682]">
                          {formatNotificationTime(
                            notificationPopup.createdAt ??
                              notificationPopup.created_at
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-[2px] bg-[#c9a45c]/30" />
                </div>
              )}

              {/* NOTIFICATION DROPDOWN */}
              {showNotificationDropdown && (
                <div className="absolute right-0 top-12 z-[100] mt-1 w-[390px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[22px] border border-[#ded0bd] bg-[#fffaf3] text-[#351716] shadow-[0_24px_70px_rgba(53,23,22,0.25)]">
                  {/* HEADER */}
                  <div className="border-b border-[#e5dacb] px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-[#9b7741]">
                          Admin Center
                        </p>

                        <h3 className="mt-1 text-base font-semibold">
                          Notifications
                        </h3>

                        {unreadNotifications > 0 && (
                          <p className="mt-1 text-[10px] text-[#806b60]">
                            {unreadNotifications} unread
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setShowNotificationDropdown(
                            false
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[#806b60] transition hover:bg-[#f2e8dc] hover:text-[#351716]"
                        aria-label="Close notifications"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={
                          handleMarkAllNotificationsAsRead
                        }
                        disabled={
                          markingAllRead ||
                          unreadNotifications === 0
                        }
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#d9cbb9] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#806b60] transition hover:border-[#c9a45c] hover:text-[#351716] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {markingAllRead ? (
                          <RefreshCw
                            size={11}
                            className="animate-spin"
                          />
                        ) : (
                          <CheckCheck size={11} />
                        )}

                        Mark all read
                      </button>

                      <button
                        type="button"
                        onClick={
                          handleDeleteAllNotifications
                        }
                        disabled={
                          clearingAllNotifications ||
                          notifications.length === 0
                        }
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#d9cbb9] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#806b60] transition hover:border-red-200 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {clearingAllNotifications ? (
                          <RefreshCw
                            size={11}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={11} />
                        )}

                        Clear all
                      </button>
                    </div>
                  </div>

                  {/* LIST */}
                  <div
                    className="max-h-[390px] overflow-y-auto"
                    style={{
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  >
                    {notificationLoading ? (
                      <div className="px-5 py-12 text-center text-sm text-[#806b60]">
                        <RefreshCw
                          size={22}
                          className="mx-auto animate-spin"
                        />

                        <p className="mt-3 text-xs">
                          Loading notifications...
                        </p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-5 py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f2e8dc] text-[#9b7741]">
                          <Bell size={20} />
                        </div>

                        <p className="mt-3 text-sm font-medium">
                          All caught up
                        </p>

                        <p className="mt-1 text-xs text-[#806b60]">
                          You have no notifications right now.
                        </p>
                      </div>
                    ) : (
                      notifications
                        .slice(0, 8)
                        .map((notification) => {
                          const isRead =
                            notification.isRead ??
                            notification.is_read ??
                            false;

                          const createdAt =
                            notification.createdAt ??
                            notification.created_at;

                          const notificationType =
                            notification.type ??
                            notification.notificationType;

                          const isDeleting =
                            Number(
                              deletingNotificationId
                            ) ===
                            Number(notification.id);

                          return (
                            <div
                              key={notification.id}
                              className={`group relative flex items-start gap-3 border-b border-[#eee4d8] px-5 py-4 transition ${
                                !isRead
                                  ? "bg-[#fbf3e6]"
                                  : "bg-[#fffaf3]"
                              } hover:bg-[#f7efe4]`}
                            >
                              {/* ICON */}
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                  isRead
                                    ? "bg-[#f0e7dc] text-[#9b8a78]"
                                    : "bg-[#351716] text-[#c9a45c]"
                                }`}
                              >
                                {getNotificationIcon(
                                  notificationType
                                )}
                              </div>

                              {/* CONTENT */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleMarkNotificationAsRead(
                                    notification
                                  )
                                }
                                className="min-w-0 flex-1 text-left"
                              >
                                <div className="flex items-start gap-2">
                                  {!isRead && (
                                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c9a45c]" />
                                  )}

                                  <span
                                    className={`block text-sm ${
                                      isRead
                                        ? "font-medium text-[#5e4944]"
                                        : "font-semibold text-[#351716]"
                                    }`}
                                  >
                                    {notification.title ||
                                      "Notification"}
                                  </span>
                                </div>

                                <span className="mt-1 block line-clamp-2 text-xs leading-5 text-[#806b60]">
                                  {notification.message ||
                                    ""}
                                </span>

                                <span className="mt-2 block text-[9px] uppercase tracking-[0.1em] text-[#a99682]">
                                  {formatNotificationTime(
                                    createdAt
                                  )}
                                </span>
                              </button>

                              {/* ACTIONS */}
                              <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                                {!isRead && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleMarkNotificationAsRead(
                                        notification
                                      )
                                    }
                                    className="flex h-7 w-7 items-center justify-center rounded-full text-[#806b60] transition hover:bg-[#e9dccd] hover:text-[#351716]"
                                    title="Mark as read"
                                    aria-label="Mark as read"
                                  >
                                    <Check
                                      size={13}
                                    />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteNotification(
                                      notification.id
                                    )
                                  }
                                  disabled={isDeleting}
                                  className="flex h-7 w-7 items-center justify-center rounded-full text-[#806b60] transition hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                                  title="Clear notification"
                                  aria-label="Clear notification"
                                >
                                  {isDeleting ? (
                                    <RefreshCw
                                      size={12}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Trash2
                                      size={13}
                                    />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* FOOTER */}
                  <div className="border-t border-[#e5dacb] bg-[#fffaf3] p-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotificationDropdown(
                          false
                        );
                        navigate("/notifications");
                      }}
                      className="flex w-full items-center justify-center rounded-xl bg-[#351716] px-3 py-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#c9a45c] transition hover:bg-[#472624]"
                    >
                      View all notifications
                      <span className="ml-2 text-base leading-none">
                        →
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ADMIN INFO */}
            <div className="hidden text-right sm:block">
              <p className="max-w-[220px] truncate text-xs font-medium text-[#f8efe2]">
                {admin?.name ||
                  `${brandName} Admin`}
              </p>

              <p className="max-w-[220px] truncate text-[10px] text-[#d9cbb9]">
                {admin?.email ||
                  "Store administrator"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <div className="min-h-screen pt-16 lg:pl-[272px]">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;