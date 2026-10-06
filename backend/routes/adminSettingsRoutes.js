const express = require("express");

const {
  getAdminSettings,
  updateAdminSettings,
  uploadAdminLogo,
} = require("../controllers/adminSettingsController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

// All settings routes require admin authentication
router.use(adminAuthMiddleware);

// Get settings
router.get("/", getAdminSettings);

// Update settings
router.put("/", updateAdminSettings);

// Upload logo

router.post(
  "/logo",
  uploadAdminLogo
);

module.exports = router;