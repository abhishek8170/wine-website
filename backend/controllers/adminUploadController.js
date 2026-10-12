const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

/*
|--------------------------------------------------------------------------
| MULTER (keeps the uploaded file in memory, not on the server disk)
|--------------------------------------------------------------------------
*/

const storage = multer.memoryStorage();

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
| SEND FILE TO CLOUDINARY
|--------------------------------------------------------------------------
*/

const uploadBufferToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve(result);
      }
    );

    stream.end(buffer);
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
  logPrefix,
  folder
) => {
  uploadImageMiddleware.single("image")(
    req,
    res,
    async (error) => {
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

      if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
      ) {
        console.error(
          `${logPrefix} upload error: Cloudinary keys are missing in the environment variables.`
        );

        return res.status(500).json({
          success: false,
          message:
            "Image storage is not configured.",
        });
      }

      cloudinary.config({
        cloud_name:
          process.env.CLOUDINARY_CLOUD_NAME,
        api_key:
          process.env.CLOUDINARY_API_KEY,
        api_secret:
          process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });

      try {
        const result =
          await uploadBufferToCloudinary(
            req.file.buffer,
            folder
          );

        const imageUrl = result.secure_url;

        console.log(
          `${logPrefix} IMAGE UPLOADED:`,
          imageUrl
        );

        return res.status(201).json({
          success: true,
          message: successMessage,
          imageUrl,
          image_url: imageUrl,
          filename: result.public_id,
        });
      } catch (uploadError) {
        console.error(
          `${logPrefix} Cloudinary upload error:`,
          uploadError
        );

        return res.status(500).json({
          success: false,
          message:
            "Failed to upload image. Please try again.",
        });
      }
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
    "PRODUCT",
    "vineora/products"
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
    "GIFT SET",
    "vineora/gift-sets"
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