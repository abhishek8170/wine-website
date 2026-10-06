import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);

const CART_STORAGE_KEY = "wine_cart";
const API_BASE_URL = "/api";

/* -------------------------------------------------------
   NORMALIZE CART ITEMS
------------------------------------------------------- */

const normalizeCartItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  const mergedItems = [];

  items.forEach((item) => {
    const giftSetId = Number(
      item.giftSetId ??
      item.gift_set_id ??
      0
    );

    const isGiftSet =
      item.isGiftSet === true ||
      item.is_gift_set === true ||
      giftSetId > 0;

    const quantity =
      Number(item.quantity) || 0;

    if (quantity <= 0) {
      return;
    }

    /* ---------------------------------------------------
       GIFT SET
    --------------------------------------------------- */

    if (isGiftSet && giftSetId > 0) {
      const existingIndex =
        mergedItems.findIndex(
          (existingItem) =>
            existingItem.isGiftSet === true &&
            Number(
              existingItem.giftSetId
            ) === giftSetId
        );

      if (existingIndex !== -1) {
        mergedItems[existingIndex] = {
          ...mergedItems[existingIndex],

          quantity:
            Number(
              mergedItems[existingIndex]
                .quantity || 0
            ) + quantity,
        };

        return;
      }

      mergedItems.push({
        ...item,

        isGiftSet: true,

        giftSetId,

        productId: null,

        variantId: null,

        name:
          item.giftSetName ||
          item.gift_set_name ||
          item.name ||
          "Wine Gift Set",

        category: "Gift Set",

        image:
          item.giftSetImage ||
          item.gift_set_image_url ||
          item.image ||
          "/images/wine.png",

        bottleSize: "",

        vintage: "",

        price:
          Number(
            item.giftSetPrice ??
            item.gift_set_price ??
            item.price
          ) || 0,

        mrp:
          Number(
            item.giftSetMrp ??
            item.gift_set_mrp ??
            item.mrp
          ) || 0,

        quantity,

        stockQuantity:
          Number(
            item.giftSetStockQuantity ??
            item.gift_set_stock_quantity ??
            item.stockQuantity
          ) || 0,

        giftSetName:
          item.giftSetName ||
          item.gift_set_name ||
          item.name ||
          "Wine Gift Set",

        giftSetDescription:
          item.giftSetDescription ||
          item.gift_set_description ||
          "",

        giftSetImage:
          item.giftSetImage ||
          item.gift_set_image_url ||
          item.image ||
          "/images/wine.png",

        giftSetPrice:
          Number(
            item.giftSetPrice ??
            item.gift_set_price ??
            item.price
          ) || 0,

        giftSetMrp:
          Number(
            item.giftSetMrp ??
            item.gift_set_mrp ??
            item.mrp
          ) || 0,

        giftSetStockQuantity:
          Number(
            item.giftSetStockQuantity ??
            item.gift_set_stock_quantity ??
            item.stockQuantity
          ) || 0,

        giftSetActive:
          item.giftSetActive ??
          item.gift_set_is_active ??
          true,
      });

      return;
    }

    /* ---------------------------------------------------
       NORMAL WINE
    --------------------------------------------------- */

    const productId = Number(
      item.productId ??
      item.product_id
    );

    const variantId = Number(
      item.variantId ??
      item.variant_id
    );

    if (
      !Number.isFinite(productId) ||
      !Number.isFinite(variantId)
    ) {
      return;
    }

    const existingIndex =
      mergedItems.findIndex(
        (existingItem) =>
          existingItem.isGiftSet !== true &&
          Number(existingItem.productId) ===
            productId &&
          Number(existingItem.variantId) ===
            variantId
      );

    if (existingIndex !== -1) {
      mergedItems[existingIndex] = {
        ...mergedItems[existingIndex],

        quantity:
          Number(
            mergedItems[existingIndex]
              .quantity || 0
          ) + quantity,
      };

      return;
    }

    mergedItems.push({
      ...item,

      isGiftSet: false,

      giftSetId: null,

      productId,

      variantId,

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

      vintage:
        item.vintage || "",

      price:
        Number(
          item.price ??
          item.selling_price
        ) || 0,

      mrp:
        Number(item.mrp) || 0,

      quantity,

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
  const giftSetId = Number(
    item.giftSetId ??
    item.gift_set_id ??
    0
  );

  const isGiftSet =
    item.isGiftSet === true ||
    item.is_gift_set === true ||
    giftSetId > 0;

  /* ---------------------------------------------------
     GIFT SET
  --------------------------------------------------- */

  if (isGiftSet && giftSetId > 0) {
    const giftSetPrice =
      Number(
        item.giftSetPrice ??
        item.gift_set_price
      ) || 0;

    const giftSetMrp =
      Number(
        item.giftSetMrp ??
        item.gift_set_mrp
      ) || 0;

    const giftSetImage =
      item.giftSetImage ||
      item.gift_set_image_url ||
      "/images/wine.png";

    const giftSetName =
      item.giftSetName ||
      item.gift_set_name ||
      "Wine Gift Set";

    return {
      id: item.id,

      isGiftSet: true,

      giftSetId,

      productId: null,

      variantId: null,

      name: giftSetName,

      category: "Gift Set",

      image: giftSetImage,

      bottleSize: "",

      vintage: "",

      price: giftSetPrice,

      mrp: giftSetMrp,

      quantity:
        Number(item.quantity) || 0,

      stockQuantity:
        Number(
          item.giftSetStockQuantity ??
          item.gift_set_stock_quantity
        ) || 0,

      giftSetName,

      giftSetDescription:
        item.giftSetDescription ||
        item.gift_set_description ||
        "",

      giftSetImage,

      giftSetPrice,

      giftSetMrp,

      giftSetStockQuantity:
        Number(
          item.giftSetStockQuantity ??
          item.gift_set_stock_quantity
        ) || 0,

      giftSetActive:
        item.giftSetActive ??
        item.gift_set_is_active ??
        true,
    };
  }

  /* ---------------------------------------------------
     NORMAL WINE
  --------------------------------------------------- */

  return {
    id: item.id,

    isGiftSet: false,

    giftSetId: null,

    productId: Number(
      item.productId ??
      item.product_id
    ),

    variantId: Number(
      item.variantId ??
      item.variant_id
    ),

    name:
      item.name || "Wine",

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

    vintage:
      item.vintage || "",

    price:
      Number(
        item.price ??
        item.selling_price
      ) || 0,

    mrp:
      Number(item.mrp) || 0,

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

export function CartProvider({
  children,
}) {
  const {
    token,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [cartItems, setCartItems] =
    useState(() => {
      try {
        const savedCart =
          localStorage.getItem(
            CART_STORAGE_KEY
          );

        if (!savedCart) {
          return [];
        }

        const parsedCart =
          JSON.parse(savedCart);

        if (
          !Array.isArray(parsedCart)
        ) {
          return [];
        }

        return normalizeCartItems(
          parsedCart
        );
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

  const loadDatabaseCart =
    async (authToken) => {
      if (!authToken) {
        return;
      }

      try {
        setLoading(true);

        const response =
          await fetch(
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

        if (
          response.status === 401
        ) {
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

      if (
        !Array.isArray(parsedCart)
      ) {
        setCartItems([]);

        return;
      }

      setCartItems(
        normalizeCartItems(
          parsedCart
        )
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
     ADD NORMAL WINE TO CART
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
      !Number.isFinite(
        addQuantity
      ) ||
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
              item.isGiftSet !== true &&
              Number(
                item.productId
              ) === productId &&
              Number(
                item.variantId
              ) === variantId
          );

        if (existingItem) {
          return currentItems.map(
            (item) => {
              const sameItem =
                item.isGiftSet !==
                  true &&
                Number(
                  item.productId
                ) === productId &&
                Number(
                  item.variantId
                ) === variantId;

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
            isGiftSet: false,

            giftSetId: null,

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
              product.image_url ||
              product.images?.[0]
                ?.image_url ||
              "/images/wine.png",

            bottleSize:
              variant.bottle_size ||
              variant.bottleSize ||
              "",

            vintage:
              product.vintage || "",

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
     ADD GIFT SET TO CART
  ------------------------------------------------------- */

  const addGiftSetToCart =
    async (
      giftSet,
      quantity = 1
    ) => {
      const giftSetId =
        Number(
          giftSet?.id ??
          giftSet?.giftSetId ??
          giftSet?.gift_set_id
        );

      const addQuantity =
        Number(quantity);

      if (
        !Number.isInteger(
          giftSetId
        ) ||
        giftSetId <= 0
      ) {
        throw new Error(
          "Invalid gift set"
        );
      }

      if (
        !Number.isInteger(
          addQuantity
        ) ||
        addQuantity <= 0
      ) {
        throw new Error(
          "Invalid quantity"
        );
      }

      const giftSetPrice =
        Number(
          giftSet.selling_price ??
            giftSet.sellingPrice ??
            giftSet.price ??
            giftSet.giftSetPrice
        ) || 0;

      const giftSetMrp =
        Number(
          giftSet.mrp ??
            giftSet.giftSetMrp
        ) || 0;

      const giftSetStock =
        Number(
          giftSet.stock_quantity ??
            giftSet.stockQuantity ??
            giftSet.giftSetStockQuantity
        ) || 0;

      const giftSetName =
        giftSet.name ||
        giftSet.giftSetName ||
        "Wine Gift Set";

      const giftSetImage =
        giftSet.image_url ||
        giftSet.image ||
        giftSet.giftSetImage ||
        "/images/wine.png";

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
              `${API_BASE_URL}/cart/gift-sets`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  Authorization:
                    `Bearer ${token}`,
                },

                body: JSON.stringify({
                  gift_set_id:
                    giftSetId,

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
                "Failed to add gift set to cart"
            );
          }

          await loadDatabaseCart(
            token
          );
        } catch (error) {
          console.error(
            "Error adding gift set to cart:",
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
                item.isGiftSet ===
                  true &&
                Number(
                  item.giftSetId
                ) === giftSetId
            );

          if (existingItem) {
            const newQuantity =
              Number(
                existingItem.quantity ||
                  0
              ) + addQuantity;

            if (
              giftSetStock > 0 &&
              newQuantity >
                giftSetStock
            ) {
              throw new Error(
                `Only ${giftSetStock} gift set(s) available`
              );
            }

            return currentItems.map(
              (item) => {
                if (
                  item.isGiftSet !==
                    true ||
                  Number(
                    item.giftSetId
                  ) !== giftSetId
                ) {
                  return item;
                }

                return {
                  ...item,

                  quantity:
                    newQuantity,
                };
              }
            );
          }

          if (
            giftSetStock > 0 &&
            addQuantity >
              giftSetStock
          ) {
            throw new Error(
              `Only ${giftSetStock} gift set(s) available`
            );
          }

          return [
            ...currentItems,

            {
              isGiftSet: true,

              giftSetId,

              productId: null,

              variantId: null,

              name:
                giftSetName,

              category:
                "Gift Set",

              image:
                giftSetImage,

              bottleSize: "",

              vintage: "",

              price:
                giftSetPrice,

              mrp:
                giftSetMrp,

              quantity:
                addQuantity,

              stockQuantity:
                giftSetStock,

              giftSetName,

              giftSetDescription:
                giftSet.description ||
                giftSet.giftSetDescription ||
                "",

              giftSetImage,

              giftSetPrice,

              giftSetMrp,

              giftSetStockQuantity:
                giftSetStock,

              giftSetActive:
                giftSet.is_active ??
                giftSet.isActive ??
                true,
            },
          ];
        }
      );
    };

  /* -------------------------------------------------------
     SET NORMAL WINE EXACT QUANTITY
  ------------------------------------------------------- */

  const setCartItemQuantity =
    async (
      productId,
      variantId,
      quantity
    ) => {
      const newQuantity =
        Number(quantity);

      if (
        !Number.isFinite(
          newQuantity
        ) ||
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
            item.isGiftSet !==
              true &&
            Number(
              item.productId
            ) ===
              numericProductId &&
            Number(
              item.variantId
            ) ===
              numericVariantId
        );

      if (!currentItem) {
        return;
      }

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
                item.isGiftSet !==
                  true &&
                Number(
                  item.productId
                ) ===
                  numericProductId &&
                Number(
                  item.variantId
                ) ===
                  numericVariantId;

              if (!sameItem) {
                return item;
              }

              return {
                ...item,

                quantity:
                  newQuantity,
              };
            }
          )
      );
    };

  /* -------------------------------------------------------
     SET GIFT SET EXACT QUANTITY
     
     NOTE:
     The backend PATCH endpoint for Gift Sets
     will be added in the next backend step.
  ------------------------------------------------------- */

  const setGiftSetQuantity =
    async (
      giftSetId,
      quantity
    ) => {
      const numericGiftSetId =
        Number(giftSetId);

      const newQuantity =
        Number(quantity);

      if (
        !Number.isInteger(
          numericGiftSetId
        ) ||
        numericGiftSetId <= 0
      ) {
        return;
      }

      if (
        !Number.isInteger(
          newQuantity
        ) ||
        newQuantity < 0
      ) {
        return;
      }

      const currentItem =
        cartItems.find(
          (item) =>
            item.isGiftSet ===
              true &&
            Number(
              item.giftSetId
            ) ===
              numericGiftSetId
        );

      if (!currentItem) {
        return;
      }

      if (newQuantity === 0) {
        await removeGiftSetFromCart(
          numericGiftSetId
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
              `${API_BASE_URL}/cart/gift-sets/${numericGiftSetId}`,
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
                "Failed to update gift set quantity"
            );
          }

          await loadDatabaseCart(
            token
          );
        } catch (error) {
          console.error(
            "Error updating gift set quantity:",
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

      const stockQuantity =
        Number(
          currentItem
            .giftSetStockQuantity ??
            currentItem.stockQuantity ??
            0
        );

      if (
        stockQuantity > 0 &&
        newQuantity >
          stockQuantity
      ) {
        throw new Error(
          `Only ${stockQuantity} gift set(s) available`
        );
      }

      setCartItems(
        (currentItems) =>
          currentItems.map(
            (item) => {
              if (
                item.isGiftSet !==
                  true ||
                Number(
                  item.giftSetId
                ) !==
                  numericGiftSetId
              ) {
                return item;
              }

              return {
                ...item,

                quantity:
                  newQuantity,
              };
            }
          )
      );
    };

  /* -------------------------------------------------------
     REMOVE NORMAL WINE FROM CART
  ------------------------------------------------------- */

  const removeFromCart =
    async (
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
                item.isGiftSet !==
                  true &&
                Number(
                  item.productId
                ) ===
                  Number(productId) &&
                Number(
                  item.variantId
                ) ===
                  Number(variantId)
              )
          )
      );
    };

  /* -------------------------------------------------------
     REMOVE GIFT SET FROM CART
     
     NOTE:
     The backend DELETE endpoint for Gift Sets
     will be added in the next backend step.
  ------------------------------------------------------- */

  const removeGiftSetFromCart =
    async (
      giftSetId
    ) => {
      const numericGiftSetId =
        Number(giftSetId);

      if (
        !Number.isInteger(
          numericGiftSetId
        ) ||
        numericGiftSetId <= 0
      ) {
        return;
      }

      if (
        isAuthenticated &&
        token
      ) {
        try {
          setLoading(true);

          const response =
            await fetch(
              `${API_BASE_URL}/cart/gift-sets/${numericGiftSetId}`,
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
                "Failed to remove gift set"
            );
          }

          await loadDatabaseCart(
            token
          );
        } catch (error) {
          console.error(
            "Error removing gift set:",
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
                item.isGiftSet ===
                  true &&
                Number(
                  item.giftSetId
                ) ===
                  numericGiftSetId
              )
          )
      );
    };

  /* -------------------------------------------------------
     INCREASE NORMAL WINE QUANTITY
  ------------------------------------------------------- */

  const increaseQuantity =
    async (
      productId,
      variantId
    ) => {
      const currentItem =
        cartItems.find(
          (item) =>
            item.isGiftSet !==
              true &&
            Number(
              item.productId
            ) ===
              Number(productId) &&
            Number(
              item.variantId
            ) ===
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
     DECREASE NORMAL WINE QUANTITY
  ------------------------------------------------------- */

  const decreaseQuantity =
    async (
      productId,
      variantId
    ) => {
      const currentItem =
        cartItems.find(
          (item) =>
            item.isGiftSet !==
              true &&
            Number(
              item.productId
            ) ===
              Number(productId) &&
            Number(
              item.variantId
            ) ===
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
     INCREASE GIFT SET QUANTITY
  ------------------------------------------------------- */

  const increaseGiftSetQuantity =
    async (
      giftSetId
    ) => {
      const currentItem =
        cartItems.find(
          (item) =>
            item.isGiftSet ===
              true &&
            Number(
              item.giftSetId
            ) ===
              Number(giftSetId)
        );

      if (!currentItem) {
        return;
      }

      const newQuantity =
        Number(
          currentItem.quantity || 0
        ) + 1;

      await setGiftSetQuantity(
        giftSetId,
        newQuantity
      );
    };

  /* -------------------------------------------------------
     DECREASE GIFT SET QUANTITY
  ------------------------------------------------------- */

  const decreaseGiftSetQuantity =
    async (
      giftSetId
    ) => {
      const currentItem =
        cartItems.find(
          (item) =>
            item.isGiftSet ===
              true &&
            Number(
              item.giftSetId
            ) ===
              Number(giftSetId)
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
        await removeGiftSetFromCart(
          giftSetId
        );

        return;
      }

      await setGiftSetQuantity(
        giftSetId,
        newQuantity
      );
    };

  /* -------------------------------------------------------
     CLEAR CART
  ------------------------------------------------------- */

  const clearCart =
    async () => {
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
        Number(
          item.price || 0
        ) *
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

    addGiftSetToCart,

    setCartItemQuantity,

    setGiftSetQuantity,

    removeFromCart,

    removeGiftSetFromCart,

    increaseQuantity,

    decreaseQuantity,

    increaseGiftSetQuantity,

    decreaseGiftSetQuantity,

    clearCart,
  };

  return (
    <CartContext.Provider
      value={value}
    >
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