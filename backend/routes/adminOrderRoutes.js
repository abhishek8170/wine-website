const express = require("express");

const {
  getAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
  updateAdminPaymentStatus,
} = require("../controllers/adminOrderController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

// =====================================
// ADMIN AUTHENTICATION
// =====================================

router.use(adminAuthMiddleware);

// =====================================
// GET ALL ORDERS
// =====================================

router.get("/", getAdminOrders);

// =====================================
// GET SINGLE ORDER
// =====================================

router.get("/:id", getAdminOrderById);

// =====================================
// UPDATE ORDER STATUS
// =====================================

router.patch(
  "/:id/status",
  updateAdminOrderStatus
);

// =====================================
// UPDATE PAYMENT STATUS
// =====================================

router.patch(
  "/:id/payment-status",
  updateAdminPaymentStatus
);

module.exports = router;