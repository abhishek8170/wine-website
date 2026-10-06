const express = require("express");

const {
  uploadProductImage,
  uploadGiftSetImage,
} = require("../controllers/adminUploadController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| ADMIN AUTHENTICATION
|--------------------------------------------------------------------------
*/

router.use(
  adminAuthMiddleware
);

/*
|--------------------------------------------------------------------------
| PRODUCT IMAGE UPLOAD
|--------------------------------------------------------------------------
*/

router.post(
  "/product-image",
  uploadProductImage
);

/*
|--------------------------------------------------------------------------
| GIFT SET IMAGE UPLOAD
|--------------------------------------------------------------------------
*/

router.post(
  "/gift-set-image",
  uploadGiftSetImage
);

module.exports = router;