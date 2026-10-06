const express = require("express");

const {
  getAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  activateAdminProduct,
} = require("../controllers/adminProductController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

/*
  All product management routes require admin authentication.
*/
router.use(adminAuthMiddleware);

/*
  GET /api/admin/products
*/
router.get("/", getAdminProducts);

/*
  GET /api/admin/products/:id
*/
router.get("/:id", getAdminProductById);

/*
  POST /api/admin/products
*/
router.post("/", createAdminProduct);

/*
  PUT /api/admin/products/:id
*/
router.put("/:id", updateAdminProduct);

/*
  DELETE /api/admin/products/:id

  This deactivates the product instead of permanently
  removing the database record.
*/
router.delete("/:id", deleteAdminProduct);

/*
  PATCH /api/admin/products/:id/activate
*/
router.patch(
  "/:id/activate",
  activateAdminProduct
);

module.exports = router;