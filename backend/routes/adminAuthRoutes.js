const express = require("express");

const {
  loginAdmin,
  getCurrentAdmin,
  forgotAdminPassword,
  resetAdminPassword,
} = require("../controllers/adminAuthController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.post("/login", loginAdmin);

// Forgot / reset password (public: the admin is not signed in yet)
router.post("/forgot-password", forgotAdminPassword);
router.post("/reset-password", resetAdminPassword);

router.get(
  "/me",
  adminAuthMiddleware,
  getCurrentAdmin
);

module.exports = router;
