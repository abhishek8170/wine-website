import { useState } from "react";
import { useLocation } from "react-router-dom";

import "../styles/Header.css";

import { useWishlist } from "../context/WishlistContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function Header({ brandName }) {
  const { wishlistCount } = useWishlist();
  const { cartCount } = useCart();
  const { customer, isAuthenticated, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  const location = useLocation();

  /* =========================================
     PAGES WHERE SEARCH SHOULD BE SHOWN
     ========================================= */

  const searchPages = ["/", "/shop", "/collections"];

  const showSearch = searchPages.includes(location.pathname);

  /* =========================================
     CLOSE MOBILE MENU
     ========================================= */

  const closeMenu = () => {
    setMenuOpen(false);
  };

  /* =========================================
     LOGOUT
     ========================================= */

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  return (
    <header className="site-header">
      {/* =========================
          MAIN HEADER
          ========================= */}

      <div className="header-container">
        {/* Logo */}

        <a href="/" className="brand-logo">
          {brandName}
        </a>

        {/* =========================
            DESKTOP NAVIGATION
            ========================= */}

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

        {/* =========================
            DESKTOP ACTIONS
            ========================= */}

        <div className="header-actions">
          {/* =========================
              SEARCH
              ========================= */}

          {showSearch && (
            <a
              href="/shop"
              className="header-icon"
              aria-label="Search wines"
            >
              ⌕
            </a>
          )}

          {/* =========================
              ACCOUNT
              ========================= */}

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
                  Hi, {customer?.first_name}
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

          {/* =========================
              WISHLIST
              ========================= */}

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

          {/* =========================
              CART
              ========================= */}

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

        {/* =========================
            MOBILE HAMBURGER
            ========================= */}

        <button
          className={`menu-toggle ${
            menuOpen ? "open" : ""
          }`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* =========================
          MOBILE DROPDOWN MENU
          ========================= */}

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

          {/* =========================
              MOBILE AUTHENTICATION
              ========================= */}

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

      {/* =========================
          MOBILE BOTTOM NAVIGATION
          ========================= */}

      <nav className="mobile-bottom-nav">
        {/* Home */}

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

          <span>
            Home
          </span>
        </a>

        {/* Search */}

        {showSearch && (
          <a
            href="/shop"
            className="mobile-bottom-item"
          >
            <span className="bottom-icon">
              ⌕
            </span>

            <span>
              Search
            </span>
          </a>
        )}

        {/* Account */}

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

        {/* Wishlist */}

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

          <span>
            Wishlist
          </span>
        </a>

        {/* Cart */}

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

          <span>
            Cart
          </span>
        </a>
      </nav>
    </header>
  );
}

export default Header;