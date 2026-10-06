const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDirectory = path.join(
  __dirname,
  "..",
  "uploads"
);

/*
|--------------------------------------------------------------------------
| MAKE SURE UPLOAD DIRECTORY EXISTS
|--------------------------------------------------------------------------
*/

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

/*
|--------------------------------------------------------------------------
| MULTER STORAGE
|--------------------------------------------------------------------------
*/

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const uniqueName = `product-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${extension}`;

    cb(null, uniqueName);
  },
});

/*
|--------------------------------------------------------------------------
| FILE FILTER
|--------------------------------------------------------------------------
*/

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      )
    );
  }
};

/*
|--------------------------------------------------------------------------
| COMMON MULTER UPLOAD
|--------------------------------------------------------------------------
*/

const uploadImageMiddleware = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

/*
|--------------------------------------------------------------------------
| HANDLE IMAGE UPLOAD
|--------------------------------------------------------------------------
*/

const handleImageUpload = (
  req,
  res,
  successMessage,
  logPrefix
) => {
  uploadImageMiddleware.single("image")(
    req,
    res,
    (error) => {
      if (error) {
        console.error(
          `${logPrefix} upload error:`,
          error
        );

        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message:
              "Image size must be 5MB or less.",
          });
        }

        return res.status(400).json({
          success: false,
          message:
            error.message ||
            "Image upload failed.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Please select an image.",
        });
      }

      const imageUrl =
        `/uploads/${req.file.filename}`;

      console.log(
        `${logPrefix} IMAGE UPLOADED:`,
        imageUrl
      );

      return res.status(201).json({
        success: true,
        message: successMessage,
        imageUrl,
        image_url: imageUrl,
        filename: req.file.filename,
      });
    }
  );
};

/*
|--------------------------------------------------------------------------
| UPLOAD PRODUCT IMAGE
|--------------------------------------------------------------------------
*/

const uploadProductImage = (req, res) => {
  handleImageUpload(
    req,
    res,
    "Product image uploaded successfully.",
    "PRODUCT"
  );
};

/*
|--------------------------------------------------------------------------
| UPLOAD GIFT SET IMAGE
|--------------------------------------------------------------------------
*/

const uploadGiftSetImage = (req, res) => {
  handleImageUpload(
    req,
    res,
    "Gift set image uploaded successfully.",
    "GIFT SET"
  );
};

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  uploadProductImage,
  uploadGiftSetImage,
};