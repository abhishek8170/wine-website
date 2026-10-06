const express = require("express");

const adminAuthMiddleware = require(
  "../middleware/adminAuthMiddleware"
);

const {
  getNewsletterSubscribers,
  updateNewsletterSubscriberStatus,
} = require(
  "../controllers/adminNewsletterController"
);

const router = express.Router();


/*
|--------------------------------------------------------------------------
| ADMIN AUTHENTICATION
|--------------------------------------------------------------------------
*/

router.use(adminAuthMiddleware);


/*
|--------------------------------------------------------------------------
| GET ALL NEWSLETTER SUBSCRIBERS
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  getNewsletterSubscribers
);


/*
|--------------------------------------------------------------------------
| ACTIVATE / DEACTIVATE SUBSCRIBER
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/status",
  updateNewsletterSubscriberStatus
);


module.exports = router;