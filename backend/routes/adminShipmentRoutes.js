const express = require("express");

const {
  getAdminShipments,
  getAdminShipmentById,
  createAdminShipment,
  updateAdminShipment,
} = require("../controllers/adminShipmentController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

// All shipment routes require admin authentication
router.use(adminAuthMiddleware);

// Get all shipments
router.get("/", getAdminShipments);

// Get shipment details
router.get("/:id", getAdminShipmentById);

// Create shipment
router.post("/", createAdminShipment);

// Update shipment
router.put("/:id", updateAdminShipment);

module.exports = router;