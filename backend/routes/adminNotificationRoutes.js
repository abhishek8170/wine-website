const express = require("express");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const {
  getAdminNotifications,
  getAdminUnreadNotificationCount,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  deleteAdminNotification,
  deleteAllAdminNotifications,
} = require("../controllers/adminNotificationController");

const router = express.Router();

// =====================================================
// ADMIN AUTHENTICATION
// =====================================================

router.use(adminAuthMiddleware);

// =====================================================
// GET NOTIFICATIONS
// =====================================================

router.get("/", getAdminNotifications);

// =====================================================
// GET UNREAD COUNT
// =====================================================

router.get("/unread-count", getAdminUnreadNotificationCount);

// =====================================================
// MARK ALL AS READ
// =====================================================

router.patch("/read-all", markAllAdminNotificationsAsRead);

// =====================================================
// DELETE ALL / CLEAR ALL
// =====================================================

router.delete("/clear-all", deleteAllAdminNotifications);

// =====================================================
// MARK ONE AS READ
// =====================================================

router.patch("/:id/read", markAdminNotificationAsRead);

// =====================================================
// DELETE ONE
// =====================================================

router.delete("/:id", deleteAdminNotification);

module.exports = router;