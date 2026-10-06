const express = require("express");

const {
  getGiftSets,
  getGiftSetById,
} = require("../controllers/giftSetController");

const router = express.Router();

// PUBLIC CUSTOMER ROUTES

router.get("/", getGiftSets);
router.get("/:id", getGiftSetById);

module.exports = router;