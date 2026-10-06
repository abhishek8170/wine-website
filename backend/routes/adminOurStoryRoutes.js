const express = require("express");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const {
  getAdminOurStory,
  uploadOurStoryImageFile,
  removeOurStoryImage,
} = require("../controllers/adminOurStoryController");

const {
  uploadOurStoryImage,
} = require("../middleware/ourStoryImageUploadMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| ADMIN AUTHENTICATION
|--------------------------------------------------------------------------
*/

router.use(adminAuthMiddleware);

/*
|--------------------------------------------------------------------------
| GET OUR STORY
|--------------------------------------------------------------------------
|
| GET /api/admin/our-story
|
*/

router.get(
  "/",
  getAdminOurStory
);

/*
|--------------------------------------------------------------------------
| UPLOAD OUR STORY IMAGE
|--------------------------------------------------------------------------
|
| Vineyard:
| POST /api/admin/our-story/image/vineyard
|
| Team:
| POST /api/admin/our-story/image/team/1
| POST /api/admin/our-story/image/team/2
| POST /api/admin/our-story/image/team/3
|
|--------------------------------------------------------------------------
*/

/*
| Vineyard
| :type = vineyard
*/

router.post(
  "/image/:type",
  uploadOurStoryImage,
  uploadOurStoryImageFile
);

/*
| Team
| :type = team
| :slot = 1, 2 or 3
*/

router.post(
  "/image/:type/:slot",
  uploadOurStoryImage,
  uploadOurStoryImageFile
);

/*
|--------------------------------------------------------------------------
| REMOVE OUR STORY IMAGE
|--------------------------------------------------------------------------
|
| Vineyard:
| DELETE /api/admin/our-story/image/vineyard
|
| Team:
| DELETE /api/admin/our-story/image/team/1
| DELETE /api/admin/our-story/image/team/2
| DELETE /api/admin/our-story/image/team/3
|
|--------------------------------------------------------------------------
*/

router.delete(
  "/image/:type",
  removeOurStoryImage
);

router.delete(
  "/image/:type/:slot",
  removeOurStoryImage
);

module.exports = router;