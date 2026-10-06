
const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  getCustomerNotificationPreferences,
  updateCustomerNotificationPreferences,
} = require("../controllers/notificationPreferenceController");

const router = express.Router();

// =====================================================
// CUSTOMER AUTHENTICATION
// =====================================================

router.use(authMiddleware);

// =====================================================
// GET PREFERENCES
// =====================================================

router.get(
  "/",
  getCustomerNotificationPreferences
);

// =====================================================
// UPDATE PREFERENCES
// =====================================================

router.patch(
  "/",
  updateCustomerNotificationPreferences
);

module.exports = router;