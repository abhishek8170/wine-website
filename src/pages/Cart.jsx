import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

function Cart() {
  const {
    cartItems,
    cartCount,
    cartTotal,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    loading: cartLoading,
  } = useCart();

  /* =====================================================
     EMPTY CART
  ===================================================== */

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-[#f3e8d7] px-5 py-24 text-[#351716] md:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#8f6d32]">
            Your Selection
          </p>

          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.02em] md:text-6xl">
            Your Cart
          </h1>

          <div className="mx-auto mt-6 h-px w-16 bg-[#c9a45c]" />

          <p className="mx-auto mt-8 max-w-md text-sm leading-7 text-[#351716]/60">
            Your cart is currently empty. Explore our collection and discover
            wines crafted for memorable moments.
          </p>

          <Link
            to="/shop"
            className="mt-9 inline-flex items-center justify-center rounded-md bg-[#351716] px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#f3e8d7] transition-all duration-300 hover:bg-[#4a211d] hover:shadow-lg"
          >
            Explore Wines
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3e8d7] px-4 py-14 text-[#351716] sm:px-5 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-[1240px]">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="mb-10">
          <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#8f6d32]">
            Your Selection
          </p>

          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-serif text-4xl font-semibold tracking-[-0.02em] md:text-6xl">
                Your Cart
              </h1>

              <p className="mt-2 text-sm text-[#351716]/55">
                {cartCount} {cartCount === 1 ? "item" : "items"} in your cart
              </p>
            </div>

            <button
              type="button"
              onClick={clearCart}
              disabled={cartLoading}
              className="self-start text-[10px] font-medium uppercase tracking-[0.16em] text-[#351716]/50 transition-colors hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"
            >
              Clear Cart
            </button>
          </div>

          <div className="mt-6 h-px w-full bg-[#c9a45c]/35" />
        </div>

        {/* =====================================================
            CART + SUMMARY
        ===================================================== */}

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* =====================================================
              CART ITEMS
          ===================================================== */}

          <section className="space-y-4">
            {cartItems.map((item) => {
              const itemTotal =
                Number(item.price || 0) * Number(item.quantity || 0);

              return (
                <article
                  key={`${item.productId}-${item.variantId}`}
                  className="group rounded-2xl border border-[#c9a45c]/25 bg-[#eee1ce]/80 p-4 shadow-[0_10px_40px_rgba(53,23,22,0.04)] backdrop-blur-sm transition-all duration-300 hover:border-[#c9a45c]/45 hover:shadow-[0_15px_45px_rgba(53,23,22,0.07)] md:p-5"
                >
                  <div className="flex gap-4 sm:gap-5 md:gap-6">
                    {/* =================================================
                        IMAGE
                    ================================================= */}

                    <Link
                      to={`/shop/${item.productId}`}
                      className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#c9a45c]/15 bg-[#e7dac6] sm:h-32 sm:w-28 md:h-36 md:w-32"
                    >
                      <img
                        src={item.image || "/images/wine.png"}
                        alt={item.name}
                        onError={(event) => {
                          event.currentTarget.src = "/images/wine.png";
                        }}
                        className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>

                    {/* =================================================
                        PRODUCT INFORMATION
                    ================================================= */}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-[#8f6d32]">
                            {item.category || "Wine"}
                          </p>

                          <Link to={`/shop/${item.productId}`}>
                            <h2 className="mt-1 line-clamp-2 font-serif text-lg font-semibold leading-tight transition-colors hover:text-[#8f6d32] sm:text-xl md:text-2xl">
                              {item.name}
                            </h2>
                          </Link>

                          {item.bottleSize && (
                            <p className="mt-1 text-[11px] text-[#351716]/50">
                              {item.bottleSize}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* =================================================
                          QUANTITY + PRICE
                      ================================================= */}

                      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        {/* QUANTITY */}

                        <div>
                          <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.16em] text-[#351716]/40">
                            Quantity
                          </p>

                          <div className="flex w-fit items-center overflow-hidden rounded-md border border-[#351716]/15 bg-[#f3e8d7]/50">
                            <button
                              type="button"
                              disabled={cartLoading}
                              onClick={() =>
                                decreaseQuantity(
                                  item.productId,
                                  item.variantId
                                )
                              }
                              aria-label={`Decrease quantity of ${item.name}`}
                              className="flex h-9 w-9 items-center justify-center text-lg transition-all hover:bg-[#351716] hover:text-[#f3e8d7] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              −
                            </button>

                            <span className="flex h-9 min-w-10 items-center justify-center border-x border-[#351716]/15 px-2 text-xs font-medium">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              disabled={cartLoading}
                              onClick={() =>
                                increaseQuantity(
                                  item.productId,
                                  item.variantId
                                )
                              }
                              aria-label={`Increase quantity of ${item.name}`}
                              className="flex h-9 w-9 items-center justify-center text-lg transition-all hover:bg-[#351716] hover:text-[#f3e8d7] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* PRICE */}

                        <div className="text-left sm:text-right">
                          <p className="font-serif text-xl font-semibold md:text-2xl">
                            ₹{itemTotal.toLocaleString("en-IN")}
                          </p>

                          <p className="mt-0.5 text-[10px] text-[#351716]/40">
                            ₹
                            {Number(item.price || 0).toLocaleString("en-IN")}{" "}
                            each
                          </p>
                        </div>
                      </div>

                      {/* =================================================
                          REMOVE
                      ================================================= */}

                      <button
                        type="button"
                        disabled={cartLoading}
                        onClick={() =>
                          removeFromCart(
                            item.productId,
                            item.variantId
                          )
                        }
                        className="mt-4 text-[9px] font-medium uppercase tracking-[0.16em] text-[#351716]/40 transition-colors hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {/* =====================================================
              ORDER SUMMARY
          ===================================================== */}

          <aside className="sticky top-24 h-fit rounded-2xl border border-[#c9a45c]/35 bg-[#eee1ce]/85 p-5 shadow-[0_15px_50px_rgba(53,23,22,0.06)] backdrop-blur-md md:p-6">
            <p className="text-[9px] font-medium uppercase tracking-[0.28em] text-[#8f6d32]">
              Order Summary
            </p>

            <h2 className="mt-2 font-serif text-2xl font-semibold">
              Your Selection
            </h2>

            <div className="my-5 h-px bg-[#c9a45c]/30" />

            {/* ITEMS */}

            <div className="flex items-center justify-between text-sm">
              <span className="text-[#351716]/55">Items</span>

              <span className="font-medium">{cartCount}</span>
            </div>

            {/* SUBTOTAL */}

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-[#351716]/55">Subtotal</span>

              <span className="font-medium">
                ₹{cartTotal.toLocaleString("en-IN")}
              </span>
            </div>

            {/* SHIPPING */}

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-[#351716]/55">Shipping</span>

              <span className="text-[11px] text-[#8f6d32]">
                Calculated at checkout
              </span>
            </div>

            <div className="my-5 h-px bg-[#c9a45c]/30" />

            {/* TOTAL */}

            <div className="flex items-center justify-between">
              <span className="font-medium">Total</span>

              <span className="font-serif text-2xl font-semibold md:text-3xl">
                ₹{cartTotal.toLocaleString("en-IN")}
              </span>
            </div>

            {/* CHECKOUT */}

            <Link
              to="/checkout"
              className={`mt-6 block w-full rounded-md bg-[#351716] px-5 py-3.5 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-[#f3e8d7] transition-all duration-300 hover:bg-[#4a211d] hover:shadow-lg ${
                cartLoading
                  ? "pointer-events-none opacity-50"
                  : ""
              }`}
            >
              Proceed to Checkout
            </Link>

            {/* CONTINUE SHOPPING */}

            <Link
              to="/shop"
              className="mt-3 block w-full rounded-md border border-[#351716]/15 px-5 py-3 text-center text-[10px] font-medium uppercase tracking-[0.18em] transition-all duration-300 hover:border-[#c9a45c] hover:text-[#8f6d32]"
            >
              Continue Shopping
            </Link>

            {/* TRUST NOTE */}

            <p className="mt-5 text-center text-[9px] leading-5 text-[#351716]/40">
              Secure checkout · Order tracking · Premium wine selection
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default Cart;