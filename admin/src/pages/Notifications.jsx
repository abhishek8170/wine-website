import {
  useEffect,
  useState,
} from "react";

import {
  Bell,
  Check,
  CheckCheck,
  RefreshCw,
  ArrowRight,
  ShoppingBag,
  Package,
  CreditCard,
  AlertTriangle,
  Tag,
  Users,
  XCircle,
  MessageSquare,
  Star,
  Mail,
} from "lucide-react";

import {
  getAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  deleteAdminNotification,
  deleteAllAdminNotifications,
} from "../services/api";

import { useAdminAuth } from "../context/AdminAuthContext";


const Notifications = () => {
  const {
    token,
  } = useAdminAuth();

  const [
    notifications,
    setNotifications,
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
    markingAll,
    setMarkingAll,
  ] = useState(false);

  const [
    deletingNotificationId,
    setDeletingNotificationId,
  ] = useState(null);

  const [
    clearingAll,
    setClearingAll,
  ] = useState(false);

  /*
  ============================================================
  LOAD NOTIFICATIONS
  ============================================================
  */

  const loadNotifications = async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getAdminNotifications(token);

      const data =
        response?.notifications ||
        response?.data?.notifications ||
        response?.data ||
        [];

      if (Array.isArray(data)) {
        const normalizedNotifications = data.map(
          (notification) => ({
            ...notification,

            // Normalize backend camelCase response
            // and keep snake_case compatibility.
            isRead:
              notification.isRead ??
              notification.is_read ??
              false,

            is_read:
              notification.isRead ??
              notification.is_read ??
              false,

            createdAt:
              notification.createdAt ??
              notification.created_at ??
              null,

            created_at:
              notification.createdAt ??
              notification.created_at ??
              null,

            entityType:
              notification.entityType ??
              notification.entity_type ??
              null,

            entity_type:
              notification.entityType ??
              notification.entity_type ??
              null,

            entityId:
              notification.entityId ??
              notification.entity_id ??
              null,

            entity_id:
              notification.entityId ??
              notification.entity_id ??
              null,
          })
        );

        setNotifications(
          normalizedNotifications
        );
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error(
        "Admin notifications loading error:",
        err
      );

      setError(
        err.message ||
        "Unable to load notifications"
      );
    } finally {
      setLoading(false);
    }
  };


  /*
  ============================================================
  INITIAL LOAD
  ============================================================
  */

  useEffect(() => {
    loadNotifications();
  }, [token]);


  /*
  ============================================================
  MARK SINGLE NOTIFICATION AS READ
  ============================================================
  */

  const handleMarkAsRead = async (
    notificationId
  ) => {
    if (
      !token ||
      !notificationId
    ) {
      return;
    }

    try {
      setError("");

      await markAdminNotificationAsRead(
        token,
        notificationId
      );

      setNotifications(
        (current) =>
          current.map(
            (notification) =>
              Number(notification.id) ===
                Number(notificationId)
                ? {
                  ...notification,
                  isRead: true,
                  is_read: true,
                }
                : notification
          )
      );

    } catch (err) {
      console.error(
        "Mark notification as read error:",
        err
      );

      setError(
        err?.message ||
        "Unable to mark notification as read"
      );
    }
  };


  /*
  ============================================================
  MARK ALL AS READ
  ============================================================
  */

  const handleMarkAllAsRead = async () => {
    if (
      !token ||
      markingAll
    ) {
      return;
    }

    try {
      setMarkingAll(true);
      setError("");

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

    } catch (err) {
      console.error(
        "Mark all notifications as read error:",
        err
      );

      setError(
        err?.message ||
        "Unable to mark all notifications as read"
      );
    } finally {
      setMarkingAll(false);
    }
  };

  /*
============================================================
DELETE ONE NOTIFICATION
============================================================
*/

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

    } catch (err) {
      console.error(
        "Delete notification error:",
        err
      );

      setError(
        err?.message ||
        "Unable to delete notification"
      );
    } finally {
      setDeletingNotificationId(null);
    }
  };


  /*
  ============================================================
  DELETE ALL NOTIFICATIONS
  ============================================================
  */

  const handleDeleteAllNotifications =
    async () => {
      if (
        !token ||
        clearingAll ||
        notifications.length === 0
      ) {
        return;
      }

      try {
        setClearingAll(true);

        await deleteAllAdminNotifications(
          token
        );

        setNotifications([]);

      } catch (err) {
        console.error(
          "Clear all notifications error:",
          err
        );

        setError(
          err?.message ||
          "Unable to clear notifications"
        );
      } finally {
        setClearingAll(false);
      }
    };

  /*
  ============================================================
  HELPERS
  ============================================================
  */

  const getNotificationIcon = (
    type
  ) => {
    const value =
      String(type || "")
        .toLowerCase();

    if (
      value.includes("contact") ||
      value.includes("message")
    ) {
      return MessageSquare;
    }

    if (
      value.includes("review")
    ) {
      return Star;
    }

    if (
      value.includes("newsletter")
    ) {
      return Mail;
    }

    if (
      value.includes("order")
    ) {
      return ShoppingBag;
    }

    if (
      value.includes("stock") ||
      value.includes("inventory")
    ) {
      return Package;
    }

    if (
      value.includes("payment")
    ) {
      return CreditCard;
    }

    if (
      value.includes("customer")
    ) {
      return Users;
    }

    if (
      value.includes("coupon") ||
      value.includes("promotion")
    ) {
      return Tag;
    }

    if (
      value.includes("alert") ||
      value.includes("warning")
    ) {
      return AlertTriangle;
    }

    return Bell;
  };


  const unreadCount =
    notifications.filter(
      (notification) =>
        !(
          notification.isRead ??
          notification.is_read
        )
    ).length;


  /*
  ============================================================
  FORMAT DATE
  ============================================================
  */

  const formatDate = (
    value
  ) => {
    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };


  /*
  ============================================================
  LOADING
  ============================================================
  */

  if (
    loading &&
    notifications.length === 0
  ) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#f5eee4] text-[#351716]">

        <div className="text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#c9a45c]/50 bg-[#351716] text-[#c9a45c]">

            <RefreshCw
              size={22}
              className="animate-spin"
            />

          </div>

          <p className="mt-5 text-[10px] uppercase tracking-[0.3em] text-[#9b7741]">
            Notifications
          </p>

          <h1 className="mt-2 text-xl font-semibold">
            Loading notifications
          </h1>

        </div>

      </div>
    );
  }


  /*
  ============================================================
  MAIN
  ============================================================
  */

  return (
    <div className="min-h-screen bg-[#f5eee4] px-4 py-7 text-[#351716] sm:px-6 lg:px-10 lg:py-10">

      <div className="mx-auto max-w-[1100px]">

        {/* HEADER */}

        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <Bell
                size={18}
                className="text-[#9b7741]"
              />

              <p className="text-[10px] uppercase tracking-[0.25em] text-[#9b7741]">
                Admin Center
              </p>

            </div>

            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              Notifications
            </h1>

            <p className="mt-2 text-sm text-[#806b60]">
              Stay updated with orders,
              inventory, payments and
              store activity.
            </p>

          </div>


          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={loadNotifications}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-[#d9cbb9] bg-white/70 px-4 py-2.5 text-xs uppercase tracking-[0.12em] text-[#6d5230] transition hover:bg-white disabled:opacity-50"
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


            {unreadCount > 0 && (
              <button
                type="button"
                onClick={
                  handleMarkAllAsRead
                }
                disabled={markingAll}
                className="inline-flex items-center gap-2 rounded-full bg-[#351716] px-4 py-2.5 text-xs uppercase tracking-[0.12em] text-[#f8efe2] transition hover:bg-[#472624] disabled:opacity-50"
              >

                <CheckCheck
                  size={14}
                />

                Mark all read

              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={
                  handleDeleteAllNotifications
                }
                disabled={clearingAll}
                className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/70 px-4 py-2.5 text-xs uppercase tracking-[0.12em] text-red-700 transition hover:bg-red-50 disabled:opacity-50"
              >

                {clearingAll ? (
                  <RefreshCw
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <XCircle size={14} />
                )}

                Clear all

              </button>
            )}

          </div>

        </div>


        {/* SUMMARY */}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">

          <div className="rounded-[22px] border border-[#ded0bd] bg-white/65 p-5">

            <p className="text-[9px] uppercase tracking-[0.15em] text-[#806b60]">
              Total
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {notifications.length}
            </p>

          </div>


          <div className="rounded-[22px] border border-[#c9a45c]/40 bg-[#351716] p-5 text-[#f8efe2]">

            <p className="text-[9px] uppercase tracking-[0.15em] text-[#c9a45c]">
              Unread
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {unreadCount}
            </p>

          </div>


          <div className="hidden rounded-[22px] border border-[#ded0bd] bg-white/65 p-5 sm:block">

            <p className="text-[9px] uppercase tracking-[0.15em] text-[#806b60]">
              Status
            </p>

            <p className="mt-2 text-sm font-semibold">
              {unreadCount > 0
                ? "Action required"
                : "All caught up"}
            </p>

          </div>

        </div>


        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}


        {/* EMPTY */}

        {!loading &&
          notifications.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-[#d9cbb9] bg-white/50 px-6 py-16 text-center">

              <Bell
                size={34}
                className="mx-auto text-[#b39a79]"
              />

              <h2 className="mt-4 text-lg font-semibold">
                No notifications
              </h2>

              <p className="mt-2 text-sm text-[#806b60]">
                New admin notifications will
                appear here.
              </p>

            </div>
          )}


        {/* NOTIFICATIONS */}

        {notifications.length > 0 && (
          <div className="space-y-3">

            {notifications.map(
              (notification) => {

                const Icon =
                  getNotificationIcon(
                    notification.type
                  );

                const isUnread =
                  !(
                    notification.isRead ??
                    notification.is_read
                  );

                return (
                  <div
                    key={
                      notification.id
                    }
                    className={[
                      "relative overflow-hidden rounded-[24px] border p-5 transition",
                      isUnread
                        ? "border-[#c9a45c]/50 bg-white shadow-[0_12px_35px_rgba(53,23,22,0.07)]"
                        : "border-[#ded0bd] bg-white/50",
                    ].join(" ")}
                  >

                    {isUnread && (
                      <div className="absolute left-0 top-0 h-full w-1 bg-[#c9a45c]" />
                    )}

                    <div className="flex gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#c9a45c]/40 bg-[#f8f0e5] text-[#9b7741]">

                        <Icon
                          size={19}
                          strokeWidth={1.7}
                        />

                      </div>


                      <div className="min-w-0 flex-1">

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                          <div className="min-w-0">

                            <div className="flex flex-wrap items-center gap-2">

                              <h3 className="text-sm font-semibold sm:text-base">
                                {
                                  notification.title
                                }
                              </h3>

                              {isUnread && (
                                <span className="rounded-full bg-[#351716] px-2 py-0.5 text-[8px] uppercase tracking-[0.12em] text-[#f8efe2]">
                                  New
                                </span>
                              )}

                            </div>

                            <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-[#9b7741]">
                              {
                                notification.type ||
                                "Notification"
                              }
                            </p>

                          </div>


                          <p className="shrink-0 text-[10px] text-[#806b60]">
                            {formatDate(
                              notification.createdAt ??
                              notification.created_at
                            )}
                          </p>

                        </div>


                        <p className="mt-3 text-sm leading-6 text-[#6c5850]">
                          {
                            notification.message
                          }
                        </p>


                        <div className="mt-4 flex flex-wrap items-center gap-3">

                          {isUnread && (
                            <button
                              type="button"
                              onClick={() =>
                                handleMarkAsRead(
                                  notification.id
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-full border border-[#d9cbb9] px-3 py-2 text-[9px] uppercase tracking-[0.12em] text-[#6d5230] transition hover:bg-[#f8f0e5]"
                            >

                              <Check
                                size={13}
                              />

                              Mark as read

                            </button>
                          )}



                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteNotification(
                                notification.id
                              )
                            }
                            disabled={
                              deletingNotificationId ===
                              notification.id
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-2 text-[9px] uppercase tracking-[0.12em] text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingNotificationId ===
                              notification.id ? (
                              <RefreshCw
                                size={13}
                                className="animate-spin"
                              />
                            ) : (
                              <XCircle size={13} />
                            )}

                            Clear
                          </button>



                          {(
                            notification.entityId ??
                            notification.entity_id
                          ) && (
                              <span className="inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.12em] text-[#806b60]">

                                {notification.entityType ??
                                  notification.entity_type ??
                                  "Record"}

                                <ArrowRight
                                  size={12}
                                />

                                #{
                                  notification.entityId ??
                                  notification.entity_id
                                }

                              </span>
                            )}

                        </div>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

    </div>
  );
};


export default Notifications;