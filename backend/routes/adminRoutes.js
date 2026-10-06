const express = require("express");

const {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} = require("../controllers/adminController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

// Every admin-management endpoint requires admin authentication.
router.use(adminAuthMiddleware);

router.get("/", getAdmins);

router.post("/", createAdmin);

router.put("/:id", updateAdmin);

router.delete("/:id", deleteAdmin);

module.exports = router;