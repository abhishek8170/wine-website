const express = require("express");

const {
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
} = require("../controllers/adminCustomerController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.use(adminAuthMiddleware);

/*
|--------------------------------------------------------------------------
| Customer List
|--------------------------------------------------------------------------
*/
router.get("/", getCustomers);

/*
|--------------------------------------------------------------------------
| Customer Details
|--------------------------------------------------------------------------
*/
router.get("/:id", getCustomerById);

/*
|--------------------------------------------------------------------------
| Activate / Deactivate Customer
|--------------------------------------------------------------------------
*/
router.patch("/:id/status", updateCustomerStatus);

module.exports = router;