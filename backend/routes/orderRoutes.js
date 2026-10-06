const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  createOrder,
  getCustomerOrders,
  getCustomerOrderDetails,
  cancelCustomerOrder,
} = require("../controllers/orderController");

const router = express.Router();

// =====================================
// AUTHENTICATION
// =====================================

router.use(authMiddleware);

// =====================================
// TEST
// =====================================

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Order routes are working",
  });
});

// =====================================
// GET ALL CUSTOMER ORDERS
// =====================================

router.get("/", getCustomerOrders);

// =====================================
// GET SINGLE ORDER
// =====================================

router.get(
  "/:id",
  getCustomerOrderDetails
);

// =====================================
// CREATE ORDER
// =====================================

router.post("/", createOrder);

// =====================================
// CANCEL ORDER (CUSTOMER)
// =====================================

router.patch("/:id/cancel", cancelCustomerOrder);

module.exports = router;