const express = require("express");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const {
  getAdminReviews,
  updateReviewStatus,
  deleteReview,
} = require("../controllers/adminReviewController");

const router = express.Router();

router.use(adminAuthMiddleware);

router.get("/", getAdminReviews);

router.patch(
  "/:id/status",
  updateReviewStatus
);

router.delete(
  "/:id",
  deleteReview
);

module.exports = router;
