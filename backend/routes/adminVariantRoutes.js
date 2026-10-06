const express = require("express");

const {
  getProductVariants,
  getProductVariantById,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  activateProductVariant,
} = require("../controllers/adminVariantController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

/*
  All variant management routes require admin authentication.
*/

router.use(adminAuthMiddleware);

/*
  GET
  /api/admin/products/:productId/variants
*/

router.get(
  "/:productId/variants",
  getProductVariants
);

/*
  GET
  /api/admin/products/:productId/variants/:variantId
*/

router.get(
  "/:productId/variants/:variantId",
  getProductVariantById
);

/*
  POST
  /api/admin/products/:productId/variants
*/

router.post(
  "/:productId/variants",
  createProductVariant
);

/*
  PUT
  /api/admin/products/:productId/variants/:variantId
*/

router.put(
  "/:productId/variants/:variantId",
  updateProductVariant
);

/*
  DELETE
  /api/admin/products/:productId/variants/:variantId

  Soft delete:
  is_active = FALSE
*/

router.delete(
  "/:productId/variants/:variantId",
  deleteProductVariant
);

/*
  PATCH
  /api/admin/products/:productId/variants/:variantId/activate
*/

router.patch(
  "/:productId/variants/:variantId/activate",
  activateProductVariant
);

module.exports = router;