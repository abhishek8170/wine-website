const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} = require("../controllers/wishlistController");

const router = express.Router();

router.use(authMiddleware);

// Get wishlist
router.get("/", getWishlist);

// Add product
router.post("/", addToWishlist);

// Remove product
router.delete("/:productId", removeFromWishlist);

// Clear wishlist
router.delete("/", clearWishlist);

module.exports = router;