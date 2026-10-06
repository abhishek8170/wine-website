const {
  createAdminNotification,
  ADMIN_NOTIFICATION_TYPES,
} = require("../controllers/adminNotificationController");

const {
  emitAdminNotificationCreated,
} = require("./notificationSocket");

// =====================================================
// CREATE + EMIT ADMIN NOTIFICATION
// =====================================================

const createAndEmitAdminNotification = async (
  client,
  {
    type,
    title,
    message,
    entityType = null,
    entityId = null,
    adminId = null,
  }
) => {
  const notification =
    await createAdminNotification(
      client,
      {
        adminId,

        type,

        title,

        message,

        entityType,

        entityId,
      }
    );

  return notification;
};

// =====================================================
// NEW ORDER
// =====================================================

const notifyNewOrder = async (
  client,
  {
    orderId,
    orderNumber,
    totalAmount,
  }
) => {
  return createAndEmitAdminNotification(
    client,
    {
      type:
        ADMIN_NOTIFICATION_TYPES.NEW_ORDER,

      title:
        "New Order",

      message:
        `New order ${orderNumber} has been placed for ₹${Number(
          totalAmount || 0
        ).toLocaleString("en-IN")}.`,

      entityType:
        "ORDER",

      entityId:
        orderId,
    }
  );
};

// =====================================================
// ORDER STATUS CHANGED
// =====================================================

const notifyOrderStatusChanged = async (
  client,
  {
    orderId,
    orderNumber,
    status,
  }
) => {
  return createAndEmitAdminNotification(
    client,
    {
      type:
        ADMIN_NOTIFICATION_TYPES.ORDER_STATUS_CHANGED,

      title:
        "Order Status Changed",

      message:
        `Order ${orderNumber} status changed to ${status}.`,

      entityType:
        "ORDER",

      entityId:
        orderId,
    }
  );
};

// =====================================================
// ORDER CANCELLED BY CUSTOMER
// =====================================================

const notifyOrderCancelledByCustomer = async (
  client,
  {
    orderId,
    orderNumber,
    wasPaid = false,
  }
) => {
  return createAndEmitAdminNotification(
    client,
    {
      type:
        ADMIN_NOTIFICATION_TYPES.ORDER_CANCELLED_BY_CUSTOMER,

      title: "Order Cancelled by Customer",

      message: wasPaid
        ? `Customer cancelled order ${orderNumber}. Payment was already received - a refund is needed.`
        : `Customer cancelled order ${orderNumber}.`,

      entityType: "ORDER",

      entityId: orderId,
    }
  );
};

// =====================================================
// PAYMENT STATUS CHANGED
// =====================================================

const notifyPaymentStatusChanged = async (
  client,
  {
    orderId,
    orderNumber,
    paymentStatus,
  }
) => {
  return createAndEmitAdminNotification(
    client,
    {
      type:
        ADMIN_NOTIFICATION_TYPES.PAYMENT_STATUS_CHANGED,

      title:
        "Payment Status Changed",

      message:
        `Payment status for order ${orderNumber} changed to ${paymentStatus}.`,

      entityType:
        "ORDER",

      entityId:
        orderId,
    }
  );
};

// =====================================================
// LOW STOCK
// =====================================================

const notifyLowStock = async (
  client,
  {
    variantId,
    productName,
    stockQuantity,
  }
) => {
  return createAndEmitAdminNotification(
    client,
    {
      type:
        ADMIN_NOTIFICATION_TYPES.LOW_STOCK,

      title:
        "Low Stock",

      message:
        `${productName} is running low on stock. Only ${stockQuantity} item(s) remaining.`,

      entityType:
        "PRODUCT_VARIANT",

      entityId:
        variantId,
    }
  );
};

// =====================================================
// OUT OF STOCK
// =====================================================

const notifyOutOfStock = async (
  client,
  {
    variantId,
    productName,
  }
) => {
  return createAndEmitAdminNotification(
    client,
    {
      type:
        ADMIN_NOTIFICATION_TYPES.OUT_OF_STOCK,

      title:
        "Out of Stock",

      message:
        `${productName} is now out of stock.`,

      entityType:
        "PRODUCT_VARIANT",

      entityId:
        variantId,
    }
  );
};

// =====================================================
// NEW CUSTOMER
// =====================================================

const notifyNewCustomer = async (
  client,
  {
    customerId,
    customerName,
    email,
  }
) => {
  return createAndEmitAdminNotification(
    client,
    {
      type:
        ADMIN_NOTIFICATION_TYPES.NEW_CUSTOMER,

      title:
        "New Customer",

      message:
        `A new customer ${customerName || "has"} registered${
          email ? ` (${email})` : ""
        }.`,

      entityType:
        "CUSTOMER",

      entityId:
        customerId,
    }
  );
};

// =====================================================
// CONTACT MESSAGE
// =====================================================

const notifyContactMessage = async (
  client,
  {
    messageId,
    customerName,
    subject,
  }
) => {
  return createAndEmitAdminNotification(
    client,
    {
      type:
        ADMIN_NOTIFICATION_TYPES.CONTACT_MESSAGE,

      title:
        "New Contact Message",

      message:
        `${customerName || "A customer"} sent a new contact message${
          subject ? `: ${subject}` : "."
        }`,

      entityType:
        "CONTACT_MESSAGE",

      entityId:
        messageId,
    }
  );
};

// =====================================================
// NEW REVIEW (pending approval)
// =====================================================

const notifyNewReview = async (
  client,
  {
    reviewId,
    productName,
    rating,
  }
) => {
  return createAndEmitAdminNotification(
    client,
    {
      type: ADMIN_NOTIFICATION_TYPES.NEW_REVIEW,
      title: "New Review Pending Approval",
      message: `A new ${rating}-star review${
        productName ? ` for ${productName}` : ""
      } is waiting for approval.`,
      entityType: "REVIEW",
      entityId: reviewId,
    }
  );
};

// =====================================================
// NEWSLETTER SUBSCRIBER
// =====================================================

const notifyNewsletterSubscribed = async (
  client,
  {
    subscriberId,
    email,
  }
) => {
  return createAndEmitAdminNotification(
    client,
    {
      type: ADMIN_NOTIFICATION_TYPES.NEWSLETTER_SUBSCRIBED,
      title: "New Newsletter Subscriber",
      message: `${email} subscribed to the newsletter.`,
      entityType: "NEWSLETTER_SUBSCRIBER",
      entityId: subscriberId,
    }
  );
};

// =====================================================
// EMIT AFTER COMMIT
// =====================================================

const emitCreatedAdminNotification =
  (notification) => {
    if (!notification?.id) {
      return;
    }

    emitAdminNotificationCreated(
      notification.id
    );
  };

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  notifyNewOrder,
  notifyOrderStatusChanged,
  notifyOrderCancelledByCustomer,
  notifyPaymentStatusChanged,
  notifyLowStock,
  notifyOutOfStock,
  notifyNewCustomer,
  notifyContactMessage,
  notifyNewReview,
  notifyNewsletterSubscribed,
  emitCreatedAdminNotification,
};