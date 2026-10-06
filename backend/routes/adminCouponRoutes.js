const express = require("express");

const {
  getAdminCoupons,
  getAdminCouponById,
  createAdminCoupon,
  updateAdminCoupon,
  updateAdminCouponStatus,
  deleteAdminCoupon,
} = require("../controllers/adminCouponController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| All coupon routes require admin authentication
|--------------------------------------------------------------------------
*/

router.use(
  adminAuthMiddleware
);


/*
|--------------------------------------------------------------------------
| GET ALL COUPONS
|--------------------------------------------------------------------------
|
| GET /api/admin/coupons
|
*/

router.get(
  "/",
  getAdminCoupons
);


/*
|--------------------------------------------------------------------------
| GET SINGLE COUPON
|--------------------------------------------------------------------------
|
| GET /api/admin/coupons/:id
|
*/

router.get(
  "/:id",
  getAdminCouponById
);


/*
|--------------------------------------------------------------------------
| CREATE COUPON
|--------------------------------------------------------------------------
|
| POST /api/admin/coupons
|
*/

router.post(
  "/",
  createAdminCoupon
);


/*
|--------------------------------------------------------------------------
| UPDATE COUPON
|--------------------------------------------------------------------------
|
| PUT /api/admin/coupons/:id
|
*/

router.put(
  "/:id",
  updateAdminCoupon
);


/*
|--------------------------------------------------------------------------
| ACTIVATE / DEACTIVATE COUPON
|--------------------------------------------------------------------------
|
| PATCH /api/admin/coupons/:id/status
|
*/

router.patch(
  "/:id/status",
  updateAdminCouponStatus
);


/*
|--------------------------------------------------------------------------
| DELETE COUPON
|--------------------------------------------------------------------------
|
| DELETE /api/admin/coupons/:id
|
*/

router.delete(
  "/:id",
  deleteAdminCoupon
);


module.exports = router;