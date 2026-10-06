const express = require("express");

const {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  updateCouponStatus,
  deleteCoupon,
} = require("../controllers/couponController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

/*
  All coupon management routes require
  admin authentication.
*/
router.use(adminAuthMiddleware);

/*
  GET /api/admin/coupons

  Get all coupons
*/
router.get("/", getCoupons);

/*
  GET /api/admin/coupons/:id

  Get single coupon
*/
router.get("/:id", getCouponById);

/*
  POST /api/admin/coupons

  Create coupon
*/
router.post("/", createCoupon);

/*
  PUT /api/admin/coupons/:id

  Update coupon
*/
router.put("/:id", updateCoupon);

/*
  PATCH /api/admin/coupons/:id/status

  Activate / deactivate coupon
*/
router.patch(
  "/:id/status",
  updateCouponStatus
);

/*
  DELETE /api/admin/coupons/:id

  Delete coupon
*/
router.delete(
  "/:id",
  deleteCoupon
);

module.exports = router;