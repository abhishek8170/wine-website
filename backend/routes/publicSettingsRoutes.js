const express = require("express");

const {
  getPublicSettings,
} = require("../controllers/publicSettingsController");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PUBLIC STORE SETTINGS
|--------------------------------------------------------------------------
|
| GET /api/settings/public
|
| No admin authentication required.
|
|--------------------------------------------------------------------------
*/

router.get("/public", getPublicSettings);

module.exports = router;