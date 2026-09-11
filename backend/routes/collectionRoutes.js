const express = require("express");

const {
  getCollections,
  getCollectionBySlug,
} = require("../controllers/collectionController");

const router = express.Router();

// Get all active collections
router.get("/", getCollections);

// Get one collection + its products
router.get("/:slug", getCollectionBySlug);

module.exports = router;