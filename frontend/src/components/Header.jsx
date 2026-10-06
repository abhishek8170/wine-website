
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";
import { useLocation } from "react-router-dom";

import "../styles/Header.css";

import { useWishlist } from "../context/WishlistContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

function Header({ brandName: brandNameProp }) {
  const { wishlistCount } = useWishlist();
  const { cartCount } = useCart();
  const { customer, isAuthenticated, logout } =
    useAuth();

  const { settings } = useSiteSettings();

  const location = useLocation();

  // =========================================
  // STATE
  // =========================================

  const [menuOpen, setMenuOpen] = useState(false);

  const [
    notificationOpen,
    setNotificationOpen,
  ] = useState(false);

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    notificationLoading,
    setNotificationLoading,
  ] = useState(false);

  const notificationRef = useRef(null);

  // =========================================
  // BRAND NAME
  // =========================================

  const brandName =
    settings?.brand_name ||
    brandNameProp ||
    "VINEORA";

  // =========================================
  // LOGO
  // =========================================

  const logoUrl = settings?.logo_url
    ? settings.logo_url.startsWith("http://") ||
      settings.logo_url.startsWith("https://")
      ? settings.logo_url
      : `http://localhost:5000${
          settings.logo_url.startsWith("/")
            ? settings.logo_url
            : `/${settings.logo_url}`
        }`
    : "";

  // =========================================
  // SEARCH PAGES
  // =========================================

  const searchPages = [
    "/",
    "/shop",
    "/collections",
  ];

  const showSearch = searchPages.includes(
    location.pathname
  );

  // =========================================
  // CLOSE MOBILE MENU
  // =========================================

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout = () => {
    logout();

    closeMenu();

    setNotificationOpen(false);
  };

  // =========================================
  // AUTH TOKEN
  // =========================================

  const getAuthToken = () => {
    return localStorage.getItem(
      "wine_auth_token"
    );
  };

  // =========================================
  // LOAD NOTIFICATIONS
  // =========================================

  const loadNotifications = async () => {
    const authToken = getAuthToken();

    if (!authToken || !isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setNotificationLoading(true);

      const [
        notificationsResponse,
        unreadResponse,
      ] = await Promise.all([
        fetch(
          "http://localhost:5000/api/notifications",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        ),

        fetch(
          "http://localhost:5000/api/notifications/unread-count",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        ),
      ]);

      const notificationData =
        await notificationsResponse.json();

      const unreadData =
        await unreadResponse.json();

      console.log(
        "Customer notifications response:",
        notificationData
      );

      console.log(
        "Unread notification response:",
        unreadData
      );

      if (
        notificationsResponse.ok &&
        notificationData.success
      ) {
        setNotifications(
          notificationData.notifications || []
        );
      } else {
        setNotifications([]);
      }

      if (
        unreadResponse.ok &&
        unreadData.success
      ) {
        setUnreadCount(
          Number(unreadData.count || 0)
        );
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error(
        "Load notifications error:",
        error
      );
    } finally {
      setNotificationLoading(false);
    }
  };

  // =========================================
  // INITIAL NOTIFICATION LOAD
  // =========================================

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  // =========================================
// REAL-TIME CUSTOMER NOTIFICATIONS
// =========================================

useEffect(() => {
  if (!isAuthenticated) {
    return;
  }

  const socket = io("http://localhost:5000", {
    transports: ["websocket", "polling"],
  });

  const handleCustomerNotification = (
    notification
  ) => {
    console.log(
      "Customer notification received:",
      notification
    );

    // Make sure this notification belongs
    // to the currently logged-in customer.
    if (
      notification?.customerId &&
      customer?.id &&
      Number(notification.customerId) !==
        Number(customer.id)
    ) {
      return;
    }

    // Reload notifications from database.
    // This guarantees that the frontend gets
    // the complete notification object.
    loadNotifications();
  };

  socket.on(
    "customer:notification-created",
    handleCustomerNotification
  );

  console.log(
    "Customer notification socket connected:",
    socket.id
  );

  return () => {
    socket.off(
      "customer:notification-created",
      handleCustomerNotification
    );

    socket.disconnect();

    console.log(
      "Customer notification socket disconnected"
    );
  };
}, [isAuthenticated, customer?.id]);
  // =========================================
  // CLOSE NOTIFICATION WHEN CLICKING OUTSIDE
  // =========================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target
        )
      ) {
        setNotificationOpen(false);
      }
    };

    if (notificationOpen) {
      document.addEventListener(
        "mousedown",
        handleOutsideClick
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [notificationOpen]);

  // =========================================
  // TOGGLE NOTIFICATIONS
  // =========================================

  const handleNotificationToggle = async (
    event
  ) => {
    event.stopPropagation();

    const newState = !notificationOpen;

    setNotificationOpen(newState);

    if (newState) {
      await loadNotifications();
    }
  };

  // =========================================
  // MARK ONE AS READ
  // =========================================

  const handleMarkAsRead = async (
    notification
  ) => {
    if (notification.isRead) {
      return;
    }

    const authToken = getAuthToken();

    if (!authToken) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/notifications/${notification.id}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setNotifications((previous) =>
          previous.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  isRead: true,
                }
              : item
          )
        );

        setUnreadCount((previous) =>
          Math.max(previous - 1, 0)
        );
      }
    } catch (error) {
      console.error(
        "Mark notification as read error:",
        error
      );
    }
  };

  // =========================================
  // DELETE ONE NOTIFICATION
  // =========================================

  const handleDeleteNotification = async (
    event,
    notificationId
  ) => {
    event.stopPropagation();

    const authToken = getAuthToken();

    if (!authToken) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();

      console.log(
        "Delete notification response:",
        data
      );

      if (response.ok && data.success) {
        const deletedNotification =
          notifications.find(
            (item) =>
              item.id === notificationId
          );

        setNotifications((previous) =>
          previous.filter(
            (item) =>
              item.id !== notificationId
          )
        );

        if (
          deletedNotification &&
          !deletedNotification.isRead
        ) {
          setUnreadCount((previous) =>
            Math.max(previous - 1, 0)
          );
        }
      }
    } catch (error) {
      console.error(
        "Delete notification error:",
        error
      );
    }
  };

  // =========================================
  // CLEAR ALL NOTIFICATIONS
  // =========================================

  const handleClearAll = async (event) => {
    event.stopPropagation();

    if (notifications.length === 0) {
      return;
    }

    const authToken = getAuthToken();

    if (!authToken) {
      return;
    }

    try {
      /*
       * Your backend currently provides
       * DELETE /:id, not DELETE ALL.
       *
       * Therefore we delete each notification
       * individually.
       */

      const notificationIds =
        notifications.map(
          (notification) =>
            notification.id
        );

      const deleteResults =
        await Promise.all(
          notificationIds.map(
            async (notificationId) => {
              try {
                const response =
                  await fetch(
                    `http://localhost:5000/api/notifications/${notificationId}`,
                    {
                      method: "DELETE",
                      headers: {
                        Authorization: `Bearer ${authToken}`,
                      },
                    }
                  );

                const data =
                  await response.json();

                return (
                  response.ok &&
                  data.success
                );
              } catch (error) {
                console.error(
                  "Delete notification error:",
                  error
                );

                return false;
              }
            }
          )
        );

      const allDeleted =
        deleteResults.every(Boolean);

      if (allDeleted) {
        setNotifications([]);
        setUnreadCount(0);
      } else {
        await loadNotifications();
      }
    } catch (error) {
      console.error(
        "Clear all notifications error:",
        error
      );
    }
  };

  // =========================================
  // FORMAT NOTIFICATION TIME
  // =========================================

  const formatNotificationTime = (
    createdAt
  ) => {
    if (!createdAt) {
      return "";
    }

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const now = new Date();

    const difference =
      now.getTime() - date.getTime();

    const minutes = Math.floor(
      difference / 60000
    );

    const hours = Math.floor(
      minutes / 60
    );

    const days = Math.floor(
      hours / 24
    );

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    if (hours < 24) {
      return `${hours} hr ago`;
    }

    if (days < 7) {
      return `${days} day${
        days > 1 ? "s" : ""
      } ago`;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================================
  // NOTIFICATION ICON
  // =========================================

  const NotificationIcon = () => (
    <svg
      viewBox="0 0 24 24"
      className="notification-bell-icon"
      aria-hidden="true"
    >
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );

  // =========================================
  // HEADER
  // =========================================

  return (
    <header className="site-header">
      {/* =====================================
          MAIN HEADER
      ===================================== */}

      <div className="header-container">
        {/* ===================================
            LOGO
        =================================== */}

        <a
          href="/"
          className="brand-logo"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={brandName}
              className="brand-logo-image"
            />
          ) : (
            brandName
          )}
        </a>

        {/* ===================================
            DESKTOP NAVIGATION
        =================================== */}

        <nav className="desktop-nav">
          <a href="/">Home</a>

          <a href="/shop">
            Shop
          </a>

          <a href="/collections">
            Collections
          </a>

          <a href="/our-story">
            Our Story
          </a>

          <a href="/wine-guide">
            Wine Guide
          </a>

          <a href="/contact">
            Contact
          </a>
        </nav>

        {/* ===================================
            DESKTOP ACTIONS
        =================================== */}

        <div className="header-actions">
          {/* SEARCH */}

          {showSearch && (
            <a
              href="/shop"
              className="header-icon"
              aria-label="Search wines"
            >
              ⌕
            </a>
          )}

          {/* ACCOUNT */}

          {isAuthenticated ? (
            <div className="account-header">
              <a
                href="/account"
                className="account-user"
                aria-label="My account"
              >
                <span className="account-icon">
                  ♙
                </span>

                <span className="account-name">
                  Hi,{" "}
                  {customer?.first_name}
                </span>
              </a>

              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <a
              href="/login"
              className="header-icon account-header-icon"
              aria-label="Login"
            >
              ♙
            </a>
          )}

          {/* =================================
              DESKTOP NOTIFICATION
          ================================= */}

          {isAuthenticated && (
            <div
              className="notification-wrapper"
              ref={notificationRef}
            >
              <button
                type="button"
                className={`header-icon notification-header-icon ${
                  notificationOpen
                    ? "notification-active"
                    : ""
                }`}
                onClick={
                  handleNotificationToggle
                }
                aria-label={`Notifications${
                  unreadCount > 0
                    ? `, ${unreadCount} unread`
                    : ""
                }`}
                aria-expanded={
                  notificationOpen
                }
              >
                <NotificationIcon />

                {unreadCount > 0 && (
                  <span className="notification-count">
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <NotificationPanel
                  notifications={
                    notifications
                  }
                  unreadCount={
                    unreadCount
                  }
                  loading={
                    notificationLoading
                  }
                  onMarkAsRead={
                    handleMarkAsRead
                  }
                  onDelete={
                    handleDeleteNotification
                  }
                  onClearAll={
                    handleClearAll
                  }
                  formatTime={
                    formatNotificationTime
                  }
                />
              )}
            </div>
          )}

          {/* WISHLIST */}

          <a
            href="/wishlist"
            className="header-icon wishlist-header-icon"
            aria-label={`Wishlist${
              wishlistCount > 0
                ? `, ${wishlistCount} items`
                : ""
            }`}
          >
            <span>♡</span>

            {wishlistCount > 0 && (
              <span className="wishlist-count">
                {wishlistCount}
              </span>
            )}
          </a>

          {/* CART */}

          <a
            href="/cart"
            className="header-icon cart-header-icon"
            aria-label={`Cart${
              cartCount > 0
                ? `, ${cartCount} items`
                : ""
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="cart-icon"
              aria-hidden="true"
            >
              <path d="M4 5h2l1.5 10h10L20 8H7" />
              <path d="M9 19h.01M17 19h.01" />
            </svg>

            {cartCount > 0 && (
              <span className="cart-count">
                {cartCount}
              </span>
            )}
          </a>
        </div>

        {/* ===================================
            MOBILE ACTIONS
        =================================== */}

        <div className="mobile-header-actions">
          {isAuthenticated && (
            <div
              className="notification-wrapper mobile-notification-wrapper"
              ref={
                notificationOpen
                  ? notificationRef
                  : null
              }
            >
              <button
                type="button"
                className={`mobile-notification-button ${
                  notificationOpen
                    ? "notification-active"
                    : ""
                }`}
                onClick={
                  handleNotificationToggle
                }
                aria-label={`Notifications${
                  unreadCount > 0
                    ? `, ${unreadCount} unread`
                    : ""
                }`}
                aria-expanded={
                  notificationOpen
                }
              >
                <NotificationIcon />

                {unreadCount > 0 && (
                  <span className="notification-count mobile-notification-count">
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <NotificationPanel
                  notifications={
                    notifications
                  }
                  unreadCount={
                    unreadCount
                  }
                  loading={
                    notificationLoading
                  }
                  onMarkAsRead={
                    handleMarkAsRead
                  }
                  onDelete={
                    handleDeleteNotification
                  }
                  onClearAll={
                    handleClearAll
                  }
                  formatTime={
                    formatNotificationTime
                  }
                  mobile
                />
              )}
            </div>
          )}

          {/* HAMBURGER */}

          <button
            type="button"
            className={`menu-toggle ${
              menuOpen ? "open" : ""
            }`}
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* =====================================
          MOBILE DROPDOWN MENU
      ===================================== */}

      <div
        className={`mobile-menu ${
          menuOpen ? "open" : ""
        }`}
      >
        <nav className="mobile-nav">
          <a
            href="/"
            onClick={closeMenu}
          >
            Home
          </a>

          <a
            href="/shop"
            onClick={closeMenu}
          >
            Shop
          </a>

          <a
            href="/collections"
            onClick={closeMenu}
          >
            Collections
          </a>

          <a
            href="/our-story"
            onClick={closeMenu}
          >
            Our Story
          </a>

          <a
            href="/wine-guide"
            onClick={closeMenu}
          >
            Wine Guide
          </a>

          <a
            href="/contact"
            onClick={closeMenu}
          >
            Contact
          </a>

          {isAuthenticated ? (
            <>
              <a
                href="/account"
                onClick={closeMenu}
              >
                My Account —{" "}
                {customer?.first_name}
              </a>
              
              <button
                type="button"
                className="mobile-logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <a
              href="/login"
              onClick={closeMenu}
            >
              Login
            </a>
          )}
        </nav>
      </div>

      {/* =====================================
          MOBILE BOTTOM NAVIGATION
      ===================================== */}

      <nav className="mobile-bottom-nav">
        {/* HOME */}

        <a
          href="/"
          className={`mobile-bottom-item ${
            location.pathname === "/"
              ? "active"
              : ""
          }`}
        >
          <span className="bottom-icon">
            ⌂
          </span>

          <span>Home</span>
        </a>

        {/* SEARCH */}

        {showSearch && (
          <a
            href="/shop"
            className="mobile-bottom-item"
          >
            <span className="bottom-icon">
              ⌕
            </span>

            <span>Search</span>
          </a>
        )}

        {/* ACCOUNT */}

        <a
          href={
            isAuthenticated
              ? "/account"
              : "/login"
          }
          className="mobile-bottom-item"
        >
          <span className="bottom-icon">
            ♙
          </span>

          <span>
            {isAuthenticated
              ? customer?.first_name
              : "Account"}
          </span>
        </a>

        {/* WISHLIST */}

        <a
          href="/wishlist"
          className="mobile-bottom-item wishlist-mobile-item"
        >
          <span className="bottom-icon wishlist-mobile-icon">
            ♡

            {wishlistCount > 0 && (
              <span className="wishlist-count-mobile">
                {wishlistCount}
              </span>
            )}
          </span>

          <span>Wishlist</span>
        </a>

        {/* CART */}

        <a
          href="/cart"
          className="mobile-bottom-item"
        >
          <span className="bottom-icon cart-mobile-icon">
            <svg
              viewBox="0 0 24 24"
              className="cart-icon"
              aria-hidden="true"
            >
              <path d="M4 5h2l1.5 10h10L20 8H7" />
              <path d="M9 19h.01M17 19h.01" />
            </svg>

            {cartCount > 0 && (
              <span className="cart-count-mobile">
                {cartCount}
              </span>
            )}
          </span>

          <span>Cart</span>
        </a>
      </nav>
    </header>
  );
}

// =====================================================
// NOTIFICATION PANEL
// =====================================================

function NotificationPanel({
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onDelete,
  onClearAll,
  formatTime,
  mobile = false,
}) {
  return (
    <div
      className={`notification-panel ${
        mobile
          ? "notification-panel-mobile"
          : ""
      }`}
      onMouseDown={(event) =>
        event.stopPropagation()
      }
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      {/* =========================================
          HEADER
      ========================================= */}

      <div className="notification-panel-header">
        <div>
          <h3>Notifications</h3>

          <span>
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "All caught up"}
          </span>
        </div>

        {notifications.length > 0 && (
          <button
            type="button"
            className="clear-all-button"
            onClick={onClearAll}
          >
            Clear All
          </button>
        )}
      </div>

      {/* =========================================
          CONTENT
      ========================================= */}

      <div className="notification-panel-content">
        {loading ? (
          <div className="notification-empty">
            <div className="notification-loader"></div>

            <p>
              Loading notifications...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <div className="empty-bell">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>
            </div>

            <h4>No notifications</h4>

            <p>
              You're all caught up.
            </p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map(
              (notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    notification.isRead
                      ? "read"
                      : "unread"
                  }`}
                  onClick={() =>
                    onMarkAsRead(
                      notification
                    )
                  }
                >
                  {/* UNREAD DOT */}

                  {!notification.isRead && (
                    <span className="notification-unread-dot"></span>
                  )}

                  {/* ICON */}

                  <div className="notification-item-icon">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M12 3v18" />
                      <path d="M5 8h14" />
                      <path d="M7 8c0 5-2 7-3 9h16c-1-2-3-4-3-9" />
                    </svg>
                  </div>

                  {/* TEXT */}

                  <div className="notification-item-content">
                    <div className="notification-item-top">
                      <h4>
                        {notification.title}
                      </h4>

                      <span className="notification-time">
                        {formatTime(
                          notification.createdAt
                        )}
                      </span>
                    </div>

                    <p>
                      {notification.message}
                    </p>

                    <button
                      type="button"
                      className="notification-delete-button"
                      onClick={(event) =>
                        onDelete(
                          event,
                          notification.id
                        )
                      }
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Header;
