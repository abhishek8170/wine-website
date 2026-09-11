import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);

const CART_STORAGE_KEY = "wine_cart";
const API_BASE_URL = "http://localhost:5000/api";

/* -------------------------------------------------------
   NORMALIZE CART ITEMS
------------------------------------------------------- */

const normalizeCartItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  const mergedItems = [];

  items.forEach((item) => {
    const productId = Number(
      item.productId ?? item.product_id
    );

    const variantId = Number(
      item.variantId ?? item.variant_id
    );

    const quantity = Number(item.quantity) || 0;

    if (
      !Number.isFinite(productId) ||
      !Number.isFinite(variantId) ||
      quantity <= 0
    ) {
      return;
    }

    const existingIndex = mergedItems.findIndex(
      (existingItem) =>
        Number(existingItem.productId) === productId &&
        Number(existingItem.variantId) === variantId
    );

    if (existingIndex !== -1) {
      mergedItems[existingIndex] = {
        ...mergedItems[existingIndex],
        quantity:
          Number(
            mergedItems[existingIndex].quantity || 0
          ) + quantity,
      };

      return;
    }

    mergedItems.push({
      ...item,

      productId,
      variantId,
      quantity,

      name: item.name || "Wine",

      category:
        item.category ||
        item.category_name ||
        "Wine",

      image:
        item.image ||
        item.image_url ||
        "/images/wine.png",

      bottleSize:
        item.bottleSize ||
        item.bottle_size ||
        "",

      vintage: item.vintage || "",

      price:
        Number(
          item.price ??
          item.selling_price
        ) || 0,

      mrp: Number(item.mrp) || 0,

      stockQuantity:
        Number(
          item.stockQuantity ??
          item.stock_quantity
        ) || 0,
    });
  });

  return mergedItems;
};

/* -------------------------------------------------------
   MAP DATABASE CART ITEM
------------------------------------------------------- */

const mapDatabaseCartItem = (item) => {
  return {
    id: item.id,

    productId: Number(
      item.productId ?? item.product_id
    ),

    variantId: Number(
      item.variantId ?? item.variant_id
    ),

    name: item.name || "Wine",

    category:
      item.category ||
      item.category_name ||
      "Wine",

    image:
      item.image ||
      item.image_url ||
      "/images/wine.png",

    bottleSize:
      item.bottleSize ||
      item.bottle_size ||
      "",

    vintage: item.vintage || "",

    price:
      Number(
        item.price ??
        item.selling_price
      ) || 0,

    mrp: Number(item.mrp) || 0,

    quantity:
      Number(item.quantity) || 0,

    stockQuantity:
      Number(
        item.stockQuantity ??
        item.stock_quantity
      ) || 0,
  };
};

/* -------------------------------------------------------
   CART PROVIDER
------------------------------------------------------- */

export function CartProvider({ children }) {
  const {
    token,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart =
        localStorage.getItem(CART_STORAGE_KEY);

      if (!savedCart) {
        return [];
      }

      const parsedCart =
        JSON.parse(savedCart);

      if (!Array.isArray(parsedCart)) {
        return [];
      }

      return normalizeCartItems(parsedCart);
    } catch (error) {
      console.error(
        "Error loading cart:",
        error
      );

      localStorage.removeItem(
        CART_STORAGE_KEY
      );

      return [];
    }
  });

  const [loading, setLoading] =
    useState(false);

  /* -------------------------------------------------------
     LOAD CART FROM DATABASE
  ------------------------------------------------------- */

  const loadDatabaseCart = async (authToken) => {
    if (!authToken) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/cart`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${authToken}`,
          },
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        console.warn(
          "Cart authentication failed."
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to load cart"
        );
      }

      const databaseItems =
        data.cart?.items || [];

      const formattedItems =
        databaseItems.map(
          mapDatabaseCartItem
        );

      setCartItems(
        normalizeCartItems(
          formattedItems
        )
      );
    } catch (error) {
      console.error(
        "Error loading database cart:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------
     RESTORE CART WHEN AUTH STATE IS READY
  ------------------------------------------------------- */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (
      isAuthenticated &&
      token
    ) {
      loadDatabaseCart(token);
      return;
    }

    try {
      const savedCart =
        localStorage.getItem(
          CART_STORAGE_KEY
        );

      if (!savedCart) {
        setCartItems([]);
        return;
      }

      const parsedCart =
        JSON.parse(savedCart);

      if (!Array.isArray(parsedCart)) {
        setCartItems([]);
        return;
      }

      setCartItems(
        normalizeCartItems(parsedCart)
      );
    } catch (error) {
      console.error(
        "Error restoring guest cart:",
        error
      );

      setCartItems([]);
    }
  }, [
    authLoading,
    isAuthenticated,
    token,
  ]);

  /* -------------------------------------------------------
     SAVE GUEST CART
  ------------------------------------------------------- */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (isAuthenticated) {
      return;
    }

    try {
      if (cartItems.length === 0) {
        localStorage.removeItem(
          CART_STORAGE_KEY
        );

        return;
      }

      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cartItems)
      );
    } catch (error) {
      console.error(
        "Error saving guest cart:",
        error
      );
    }
  }, [
    cartItems,
    isAuthenticated,
    authLoading,
  ]);

  /* -------------------------------------------------------
     ADD TO CART
  ------------------------------------------------------- */

  const addToCart = async (
    product,
    quantity = 1
  ) => {
    const variant =
      product?.variants?.[0];

    if (!variant) {
      console.error(
        "Product has no variant:",
        product
      );

      return;
    }

    const addQuantity =
      Number(quantity);

    if (
      !Number.isFinite(addQuantity) ||
      addQuantity <= 0
    ) {
      return;
    }

    const productId =
      Number(product.id);

    const variantId =
      Number(variant.id);

    /* -----------------------------
       LOGGED-IN CUSTOMER
    ----------------------------- */

    if (
      isAuthenticated &&
      token
    ) {
      try {
        setLoading(true);

        const response =
          await fetch(
            `${API_BASE_URL}/cart/items`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                product_variant_id:
                  variantId,

                quantity:
                  addQuantity,
              }),
            }
          );

        const data =
          await response.json();

        if (
          response.status === 401
        ) {
          throw new Error(
            "Your login session has expired. Please log in again."
          );
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Failed to add item to cart"
          );
        }

        await loadDatabaseCart(
          token
        );
      } catch (error) {
        console.error(
          "Error adding item to cart:",
          error
        );

        throw error;
      } finally {
        setLoading(false);
      }

      return;
    }

    /* -----------------------------
       GUEST CUSTOMER
    ----------------------------- */

    setCartItems(
      (currentItems) => {
        const existingItem =
          currentItems.find(
            (item) =>
              Number(item.productId) ===
                productId &&
              Number(item.variantId) ===
                variantId
          );

        if (existingItem) {
          return currentItems.map(
            (item) => {
              const sameItem =
                Number(item.productId) ===
                  productId &&
                Number(item.variantId) ===
                  variantId;

              if (!sameItem) {
                return item;
              }

              return {
                ...item,

                quantity:
                  Number(
                    item.quantity || 0
                  ) + addQuantity,
              };
            }
          );
        }

        return [
          ...currentItems,

          {
            productId,

            variantId,

            name:
              product.name ||
              "Wine",

            category:
              product.category ||
              product.category_name ||
              "Wine",

            image:
              product.images?.[0]
                ?.image_url ||
              product.images?.[0]?.image ||
              "/images/wine.png",

            bottleSize:
              variant.bottle_size ||
              variant.bottleSize ||
              "",

            vintage:
              product.vintage ||
              "",

            price:
              Number(
                variant.selling_price ??
                variant.price
              ) || 0,

            mrp:
              Number(
                variant.mrp
              ) || 0,

            quantity:
              addQuantity,

            stockQuantity:
              Number(
                variant.stock_quantity ??
                variant.stockQuantity
              ) || 0,
          },
        ];
      }
    );
  };

  /* -------------------------------------------------------
     SET EXACT QUANTITY
     
     Used by Buy Now so that:
     
     Existing cart = 2
     Product Details quantity = 1
     
     Result = 1
     
     NOT 3.
  ------------------------------------------------------- */

  const setCartItemQuantity = async (
    productId,
    variantId,
    quantity
  ) => {
    const newQuantity =
      Number(quantity);

    if (
      !Number.isFinite(newQuantity) ||
      newQuantity < 0
    ) {
      return;
    }

    const numericProductId =
      Number(productId);

    const numericVariantId =
      Number(variantId);

    const currentItem =
      cartItems.find(
        (item) =>
          Number(item.productId) ===
            numericProductId &&
          Number(item.variantId) ===
            numericVariantId
      );

    if (!currentItem) {
      return;
    }

    /* -----------------------------
       REMOVE IF QUANTITY = 0
    ----------------------------- */

    if (newQuantity === 0) {
      await removeFromCart(
        numericProductId,
        numericVariantId
      );

      return;
    }

    /* -----------------------------
       LOGGED-IN CUSTOMER
    ----------------------------- */

    if (
      isAuthenticated &&
      token
    ) {
      try {
        setLoading(true);

        const response =
          await fetch(
            `${API_BASE_URL}/cart/items/${numericVariantId}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                quantity:
                  newQuantity,
              }),
            }
          );

        const data =
          await response.json();

        if (
          response.status === 401
        ) {
          throw new Error(
            "Your login session has expired. Please log in again."
          );
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Failed to set cart quantity"
          );
        }

        await loadDatabaseCart(
          token
        );
      } catch (error) {
        console.error(
          "Error setting cart quantity:",
          error
        );

        throw error;
      } finally {
        setLoading(false);
      }

      return;
    }

    /* -----------------------------
       GUEST CUSTOMER
    ----------------------------- */

    setCartItems(
      (currentItems) =>
        currentItems.map(
          (item) => {
            const sameItem =
              Number(item.productId) ===
                numericProductId &&
              Number(item.variantId) ===
                numericVariantId;

            if (!sameItem) {
              return item;
            }

            return {
              ...item,
              quantity: newQuantity,
            };
          }
        )
    );
  };

  /* -------------------------------------------------------
     REMOVE FROM CART
  ------------------------------------------------------- */

  const removeFromCart = async (
    productId,
    variantId
  ) => {
    if (
      isAuthenticated &&
      token
    ) {
      try {
        setLoading(true);

        const response =
          await fetch(
            `${API_BASE_URL}/cart/items/${variantId}`,
            {
              method: "DELETE",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (
          response.status === 401
        ) {
          throw new Error(
            "Your login session has expired. Please log in again."
          );
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Failed to remove item"
          );
        }

        await loadDatabaseCart(
          token
        );
      } catch (error) {
        console.error(
          "Error removing cart item:",
          error
        );

        throw error;
      } finally {
        setLoading(false);
      }

      return;
    }

    setCartItems(
      (currentItems) =>
        currentItems.filter(
          (item) =>
            !(
              Number(item.productId) ===
                Number(productId) &&
              Number(item.variantId) ===
                Number(variantId)
            )
        )
    );
  };

  /* -------------------------------------------------------
     INCREASE QUANTITY
  ------------------------------------------------------- */

  const increaseQuantity = async (
    productId,
    variantId
  ) => {
    const currentItem =
      cartItems.find(
        (item) =>
          Number(item.productId) ===
            Number(productId) &&
          Number(item.variantId) ===
            Number(variantId)
      );

    if (!currentItem) {
      return;
    }

    const newQuantity =
      Number(
        currentItem.quantity || 0
      ) + 1;

    await setCartItemQuantity(
      productId,
      variantId,
      newQuantity
    );
  };

  /* -------------------------------------------------------
     DECREASE QUANTITY
  ------------------------------------------------------- */

  const decreaseQuantity = async (
    productId,
    variantId
  ) => {
    const currentItem =
      cartItems.find(
        (item) =>
          Number(item.productId) ===
            Number(productId) &&
          Number(item.variantId) ===
            Number(variantId)
      );

    if (!currentItem) {
      return;
    }

    const currentQuantity =
      Number(
        currentItem.quantity || 0
      );

    const newQuantity =
      currentQuantity - 1;

    if (newQuantity <= 0) {
      await removeFromCart(
        productId,
        variantId
      );

      return;
    }

    await setCartItemQuantity(
      productId,
      variantId,
      newQuantity
    );
  };

  /* -------------------------------------------------------
     CLEAR CART
  ------------------------------------------------------- */

  const clearCart = async () => {
    if (
      isAuthenticated &&
      token
    ) {
      try {
        setLoading(true);

        const response =
          await fetch(
            `${API_BASE_URL}/cart`,
            {
              method: "DELETE",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (
          response.status === 401
        ) {
          throw new Error(
            "Your login session has expired. Please log in again."
          );
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Failed to clear cart"
          );
        }

        setCartItems([]);
      } catch (error) {
        console.error(
          "Error clearing cart:",
          error
        );

        throw error;
      } finally {
        setLoading(false);
      }

      return;
    }

    setCartItems([]);
  };

  /* -------------------------------------------------------
     CART COUNT
  ------------------------------------------------------- */

  const cartCount =
    cartItems.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity || 0
        ),
      0
    );

  /* -------------------------------------------------------
     CART TOTAL
  ------------------------------------------------------- */

  const cartTotal =
    cartItems.reduce(
      (total, item) =>
        total +
        Number(item.price || 0) *
          Number(
            item.quantity || 0
          ),
      0
    );

  /* -------------------------------------------------------
     CONTEXT VALUE
  ------------------------------------------------------- */

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    loading,

    addToCart,

    setCartItemQuantity,

    removeFromCart,

    increaseQuantity,

    decreaseQuantity,

    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

/* -------------------------------------------------------
   USE CART
------------------------------------------------------- */

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}