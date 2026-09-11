const express = require("express");

const {
  getWineGuideArticles,
  getFeaturedWineGuideArticles,
  getWineGuideArticleBySlug,
} = require("../controllers/wineGuideController");

const router = express.Router();

// All published articles
router.get("/", getWineGuideArticles);

// Featured articles for homepage
router.get("/featured", getFeaturedWineGuideArticles);

// Single article
router.get("/:slug", getWineGuideArticleBySlug);

module.exports = router;