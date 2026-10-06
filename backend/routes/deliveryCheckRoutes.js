const express = require("express");
const router = express.Router();

const {
  checkDeliveryAvailability,
} = require("../controllers/deliveryCheckController");

router.get("/check", checkDeliveryAvailability);

module.exports = router;