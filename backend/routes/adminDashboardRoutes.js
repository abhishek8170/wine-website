const express = require("express");

const {
  getDashboardStats,
} = require("../controllers/adminDashboardController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.use(adminAuthMiddleware);

router.get("/stats", getDashboardStats);

module.exports = router;