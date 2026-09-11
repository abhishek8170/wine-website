const express = require("express");

const {
  getContactSettings,
  submitContactMessage,
} = require("../controllers/contactController");

const router = express.Router();


// Public Contact page content
router.get("/", getContactSettings);


// Customer contact form
router.post("/messages", submitContactMessage);


module.exports = router;