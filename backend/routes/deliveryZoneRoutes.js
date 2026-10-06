const express = require("express");

const {
  getDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  checkDeliveryAvailability,
} = require("../controllers/deliveryZoneController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

// Public delivery availability check
router.get("/check", checkDeliveryAvailability);

// Admin delivery-zone management
router.get("/", adminAuthMiddleware, getDeliveryZones);

router.post("/", adminAuthMiddleware, createDeliveryZone);

router.put("/:id", adminAuthMiddleware, updateDeliveryZone);

router.delete("/:id", adminAuthMiddleware, deleteDeliveryZone);

module.exports = router;