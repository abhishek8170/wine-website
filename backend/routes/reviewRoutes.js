const express = require("express");

const {
  getReviews,
  getProductReviews,
  createReview,
} = require("../controllers/reviewController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All approved reviews
router.get("/", getReviews);

// Reviews for a specific product
router.get("/product/:productId", getProductReviews);

// Logged-in customer submits a review
router.post(
  "/",
  authMiddleware,
  createReview
);

module.exports = router;