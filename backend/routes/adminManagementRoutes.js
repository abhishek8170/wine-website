const express = require("express");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const {
  getAdmins,
  createAdmin,
  updateAdmin,
  changeAdminPassword,
  updateAdminStatus,
  deleteAdmin,
} = require("../controllers/adminManagementController");

const router = express.Router();

// Every admin-management API requires an authenticated admin.
router.use(adminAuthMiddleware);

router.get("/", getAdmins);

router.post("/", createAdmin);

router.put("/:id", updateAdmin);

router.patch("/:id/password", changeAdminPassword);

router.patch("/:id/status", updateAdminStatus);

router.delete("/:id", deleteAdmin);

module.exports = router;