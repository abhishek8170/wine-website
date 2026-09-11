const express = require("express");

const {
  getReviews,
  getProductReviews,
} = require("../controllers/reviewController");

const router = express.Router();

// All approved reviews
router.get("/", getReviews);

// Reviews for a specific product
router.get("/product/:productId", getProductReviews);

module.exports = router;