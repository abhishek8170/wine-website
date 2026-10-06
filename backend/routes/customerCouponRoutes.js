const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  validateCoupon,
} = require("../controllers/customerCouponController");

const router = express.Router();

router.use(authMiddleware);

router.post("/validate", validateCoupon);

module.exports = router;