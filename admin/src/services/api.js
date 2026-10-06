
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

/*
|--------------------------------------------------------------------------
| GENERIC API REQUEST
|--------------------------------------------------------------------------
*/

const apiRequest = async (
  endpoint,
  options = {}
) => {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Something went wrong"
    );
  }

  return data;
};


/*
|--------------------------------------------------------------------------
| ADMIN AUTHENTICATION
|--------------------------------------------------------------------------
*/

export const adminLogin = async (
  email,
  password
) =>
  apiRequest(
    "/admin/auth/login",
    {
      method: "POST",

      body: JSON.stringify({
        email,
        password,
      }),
    }
  );


export const getCurrentAdmin = async (
  token
) =>
  apiRequest(
    "/admin/auth/me",
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );


/*
|--------------------------------------------------------------------------
| ADMIN DASHBOARD
|--------------------------------------------------------------------------
*/

export const getDashboardStats = async (
  token
) =>
  apiRequest(
    "/admin/dashboard/stats",
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );


/*
|--------------------------------------------------------------------------
| ADMIN PRODUCTS
|--------------------------------------------------------------------------
*/

export const getAdminProducts = async (
  token
) =>
  apiRequest(
    "/admin/products",
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );


export const getAdminProductById = async (
  token,
  id
) =>
  apiRequest(
    `/admin/products/${id}`,
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );


export const createAdminProduct = async (
  token,
  productData
) =>
  apiRequest(
    "/admin/products",
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify(
        productData
      ),
    }
  );


export const updateAdminProduct = async (
  token,
  id,
  productData
) =>
  apiRequest(
    `/admin/products/${id}`,
    {
      method: "PUT",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify(
        productData
      ),
    }
  );


export const deleteAdminProduct = async (
  token,
  id
) =>
  apiRequest(
    `/admin/products/${id}`,
    {
      method: "DELETE",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );


export const activateAdminProduct = async (
  token,
  id
) =>
  apiRequest(
    `/admin/products/${id}/activate`,
    {
      method: "PATCH",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );


/*
|--------------------------------------------------------------------------
| PRODUCT IMAGE UPLOAD
|--------------------------------------------------------------------------
*/

export const uploadProductImage = async (
  token,
  imageFile
) => {
  const formData =
    new FormData();

  formData.append(
    "image",
    imageFile
  );

  const response =
    await fetch(
      `${API_BASE_URL}/admin/uploads/product-image`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: formData,
      }
    );

  let data = {};

  try {
    data =
      await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Image upload failed"
    );
  }

  return data;
};


/*
|--------------------------------------------------------------------------
| PRODUCT VARIANTS
|--------------------------------------------------------------------------
*/

export const getAdminProductVariants =
  async (
    token,
    productId
  ) =>
    apiRequest(
      `/admin/products/${productId}/variants`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


export const getAdminProductVariantById =
  async (
    token,
    productId,
    variantId
  ) =>
    apiRequest(
      `/admin/products/${productId}/variants/${variantId}`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


export const createAdminProductVariant =
  async (
    token,
    productId,
    variantData
  ) =>
    apiRequest(
      `/admin/products/${productId}/variants`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify(
          variantData
        ),
      }
    );


export const updateAdminProductVariant =
  async (
    token,
    productId,
    variantId,
    variantData
  ) =>
    apiRequest(
      `/admin/products/${productId}/variants/${variantId}`,
      {
        method: "PUT",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify(
          variantData
        ),
      }
    );


export const deleteAdminProductVariant =
  async (
    token,
    productId,
    variantId
  ) =>
    apiRequest(
      `/admin/products/${productId}/variants/${variantId}`,
      {
        method: "DELETE",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


export const activateAdminProductVariant =
  async (
    token,
    productId,
    variantId
  ) =>
    apiRequest(
      `/admin/products/${productId}/variants/${variantId}/activate`,
      {
        method: "PATCH",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


/*
|--------------------------------------------------------------------------
| ADMIN INVENTORY
|--------------------------------------------------------------------------
*/

export const getAdminInventory = async (
  token
) =>
  apiRequest(
    "/admin/inventory",
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );


export const addAdminStock = async (
  token,
  variantId,
  stockData
) =>
  apiRequest(
    `/admin/inventory/${variantId}/add-stock`,
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify(
        stockData
      ),
    }
  );


export const removeAdminStock = async (
  token,
  variantId,
  stockData
) =>
  apiRequest(
    `/admin/inventory/${variantId}/remove-stock`,
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify(
        stockData
      ),
    }
  );


export const getAdminInventoryHistory =
  async (
    token,
    variantId
  ) =>
    apiRequest(
      `/admin/inventory/${variantId}/history`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


/*
|--------------------------------------------------------------------------
| ADMIN CUSTOMERS
|--------------------------------------------------------------------------
*/

export const getAdminCustomers = async (
  token
) =>
  apiRequest(
    "/admin/customers",
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );


export const getAdminCustomerById =
  async (
    token,
    customerId
  ) =>
    apiRequest(
      `/admin/customers/${customerId}`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


export const updateAdminCustomerStatus =
  async (
    token,
    customerId,
    isActive
  ) =>
    apiRequest(
      `/admin/customers/${customerId}/status`,
      {
        method: "PATCH",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify({
          isActive,
        }),
      }
    );


/*
|--------------------------------------------------------------------------
| ADMIN ORDERS
|--------------------------------------------------------------------------
*/

export const getAdminOrders = async (
  token
) =>
  apiRequest(
    "/admin/orders",
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );


export const getAdminOrderById = async (
  token,
  orderId
) =>
  apiRequest(
    `/admin/orders/${orderId}`,
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );


export const updateAdminOrderStatus =
  async (
    token,
    orderId,
    statusData
  ) =>
    apiRequest(
      `/admin/orders/${orderId}/status`,
      {
        method: "PATCH",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify(
          statusData
        ),
      }
    );


export const updateAdminPaymentStatus =
  async (
    token,
    orderId,
    paymentData
  ) =>
    apiRequest(
      `/admin/orders/${orderId}/payment-status`,
      {
        method: "PATCH",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify(
          paymentData
        ),
      }
    );


/*
|--------------------------------------------------------------------------
| ADMIN SHIPMENTS
|--------------------------------------------------------------------------
*/

export const getAdminShipments = async (
  token
) =>
  apiRequest(
    "/admin/shipments",
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );


export const getAdminShipmentById =
  async (
    token,
    shipmentId
  ) =>
    apiRequest(
      `/admin/shipments/${shipmentId}`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


export const createAdminShipment =
  async (
    token,
    shipmentData
  ) =>
    apiRequest(
      "/admin/shipments",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify(
          shipmentData
        ),
      }
    );


export const updateAdminShipment =
  async (
    token,
    shipmentId,
    shipmentData
  ) =>
    apiRequest(
      `/admin/shipments/${shipmentId}`,
      {
        method: "PUT",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify(
          shipmentData
        ),
      }
    );


/*
|--------------------------------------------------------------------------
| ADMIN COUPONS
|--------------------------------------------------------------------------
*/

export const getAdminCoupons = async (
  token
) =>
  apiRequest(
    "/admin/coupons",
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );


export const getAdminCouponById =
  async (
    token,
    couponId
  ) =>
    apiRequest(
      `/admin/coupons/${couponId}`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


export const createAdminCoupon =
  async (
    token,
    couponData
  ) =>
    apiRequest(
      "/admin/coupons",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify(
          couponData
        ),
      }
    );


export const updateAdminCoupon =
  async (
    token,
    couponId,
    couponData
  ) =>
    apiRequest(
      `/admin/coupons/${couponId}`,
      {
        method: "PUT",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify(
          couponData
        ),
      }
    );


export const updateAdminCouponStatus =
  async (
    token,
    couponId,
    isActive
  ) =>
    apiRequest(
      `/admin/coupons/${couponId}/status`,
      {
        method: "PATCH",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify({
          is_active:
            isActive,
        }),
      }
    );


export const deleteAdminCoupon =
  async (
    token,
    couponId
  ) =>
    apiRequest(
      `/admin/coupons/${couponId}`,
      {
        method: "DELETE",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


/*
|--------------------------------------------------------------------------
| ADMIN / PUBLIC CATEGORIES
|--------------------------------------------------------------------------
*/

export const getAdminCategories =
  async () =>
    apiRequest(
      "/categories",
      {
        method: "GET",
      }
    );


/*
|--------------------------------------------------------------------------
| ADMIN NEWSLETTER
|--------------------------------------------------------------------------
*/

export const getAdminNewsletterSubscribers =
  async (
    token
  ) =>
    apiRequest(
      "/admin/newsletter",
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


export const updateAdminNewsletterSubscriberStatus =
  async (
    token,
    subscriberId,
    isActive
  ) =>
    apiRequest(
      `/admin/newsletter/${subscriberId}/status`,
      {
        method: "PATCH",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify({
          is_active:
            isActive,
        }),
      }
    );


/*
|--------------------------------------------------------------------------
| ADMIN CONTACT MESSAGES
|--------------------------------------------------------------------------
*/

export const getAdminContactMessages =
  async (
    token
  ) =>
    apiRequest(
      "/admin/contact-messages",
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


export const getAdminContactMessageById =
  async (
    token,
    messageId
  ) =>
    apiRequest(
      `/admin/contact-messages/${messageId}`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


export const updateAdminContactMessageStatus =
  async (
    token,
    messageId,
    status
  ) =>
    apiRequest(
      `/admin/contact-messages/${messageId}/status`,
      {
        method: "PATCH",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify({
          status,
        }),
      }
    );


/*
|--------------------------------------------------------------------------
| ADMIN LOGO UPLOAD
|--------------------------------------------------------------------------
*/

export const uploadAdminLogo = async (
  token,
  file
) => {
  const formData =
    new FormData();

  formData.append(
    "logo",
    file
  );

  const response =
    await fetch(
      `${API_BASE_URL}/admin/settings/logo`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: formData,
      }
    );

  let data = {};

  try {
    data =
      await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      "Failed to upload logo"
    );
  }

  return data;
};


/*
|--------------------------------------------------------------------------
| ADMIN OUR STORY
|--------------------------------------------------------------------------
*/

export const getAdminOurStory = async (
  token
) =>
  apiRequest(
    "/admin/our-story",
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );


/*
|--------------------------------------------------------------------------
| VINEYARD
|--------------------------------------------------------------------------
*/

export const createAdminVineyard = async (
  token,
  vineyardData
) =>
  apiRequest(
    "/admin/our-story/vineyard",
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify(
        vineyardData
      ),
    }
  );


export const updateAdminVineyard =
  async (
    token,
    vineyardId,
    vineyardData
  ) =>
    apiRequest(
      `/admin/our-story/vineyard/${vineyardId}`,
      {
        method: "PUT",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify(
          vineyardData
        ),
      }
    );


export const deleteAdminVineyard =
  async (
    token,
    vineyardId
  ) =>
    apiRequest(
      `/admin/our-story/vineyard/${vineyardId}`,
      {
        method: "DELETE",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


/*
|--------------------------------------------------------------------------
| WINEMAKING TEAM
|--------------------------------------------------------------------------
*/

export const createAdminTeamMember =
  async (
    token,
    teamData
  ) =>
    apiRequest(
      "/admin/our-story/team",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify(
          teamData
        ),
      }
    );


export const updateAdminTeamMember =
  async (
    token,
    teamId,
    teamData
  ) =>
    apiRequest(
      `/admin/our-story/team/${teamId}`,
      {
        method: "PUT",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify(
          teamData
        ),
      }
    );


export const deleteAdminTeamMember =
  async (
    token,
    teamId
  ) =>
    apiRequest(
      `/admin/our-story/team/${teamId}`,
      {
        method: "DELETE",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


/*
|--------------------------------------------------------------------------
| ADMIN OUR STORY IMAGE UPLOAD
|--------------------------------------------------------------------------
*/

export const uploadAdminOurStoryImage =
  async (
    token,
    file,
    type
  ) => {
    const formData =
      new FormData();

    formData.append(
      "image",
      file
    );

    const response =
      await fetch(
        `${API_BASE_URL}/admin/our-story/image/${type}`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: formData,
        }
      );

    let data = {};

    try {
      data =
        await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
        "Failed to upload Our Story image"
      );
    }

    return data;
  };


/*
|--------------------------------------------------------------------------
| CUSTOMER NOTIFICATION PREFERENCES
|--------------------------------------------------------------------------
*/

/*
| Get customer's notification preferences
|
| GET
| /api/notifications/preferences
|
| Requires:
| Authorization: Bearer <customer token>
*/
export const getCustomerNotificationPreferences =
  async (
    token
  ) =>
    apiRequest(
      "/notifications/preferences",
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );



export const updateCustomerNotificationPreferences =
  async (
    token,
    preferences
  ) =>
    apiRequest(
      "/notifications/preferences",
      {
        method: "PUT",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify(
          preferences
        ),
      }
    );

 /*
|--------------------------------------------------------------------------
| ADMIN NOTIFICATIONS
|--------------------------------------------------------------------------
*/

// Get admin notifications
export const getAdminNotifications = async (
  token
) =>
  apiRequest(
    "/admin/notifications",
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );


// Get unread admin notification count
export const getAdminUnreadNotificationCount =
  async (
    token
  ) =>
    apiRequest(
      "/admin/notifications/unread-count",
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


// Mark one admin notification as read
export const markAdminNotificationAsRead =
  async (
    token,
    notificationId
  ) =>
    apiRequest(
      `/admin/notifications/${notificationId}/read`,
      {
        method: "PATCH",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


// Mark all admin notifications as read
export const markAllAdminNotificationsAsRead =
  async (
    token
  ) =>
    apiRequest(
      "/admin/notifications/read-all",
      {
        method: "PATCH",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


// Delete one admin notification
export const deleteAdminNotification =
  async (
    token,
    notificationId
  ) =>
    apiRequest(
      `/admin/notifications/${notificationId}`,
      {
        method: "DELETE",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

   /*
|--------------------------------------------------------------------------
| DELETE ALL ADMIN NOTIFICATIONS
|--------------------------------------------------------------------------
*/

export const deleteAllAdminNotifications = async (
  token
) =>
  apiRequest(
    "/admin/notifications/clear-all",
    {
      method: "DELETE",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );
/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/


export default apiRequest;
