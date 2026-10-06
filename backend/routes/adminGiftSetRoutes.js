const express = require("express");

const {
  getGiftSets,
  getGiftSetById,
  createGiftSet,
  updateGiftSet,
  updateGiftSetStatus,
  deleteGiftSet,
} = require("../controllers/giftSetController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

// All gift-set management routes require admin authentication
router.use(adminAuthMiddleware);

// GET all combos
router.get("/", getGiftSets);

// GET single combo
router.get("/:id", getGiftSetById);

// CREATE combo
router.post("/", createGiftSet);

// EDIT combo
router.put("/:id", updateGiftSet);

// ACTIVATE / DEACTIVATE combo
router.patch("/:id/status", updateGiftSetStatus);

// DELETE combo
router.delete("/:id", deleteGiftSet);

module.exports = router;