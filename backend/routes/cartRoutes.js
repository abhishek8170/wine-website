const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  getCart,
  addToCart,
  updateCartItem,
  addGiftSetToCart,
  updateGiftSetCartItem,
  removeCartItem,
  removeGiftSetCartItem,
  clearCart,
} = require("../controllers/cartController");

const router = express.Router();

// =====================================
// AUTHENTICATION
// =====================================

router.use(authMiddleware);

// =====================================
// GET CART
// =====================================

router.get("/", getCart);

// =====================================
// NORMAL PRODUCT CART
// =====================================

router.post("/items", addToCart);

router.patch(
  "/items/:variantId",
  updateCartItem
);

router.delete(
  "/items/:variantId",
  removeCartItem
);

// =====================================
// GIFT SET CART
// =====================================

router.post(
  "/gift-sets",
  addGiftSetToCart
);

router.patch(
  "/gift-sets/:giftSetId",
  updateGiftSetCartItem
);

router.delete(
  "/gift-sets/:giftSetId",
  removeGiftSetCartItem
);

// =====================================
// CLEAR CART
// =====================================

router.delete(
  "/",
  clearCart
);

module.exports = router;