const pool = require("../config/db");

console.log("NOTIFICATION CONTROLLER LOADED");

// =====================================================
// NOTIFICATION TYPES
// =====================================================

const NOTIFICATION_TYPES = {
  ORDER_CONFIRMATION: "ORDER_CONFIRMATION",
  PAYMENT_CONFIRMATION: "PAYMENT_CONFIRMATION",
  PAYMENT_FAILED: "PAYMENT_FAILED",

  ORDER_PROCESSING: "ORDER_PROCESSING",
  ORDER_PACKED: "ORDER_PACKED",
  ORDER_SHIPPED: "ORDER_SHIPPED",
  ORDER_OUT_FOR_DELIVERY: "ORDER_OUT_FOR_DELIVERY",
  ORDER_DELIVERED: "ORDER_DELIVERED",

  ORDER_CANCELLED: "ORDER_CANCELLED",
  ORDER_REFUNDED: "ORDER_REFUNDED",

  BACK_IN_STOCK: "BACK_IN_STOCK",
  PRICE_CHANGE: "PRICE_CHANGE",
  PROMOTIONAL_OFFER: "PROMOTIONAL_OFFER",
};

// =====================================================
// CREATE CUSTOMER NOTIFICATION
// =====================================================

const createCustomerNotification = async (
  client,
  {
    customerId,
    type,
    title,
    message,
    entityType = null,
    entityId = null,
  }
) => {
  if (!customerId) {
    throw new Error(
      "Customer ID is required to create notification"
    );
  }

  if (!type) {
    throw new Error(
      "Notification type is required"
    );
  }

  if (!title) {
    throw new Error(
      "Notification title is required"
    );
  }

  if (!message) {
    throw new Error(
      "Notification message is required"
    );
  }

  const result = await client.query(
    `
    INSERT INTO customer_notifications (
      customer_id,
      type,
      title,
      message,
      entity_type,
      entity_id,
      is_read,
      created_at
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      FALSE,
      CURRENT_TIMESTAMP
    )
    RETURNING
      id,
      customer_id,
      type,
      title,
      message,
      entity_type,
      entity_id,
      is_read,
      created_at
    `,
    [
      customerId,
      type,
      title,
      message,
      entityType,
      entityId,
    ]
  );

  return result.rows[0];
};

// =====================================================
// GET CUSTOMER NOTIFICATIONS
// =====================================================

const getCustomerNotifications = async (
  req,
  res
) => {
  try {
    const customerId = req.customer.id;

    const result = await pool.query(
      `
      SELECT
        id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        is_read,
        created_at
      FROM customer_notifications
      WHERE customer_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT 100
      `,
      [customerId]
    );

    const notifications =
      result.rows.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,

        entityType:
          notification.entity_type,

        entityId:
          notification.entity_id,

        isRead:
          notification.is_read,

        createdAt:
          notification.created_at,
      }));

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error(
      "Get customer notifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load notifications",
    });
  }
};

// =====================================================
// GET UNREAD CUSTOMER NOTIFICATION COUNT
// =====================================================

const getCustomerUnreadNotificationCount =
  async (req, res) => {
    try {
      const customerId =
        req.customer.id;

      const result =
        await pool.query(
          `
          SELECT
            COUNT(*)::integer AS count
          FROM customer_notifications
          WHERE customer_id = $1
            AND is_read = FALSE
          `,
          [customerId]
        );

      return res.json({
        success: true,
        count:
          Number(result.rows[0].count) || 0,
      });
    } catch (error) {
      console.error(
        "Get unread notification count error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load notification count",
      });
    }
  };

// =====================================================
// MARK ONE CUSTOMER NOTIFICATION AS READ
// =====================================================

const markCustomerNotificationAsRead =
  async (req, res) => {
    try {
      const customerId =
        req.customer.id;

      const notificationId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          notificationId
        ) ||
        notificationId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid notification ID",
        });
      }

      const result =
        await pool.query(
          `
          UPDATE customer_notifications
          SET
            is_read = TRUE
          WHERE id = $1
            AND customer_id = $2
          RETURNING
            id,
            is_read
          `,
          [
            notificationId,
            customerId,
          ]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Notification not found",
        });
      }

      return res.json({
        success: true,
        message:
          "Notification marked as read",
      });
    } catch (error) {
      console.error(
        "Mark notification as read error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update notification",
      });
    }
  };

// =====================================================
// MARK ALL CUSTOMER NOTIFICATIONS AS READ
// =====================================================

const markAllCustomerNotificationsAsRead =
  async (req, res) => {
    try {
      const customerId =
        req.customer.id;

      await pool.query(
        `
        UPDATE customer_notifications
        SET
          is_read = TRUE
        WHERE customer_id = $1
          AND is_read = FALSE
        `,
        [customerId]
      );

      return res.json({
        success: true,
        message:
          "All notifications marked as read",
      });
    } catch (error) {
      console.error(
        "Mark all notifications as read error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update notifications",
      });
    }
  };

// =====================================================
// DELETE ONE CUSTOMER NOTIFICATION
// =====================================================

const deleteCustomerNotification =
  async (req, res) => {
    try {
      const customerId =
        req.customer.id;

      const notificationId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          notificationId
        ) ||
        notificationId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid notification ID",
        });
      }

      const result =
        await pool.query(
          `
          DELETE FROM customer_notifications
          WHERE id = $1
            AND customer_id = $2
          RETURNING id
          `,
          [
            notificationId,
            customerId,
          ]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Notification not found",
        });
      }

      return res.json({
        success: true,
        message:
          "Notification deleted",
      });
    } catch (error) {
      console.error(
        "Delete notification error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete notification",
      });
    }
  };

// =====================================================
// DELETE ALL CUSTOMER NOTIFICATIONS
// =====================================================

const deleteAllCustomerNotifications =
  async (req, res) => {
    try {
      const customerId =
        req.customer.id;

      const result =
        await pool.query(
          `
          DELETE FROM customer_notifications
          WHERE customer_id = $1
          `,
          [customerId]
        );

      return res.json({
        success: true,
        message:
          "All notifications cleared",
        deletedCount:
          result.rowCount,
      });
    } catch (error) {
      console.error(
        "Delete all notifications error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to clear notifications",
      });
    }
  };

// =====================================================
// CREATE DEFAULT NOTIFICATION PREFERENCES
// =====================================================

const createDefaultNotificationPreferences =
  async (customerId) => {
    const result = await pool.query(
      `
      INSERT INTO customer_notification_preferences (
        customer_id,

        order_confirmation_email,
        order_confirmation_sms,
        order_confirmation_whatsapp,

        payment_confirmation_email,
        payment_confirmation_sms,
        payment_confirmation_whatsapp,

        order_processing_email,
        order_processing_sms,
        order_processing_whatsapp,

        order_packed_email,
        order_packed_sms,
        order_packed_whatsapp,

        order_shipped_email,
        order_shipped_sms,
        order_shipped_whatsapp,

        order_out_for_delivery_email,
        order_out_for_delivery_sms,
        order_out_for_delivery_whatsapp,

        order_delivered_email,
        order_delivered_sms,
        order_delivered_whatsapp,

        promotional_offer_email,
        promotional_offer_sms,
        promotional_offer_whatsapp,

        price_change_email,
        price_change_sms,
        price_change_whatsapp,

        back_in_stock_email,
        back_in_stock_sms,
        back_in_stock_whatsapp,

        created_at,
        updated_at
      )
      VALUES (
        $1,

        TRUE,
        FALSE,
        FALSE,

        TRUE,
        FALSE,
        FALSE,

        TRUE,
        FALSE,
        FALSE,

        TRUE,
        FALSE,
        FALSE,

        TRUE,
        FALSE,
        FALSE,

        TRUE,
        FALSE,
        FALSE,

        TRUE,
        FALSE,
        FALSE,

        TRUE,
        FALSE,
        FALSE,

        TRUE,
        FALSE,
        FALSE,

        TRUE,
        FALSE,
        FALSE,

        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (customer_id)
      DO NOTHING
      RETURNING *
      `,
      [customerId]
    );

    return result.rows[0] || null;
  };

// =====================================================
// GET CUSTOMER NOTIFICATION PREFERENCES
// =====================================================

const getCustomerNotificationPreferences =
  async (req, res) => {
    try {
      const customerId =
        req.customer.id;

      await createDefaultNotificationPreferences(
        customerId
      );

      const result = await pool.query(
        `
        SELECT
          id,
          customer_id,

          order_confirmation_email,
          order_confirmation_sms,
          order_confirmation_whatsapp,

          payment_confirmation_email,
          payment_confirmation_sms,
          payment_confirmation_whatsapp,

          order_processing_email,
          order_processing_sms,
          order_processing_whatsapp,

          order_packed_email,
          order_packed_sms,
          order_packed_whatsapp,

          order_shipped_email,
          order_shipped_sms,
          order_shipped_whatsapp,

          order_out_for_delivery_email,
          order_out_for_delivery_sms,
          order_out_for_delivery_whatsapp,

          order_delivered_email,
          order_delivered_sms,
          order_delivered_whatsapp,

          promotional_offer_email,
          promotional_offer_sms,
          promotional_offer_whatsapp,

          price_change_email,
          price_change_sms,
          price_change_whatsapp,

          back_in_stock_email,
          back_in_stock_sms,
          back_in_stock_whatsapp,

          created_at,
          updated_at

        FROM customer_notification_preferences

        WHERE customer_id = $1

        LIMIT 1
        `,
        [customerId]
      );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Notification preferences not found",
        });
      }

      const row = result.rows[0];

      return res.json({
        success: true,

        preferences: {
          id: row.id,
          customerId:
            row.customer_id,

          orderConfirmation: {
            email:
              row.order_confirmation_email,
            sms:
              row.order_confirmation_sms,
            whatsapp:
              row.order_confirmation_whatsapp,
          },

          paymentConfirmation: {
            email:
              row.payment_confirmation_email,
            sms:
              row.payment_confirmation_sms,
            whatsapp:
              row.payment_confirmation_whatsapp,
          },

          orderProcessing: {
            email:
              row.order_processing_email,
            sms:
              row.order_processing_sms,
            whatsapp:
              row.order_processing_whatsapp,
          },

          orderPacked: {
            email:
              row.order_packed_email,
            sms:
              row.order_packed_sms,
            whatsapp:
              row.order_packed_whatsapp,
          },

          orderShipped: {
            email:
              row.order_shipped_email,
            sms:
              row.order_shipped_sms,
            whatsapp:
              row.order_shipped_whatsapp,
          },

          orderOutForDelivery: {
            email:
              row.order_out_for_delivery_email,
            sms:
              row.order_out_for_delivery_sms,
            whatsapp:
              row.order_out_for_delivery_whatsapp,
          },

          orderDelivered: {
            email:
              row.order_delivered_email,
            sms:
              row.order_delivered_sms,
            whatsapp:
              row.order_delivered_whatsapp,
          },

          promotionalOffer: {
            email:
              row.promotional_offer_email,
            sms:
              row.promotional_offer_sms,
            whatsapp:
              row.promotional_offer_whatsapp,
          },

          priceChange: {
            email:
              row.price_change_email,
            sms:
              row.price_change_sms,
            whatsapp:
              row.price_change_whatsapp,
          },

          backInStock: {
            email:
              row.back_in_stock_email,
            sms:
              row.back_in_stock_sms,
            whatsapp:
              row.back_in_stock_whatsapp,
          },

          createdAt:
            row.created_at,

          updatedAt:
            row.updated_at,
        },
      });
    } catch (error) {
      console.error(
        "Get notification preferences error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load notification preferences",
      });
    }
  };

// =====================================================
// UPDATE CUSTOMER NOTIFICATION PREFERENCES
// =====================================================

const updateCustomerNotificationPreferences =
  async (req, res) => {
    try {
      const customerId =
        req.customer.id;

      const {
        orderConfirmation,
        paymentConfirmation,
        orderProcessing,
        orderPacked,
        orderShipped,
        orderOutForDelivery,
        orderDelivered,
        promotionalOffer,
        priceChange,
        backInStock,
      } = req.body;

      await createDefaultNotificationPreferences(
        customerId
      );

      const result = await pool.query(
        `
        UPDATE customer_notification_preferences

        SET

          order_confirmation_email =
            COALESCE($1, order_confirmation_email),

          order_confirmation_sms =
            COALESCE($2, order_confirmation_sms),

          order_confirmation_whatsapp =
            COALESCE($3, order_confirmation_whatsapp),


          payment_confirmation_email =
            COALESCE($4, payment_confirmation_email),

          payment_confirmation_sms =
            COALESCE($5, payment_confirmation_sms),

          payment_confirmation_whatsapp =
            COALESCE($6, payment_confirmation_whatsapp),


          order_processing_email =
            COALESCE($7, order_processing_email),

          order_processing_sms =
            COALESCE($8, order_processing_sms),

          order_processing_whatsapp =
            COALESCE($9, order_processing_whatsapp),


          order_packed_email =
            COALESCE($10, order_packed_email),

          order_packed_sms =
            COALESCE($11, order_packed_sms),

          order_packed_whatsapp =
            COALESCE($12, order_packed_whatsapp),


          order_shipped_email =
            COALESCE($13, order_shipped_email),

          order_shipped_sms =
            COALESCE($14, order_shipped_sms),

          order_shipped_whatsapp =
            COALESCE($15, order_shipped_whatsapp),


          order_out_for_delivery_email =
            COALESCE($16, order_out_for_delivery_email),

          order_out_for_delivery_sms =
            COALESCE($17, order_out_for_delivery_sms),

          order_out_for_delivery_whatsapp =
            COALESCE($18, order_out_for_delivery_whatsapp),


          order_delivered_email =
            COALESCE($19, order_delivered_email),

          order_delivered_sms =
            COALESCE($20, order_delivered_sms),

          order_delivered_whatsapp =
            COALESCE($21, order_delivered_whatsapp),


          promotional_offer_email =
            COALESCE($22, promotional_offer_email),

          promotional_offer_sms =
            COALESCE($23, promotional_offer_sms),

          promotional_offer_whatsapp =
            COALESCE($24, promotional_offer_whatsapp),


          price_change_email =
            COALESCE($25, price_change_email),

          price_change_sms =
            COALESCE($26, price_change_sms),

          price_change_whatsapp =
            COALESCE($27, price_change_whatsapp),


          back_in_stock_email =
            COALESCE($28, back_in_stock_email),

          back_in_stock_sms =
            COALESCE($29, back_in_stock_sms),

          back_in_stock_whatsapp =
            COALESCE($30, back_in_stock_whatsapp),

          updated_at =
            CURRENT_TIMESTAMP

        WHERE customer_id = $31

        RETURNING *
        `,
        [
          orderConfirmation?.email,
          orderConfirmation?.sms,
          orderConfirmation?.whatsapp,

          paymentConfirmation?.email,
          paymentConfirmation?.sms,
          paymentConfirmation?.whatsapp,

          orderProcessing?.email,
          orderProcessing?.sms,
          orderProcessing?.whatsapp,

          orderPacked?.email,
          orderPacked?.sms,
          orderPacked?.whatsapp,

          orderShipped?.email,
          orderShipped?.sms,
          orderShipped?.whatsapp,

          orderOutForDelivery?.email,
          orderOutForDelivery?.sms,
          orderOutForDelivery?.whatsapp,

          orderDelivered?.email,
          orderDelivered?.sms,
          orderDelivered?.whatsapp,

          promotionalOffer?.email,
          promotionalOffer?.sms,
          promotionalOffer?.whatsapp,

          priceChange?.email,
          priceChange?.sms,
          priceChange?.whatsapp,

          backInStock?.email,
          backInStock?.sms,
          backInStock?.whatsapp,

          customerId,
        ]
      );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Notification preferences not found",
        });
      }

     const row = result.rows[0];

return res.json({
  success: true,

  message:
    "Notification preferences updated successfully",

  preferences: {
    orderConfirmation: {
      email:
        row.order_confirmation_email,
      sms:
        row.order_confirmation_sms,
      whatsapp:
        row.order_confirmation_whatsapp,
    },

    paymentConfirmation: {
      email:
        row.payment_confirmation_email,
      sms:
        row.payment_confirmation_sms,
      whatsapp:
        row.payment_confirmation_whatsapp,
    },

    orderProcessing: {
      email:
        row.order_processing_email,
      sms:
        row.order_processing_sms,
      whatsapp:
        row.order_processing_whatsapp,
    },

    orderPacked: {
      email:
        row.order_packed_email,
      sms:
        row.order_packed_sms,
      whatsapp:
        row.order_packed_whatsapp,
    },

    orderShipped: {
      email:
        row.order_shipped_email,
      sms:
        row.order_shipped_sms,
      whatsapp:
        row.order_shipped_whatsapp,
    },

    orderOutForDelivery: {
      email:
        row.order_out_for_delivery_email,
      sms:
        row.order_out_for_delivery_sms,
      whatsapp:
        row.order_out_for_delivery_whatsapp,
    },

    orderDelivered: {
      email:
        row.order_delivered_email,
      sms:
        row.order_delivered_sms,
      whatsapp:
        row.order_delivered_whatsapp,
    },

    promotionalOffer: {
      email:
        row.promotional_offer_email,
      sms:
        row.promotional_offer_sms,
      whatsapp:
        row.promotional_offer_whatsapp,
    },

    priceChange: {
      email:
        row.price_change_email,
      sms:
        row.price_change_sms,
      whatsapp:
        row.price_change_whatsapp,
    },

    backInStock: {
      email:
        row.back_in_stock_email,
      sms:
        row.back_in_stock_sms,
      whatsapp:
        row.back_in_stock_whatsapp,
    },
  },
});
    } catch (error) {
      console.error(
        "Update notification preferences error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update notification preferences",
      });
    }
  };

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  NOTIFICATION_TYPES,

  createCustomerNotification,

  getCustomerNotifications,

  getCustomerUnreadNotificationCount,

  markCustomerNotificationAsRead,

  markAllCustomerNotificationsAsRead,

  deleteCustomerNotification,

  deleteAllCustomerNotifications,

  createDefaultNotificationPreferences,

  getCustomerNotificationPreferences,

  updateCustomerNotificationPreferences,
};