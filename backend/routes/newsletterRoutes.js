const express = require("express");

const {
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
} = require("../controllers/newsletterController");

const router = express.Router();

router.post("/subscribe", subscribeToNewsletter);

router.post("/unsubscribe", unsubscribeFromNewsletter);

module.exports = router;