const express = require("express");

const {
  registerCustomer,
  loginCustomer,
  getCurrentCustomer,
  updateCustomerProfile,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/* =========================================================
   CUSTOMER AUTHENTICATION
========================================================= */

// Register
router.post("/register", registerCustomer);

// Login
router.post("/login", loginCustomer);


/* =========================================================
   PASSWORD RESET
========================================================= */

// Request password reset
router.post("/forgot-password", forgotPassword);

// Reset password using reset token
router.post("/reset-password", resetPassword);


/* =========================================================
   PROTECTED CUSTOMER ROUTES
========================================================= */

// Get current logged-in customer
router.get(
  "/me",
  authMiddleware,
  getCurrentCustomer
);

// Update customer profile
router.put(
  "/profile",
  authMiddleware,
  updateCustomerProfile
);


module.exports = router;