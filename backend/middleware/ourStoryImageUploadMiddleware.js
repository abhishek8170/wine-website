const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDirectory = path.join(
  __dirname,
  "..",
  "uploads"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const type =
      req.params.type === "team"
        ? "team"
        : "vineyard";

    const slot = req.params.slot
      ? `-${req.params.slot}`
      : "";

    cb(
      null,
      `our-story-${type}${slot}-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`
    );
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(
    new Error(
      "Only JPG, JPEG, PNG and WEBP images are allowed."
    )
  );
};

const uploadOurStoryImage = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("image");

module.exports = {
  uploadOurStoryImage,
};