const express = require("express");

const {
  loginAdmin,
  getCurrentAdmin,
} = require("../controllers/adminAuthController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.post("/login", loginAdmin);

router.get(
  "/me",
  adminAuthMiddleware,
  getCurrentAdmin
);

module.exports = router;