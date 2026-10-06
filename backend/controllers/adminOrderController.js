const pool = require("../config/db");

const {
  createCustomerNotification,
  NOTIFICATION_TYPES,
} = require("./notificationController");

const {
  notifyOrderStatusChanged,
  notifyPaymentStatusChanged,
  emitCreatedAdminNotification,
} = require("../utils/adminNotificationEvents");

const {
  emitCustomerNotificationCreated,
} = require("../utils/notificationSocket");

console.log("ADMIN ORDER CONTROLLER LOADED");

// =====================================
// GET ALL ADMIN ORDERS
// =====================================

const getAdminOrders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        o.id,
        o.order_number,
        o.order_status,
        o.payment_status,
        o.subtotal,
        o.discount_amount,
        o.shipping_amount,
        o.tax_amount,
        o.total_amount,
        o.coupon_code,
        o.created_at,
        o.updated_at,

        c.id AS customer_id,
        c.first_name AS customer_first_name,
        c.last_name AS customer_last_name,
        c.email AS customer_email,
        c.phone AS customer_phone,

        COUNT(oi.id)::integer AS item_count

      FROM orders o

      LEFT JOIN customers c
        ON c.id = o.customer_id

      LEFT JOIN order_items oi
        ON oi.order_id = o.id

      GROUP BY
        o.id,
        c.id

      ORDER BY o.created_at DESC
    `);

    const orders = result.rows.map((order) => ({
      id: order.id,

      orderNumber: order.order_number,

      orderStatus: order.order_status,

      paymentStatus: order.payment_status,

      subtotal: Number(order.subtotal || 0),

      discountAmount: Number(
        order.discount_amount || 0
      ),

      shippingAmount: Number(
        order.shipping_amount || 0
      ),

      taxAmount: Number(
        order.tax_amount || 0
      ),

      totalAmount: Number(
        order.total_amount || 0
      ),

      couponCode: order.coupon_code,

      createdAt: order.created_at,

      updatedAt: order.updated_at,

      customer: {
        id: order.customer_id,

        name: [
          order.customer_first_name,
          order.customer_last_name,
        ]
          .filter(Boolean)
          .join(" "),

        email: order.customer_email,

        phone: order.customer_phone,
      },

      itemCount: Number(
        order.item_count || 0
      ),
    }));

    return res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(
      "Get admin orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load orders",
    });
  }
};

// =====================================
// GET SINGLE ADMIN ORDER
// =====================================

const getAdminOrderById = async (
  req,
  res
) => {
  try {
    const orderId = Number(req.params.id);

    if (
      !Number.isInteger(orderId) ||
      orderId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // =====================================
    // ORDER + CUSTOMER + ADDRESS
    // =====================================

    const orderResult = await pool.query(
      `
      SELECT
        o.id,
        o.customer_id,
        o.address_id,
        o.order_number,
        o.order_status,
        o.payment_status,
        o.subtotal,
        o.discount_amount,
        o.shipping_amount,
        o.tax_amount,
        o.total_amount,
        o.coupon_code,
        o.delivery_instructions,
        o.created_at,
        o.updated_at,

        c.first_name AS customer_first_name,
        c.last_name AS customer_last_name,
        c.email AS customer_email,
        c.phone AS customer_phone,

        a.id AS delivery_address_id,
        a.address_line_1,
        a.address_line_2,
        a.city,
        a.state,
        a.postal_code,
        a.country,
        a.address_type

      FROM orders o

      LEFT JOIN customers c
        ON c.id = o.customer_id

      LEFT JOIN customer_addresses a
        ON a.id = o.address_id

      WHERE o.id = $1

      LIMIT 1
      `,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const orderRow = orderResult.rows[0];

    // =====================================
    // ORDER ITEMS
    // =====================================

    const itemsResult = await pool.query(
      `
      SELECT
        oi.id,
        oi.order_id,
        oi.product_id,
        oi.product_variant_id,
        oi.product_name,
        oi.bottle_size,
        oi.vintage,
        oi.quantity,
        oi.unit_price,
        oi.discount_amount,
        oi.subtotal,
        oi.created_at,

        pi.image_url,
        pi.alt_text

      FROM order_items oi

      LEFT JOIN LATERAL (
        SELECT
          image_url,
          alt_text

        FROM product_images

        WHERE product_id = oi.product_id

        ORDER BY
          is_primary DESC,
          sort_order ASC,
          id ASC

        LIMIT 1
      ) pi ON true

      WHERE oi.order_id = $1

      ORDER BY oi.id ASC
      `,
      [orderId]
    );

    // =====================================
    // ORDER STATUS HISTORY
    // =====================================

    const historyResult = await pool.query(
      `
      SELECT
        id,
        order_status,
        notes,
        changed_by,
        created_at

      FROM order_status_history

      WHERE order_id = $1

      ORDER BY created_at ASC, id ASC
      `,
      [orderId]
    );

    // =====================================
    // FORMAT ADDRESS
    // =====================================

    let address = null;

    if (orderRow.delivery_address_id) {
      address = {
        id: orderRow.delivery_address_id,

        addressLine1:
          orderRow.address_line_1,

        addressLine2:
          orderRow.address_line_2,

        city:
          orderRow.city,

        state:
          orderRow.state,

        postalCode:
          orderRow.postal_code,

        country:
          orderRow.country,

        addressType:
          orderRow.address_type,
      };
    }

    // =====================================
    // FORMAT ITEMS
    // =====================================

    const items = itemsResult.rows.map(
      (item) => ({
        id: item.id,

        orderId: item.order_id,

        productId: item.product_id,

        productVariantId:
          item.product_variant_id,

        productName:
          item.product_name,

        bottleSize:
          item.bottle_size,

        vintage:
          item.vintage,

        quantity:
          Number(item.quantity || 0),

        unitPrice:
          Number(item.unit_price || 0),

        discountAmount:
          Number(
            item.discount_amount || 0
          ),

        subtotal:
          Number(item.subtotal || 0),

        imageUrl:
          item.image_url || null,

        imageAlt:
          item.alt_text ||
          item.product_name,

        createdAt:
          item.created_at,
      })
    );

    // =====================================
    // FORMAT HISTORY
    // =====================================

    const statusHistory =
      historyResult.rows.map(
        (history) => ({
          id: history.id,

          status:
            history.order_status,

          notes:
            history.notes,

          changedBy:
            history.changed_by,

          createdAt:
            history.created_at,
        })
      );

    // =====================================
    // FINAL ORDER
    // =====================================

    const order = {
      id: orderRow.id,

      orderNumber:
        orderRow.order_number,

      orderStatus:
        orderRow.order_status,

      paymentStatus:
        orderRow.payment_status,

      subtotal:
        Number(orderRow.subtotal || 0),

      discountAmount:
        Number(
          orderRow.discount_amount || 0
        ),

      shippingAmount:
        Number(
          orderRow.shipping_amount || 0
        ),

      taxAmount:
        Number(
          orderRow.tax_amount || 0
        ),

      totalAmount:
        Number(
          orderRow.total_amount || 0
        ),

      couponCode:
        orderRow.coupon_code,

      deliveryInstructions:
        orderRow.delivery_instructions,

      createdAt:
        orderRow.created_at,

      updatedAt:
        orderRow.updated_at,

      customer: {
        id: orderRow.customer_id,

        name: [
          orderRow.customer_first_name,
          orderRow.customer_last_name,
        ]
          .filter(Boolean)
          .join(" "),

        email:
          orderRow.customer_email,

        phone:
          orderRow.customer_phone,
      },

      address,

      items,

      statusHistory,
    };

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "Get admin order details error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load order details",
    });
  }
};

// =====================================
// UPDATE ORDER STATUS
// =====================================

const updateAdminOrderStatus = async (
  req,
  res
) => {
  const client = await pool.connect();

  try {
    const orderId = Number(req.params.id);

    const {
      order_status,
      notes = "",
    } = req.body || {};

    // =====================================
    // VALIDATE ORDER ID
    // =====================================

    if (
      !Number.isInteger(orderId) ||
      orderId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // =====================================
    // VALIDATE STATUS
    // =====================================

    if (
      !order_status ||
      typeof order_status !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Order status is required",
      });
    }

    const nextStatus =
      order_status.trim();

    if (!nextStatus) {
      return res.status(400).json({
        success: false,
        message:
          "Order status is required",
      });
    }

    // =====================================
    // START TRANSACTION
    // =====================================

    await client.query("BEGIN");

    // =====================================
    // GET CURRENT ORDER
    // =====================================

    const orderResult =
      await client.query(
        `
        SELECT
          id,
          customer_id,
          order_number,
          order_status

        FROM orders

        WHERE id = $1

        FOR UPDATE
        `,
        [orderId]
      );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order =
      orderResult.rows[0];

    const previousStatus =
      String(order.order_status || "")
        .trim()
        .toLowerCase();

    const normalizedNextStatus =
      nextStatus.toLowerCase();

    // =====================================
    // CUSTOMER NOTIFICATION DETAILS
    // =====================================

    const statusNotificationMap = {
      processing: {
        type:
          NOTIFICATION_TYPES.ORDER_PROCESSING,

        title:
          "Order is being processed",

        message:
          `Your order ${order.order_number} is now being processed.`,
      },

      packed: {
        type:
          NOTIFICATION_TYPES.ORDER_PACKED,

        title:
          "Order packed",

        message:
          `Your order ${order.order_number} has been packed.`,
      },

      shipped: {
        type:
          NOTIFICATION_TYPES.ORDER_SHIPPED,

        title:
          "Order shipped",

        message:
          `Your order ${order.order_number} has been shipped.`,
      },

      "out for delivery": {
        type:
          NOTIFICATION_TYPES.ORDER_OUT_FOR_DELIVERY,

        title:
          "Order out for delivery",

        message:
          `Your order ${order.order_number} is out for delivery.`,
      },

      delivered: {
        type:
          NOTIFICATION_TYPES.ORDER_DELIVERED,

        title:
          "Order delivered",

        message:
          `Your order ${order.order_number} has been delivered.`,
      },

      cancelled: {
        type:
          NOTIFICATION_TYPES.ORDER_CANCELLED,

        title:
          "Order cancelled",

        message:
          `Your order ${order.order_number} has been cancelled.`,
      },
    };

    // =====================================
    // PREVENT DELIVERED → CANCELLED
    // =====================================

    if (
      previousStatus === "delivered" &&
      normalizedNextStatus === "cancelled"
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "A delivered order cannot be cancelled. Please use the return/refund process instead.",
      });
    }

    // =====================================
    // PREVENT CANCELLED → CANCELLED
    // =====================================

    if (
      previousStatus === "cancelled" &&
      normalizedNextStatus === "cancelled"
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "This order is already cancelled.",
      });
    }

    // =====================================
    // RESTORE INVENTORY ON CANCELLATION
    // =====================================

    const isNewCancellation =
      normalizedNextStatus === "cancelled" &&
      previousStatus !== "cancelled";

    if (isNewCancellation) {
      // =====================================
      // GET ORDER ITEMS
      // =====================================

      const itemsResult =
        await client.query(
          `
          SELECT
            id,
            product_variant_id,
            quantity

          FROM order_items

          WHERE order_id = $1

          ORDER BY id ASC
          `,
          [orderId]
        );

      // =====================================
      // RESTORE EACH VARIANT
      // =====================================

      for (const item of itemsResult.rows) {
        const variantId =
          Number(
            item.product_variant_id
          );

        const quantity =
          Number(item.quantity || 0);

        if (
          !Number.isInteger(variantId) ||
          variantId <= 0 ||
          quantity <= 0
        ) {
          continue;
        }

        // =====================================
        // LOCK VARIANT
        // =====================================

        const variantResult =
          await client.query(
            `
            SELECT
              id,
              stock_quantity

            FROM product_variants

            WHERE id = $1

            FOR UPDATE
            `,
            [variantId]
          );

        if (
          variantResult.rows.length === 0
        ) {
          throw new Error(
            `Product variant ${variantId} not found while restoring inventory`
          );
        }

        // =====================================
        // RESTORE STOCK
        // =====================================

        await client.query(
          `
          UPDATE product_variants

          SET
            stock_quantity =
              stock_quantity + $1,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $2
          `,
          [
            quantity,
            variantId,
          ]
        );

        // =====================================
        // RECORD INVENTORY MOVEMENT
        // =====================================

        await client.query(
          `
          INSERT INTO inventory_movements (
            product_variant_id,
            movement_type,
            quantity,
            reference_type,
            reference_id,
            notes,
            created_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            CURRENT_TIMESTAMP
          )
          `,
          [
            variantId,
            "Stock In",
            quantity,
            "ORDER",
            orderId,
            `Stock restored due to order cancellation (${order.order_number})`,
          ]
        );
      }
    }

    // =====================================
    // UPDATE ORDER
    // =====================================

    const updatedOrderResult =
      await client.query(
        `
        UPDATE orders

        SET
          order_status = $1,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $2

        RETURNING
          id,
          order_number,
          order_status,
          payment_status,
          updated_at
        `,
        [
          nextStatus,
          orderId,
        ]
      );

    // =====================================
    // STATUS HISTORY
    // =====================================

    await client.query(
      `
      INSERT INTO order_status_history (
        order_id,
        order_status,
        notes,
        changed_by,
        created_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        CURRENT_TIMESTAMP
      )
      `,
      [
        orderId,
        nextStatus,
        notes,
        req.admin?.email || "Admin",
      ]
    );

    // =====================================
    // CREATE CUSTOMER STATUS NOTIFICATION
    // =====================================

    const notification =
      statusNotificationMap[
        normalizedNextStatus
      ];

    const statusActuallyChanged =
      previousStatus !==
      normalizedNextStatus;

    let customerNotification = null;

    if (
      statusActuallyChanged &&
      notification &&
      order.customer_id
    ) {
      customerNotification =
        await createCustomerNotification(
          client,
        {
          customerId:
            order.customer_id,

          type:
            notification.type,

          title:
            notification.title,

          message:
            notification.message,

          entityType:
            "order",

          entityId:
            order.id,
        }
      );
    }

    // =====================================
    // CREATE ADMIN STATUS NOTIFICATION
    // =====================================

    let adminNotification = null;

    if (statusActuallyChanged) {
      adminNotification =
        await notifyOrderStatusChanged(
          client,
          {
            orderId:
              order.id,

            orderNumber:
              order.order_number,

            status:
              nextStatus,
          }
        );
    }

    // =====================================
    // COMMIT
    // =====================================

    await client.query("COMMIT");

    // Emit customer notification only after the
    // transaction has committed successfully.
    if (customerNotification?.id) {
      emitCustomerNotificationCreated({
        customerId:
          order.customer_id,
        notificationId:
          customerNotification.id,
      });
    }

    // =====================================
    // EMIT ADMIN NOTIFICATION AFTER COMMIT
    // =====================================

    if (adminNotification) {
      emitCreatedAdminNotification(
        adminNotification
      );
    }

    const updated =
      updatedOrderResult.rows[0];

    return res.json({
      success: true,

      message:
        "Order status updated successfully",

      order: {
        id: updated.id,

        orderNumber:
          updated.order_number,

        orderStatus:
          updated.order_status,

        paymentStatus:
          updated.payment_status,

        updatedAt:
          updated.updated_at,
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Rollback error:",
        rollbackError
      );
    }

    console.error(
      "Update admin order status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update order status",
    });
  } finally {
    client.release();
  }
};

// =====================================
// UPDATE PAYMENT STATUS
// =====================================

const updateAdminPaymentStatus = async (
  req,
  res
) => {
  const client = await pool.connect();

  try {
    const orderId = Number(req.params.id);

    const {
      payment_status,
    } = req.body || {};

    // =====================================
    // VALIDATE ORDER ID
    // =====================================

    if (
      !Number.isInteger(orderId) ||
      orderId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // =====================================
    // VALIDATE PAYMENT STATUS
    // =====================================

    if (
      !payment_status ||
      typeof payment_status !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment status is required",
      });
    }

    const nextPaymentStatus =
      payment_status.trim();

    if (!nextPaymentStatus) {
      return res.status(400).json({
        success: false,
        message:
          "Payment status is required",
      });
    }

    // =====================================
    // START TRANSACTION
    // =====================================

    await client.query("BEGIN");

    // =====================================
    // GET CURRENT PAYMENT STATUS
    // =====================================

    const currentResult =
      await client.query(
        `
        SELECT
          id,
          customer_id,
          order_number,
          order_status,
          payment_status

        FROM orders

        WHERE id = $1

        FOR UPDATE
        `,
        [orderId]
      );

    if (currentResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const currentOrder =
      currentResult.rows[0];

    const previousPaymentStatus =
      String(
        currentOrder.payment_status || ""
      )
        .trim()
        .toLowerCase();

    const normalizedNextPaymentStatus =
      nextPaymentStatus.toLowerCase();

    const paymentStatusChanged =
      previousPaymentStatus !==
      normalizedNextPaymentStatus;

    // =====================================
    // UPDATE PAYMENT STATUS
    // =====================================

    const result =
      await client.query(
        `
        UPDATE orders

        SET
          payment_status = $1,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $2

        RETURNING
          id,
          order_number,
          order_status,
          payment_status,
          updated_at
        `,
        [
          nextPaymentStatus,
          orderId,
        ]
      );

    const order =
      result.rows[0];

    // =====================================
    // CUSTOMER PAYMENT NOTIFICATION
    // =====================================

    let customerNotification = null;

    if (
      paymentStatusChanged &&
      currentOrder.customer_id
    ) {
      const successfulPaymentStatuses = [
        "paid",
        "successful",
        "success",
        "completed",
        "confirmed",
      ];

      const failedPaymentStatuses = [
        "failed",
        "failure",
        "declined",
        "rejected",
      ];

      // =====================================
      // PAYMENT SUCCESS
      // =====================================

      if (
        successfulPaymentStatuses.includes(
          normalizedNextPaymentStatus
        )
      ) {
        customerNotification =
          await createCustomerNotification(
            client,
          {
            customerId:
              currentOrder.customer_id,

            type:
              NOTIFICATION_TYPES.PAYMENT_CONFIRMATION,

            title:
              "Payment confirmed",

            message:
              `Your payment for order ${order.order_number} has been confirmed successfully.`,

            entityType:
              "order",

            entityId:
              order.id,
          }
        );
      }

      // =====================================
      // PAYMENT FAILED
      // =====================================

      if (
        failedPaymentStatuses.includes(
          normalizedNextPaymentStatus
        )
      ) {
        customerNotification =
          await createCustomerNotification(
            client,
          {
            customerId:
              currentOrder.customer_id,

            type:
              NOTIFICATION_TYPES.PAYMENT_FAILED,

            title:
              "Payment failed",

            message:
              `Your payment for order ${order.order_number} could not be completed.`,

            entityType:
              "order",

            entityId:
              order.id,
          }
        );
      }
    }

    // =====================================
    // CREATE ADMIN PAYMENT NOTIFICATION
    // =====================================

    let adminNotification = null;

    if (paymentStatusChanged) {
      adminNotification =
        await notifyPaymentStatusChanged(
          client,
          {
            orderId:
              order.id,

            orderNumber:
              order.order_number,

            paymentStatus:
              order.payment_status,
          }
        );
    }

    // =====================================
    // COMMIT
    // =====================================

    await client.query("COMMIT");

    if (customerNotification?.id) {
      emitCustomerNotificationCreated({
        customerId:
          currentOrder.customer_id,
        notificationId:
          customerNotification.id,
      });
    }

    // =====================================
    // EMIT ADMIN NOTIFICATION AFTER COMMIT
    // =====================================

    if (adminNotification) {
      emitCreatedAdminNotification(
        adminNotification
      );
    }

    return res.json({
      success: true,

      message:
        "Payment status updated successfully",

      order: {
        id:
          order.id,

        orderNumber:
          order.order_number,

        orderStatus:
          order.order_status,

        paymentStatus:
          order.payment_status,

        updatedAt:
          order.updated_at,
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Payment status rollback error:",
        rollbackError
      );
    }

    console.error(
      "Update admin payment status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update payment status",
    });
  } finally {
    client.release();
  }
};

// =====================================
// EXPORT
// =====================================

module.exports = {
  getAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
  updateAdminPaymentStatus,
};