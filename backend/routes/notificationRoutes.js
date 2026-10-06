const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  getCustomerNotifications,
  getCustomerUnreadNotificationCount,
  markCustomerNotificationAsRead,
  markAllCustomerNotificationsAsRead,
  deleteCustomerNotification,
  deleteAllCustomerNotifications,

  getCustomerNotificationPreferences,
  updateCustomerNotificationPreferences,
} = require("../controllers/notificationController");

const router = express.Router();

// =====================================================
// CUSTOMER AUTHENTICATION
// =====================================================

router.use(authMiddleware);

// =====================================================
// CUSTOMER NOTIFICATIONS
// =====================================================

// GET /api/notifications
router.get(
  "/",
  getCustomerNotifications
);

// GET /api/notifications/unread-count
router.get(
  "/unread-count",
  getCustomerUnreadNotificationCount
);

// PATCH /api/notifications/read-all
router.patch(
  "/read-all",
  markAllCustomerNotificationsAsRead
);

// DELETE /api/notifications
router.delete(
  "/",
  deleteAllCustomerNotifications
);

// =====================================================
// CUSTOMER NOTIFICATION PREFERENCES
// =====================================================

// GET /api/notifications/preferences
router.get(
  "/preferences",
  getCustomerNotificationPreferences
);

// PUT /api/notifications/preferences
router.put(
  "/preferences",
  updateCustomerNotificationPreferences
);

// =====================================================
// SINGLE NOTIFICATION
// =====================================================

// PATCH /api/notifications/:id/read
router.patch(
  "/:id/read",
  markCustomerNotificationAsRead
);

// DELETE /api/notifications/:id
router.delete(
  "/:id",
  deleteCustomerNotification
);

module.exports = router;