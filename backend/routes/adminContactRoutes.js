const express = require("express");

const {
  getContactMessages,
  getContactMessageById,
  updateContactMessageStatus,
} = require("../controllers/adminContactController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

// =====================================
// ADMIN AUTHENTICATION
// =====================================

router.use(adminAuthMiddleware);

// =====================================
// GET ALL CONTACT MESSAGES
// =====================================

router.get("/", getContactMessages);

// =====================================
// GET SINGLE CONTACT MESSAGE
// =====================================

router.get("/:id", getContactMessageById);

// =====================================
// UPDATE CONTACT MESSAGE STATUS
// =====================================

router.patch(
  "/:id/status",
  updateContactMessageStatus
);

module.exports = router;