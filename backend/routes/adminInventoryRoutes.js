const express = require("express");

const {
  getInventory,
  addStock,
  removeStock,
  getInventoryHistory,
} = require("../controllers/adminInventoryController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.use(adminAuthMiddleware);

// Get all inventory
router.get("/", getInventory);

// Add stock
router.post("/:variantId/add-stock", addStock);

// Remove stock
router.post("/:variantId/remove-stock", removeStock);

// Stock history for a variant
router.get("/:variantId/history", getInventoryHistory);

module.exports = router;