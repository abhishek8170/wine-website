const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cartController");

const router = express.Router();

// All cart routes require customer authentication
router.use(authMiddleware);

router.get("/", getCart);

router.post("/items", addToCart);

router.patch(
  "/items/:variantId",
  updateCartItem
);

router.delete(
  "/items/:variantId",
  removeCartItem
);

router.delete("/", clearCart);

module.exports = router;