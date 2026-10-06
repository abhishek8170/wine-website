const pool = require("../config/db");

console.log("ADMIN NOTIFICATION CONTROLLER LOADED");

// =====================================================
// ADMIN NOTIFICATION TYPES
// =====================================================

const ADMIN_NOTIFICATION_TYPES = {
  NEW_ORDER: "NEW_ORDER",
  ORDER_STATUS_CHANGED: "ORDER_STATUS_CHANGED",
  ORDER_CANCELLED_BY_CUSTOMER: "ORDER_CANCELLED_BY_CUSTOMER",
  PAYMENT_STATUS_CHANGED: "PAYMENT_STATUS_CHANGED",
  LOW_STOCK: "LOW_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  NEW_CUSTOMER: "NEW_CUSTOMER",
  CONTACT_MESSAGE: "CONTACT_MESSAGE",
  NEW_REVIEW: "NEW_REVIEW",
  NEWSLETTER_SUBSCRIBED: "NEWSLETTER_SUBSCRIBED",
};

// =====================================================
// CREATE ADMIN NOTIFICATION
// =====================================================

const createAdminNotification = async (
  client,
  {
    adminId = null,
    type,
    title,
    message,
    entityType = null,
    entityId = null,
  }
) => {
  if (!type) {
    throw new Error("Admin notification type is required");
  }

  if (!title) {
    throw new Error("Admin notification title is required");
  }

  if (!message) {
    throw new Error("Admin notification message is required");
  }

  const result = await client.query(
    `
    INSERT INTO admin_notifications (
      admin_id,
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
      admin_id,
      type,
      title,
      message,
      entity_type,
      entity_id,
      is_read,
      created_at
    `,
    [
      adminId,
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
// GET ADMIN NOTIFICATIONS
// =====================================================

const getAdminNotifications = async (req, res) => {
  try {
    const adminId = req.admin?.id || null;

    const result = await pool.query(
      `
      SELECT
        id,
        admin_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        is_read,
        created_at
      FROM admin_notifications
      WHERE admin_id IS NULL
         OR admin_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT 100
      `,
      [adminId]
    );

    const notifications = result.rows.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,

      entityType: notification.entity_type,
      entityId: notification.entity_id,

      // IMPORTANT:
      // Always return the database value.
      isRead: Boolean(notification.is_read),

      createdAt: notification.created_at,
    }));

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error(
      "Get admin notifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load admin notifications",
    });
  }
};

// =====================================================
// GET UNREAD ADMIN NOTIFICATION COUNT
// =====================================================

const getAdminUnreadNotificationCount = async (
  req,
  res
) => {
  try {
    const adminId = req.admin?.id || null;

    const result = await pool.query(
      `
      SELECT
        COUNT(*)::integer AS count
      FROM admin_notifications
      WHERE is_read = FALSE
        AND (
          admin_id IS NULL
          OR admin_id = $1
        )
      `,
      [adminId]
    );

    return res.json({
      success: true,
      count: Number(result.rows[0].count) || 0,
    });
  } catch (error) {
    console.error(
      "Get admin unread notification count error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load notification count",
    });
  }
};

// =====================================================
// MARK ONE ADMIN NOTIFICATION AS READ
// =====================================================

const markAdminNotificationAsRead = async (
  req,
  res
) => {
  try {
    const adminId = req.admin?.id || null;

    const notificationId = Number(req.params.id);

    if (
      !Number.isInteger(notificationId) ||
      notificationId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const result = await pool.query(
      `
      UPDATE admin_notifications
      SET
        is_read = TRUE
      WHERE id = $1
        AND (
          admin_id IS NULL
          OR admin_id = $2
        )
      RETURNING
        id,
        is_read
      `,
      [
        notificationId,
        adminId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.json({
      success: true,
      message: "Notification marked as read",
      notification: {
        id: result.rows[0].id,
        isRead: Boolean(result.rows[0].is_read),
      },
    });
  } catch (error) {
    console.error(
      "Mark admin notification as read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
};

// =====================================================
// MARK ALL ADMIN NOTIFICATIONS AS READ
// =====================================================

const markAllAdminNotificationsAsRead = async (
  req,
  res
) => {
  try {
    const adminId = req.admin?.id || null;

    const result = await pool.query(
      `
      UPDATE admin_notifications
      SET
        is_read = TRUE
      WHERE is_read = FALSE
        AND (
          admin_id IS NULL
          OR admin_id = $1
        )
      RETURNING id
      `,
      [adminId]
    );

    return res.json({
      success: true,
      message: "All admin notifications marked as read",
      updatedCount: result.rowCount,
    });
  } catch (error) {
    console.error(
      "Mark all admin notifications as read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update notifications",
    });
  }
};

// =====================================================
// DELETE ONE ADMIN NOTIFICATION
// =====================================================

const deleteAdminNotification = async (
  req,
  res
) => {
  try {
    const adminId = req.admin?.id || null;

    const notificationId = Number(req.params.id);

    if (
      !Number.isInteger(notificationId) ||
      notificationId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM admin_notifications
      WHERE id = $1
        AND (
          admin_id IS NULL
          OR admin_id = $2
        )
      RETURNING id
      `,
      [
        notificationId,
        adminId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.json({
      success: true,
      message: "Admin notification deleted",
      deletedId: result.rows[0].id,
    });
  } catch (error) {
    console.error(
      "Delete admin notification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};

// =====================================================
// DELETE ALL ADMIN NOTIFICATIONS
// =====================================================

const deleteAllAdminNotifications = async (
  req,
  res
) => {
  try {
    const adminId = req.admin?.id || null;

    const result = await pool.query(
      `
      DELETE FROM admin_notifications
      WHERE admin_id IS NULL
         OR admin_id = $1
      `,
      [adminId]
    );

    return res.json({
      success: true,
      message: "All admin notifications cleared",
      deletedCount: result.rowCount,
    });
  } catch (error) {
    console.error(
      "Delete all admin notifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to clear notifications",
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  ADMIN_NOTIFICATION_TYPES,

  createAdminNotification,

  getAdminNotifications,

  getAdminUnreadNotificationCount,

  markAdminNotificationAsRead,

  markAllAdminNotificationsAsRead,

  deleteAdminNotification,

  deleteAllAdminNotifications,
};