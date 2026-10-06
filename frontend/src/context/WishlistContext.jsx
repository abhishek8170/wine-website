import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { useAuth } from "./AuthContext.jsx";

const WishlistContext = createContext(null);

const API_BASE_URL = "/api";

const getGuestId = () => {
  try {
    let guestId = localStorage.getItem("wine_guest_id");

    if (!guestId) {
      guestId = crypto.randomUUID();
      localStorage.setItem("wine_guest_id", guestId);
    }

    return guestId;
  } catch (error) {
    console.error("Error creating guest ID:", error);

    return "guest";
  }
};

const getSavedGuestWishlist = () => {
  try {
    const savedWishlist =
      localStorage.getItem("wine_wishlist");

    return savedWishlist
      ? JSON.parse(savedWishlist)
      : [];
  } catch (error) {
    console.error(
      "Error loading guest wishlist:",
      error
    );

    return [];
  }
};

export function WishlistProvider({ children }) {
  const {
    token,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [wishlistItems, setWishlistItems] = useState(
    getSavedGuestWishlist
  );

  const [guestId] = useState(getGuestId);

  const [loading, setLoading] = useState(false);

  /*
    Load wishlist from PostgreSQL
    whenever customer logs in.
  */
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !token) {
      setWishlistItems(getSavedGuestWishlist());
      return;
    }

    const loadWishlist = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${API_BASE_URL}/wishlist`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load wishlist"
          );
        }

        setWishlistItems(data.wishlist || []);
      } catch (error) {
        console.error(
          "Failed to load database wishlist:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [
    token,
    isAuthenticated,
    authLoading,
  ]);

  /*
    Save guest wishlist only when
    the customer is NOT logged in.
  */
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      try {
        localStorage.setItem(
          "wine_wishlist",
          JSON.stringify(wishlistItems)
        );
      } catch (error) {
        console.error(
          "Error saving guest wishlist:",
          error
        );
      }
    }
  }, [
    wishlistItems,
    isAuthenticated,
    authLoading,
  ]);

  /*
    Check if product exists in wishlist
  */
  const isInWishlist = (productId) => {
    return wishlistItems.some(
      (item) =>
        Number(item.productId) === Number(productId)
    );
  };

  /*
    Add product
  */
  const addToWishlist = async (product) => {
    if (!product?.id) {
      return;
    }

    const productId = Number(product.id);

    /*
      LOGGED-IN CUSTOMER
      Save to PostgreSQL
    */
    if (isAuthenticated && token) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/wishlist`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              product_id: productId,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to add to wishlist"
          );
        }

        /*
          Reload complete wishlist from DB.
          This keeps frontend data consistent
          with PostgreSQL.
        */
        const wishlistResponse =
          await fetch(
            `${API_BASE_URL}/wishlist`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        const wishlistData =
          await wishlistResponse.json();

        if (!wishlistResponse.ok) {
          throw new Error(
            wishlistData.message ||
              "Failed to refresh wishlist"
          );
        }

        setWishlistItems(
          wishlistData.wishlist || []
        );
      } catch (error) {
        console.error(
          "Failed to add product to wishlist:",
          error
        );

        throw error;
      }

      return;
    }

    /*
      GUEST CUSTOMER
      Save to localStorage
    */
    setWishlistItems((currentItems) => {
      const alreadyExists =
        currentItems.some(
          (item) =>
            Number(item.productId) === productId
        );

      if (alreadyExists) {
        return currentItems;
      }

      const variant =
        product.variants?.[0];

      return [
        ...currentItems,
        {
          productId: productId,
          name: product.name,
          category:
            product.category_name || "Wine",
          image:
            product.images?.[0]?.image_url ||
            "/images/wine.png",
          price: Number(
            variant?.selling_price || 0
          ),
          mrp: Number(
            variant?.mrp || 0
          ),
          bottleSize:
            variant?.bottle_size || "",
          vintage:
            product.vintage || "",
        },
      ];
    });
  };

  /*
    Remove product
  */
  const removeFromWishlist = async (
    productId
  ) => {
    const numericProductId =
      Number(productId);

    /*
      LOGGED-IN CUSTOMER
    */
    if (isAuthenticated && token) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/wishlist/${numericProductId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to remove from wishlist"
          );
        }

        setWishlistItems((currentItems) =>
          currentItems.filter(
            (item) =>
              Number(item.productId) !==
              numericProductId
          )
        );
      } catch (error) {
        console.error(
          "Failed to remove wishlist item:",
          error
        );

        throw error;
      }

      return;
    }

    /*
      GUEST CUSTOMER
    */
    setWishlistItems((currentItems) =>
      currentItems.filter(
        (item) =>
          Number(item.productId) !==
          numericProductId
      )
    );
  };

  /*
    Toggle product
  */
  const toggleWishlist = async (product) => {
    if (!product?.id) {
      return;
    }

    const alreadyInWishlist =
      isInWishlist(product.id);

    if (alreadyInWishlist) {
      await removeFromWishlist(
        product.id
      );
    } else {
      await addToWishlist(product);
    }
  };

  /*
    Clear wishlist
  */
  const clearWishlist = async () => {
    /*
      LOGGED-IN CUSTOMER
    */
    if (isAuthenticated && token) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/wishlist`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to clear wishlist"
          );
        }

        setWishlistItems([]);
      } catch (error) {
        console.error(
          "Failed to clear wishlist:",
          error
        );

        throw error;
      }

      return;
    }

    /*
      GUEST CUSTOMER
    */
    setWishlistItems([]);
  };

  const wishlistCount =
    wishlistItems.length;

  const value = {
    wishlistItems,
    wishlistCount,
    guestId,
    loading,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
  };

  return (
    <WishlistContext.Provider
      value={value}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context =
    useContext(WishlistContext);

  if (!context) {
    throw new Error(
      "useWishlist must be used inside WishlistProvider"
    );
  }

  return context;
}