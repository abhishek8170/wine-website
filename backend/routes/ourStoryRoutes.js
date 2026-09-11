const express = require("express");

const {
  getOurStory,
} = require("../controllers/ourStoryController");

const router = express.Router();

router.get("/", getOurStory);

module.exports = router;