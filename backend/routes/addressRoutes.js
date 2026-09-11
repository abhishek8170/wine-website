const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/addressController");

const router = express.Router();

console.log("ADDRESS ROUTES LOADED");

// All address routes require authentication
router.use(authMiddleware);

// GET /api/addresses
router.get("/", getAddresses);

// POST /api/addresses
router.post("/", addAddress);

// PUT /api/addresses/:id
router.put("/:id", updateAddress);

// DELETE /api/addresses/:id
router.delete("/:id", deleteAddress);

// PATCH /api/addresses/:id/default
router.patch("/:id/default", setDefaultAddress);

module.exports = router;