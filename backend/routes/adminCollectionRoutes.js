const express = require("express");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const {
  getAdminCollections,
  getAdminCollectionById,
  createAdminCollection,
  updateAdminCollection,
  updateAdminCollectionStatus,
  deleteAdminCollection,
} = require("../controllers/adminCollectionController");

const router = express.Router();

console.log("ADMIN COLLECTION ROUTES LOADED");

router.use(adminAuthMiddleware);

// GET /api/admin/collections
router.get("/", getAdminCollections);

// GET /api/admin/collections/:id
router.get("/:id", getAdminCollectionById);

// POST /api/admin/collections
router.post("/", createAdminCollection);

// PUT /api/admin/collections/:id
router.put("/:id", updateAdminCollection);

// PATCH /api/admin/collections/:id/status
router.patch(
  "/:id/status",
  updateAdminCollectionStatus
);

// DELETE /api/admin/collections/:id
router.delete(
  "/:id",
  deleteAdminCollection
);

module.exports = router;